import { useEffect, useState } from 'react';
import './App.css';
import type { LigaConfig } from './types';
import { listaLigas } from './services/ligas';
import SidebarLigas from './components/SidebarLigas';
import Header from './components/Header';
import ModalLogin from './modals/ModalLogin';
import VistaPrincipalHome from './components/VistaPrincipalHome';
import VistaLigaDetalle from './components/VistaLigaDetalle';
import VistaCaraACara from './components/VistaCaraACara';
import Footer from './components/Footer';
import { apiUrl } from './services/api';

export default function App() {
  const [ligaSeleccionada, setLigaSeleccionada] = useState<LigaConfig | null>(null);
  const [vistaActiva, setVistaActiva] = useState<'home' | 'cara-a-cara'>('home');
  const [modalIngresarAbierto, setModalIngresarAbierto] = useState(false);
  const [usuarioActivo, setUsuarioActivo] = useState('');
  
  // Estado para los 3 temas: 'oscuro' | 'claro' | 'neon'
  const [temaActual, setTemaActual] = useState<'oscuro' | 'claro' | 'neon'>('oscuro');

  const cambiarTemaCiclo = () => {
    if (temaActual === 'oscuro') setTemaActual('claro');
    else if (temaActual === 'claro') setTemaActual('neon');
    else setTemaActual('oscuro');
  };

  useEffect(() => {
    let activo = true;
    try {
      localStorage.removeItem('edeargoal_usuarios');
      localStorage.removeItem('edeargoal_usuario_activo');
    } catch {
      // El login nuevo no depende del almacenamiento local.
    }
    const comprobarSesion = async () => {
      try {
        const respuesta = await fetch(apiUrl('/api/auth/sesion'), { credentials: 'include' });
        const datos = await respuesta.json();
        if (!activo) return;
        if (respuesta.ok && datos.usuario?.correo) {
          setUsuarioActivo(datos.usuario.correo);
        }
      } catch { /* La sesión permanece cerrada si el backend no responde. */ }
    };

    void comprobarSesion();
    return () => { activo = false; };
  }, []);

  const cerrarSesion = async () => {
    try {
      await fetch(apiUrl('/api/auth/cerrar-sesion'), { method: 'POST', credentials: 'include' });
    } finally {
      setUsuarioActivo('');
    }
  };

  const obtenerColores = () => {
    switch (temaActual) {
      case 'claro': return { bg: '#DDEEFF', text: '#10233F', card: '#F7FBFF', border: 'rgba(39, 104, 180, 0.22)', cardInner: '#EAF4FF', headerTabBg: '#D7EBFF', textMuted: '#46627F' };
      case 'neon': return { bg: '#06080F', text: '#FFF', card: '#0F1322', border: 'rgba(255, 215, 0, 0.25)', cardInner: '#151A2E', headerTabBg: '#192038', textMuted: '#8A90A2' };
      default: return { bg: '#0A0C14', text: '#FFF', card: '#131722', border: 'rgba(255,255,255,0.08)', cardInner: '#111522', headerTabBg: '#181C28', textMuted: '#8A90A2' };
    }
  };

  const col = obtenerColores();
  const esNeon = temaActual === 'neon';

  return (
    <div className={`app-shell ${temaActual}`} style={{ color: col.text, position: 'relative' }}>
      {/* Imagen del estadio en el fondo */}
      <img 
        src="./estadio-azul.jpeg" 
        alt="Estadio" 
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.5, pointerEvents: 'none' }} 
      />

      <div className="snow-layer" aria-hidden="true" />
      <div className="light-sheen" aria-hidden="true" />
      <div className="content-shell">
        <Header 
          onIrHome={() => { setLigaSeleccionada(null); setVistaActiva('home'); }}
          temaActual={temaActual}
          onCambiarTema={cambiarTemaCiclo}
          vistaActiva={vistaActiva}
          onCambiarVistaCaraACara={() => {
            setLigaSeleccionada(null);
            setVistaActiva(vistaActiva === 'cara-a-cara' ? 'home' : 'cara-a-cara');
          }}
          onAbrirLogin={() => setModalIngresarAbierto(true)}
          usuarioActivo={usuarioActivo}
          onCerrarSesion={() => { void cerrarSesion(); }}
        />

        <main className="main-layout">
          <section className="sidebar-panel">
            <SidebarLigas 
              listaLigas={listaLigas} 
              onSeleccionarLiga={(liga: LigaConfig) => {
                setLigaSeleccionada(liga);
                setVistaActiva('home');
              }}
              temaActual={temaActual}
            />
          </section>

          <section className="content-panel" style={{ backgroundColor: temaActual === 'claro' ? 'rgba(247, 251, 255, 0.9)' : 'rgba(13, 18, 36, 0.78)', border: `1px solid ${col.border}`, boxShadow: temaActual === 'claro' ? '0 12px 40px rgba(35, 94, 150, 0.16)' : '0 12px 40px rgba(0, 0, 0, 0.28)' }}>
            {vistaActiva === 'cara-a-cara' ? (
              <VistaCaraACara ligas={listaLigas} temaActual={temaActual} />
            ) : ligaSeleccionada === null ? (
              <VistaPrincipalHome 
                esNeon={esNeon} 
                colCardInner={col.cardInner} 
                colBorder={col.border} 
                colText={col.text} 
                colTextMuted={col.textMuted} 
              />
            ) : (
              <VistaLigaDetalle 
                ligaSeleccionada={ligaSeleccionada} 
                onRegresarGeneral={() => setLigaSeleccionada(null)}
              />
            )}
          </section>
        </main>

        <ModalLogin 
          abierto={modalIngresarAbierto}
          onCerrar={() => setModalIngresarAbierto(false)}
          colCard={col.card}
          colBorder={col.border}
          colText={col.text}
          temaActual={temaActual}
          onSesionIniciada={setUsuarioActivo}
        />
        <Footer temaActual={temaActual} />
      </div>
    </div>
  );
}