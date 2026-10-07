const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { promisify } = require('node:util');
const nodemailer = require('nodemailer');

const scrypt = promisify(crypto.scrypt);
const archivoCuentas = process.env.AUTH_ACCOUNTS_FILE || path.join(__dirname, '../../.accounts.json');
const archivoSecretoLocal = path.join(__dirname, '../../.auth-session-secret');
const DURACION_VERIFICACION_MS = 10 * 60 * 1000;
const DURACION_SESION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_INTENTOS_CODIGO = 5;
let secretoTemporal = null;

function errorAuth(codigo, mensaje, estado = 400) {
  const error = new Error(mensaje);
  error.codigo = codigo;
  error.estado = estado;
  return error;
}

function normalizarCorreo(correo) {
  return String(correo || '').trim().toLowerCase();
}

function esCorreoValido(correo) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

async function hashPassword(password, salt = crypto.randomBytes(16)) {
  const hash = await scrypt(String(password), salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

async function verificarPassword(password, guardado) {
  const [saltHex, hashHex] = String(guardado || '').split(':');
  if (!saltHex || !hashHex) return false;
  const hashEsperado = Buffer.from(hashHex, 'hex');
  const hashActual = await scrypt(String(password), Buffer.from(saltHex, 'hex'), hashEsperado.length);
  return hashEsperado.length === hashActual.length && crypto.timingSafeEqual(hashEsperado, hashActual);
}

function crearCodigoVerificacion() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

function hashCodigoVerificacion(codigo, sal, secreto = obtenerSecretoSesion()) {
  return crypto.createHmac('sha256', secreto).update(`${sal}:${codigo}`).digest('hex');
}

function leerCuentas() {
  try {
    const datos = JSON.parse(fs.readFileSync(archivoCuentas, 'utf8'));
    return datos && typeof datos === 'object' && !Array.isArray(datos) ? datos : {};
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw new Error('No se pudo leer el almacenamiento de cuentas.');
  }
}

function guardarCuentas(cuentas) {
  const temporal = `${archivoCuentas}.${process.pid}.tmp`;
  fs.writeFileSync(temporal, JSON.stringify(cuentas), { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(temporal, archivoCuentas);
}

function obtenerSecretoSesion() {
  if (process.env.AUTH_SESSION_SECRET) return process.env.AUTH_SESSION_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw errorAuth('AUTH_CONFIG_MISSING', 'El backend no tiene configurado AUTH_SESSION_SECRET.', 503);
  }
  if (!secretoTemporal) {
    try {
      secretoTemporal = fs.readFileSync(archivoSecretoLocal, 'utf8').trim();
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      secretoTemporal = crypto.randomBytes(32).toString('hex');
      fs.writeFileSync(archivoSecretoLocal, secretoTemporal, { encoding: 'utf8', mode: 0o600 });
    }
  }
  return secretoTemporal;
}

function crearTokenSesion(correo, opciones = {}) {
  const ahora = opciones.ahora ?? Date.now();
  const secreto = opciones.secreto || obtenerSecretoSesion();
  const payload = Buffer.from(JSON.stringify({
    sub: correo,
    exp: ahora + DURACION_SESION_MS
  })).toString('base64url');
  const firma = crypto.createHmac('sha256', secreto).update(payload).digest('base64url');
  return `${payload}.${firma}`;
}

function verificarTokenSesion(token, opciones = {}) {
  try {
    const [payload, firma] = String(token || '').split('.');
    if (!payload || !firma) return null;
    const secreto = opciones.secreto || obtenerSecretoSesion();
    const firmaEsperada = crypto.createHmac('sha256', secreto).update(payload).digest();
    const firmaRecibida = Buffer.from(firma, 'base64url');
    if (firmaEsperada.length !== firmaRecibida.length || !crypto.timingSafeEqual(firmaEsperada, firmaRecibida)) return null;
    const datos = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!datos.sub || !Number.isFinite(datos.exp) || datos.exp <= (opciones.ahora ?? Date.now())) return null;
    return datos.sub;
  } catch {
    return null;
  }
}

function crearTransporteCorreo() {
  const requerido = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'];
  const faltantes = requerido.filter((nombre) => !process.env[nombre]);
  if (faltantes.length) {
    throw errorAuth('EMAIL_NOT_CONFIGURED', 'El correo todavía no está configurado. Completa las variables SMTP del backend.', 503);
  }

  const puerto = Number(process.env.SMTP_PORT);
  if (!Number.isInteger(puerto) || puerto < 1 || puerto > 65535) {
    throw errorAuth('EMAIL_CONFIG_INVALID', 'SMTP_PORT no es válido.', 503);
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: puerto,
    secure: process.env.SMTP_SECURE === 'true' || puerto === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

async function enviarCorreoVerificacion(correo, codigo) {
  const transporte = crearTransporteCorreo();
  await transporte.sendMail({
    from: process.env.EMAIL_FROM,
    to: correo,
    subject: 'Tu código para activar EdearGoal',
    text: `¡Felicidades por registrarte en EdearGoal! Tu código de verificación es ${codigo}. Escríbelo en la pantalla de registro para activar la cuenta. Vence en 10 minutos. Si no solicitaste esta cuenta, ignora este mensaje.`,
    html: `<!doctype html><html lang="es"><body style="margin:0;padding:32px 12px;background:#08111e;font-family:Arial,sans-serif;color:#f4f7fb"><main style="max-width:560px;margin:auto;padding:32px;border:1px solid #24384b;border-radius:12px;background:#101b29"><p style="color:#63d5eb;font-size:12px;font-weight:bold;letter-spacing:2px">EDEARGOAL</p><h1 style="font-size:24px">¡Felicidades por registrarte!</h1><p style="color:#c4d0dc;line-height:1.6">Escribe este código en EdearGoal para verificar tu correo y activar tu cuenta:</p><p style="margin:24px 0;padding:18px;border:1px solid #29455a;border-radius:8px;background:#0b1420;color:#62e6ff;font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center">${codigo}</p><p style="color:#9aabba;font-size:13px;line-height:1.6">El código vence en 10 minutos y solo permite 5 intentos. Si no creaste esta cuenta, ignora este mensaje.</p></main></body></html>`
  });
}

async function enviarCorreoBienvenida(correo) {
  const transporte = crearTransporteCorreo();
  await transporte.sendMail({
    from: process.env.EMAIL_FROM,
    to: correo,
    subject: '¡Tu cuenta de EdearGoal está activa!',
    text: '¡Felicidades! Te registraste con éxito en EdearGoal. Ya puedes entrar y seguir tus competiciones y equipos.',
    html: '<!doctype html><html lang="es"><body style="margin:0;padding:32px 12px;background:#08111e;font-family:Arial,sans-serif;color:#f4f7fb"><main style="max-width:560px;margin:auto;padding:32px;border:1px solid #24384b;border-radius:12px;background:#101b29"><p style="color:#63d5eb;font-size:12px;font-weight:bold;letter-spacing:2px">EDEARGOAL</p><h1 style="font-size:24px">¡Felicidades, tu cuenta está activa!</h1><p style="color:#c4d0dc;line-height:1.6">Tu correo quedó verificado. Ya puedes entrar a EdearGoal y seguir tus competiciones y equipos favoritos.</p></main></body></html>'
  });
}

async function registrarCuenta(nombre, correoEntrada, password) {
  const correo = normalizarCorreo(correoEntrada);
  const nombreLimpio = String(nombre || '').trim().slice(0, 80);
  if (!nombreLimpio) throw errorAuth('NAME_REQUIRED', 'Escribe tu nombre.');
  if (!esCorreoValido(correo)) throw errorAuth('EMAIL_INVALID', 'Escribe un correo válido.');
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    throw errorAuth('PASSWORD_INVALID', 'La contraseña debe tener entre 8 y 128 caracteres.');
  }

  const cuentas = leerCuentas();
  const previa = cuentas[correo];
  if (previa?.correoVerificadoEn) throw errorAuth('ACCOUNT_EXISTS', 'Ya existe una cuenta con ese correo.', 409);

  const codigo = crearCodigoVerificacion();
  const salCodigo = crypto.randomBytes(16).toString('hex');
  cuentas[correo] = {
    nombre: nombreLimpio,
    correo,
    passwordHash: await hashPassword(password),
    creadoEn: previa?.creadoEn || new Date().toISOString(),
    correoVerificadoEn: null,
    codigoVerificacionHash: hashCodigoVerificacion(codigo, salCodigo),
    codigoVerificacionSal: salCodigo,
    codigoVerificacionVence: Date.now() + DURACION_VERIFICACION_MS,
    intentosCodigo: 0
  };
  guardarCuentas(cuentas);

  let correoEnviado = false;
  let mensaje;
  try {
    await enviarCorreoVerificacion(correo, codigo);
    correoEnviado = true;
    mensaje = 'Tu cuenta quedó creada. Revisa tu correo para verificarla y activarla.';
  } catch (error) {
    console.error('No se pudo enviar el correo de verificación:', error.message);
    mensaje = 'Tu cuenta quedó creada y pendiente de verificación, pero no pudimos enviarte el código ahora. Inténtalo de nuevo más tarde.';
  }

  return { correo, correoEnviado, mensaje };
}

async function verificarCuenta(correoEntrada, codigoEntrada) {
  const correo = normalizarCorreo(correoEntrada);
  if (!esCorreoValido(correo) || !/^\d{6}$/.test(String(codigoEntrada || ''))) {
    throw errorAuth('OTP_INVALID', 'Escribe el correo y el código de 6 dígitos.');
  }

  const cuentas = leerCuentas();
  const cuenta = cuentas[correo];
  if (!cuenta || cuenta.correoVerificadoEn || !cuenta.codigoVerificacionHash) {
    throw errorAuth('OTP_INVALID', 'El correo o el código no son válidos.', 400);
  }

  if (cuenta.codigoVerificacionVence < Date.now()) {
    delete cuenta.codigoVerificacionHash;
    delete cuenta.codigoVerificacionSal;
    delete cuenta.codigoVerificacionVence;
    delete cuenta.intentosCodigo;
    guardarCuentas(cuentas);
    throw errorAuth('OTP_EXPIRED', 'El código venció. Solicita uno nuevo.', 410);
  }

  if ((cuenta.intentosCodigo || 0) >= MAX_INTENTOS_CODIGO) {
    throw errorAuth('OTP_LOCKED', 'Se agotaron los intentos. Solicita un código nuevo.', 429);
  }

  const hashEsperado = Buffer.from(cuenta.codigoVerificacionHash, 'hex');
  const hashRecibido = Buffer.from(hashCodigoVerificacion(codigoEntrada, cuenta.codigoVerificacionSal), 'hex');
  const codigoValido = hashEsperado.length === hashRecibido.length && crypto.timingSafeEqual(hashEsperado, hashRecibido);
  if (!codigoValido) {
    cuenta.intentosCodigo = (cuenta.intentosCodigo || 0) + 1;
    const intentosAgotados = cuenta.intentosCodigo >= MAX_INTENTOS_CODIGO;
    if (intentosAgotados) {
      delete cuenta.codigoVerificacionHash;
      delete cuenta.codigoVerificacionSal;
      delete cuenta.codigoVerificacionVence;
    }
    guardarCuentas(cuentas);
    throw errorAuth(intentosAgotados ? 'OTP_LOCKED' : 'OTP_INVALID', intentosAgotados
      ? 'Se agotaron los intentos. Solicita un código nuevo.'
      : 'El correo o el código no son válidos.', intentosAgotados ? 429 : 400);
  }

  cuenta.correoVerificadoEn = new Date().toISOString();
  delete cuenta.codigoVerificacionHash;
  delete cuenta.codigoVerificacionSal;
  delete cuenta.codigoVerificacionVence;
  delete cuenta.intentosCodigo;
  guardarCuentas(cuentas);

  let correoBienvenidaEnviado = false;
  try {
    await enviarCorreoBienvenida(correo);
    correoBienvenidaEnviado = true;
  } catch (error) {
    console.error('No se pudo enviar el correo de bienvenida:', error.message);
  }

  return {
    usuario: { nombre: cuenta.nombre, correo },
    tokenSesion: crearTokenSesion(correo),
    correoBienvenidaEnviado
  };
}

async function reenviarVerificacion(correoEntrada) {
  const correo = normalizarCorreo(correoEntrada);
  if (!esCorreoValido(correo)) throw errorAuth('EMAIL_INVALID', 'Escribe un correo válido.');
  const cuentas = leerCuentas();
  const cuenta = cuentas[correo];
  if (!cuenta || cuenta.correoVerificadoEn) {
    return { correoEnviado: false, mensaje: 'Si existe una cuenta pendiente con ese correo, enviaremos un nuevo código.' };
  }

  const codigo = crearCodigoVerificacion();
  const salCodigo = crypto.randomBytes(16).toString('hex');
  cuenta.codigoVerificacionHash = hashCodigoVerificacion(codigo, salCodigo);
  cuenta.codigoVerificacionSal = salCodigo;
  cuenta.codigoVerificacionVence = Date.now() + DURACION_VERIFICACION_MS;
  cuenta.intentosCodigo = 0;
  guardarCuentas(cuentas);
  await enviarCorreoVerificacion(correo, codigo);
  return { correoEnviado: true, mensaje: 'Enviamos un nuevo código de verificación.' };
}

async function iniciarSesion(correoEntrada, password) {
  const correo = normalizarCorreo(correoEntrada);
  const cuenta = leerCuentas()[correo];
  if (!cuenta || !(await verificarPassword(password, cuenta.passwordHash))) {
    throw errorAuth('CREDENTIALS_INVALID', 'El correo o la contraseña no son correctos.', 401);
  }
  if (!cuenta.correoVerificadoEn) {
    throw errorAuth('EMAIL_NOT_VERIFIED', 'Confirma tu correo antes de iniciar sesión.', 403);
  }
  return { usuario: { nombre: cuenta.nombre, correo }, tokenSesion: crearTokenSesion(correo) };
}

function obtenerUsuarioDeSesion(tokenSesion) {
  const correo = verificarTokenSesion(tokenSesion);
  if (!correo) return null;
  const cuenta = leerCuentas()[correo];
  if (!cuenta?.correoVerificadoEn) return null;
  return { nombre: cuenta.nombre, correo };
}

module.exports = {
  DURACION_SESION_MS,
  errorAuth,
  crearTokenSesion,
  verificarTokenSesion,
  hashPassword,
  verificarPassword,
  crearCodigoVerificacion,
  hashCodigoVerificacion,
  registrarCuenta,
  verificarCuenta,
  reenviarVerificacion,
  iniciarSesion,
  obtenerUsuarioDeSesion
};