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
  crearCodigoVerificacion,
  hashCodigoVerificacion,
  crearTokenSesion,
  verificarTokenSesion,
  registrarCuenta,
  verificarCuenta
} = require('./authService');

test.after(() => fs.rmSync(directorioTemporal, { recursive: true, force: true }));

async function guardarCuentaOtp(correo, codigo, venceEn) {
  const cuentas = JSON.parse(fs.readFileSync(process.env.AUTH_ACCOUNTS_FILE, 'utf8'));
  const sal = `sal-${correo}`;
  cuentas[correo] = {
    nombre: 'Cuenta OTP',
    correo,
    passwordHash: await hashPassword('clave-otp-segura'),
    creadoEn: new Date().toISOString(),
    correoVerificadoEn: null,
    codigoVerificacionHash: hashCodigoVerificacion(codigo, sal, process.env.AUTH_SESSION_SECRET),
    codigoVerificacionSal: sal,
    codigoVerificacionVence: venceEn,
    intentosCodigo: 0
  };
  fs.writeFileSync(process.env.AUTH_ACCOUNTS_FILE, JSON.stringify(cuentas));
}

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

test('SMTP ausente deja la cuenta pendiente con contraseña y OTP hasheados', async () => {
  const variablesCorreo = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'];
  const valoresPrevios = Object.fromEntries(variablesCorreo.map((nombre) => [nombre, process.env[nombre]]));
  variablesCorreo.forEach((nombre) => delete process.env[nombre]);
  const correo = 'cuenta-pendiente@example.invalid';

  try {
    const resultado = await registrarCuenta('Cuenta de prueba', correo, 'clave-temporal-segura');
    const cuentas = JSON.parse(fs.readFileSync(process.env.AUTH_ACCOUNTS_FILE, 'utf8'));

    assert.equal(resultado.correoEnviado, false);
    assert.match(resultado.mensaje, /pendiente de verificación/);
    assert.equal(cuentas[correo].correoVerificadoEn, null);
    assert.notEqual(cuentas[correo].passwordHash, 'clave-temporal-segura');
    assert.match(cuentas[correo].codigoVerificacionHash, /^[a-f0-9]{64}$/);
    assert.ok(cuentas[correo].codigoVerificacionSal);
    assert.equal(cuentas[correo].intentosCodigo, 0);
  } finally {
    variablesCorreo.forEach((nombre) => {
      if (valoresPrevios[nombre] === undefined) delete process.env[nombre];
      else process.env[nombre] = valoresPrevios[nombre];
    });
  }
});

test('el OTP correcto verifica la cuenta y un código incorrecto consume un intento', async () => {
  const correo = 'cuenta-otp@example.invalid';
  const codigo = '042381';
  const sal = 'sal-otp-prueba';
  const cuentas = JSON.parse(fs.readFileSync(process.env.AUTH_ACCOUNTS_FILE, 'utf8'));
  cuentas[correo] = {
    nombre: 'Cuenta OTP',
    correo,
    passwordHash: await hashPassword('clave-otp-segura'),
    creadoEn: new Date().toISOString(),
    correoVerificadoEn: null,
    codigoVerificacionHash: hashCodigoVerificacion(codigo, sal, process.env.AUTH_SESSION_SECRET),
    codigoVerificacionSal: sal,
    codigoVerificacionVence: Date.now() + 10 * 60 * 1000,
    intentosCodigo: 0
  };
  fs.writeFileSync(process.env.AUTH_ACCOUNTS_FILE, JSON.stringify(cuentas));

  await assert.rejects(verificarCuenta(correo, '000000'), (error) => error.codigo === 'OTP_INVALID');
  const despuesDelError = JSON.parse(fs.readFileSync(process.env.AUTH_ACCOUNTS_FILE, 'utf8'));
  assert.equal(despuesDelError[correo].intentosCodigo, 1);

  const resultado = await verificarCuenta(correo, codigo);
  assert.equal(resultado.usuario.correo, correo);
  const verificada = JSON.parse(fs.readFileSync(process.env.AUTH_ACCOUNTS_FILE, 'utf8'));
  assert.ok(verificada[correo].correoVerificadoEn);
  assert.equal(verificada[correo].codigoVerificacionHash, undefined);
});

test('el OTP vence y se bloquea tras cinco intentos incorrectos', async () => {
  const correoVencido = 'otp-vencido@example.invalid';
  await guardarCuentaOtp(correoVencido, '111111', Date.now() - 1);
  await assert.rejects(verificarCuenta(correoVencido, '111111'), (error) => error.codigo === 'OTP_EXPIRED');

  const correoBloqueado = 'otp-bloqueado@example.invalid';
  await guardarCuentaOtp(correoBloqueado, '222222', Date.now() + 10 * 60 * 1000);
  for (let intento = 0; intento < 4; intento += 1) {
    await assert.rejects(verificarCuenta(correoBloqueado, '000000'), (error) => error.codigo === 'OTP_INVALID');
  }
  await assert.rejects(verificarCuenta(correoBloqueado, '000000'), (error) => error.codigo === 'OTP_LOCKED');
  const cuentas = JSON.parse(fs.readFileSync(process.env.AUTH_ACCOUNTS_FILE, 'utf8'));
  assert.equal(cuentas[correoBloqueado].codigoVerificacionHash, undefined);
});