const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const directorioTemporal = fs.mkdtempSync(path.join(os.tmpdir(), 'edeargoal-auth-test-'));
process.env.AUTH_ACCOUNTS_FILE = path.join(directorioTemporal, 'accounts.json');
process.env.AUTH_SESSION_SECRET ||= 'auth-tests-only-secret';
const {
  hashPassword,
  verificarPassword,
  crearTokenSesion,
  verificarTokenSesion,
  registrarCuenta,
  iniciarSesion,
  obtenerUsuarioDeSesion
} = require('./authService');

test.after(() => fs.rmSync(directorioTemporal, { recursive: true, force: true }));

test('guarda una contraseña como hash salado y solo valida la contraseña correcta', async () => {
  const guardado = await hashPassword('Contraseña-segura-123');

  assert.notEqual(guardado, 'Contraseña-segura-123');
  assert.equal(await verificarPassword('Contraseña-segura-123', guardado), true);
  assert.equal(await verificarPassword('otra-contraseña', guardado), false);
});

test('la sesión está firmada, expira y rechaza alteraciones', () => {
  const secreto = 'secreto-solo-para-prueba';
  const token = crearTokenSesion('persona@example.com', { secreto, ahora: 1000 });

  assert.equal(verificarTokenSesion(token, { secreto, ahora: 2000 }), 'persona@example.com');
  assert.equal(verificarTokenSesion(token, { secreto: 'secreto-incorrecto', ahora: 2000 }), null);
  assert.equal(verificarTokenSesion(token, { secreto, ahora: 8 * 24 * 60 * 60 * 1000 }), null);
});

test('crear una cuenta inicia sesión inmediatamente sin configurar correo', async () => {
  const correo = 'cuenta-activa@example.invalid';
  const resultado = await registrarCuenta('Cuenta de prueba', 'GolDeOro', 'Alianza Lima', true, correo, 'clave-temporal-segura');
  const cuentas = JSON.parse(fs.readFileSync(process.env.AUTH_ACCOUNTS_FILE, 'utf8'));

  assert.equal(resultado.usuario.correo, correo);
  assert.equal(resultado.usuario.apodo, 'GolDeOro');
  assert.equal(resultado.usuario.equipoFavorito, 'Alianza Lima');
  assert.equal(resultado.usuario.fechaUnion, cuentas[correo].creadoEn);
  assert.equal(resultado.usuario.condicionesAceptadasEn, cuentas[correo].condicionesAceptadasEn);
  assert.equal(resultado.usuario.versionCondiciones, '2026-10-07');
  assert.ok(resultado.tokenSesion);
  assert.ok(cuentas[correo].correoVerificadoEn);
  assert.notEqual(cuentas[correo].passwordHash, 'clave-temporal-segura');
  assert.deepEqual(obtenerUsuarioDeSesion(resultado.tokenSesion), resultado.usuario);
});

test('cuentas antiguas pendientes pueden ingresar y quedan activadas tras validar su contraseña', async () => {
  const correo = 'cuenta-pendiente@example.invalid';
  const cuentas = JSON.parse(fs.readFileSync(process.env.AUTH_ACCOUNTS_FILE, 'utf8'));
  cuentas[correo] = {
    nombre: 'Cuenta antigua',
    correo,
    passwordHash: await hashPassword('clave-antigua-segura'),
    creadoEn: new Date().toISOString(),
    correoVerificadoEn: null,
    codigoVerificacionHash: 'hash-antiguo',
    codigoVerificacionSal: 'sal-antigua',
    codigoVerificacionVence: Date.now() + 60_000,
    intentosCodigo: 0
  };
  fs.writeFileSync(process.env.AUTH_ACCOUNTS_FILE, JSON.stringify(cuentas));

  const sesion = await iniciarSesion(correo, 'clave-antigua-segura');
  const guardadas = JSON.parse(fs.readFileSync(process.env.AUTH_ACCOUNTS_FILE, 'utf8'));
  assert.equal(sesion.usuario.correo, correo);
  assert.ok(guardadas[correo].correoVerificadoEn);
  assert.equal(guardadas[correo].codigoVerificacionHash, undefined);
  assert.equal(sesion.usuario.apodo, 'Cuenta antigua');
  assert.equal(sesion.usuario.equipoFavorito, '');
  assert.equal(sesion.usuario.condicionesAceptadasEn, null);
  assert.deepEqual(obtenerUsuarioDeSesion(sesion.tokenSesion), sesion.usuario);
});

test('el registro rechaza cuentas sin aceptar las condiciones o sin equipo favorito', async () => {
  await assert.rejects(
    registrarCuenta('Otra cuenta', 'Aficionado', 'Universitario', false, 'sin-consentimiento@example.invalid', 'clave-segura-123'),
    (error) => error.codigo === 'TERMS_REQUIRED'
  );
  await assert.rejects(
    registrarCuenta('Otra cuenta', 'Aficionado', '', true, 'sin-equipo@example.invalid', 'clave-segura-123'),
    (error) => error.codigo === 'FAVORITE_TEAM_REQUIRED'
  );
});