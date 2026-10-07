import { useState, type FormEvent } from 'react';
import { apiUrl } from '../services/api';

interface ModalLoginProps {
  abierto: boolean;
  onCerrar: () => void;
  colCard: string;
  colBorder: string;
  colText: string;
  temaActual: 'oscuro' | 'claro' | 'neon';
  onSesionIniciada: (correo: string) => void;
}

export default function ModalLogin({
  abierto,
  onCerrar,
  colCard,
  colBorder,
  colText,
  temaActual,
  onSesionIniciada
}: ModalLoginProps) {
  const [vista, setVista] = useState<'inicio' | 'ingresar' | 'registrar' | 'pendiente' | 'confirmada'>('inicio');
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [correoEnviado, setCorreoEnviado] = useState<boolean | null>(null);
  const [cargando, setCargando] = useState(false);

  if (!abierto) return null;

  const cerrar = () => {
    setVista('inicio');
    setNombre('');
    setCorreo('');
    setCodigo('');
    setContrasena('');
    setConfirmacion('');
    setMensaje('');
    setCorreoEnviado(null);
    onCerrar();
  };

  const confirmarCodigo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMensaje('');
    setCargando(true);
    try {
      const respuesta = await fetch(apiUrl('/api/auth/verificar-correo'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ correo, codigo })
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo verificar el código.');
      onSesionIniciada(datos.usuario.correo);
      setCorreoEnviado(true);
      setMensaje(datos.mensaje || '¡Felicidades! Tu cuenta está activa.');
      setVista('confirmada');
    } catch (fallo) {
      setMensaje(fallo instanceof Error ? fallo.message : 'No se pudo verificar el código.');
    } finally {
      setCargando(false);
    }
  };

  const enviarFormulario = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMensaje('');
    if (vista === 'registrar' && contrasena !== confirmacion) {
      setMensaje('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);
    try {
      const endpoint = vista === 'registrar' ? '/api/auth/registro' : '/api/auth/iniciar-sesion';
      const respuesta = await fetch(apiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nombre, correo, contrasena })
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) {
        if (datos.error === 'EMAIL_NOT_VERIFIED') {
          setVista('pendiente');
          setCorreoEnviado(false);
        }
        throw new Error(datos.mensaje || 'No se pudo completar la solicitud.');
      }

      if (vista === 'registrar') {
        setVista('pendiente');
        setCorreoEnviado(Boolean(datos.correoEnviado));
        setMensaje(datos.mensaje || 'Revisa tu correo para activar la cuenta.');
      } else {
        onSesionIniciada(datos.usuario.correo);
        cerrar();
      }
    } catch (fallo) {
      setMensaje(fallo instanceof Error ? fallo.message : 'No se pudo conectar con el servicio de cuentas.');
    } finally {
      setCargando(false);
    }
  };

  const reenviarVerificacion = async () => {
    setCargando(true);
    setMensaje('');
    try {
      const respuesta = await fetch(apiUrl('/api/auth/reenviar-verificacion'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ correo })
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo reenviar el correo.');
      setCorreoEnviado(Boolean(datos.correoEnviado));
      setMensaje(datos.mensaje);
    } catch (fallo) {
      setCorreoEnviado(false);
      setMensaje(fallo instanceof Error ? fallo.message : 'No se pudo enviar el correo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) cerrar(); }}>
      <section className={`auth-dialog auth-dialog--${temaActual}`} role="dialog" aria-modal="true" aria-labelledby="auth-title" style={{ background: colCard, borderColor: colBorder, color: colText }}>
        <div className="auth-dialog__topline">
          <span className="auth-dialog__brand">EDEARGOAL <span>CUENTA</span></span>
          <button className="auth-dialog__close" type="button" onClick={cerrar} aria-label="Cerrar">×</button>
        </div>

        {vista === 'inicio' && (
          <div className="auth-dialog__content">
            <span className="auth-dialog__eyebrow">TU ESPACIO DE FÚTBOL</span>
            <h2 id="auth-title">Entra al partido.</h2>
            <p>Inicia sesión o crea tu cuenta para empezar.</p>
            {mensaje && <div className="auth-dialog__notice" role="status">{mensaje}</div>}
            <button className="auth-dialog__primary" type="button" onClick={() => { setVista('registrar'); setMensaje(''); }}>Crear cuenta</button>
            <button className="auth-dialog__secondary" type="button" onClick={() => { setVista('ingresar'); setMensaje(''); }}>Ya tengo una cuenta</button>
          </div>
        )}

        {(vista === 'ingresar' || vista === 'registrar') && (
          <form className="auth-dialog__content" onSubmit={enviarFormulario}>
            <span className="auth-dialog__eyebrow">{vista === 'registrar' ? 'ÚNETE A EDEARGOAL' : 'QUÉ BUENO VERTE DE NUEVO'}</span>
            <h2 id="auth-title">{vista === 'registrar' ? 'Crea tu cuenta' : 'Inicia sesión'}</h2>
            {vista === 'registrar' && (
              <label className="auth-dialog__field">
                <span>Nombre</span>
                <input autoComplete="name" value={nombre} onChange={(event) => setNombre(event.target.value)} required maxLength={80} />
              </label>
            )}
            <label className="auth-dialog__field">
              <span>Correo electrónico</span>
              <input type="email" autoComplete="email" value={correo} onChange={(event) => setCorreo(event.target.value)} required maxLength={254} />
            </label>
            <label className="auth-dialog__field">
              <span>Contraseña</span>
              <input type="password" autoComplete={vista === 'registrar' ? 'new-password' : 'current-password'} value={contrasena} onChange={(event) => setContrasena(event.target.value)} required minLength={8} maxLength={128} />
            </label>
            {vista === 'registrar' && (
              <>
                <label className="auth-dialog__field">
                  <span>Repite la contraseña</span>
                  <input type="password" autoComplete="new-password" value={confirmacion} onChange={(event) => setConfirmacion(event.target.value)} required minLength={8} maxLength={128} />
                </label>
                <p className="auth-dialog__hint">Usa al menos 8 caracteres. Te enviaremos un código de 6 dígitos al correo.</p>
              </>
            )}
            {mensaje && <p className="auth-dialog__notice" role="alert">{mensaje}</p>}
            <button className="auth-dialog__primary" type="submit" disabled={cargando}>
              {cargando ? 'Procesando…' : vista === 'registrar' ? 'Crear cuenta' : 'Entrar'}
            </button>
            <button className="auth-dialog__text-button" type="button" onClick={() => { setVista(vista === 'registrar' ? 'ingresar' : 'inicio'); setMensaje(''); }}>
              {vista === 'registrar' ? 'Ya tengo una cuenta' : 'Volver'}
            </button>
          </form>
        )}

        {vista === 'pendiente' && (
          <div className="auth-dialog__content">
            <span className="auth-dialog__eyebrow">UN PASO MÁS</span>
            <h2 id="auth-title">{correoEnviado === false ? 'Cuenta creada' : 'Ingresa el código'}</h2>
            <p>{correoEnviado === false
              ? <>Tu cuenta quedó registrada con <strong>{correo}</strong>, pero sigue pendiente de verificación. Confirma el correo antes de iniciar sesión.</>
              : <>Escribe el código de 6 dígitos que enviamos a <strong>{correo}</strong>. Vence en 10 minutos.</>}</p>
            {correoEnviado && (
              <form className="auth-dialog__otp-form" onSubmit={confirmarCodigo}>
                <label className="auth-dialog__field">
                  <span>Código de verificación</span>
                  <input className="auth-dialog__otp-input" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={codigo} onChange={(event) => setCodigo(event.target.value.replace(/\D/g, '').slice(0, 6))} required aria-label="Código de 6 dígitos" />
                </label>
                {mensaje && <p className="auth-dialog__notice" role="alert">{mensaje}</p>}
                <button className="auth-dialog__primary" type="submit" disabled={cargando || codigo.length !== 6}>
                  {cargando ? 'Verificando…' : 'Verificar y activar cuenta'}
                </button>
              </form>
            )}
            {!correoEnviado && mensaje && <p className="auth-dialog__notice auth-dialog__notice--warning" role="status">{mensaje}</p>}
            <button className="auth-dialog__primary" type="button" onClick={() => void reenviarVerificacion()} disabled={cargando}>
              {cargando ? 'Enviando…' : correoEnviado === false ? 'Intentar enviar código' : 'Reenviar código'}
            </button>
            <button className="auth-dialog__text-button" type="button" onClick={() => { setVista('ingresar'); setMensaje(''); }}>Volver a iniciar sesión</button>
          </div>
        )}

        {vista === 'confirmada' && (
          <div className="auth-dialog__content">
            <span className="auth-dialog__eyebrow">CORREO VERIFICADO</span>
            <h2 id="auth-title">¡Cuenta activa!</h2>
            <p>{mensaje || '¡Felicidades! Te registraste con éxito en EdearGoal.'}</p>
            <button className="auth-dialog__primary" type="button" onClick={cerrar}>Entrar a EdearGoal</button>
          </div>
        )}

        <div className="auth-dialog__footer">Tu correo se usa para proteger el acceso a tu cuenta.</div>
      </section>
    </div>
  );
}