const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { promisify } = require('node:util');

const scrypt = promisify(crypto.scrypt);
const archivoCuentas = process.env.AUTH_ACCOUNTS_FILE || path.join(__dirname, '../../.accounts.json');
const archivoSecretoLocal = path.join(__dirname, '../../.auth-session-secret');
const DURACION_SESION_MS = 7 * 24 * 60 * 60 * 1000;
const VERSION_CONDICIONES = '2026-10-07';
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

function crearPerfilPublico(cuenta, correo) {
  return {
    nombre: cuenta.nombre,
    apodo: cuenta.apodo || cuenta.nombre,
    correo,
    equipoFavorito: cuenta.equipoFavorito || '',
    fechaUnion: cuenta.creadoEn,
    condicionesAceptadasEn: cuenta.condicionesAceptadasEn || null,
    versionCondiciones: cuenta.versionCondiciones || null
  };
}

async function registrarCuenta(nombre, apodoEntrada, equipoFavoritoEntrada, aceptoCondiciones, correoEntrada, password) {
  const correo = normalizarCorreo(correoEntrada);
  const nombreLimpio = String(nombre || '').trim().slice(0, 80);
  const apodo = String(apodoEntrada || '').trim().slice(0, 30);
  const equipoFavorito = String(equipoFavoritoEntrada || '').trim().slice(0, 80);
  if (!nombreLimpio) throw errorAuth('NAME_REQUIRED', 'Escribe tu nombre.');
  if (apodo.length < 2) throw errorAuth('NICKNAME_INVALID', 'El apodo debe tener al menos 2 caracteres.');
  if (equipoFavorito.length < 2) throw errorAuth('FAVORITE_TEAM_REQUIRED', 'Escribe tu equipo favorito.');
  if (aceptoCondiciones !== true) throw errorAuth('TERMS_REQUIRED', 'Debes aceptar las Condiciones de uso y la Política de privacidad.');
  if (!esCorreoValido(correo)) throw errorAuth('EMAIL_INVALID', 'Escribe un correo válido.');
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    throw errorAuth('PASSWORD_INVALID', 'La contraseña debe tener entre 8 y 128 caracteres.');
  }

  const cuentas = leerCuentas();
  if (cuentas[correo]) throw errorAuth('ACCOUNT_EXISTS', 'Ya existe una cuenta con ese correo. Inicia sesión.', 409);

  const fechaUnion = new Date().toISOString();
  const cuenta = {
    nombre: nombreLimpio,
    apodo,
    correo,
    equipoFavorito,
    passwordHash: await hashPassword(password),
    creadoEn: fechaUnion,
    correoVerificadoEn: fechaUnion,
    condicionesAceptadasEn: fechaUnion,
    versionCondiciones: VERSION_CONDICIONES
  };
  cuentas[correo] = cuenta;
  guardarCuentas(cuentas);

  return {
    usuario: crearPerfilPublico(cuenta, correo),
    tokenSesion: crearTokenSesion(correo)
  };
}

async function iniciarSesion(correoEntrada, password) {
  const correo = normalizarCorreo(correoEntrada);
  const cuentas = leerCuentas();
  const cuenta = cuentas[correo];
  if (!cuenta || !(await verificarPassword(password, cuenta.passwordHash))) {
    throw errorAuth('CREDENTIALS_INVALID', 'El correo o la contraseña no son correctos.', 401);
  }
  if (!cuenta.correoVerificadoEn) {
    cuenta.correoVerificadoEn = new Date().toISOString();
    delete cuenta.codigoVerificacionHash;
    delete cuenta.codigoVerificacionSal;
    delete cuenta.codigoVerificacionVence;
    delete cuenta.intentosCodigo;
    guardarCuentas(cuentas);
  }
  return { usuario: crearPerfilPublico(cuenta, correo), tokenSesion: crearTokenSesion(correo) };
}

function obtenerUsuarioDeSesion(tokenSesion) {
  const correo = verificarTokenSesion(tokenSesion);
  if (!correo) return null;
  const cuenta = leerCuentas()[correo];
  if (!cuenta?.correoVerificadoEn) return null;
  return crearPerfilPublico(cuenta, correo);
}

module.exports = {
  DURACION_SESION_MS,
  errorAuth,
  crearTokenSesion,
  verificarTokenSesion,
  hashPassword,
  verificarPassword,
  registrarCuenta,
  iniciarSesion,
  obtenerUsuarioDeSesion
};