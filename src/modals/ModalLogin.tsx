import { useState } from 'react';

interface ModalLoginProps {
  abierto: boolean;
  onCerrar: () => void;
  colCard: string;
  colBorder: string;
  colText: string;
  colCardInner: string;
  esNeon: boolean;
  onSesionIniciada: (correo: string) => void;
}

export default function ModalLogin({
  abierto,
  onCerrar,
  colCard,
  colBorder,
  colText,
  colCardInner,
  esNeon,
  onSesionIniciada
}: ModalLoginProps) {
  const [vista, setVista] = useState<'opciones' | 'ingresar' | 'registrar'>('opciones');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [mensaje, setMensaje] = useState('');

  if (!abierto) return null;

  const cerrar = () => {
    setVista('opciones');
    setCorreo('');
    setContrasena('');
    setConfirmacion('');
    setMensaje('');
    onCerrar();
  };

  const enviarFormulario = () => {
    if (!correo.includes('@')) {
      setMensaje('Escribe un correo válido.');
      return;
    }
    if (contrasena.length < 6) {
      setMensaje('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const usuarios = JSON.parse(localStorage.getItem('edeargoal_usuarios') || '{}');
    if (vista === 'registrar') {
      if (contrasena !== confirmacion) {
        setMensaje('Las contraseñas no coinciden.');
        return;
      }
      if (usuarios[correo]) {
        setMensaje('Ese correo ya tiene una cuenta.');
        return;
      }
      usuarios[correo] = contrasena;
      localStorage.setItem('edeargoal_usuarios', JSON.stringify(usuarios));
    } else if (usuarios[correo] !== contrasena) {
      setMensaje('El correo o la contraseña no son correctos.');
      return;
    }

    localStorage.setItem('edeargoal_usuario_activo', correo);
    onSesionIniciada(correo);
    cerrar();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: colCard, border: `1px solid ${colBorder}`, padding: '30px', borderRadius: '12px', width: '350px', boxSizing: 'border-box', color: colText, position: 'relative' }}>
        <h3 style={{ margin: '0 0 20px 0', color: esNeon ? '#FFD700' : '#FFD700', textAlign: 'center' }}>
          {vista === 'registrar' ? 'Crear cuenta' : 'Entrar a EDEARGOAL'}
        </h3>
        {vista === 'opciones' ? (
          <>
            <p style={{ color: '#8A90A2', textAlign: 'center', fontSize: '0.85rem', marginBottom: '20px' }}>Accede con tu correo electrónico.</p>
            <button onClick={() => setVista('ingresar')} style={{ width: '100%', backgroundColor: '#FF3B30', color: '#FFF', border: 'none', padding: '11px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>
              Continuar con correo
            </button>
            <button onClick={() => setVista('registrar')} style={{ width: '100%', backgroundColor: '#B7F000', color: '#10131E', border: 'none', padding: '11px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>
              Crear cuenta
            </button>
          </>
        ) : (
          <>
            <input type="email" placeholder="Correo electrónico" value={correo} onChange={(event) => setCorreo(event.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '12px', backgroundColor: colCardInner, border: `1px solid ${colBorder}`, color: colText, borderRadius: '6px', boxSizing: 'border-box' }} />
            <input type="password" placeholder="Contraseña" value={contrasena} onChange={(event) => setContrasena(event.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '12px', backgroundColor: colCardInner, border: `1px solid ${colBorder}`, color: colText, borderRadius: '6px', boxSizing: 'border-box' }} />
            {vista === 'registrar' && <input type="password" placeholder="Repetir contraseña" value={confirmacion} onChange={(event) => setConfirmacion(event.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '12px', backgroundColor: colCardInner, border: `1px solid ${colBorder}`, color: colText, borderRadius: '6px', boxSizing: 'border-box' }} />}
            {mensaje && <p style={{ color: '#FF6B61', fontSize: '0.78rem', margin: '0 0 12px' }}>{mensaje}</p>}
            <button onClick={enviarFormulario} style={{ width: '100%', backgroundColor: '#FF3B30', color: '#FFF', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>
              {vista === 'registrar' ? 'Crear cuenta' : 'Continuar con correo'}
            </button>
            <button onClick={() => { setVista('opciones'); setMensaje(''); }} style={{ width: '100%', backgroundColor: 'transparent', color: '#8A90A2', border: `1px solid ${colBorder}`, padding: '8px', borderRadius: '6px', cursor: 'pointer', marginBottom: '10px' }}>
              Volver
            </button>
          </>
        )}
        <button onClick={cerrar} style={{ width: '100%', backgroundColor: 'transparent', color: '#8A90A2', border: `1px solid ${colBorder}`, padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}