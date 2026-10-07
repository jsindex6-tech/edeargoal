const express = require('express');
const authService = require('../services/authService');

const router = express.Router();
const nombreCookieSesion = 'edeargoal_session';
const solicitudesAuth = new Map();
const VENTANA_AUTH_MS = 15 * 60 * 1000;
const LIMITE_AUTH = 12;

function limitarAuth(req, res, next) {
  const ahora = Date.now();
  const ip = req.ip || req.socket.remoteAddress || 'desconocida';
  const registro = solicitudesAuth.get(ip);
  if (!registro || ahora - registro.inicio >= VENTANA_AUTH_MS) {
    solicitudesAuth.set(ip, { inicio: ahora, cantidad: 1 });
    return next();
  }
  if (registro.cantidad >= LIMITE_AUTH) {
    return res.status(429).json({ mensaje: 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.' });
  }
  registro.cantidad += 1;
  return next();
}

function opcionesCookie() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: authService.DURACION_SESION_MS
  };
}

function responderError(res, error) {
  const estado = error.estado || 500;
  if (estado >= 500) console.error('Error de autenticación:', error.message);
  const configuracionVisible = ['EMAIL_NOT_CONFIGURED', 'EMAIL_CONFIG_INVALID', 'AUTH_CONFIG_MISSING'].includes(error.codigo);
  return res.status(estado).json({
    error: error.codigo || 'AUTH_ERROR',
    mensaje: estado >= 500 && !configuracionVisible
      ? 'No se pudo completar la operación. Revisa la configuración del backend.'
      : error.codigo === 'EMAIL_NOT_CONFIGURED'
        ? 'No pudimos enviarte el código ahora. Inténtalo de nuevo más tarde.'
      : error.message
  });
}

router.post('/registro', limitarAuth, async (req, res) => {
  try {
    const resultado = await authService.registrarCuenta(req.body?.nombre, req.body?.correo, req.body?.contrasena);
    return res.status(202).json(resultado);
  } catch (error) {
    return responderError(res, error);
  }
});

router.post('/verificar-correo', limitarAuth, async (req, res) => {
  try {
    const resultado = await authService.verificarCuenta(req.body?.correo, req.body?.codigo);
    res.cookie(nombreCookieSesion, resultado.tokenSesion, opcionesCookie());
    return res.json({
      usuario: resultado.usuario,
      mensaje: '¡Felicidades! Tu cuenta de EdearGoal está activa.',
      correoBienvenidaEnviado: resultado.correoBienvenidaEnviado
    });
  } catch (error) {
    return responderError(res, error);
  }
});

router.post('/reenviar-verificacion', limitarAuth, async (req, res) => {
  try {
    const resultado = await authService.reenviarVerificacion(req.body?.correo);
    return res.json(resultado);
  } catch (error) {
    return responderError(res, error);
  }
});

router.post('/iniciar-sesion', limitarAuth, async (req, res) => {
  try {
    const resultado = await authService.iniciarSesion(req.body?.correo, req.body?.contrasena);
    res.cookie(nombreCookieSesion, resultado.tokenSesion, opcionesCookie());
    return res.json({ usuario: resultado.usuario });
  } catch (error) {
    return responderError(res, error);
  }
});

router.get('/sesion', (req, res) => {
  try {
    const usuario = authService.obtenerUsuarioDeSesion(req.cookies?.[nombreCookieSesion]);
    return res.json({ usuario });
  } catch (error) {
    return responderError(res, error);
  }
});

router.post('/cerrar-sesion', (_req, res) => {
  res.clearCookie(nombreCookieSesion, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/'
  });
  return res.json({ mensaje: 'Sesión cerrada.' });
});

module.exports = router;