import { useState, type FormEvent } from 'react';
import { apiUrl } from '../services/api';
import type { UsuarioCuenta } from '../types';

interface RespuestaAuth {
  error?: string;
  mensaje?: string;
  usuario?: UsuarioCuenta;
}

async function leerRespuestaAuth(respuesta: Response): Promise<RespuestaAuth> {
  const texto = await respuesta.text();
  if (!texto) return {};

  try {
    const datos: unknown = JSON.parse(texto);
    if (typeof datos !== 'object' || datos === null) return {};
    const objeto = datos as Record<string, unknown>;
    const usuario = typeof objeto.usuario === 'object' && objeto.usuario !== null
      ? objeto.usuario as Record<string, unknown>
      : undefined;
    const correoUsuario = typeof usuario?.correo === 'string' ? usuario.correo : undefined;
    const nombreUsuario = typeof usuario?.nombre === 'string' ? usuario.nombre : '';
    return {
      error: typeof objeto.error === 'string' ? objeto.error : undefined,
      mensaje: typeof objeto.mensaje === 'string' ? objeto.mensaje : undefined,
      usuario: correoUsuario ? {
        nombre: nombreUsuario,
        apodo: typeof usuario?.apodo === 'string' ? usuario.apodo : nombreUsuario || correoUsuario,
        correo: correoUsuario,
        equipoFavorito: typeof usuario?.equipoFavorito === 'string' ? usuario.equipoFavorito : '',
        fechaUnion: typeof usuario?.fechaUnion === 'string' ? usuario.fechaUnion : '',
        condicionesAceptadasEn: typeof usuario?.condicionesAceptadasEn === 'string' ? usuario.condicionesAceptadasEn : null,
        versionCondiciones: typeof usuario?.versionCondiciones === 'string' ? usuario.versionCondiciones : null
      } : undefined
    };
  } catch {
    return {
      mensaje: respuesta.ok
        ? 'El servicio de cuentas respondió con un formato inesperado.'
        : 'El servicio de cuentas no está disponible. Inténtalo más tarde.'
    };
  }
}

interface ModalLoginProps {
  abierto: boolean;
  onCerrar: () => void;
  colCard: string;
  colBorder: string;
  colText: string;
  temaActual: 'oscuro' | 'claro' | 'neon';
  onSesionIniciada: (usuario: UsuarioCuenta) => void;
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
  const [vista, setVista] = useState<'inicio' | 'ingresar' | 'registrar'>('inicio');
  const [nombre, setNombre] = useState('');
  const [apodo, setApodo] = useState('');
  const [correo, setCorreo] = useState('');
  const [equipoFavorito, setEquipoFavorito] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [aceptoCondiciones, setAceptoCondiciones] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  if (!abierto) return null;

  const cerrar = () => {
    setVista('inicio');
    setNombre('');
    setApodo('');
    setCorreo('');
    setEquipoFavorito('');
    setContrasena('');
    setConfirmacion('');
    setAceptoCondiciones(false);
    setMensaje('');
    onCerrar();
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
        body: JSON.stringify({
          nombre,
          apodo,
          equipoFavorito,
          aceptoCondiciones,
          correo,
          contrasena
        })
      });
      const datos = await leerRespuestaAuth(respuesta);
      if (!respuesta.ok) {
        throw new Error(datos.mensaje || 'No se pudo completar la solicitud.');
      }

      if (!datos.usuario?.correo) throw new Error('El servidor no confirmó la sesión. Inténtalo de nuevo.');
      onSesionIniciada(datos.usuario);
      cerrar();
    } catch (fallo) {
      setMensaje(fallo instanceof TypeError
        ? 'No se pudo conectar con el servicio de cuentas. Puede estar temporalmente fuera de servicio.'
        : fallo instanceof Error ? fallo.message : 'No se pudo conectar con el servicio de cuentas.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) cerrar(); }}>
      <section className={`auth-dialog auth-dialog--${temaActual}`} role="dialog" aria-modal="true" aria-labelledby="auth-title" style={{ background: colCard, borderColor: colBorder, color: colText }}>
        <div className="auth-dialog__topline">
          <span className="auth-dialog__brand"><span className="auth-dialog__brand-mark">EG</span>EDEARGOAL <span>CUENTA</span></span>
          <button className="auth-dialog__close" type="button" onClick={cerrar} aria-label="Cerrar">×</button>
        </div>

        <div className="auth-dialog__body">
          <aside className="auth-dialog__intro">
            <span className="auth-dialog__intro-tag">TU PARTIDO. TU PASIÓN.</span>
            <h2>Vive el fútbol desde un solo lugar.</h2>
            <p>Entra a EdearGoal para seguir tus competiciones y consultar la información disponible de cada encuentro.</p>
            <ul>
              <li>Resultados y calendario por liga</li>
              <li>Clubes, estadísticas y comparativas</li>
              <li>Tu cuenta protegida con sesión segura</li>
            </ul>
            <span className="auth-dialog__intro-caption">EDEARGOAL · FÚTBOL EN SEGUIMIENTO</span>
          </aside>
          <div className="auth-dialog__panel">
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
            {vista === 'registrar' && (
              <label className="auth-dialog__field">
                <span>Apodo</span>
                <input autoComplete="nickname" value={apodo} onChange={(event) => setApodo(event.target.value)} required minLength={2} maxLength={30} />
              </label>
            )}
            <label className="auth-dialog__field">
              <span>Correo electrónico</span>
              <input type="email" autoComplete="email" value={correo} onChange={(event) => setCorreo(event.target.value)} required maxLength={254} />
            </label>
            {vista === 'registrar' && (
              <label className="auth-dialog__field">
                <span>Equipo favorito</span>
                <input value={equipoFavorito} onChange={(event) => setEquipoFavorito(event.target.value)} required minLength={2} maxLength={80} placeholder="Ej. Alianza Lima" />
              </label>
            )}
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
                <p className="auth-dialog__hint">Usa al menos 8 caracteres. Al crear tu cuenta, podrás ingresar de inmediato.</p>
                <details className="auth-dialog__terms">
                  <summary>Leer Condiciones de uso y Privacidad</summary>
                  <p>EdearGoal es un proyecto independiente. Los datos deportivos pueden tener retrasos o errores; verifica la información importante con las fuentes oficiales. Usa el sitio de forma lícita y respeta los derechos de terceros.</p>
                  <p>Guardamos tu nombre, correo, apodo, equipo favorito, fecha de registro y aceptación de estas condiciones. La contraseña se almacena como hash y usamos una cookie para mantener tu sesión. No verificamos que tengas acceso al correo que registras. Puedes solicitar acceso, corrección o eliminación de tus datos escribiendo a edeargoal@gmail.com desde el correo de la cuenta.</p>
                  <p>Al continuar, confirmas que leíste y aceptas estas condiciones y la política de privacidad.</p>
                </details>
                <label className="auth-dialog__consent">
                  <input type="checkbox" checked={aceptoCondiciones} onChange={(event) => setAceptoCondiciones(event.target.checked)} required />
                  <span>Acepto las Condiciones de uso y la Política de privacidad.</span>
                </label>
              </>
            )}
            {mensaje && <p className="auth-dialog__notice" role="alert">{mensaje}</p>}
            <button className="auth-dialog__primary" type="submit" disabled={cargando || (vista === 'registrar' && !aceptoCondiciones)}>
              {cargando ? 'Procesando…' : vista === 'registrar' ? 'Crear cuenta' : 'Entrar'}
            </button>
            <button className="auth-dialog__text-button" type="button" onClick={() => { setVista(vista === 'registrar' ? 'ingresar' : 'inicio'); setMensaje(''); }}>
              {vista === 'registrar' ? 'Ya tengo una cuenta' : 'Volver'}
            </button>
          </form>
        )}

            <div className="auth-dialog__footer">
              Puedes revisar Condiciones de uso y Privacidad en el pie de página. No compartas tu contraseña.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}