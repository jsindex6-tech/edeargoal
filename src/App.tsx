import { useEffect, useState } from 'react';
import './App.css';
import type { Partido, LigaConfig } from './types';
import { listaLigas } from './services/ligas';
import SidebarLigas from './components/SidebarLigas';
import Header from './components/Header';
import ModalLogin from './modals/ModalLogin';
import VistaPrincipalHome from './components/VistaPrincipalHome';
import VistaLigaDetalle from './components/VistaLigaDetalle';

export default function App() {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [ligaSeleccionada, setLigaSeleccionada] = useState<LigaConfig | null>(null);
  const [vistaActiva, setVistaActiva] = useState<'home' | 'foro'>('home');
  const [modalIngresarAbierto, setModalIngresarAbierto] = useState(false);
  const [usuarioActivo, setUsuarioActivo] = useState(() => localStorage.getItem('edeargoal_usuario_activo') || '');
  
  // Estado para los 3 temas: 'oscuro' | 'claro' | 'neon'
  const [temaActual, setTemaActual] = useState<'oscuro' | 'claro' | 'neon'>('oscuro');

  const cambiarTemaCiclo = () => {
    if (temaActual === 'oscuro') setTemaActual('claro');
    else if (temaActual === 'claro') setTemaActual('neon');
    else setTemaActual('oscuro');
  };

  useEffect(() => {
    fetch('http://localhost:3001/api/partidos')
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setPartidos(data); })
      .catch((err) => console.error("Error al conectar con el backend:", err));
  }, []);

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
          onCambiarVistaForo={() => setVistaActiva(vistaActiva === 'foro' ? 'home' : 'foro')}
          onAbrirLogin={() => setModalIngresarAbierto(true)}
          usuarioActivo={usuarioActivo}
          onCerrarSesion={() => {
            localStorage.removeItem('edeargoal_usuario_activo');
            setUsuarioActivo('');
          }}
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
            {vistaActiva === 'foro' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <h2 style={{ color: '#3882FF', fontSize: '1.45rem', marginBottom: '8px' }}>💬 Foro de Debate EdearGoal</h2>
                  <p style={{ color: col.textMuted, fontSize: '0.85rem' }}>La previa, el análisis y la pasión por cada partido.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div style={{ background: 'linear-gradient(135deg, rgba(19, 91, 180, 0.8), rgba(9, 25, 58, 0.9))', padding: '16px', borderRadius: '10px', border: '1px solid rgba(89, 170, 255, 0.45)', boxShadow: '0 8px 24px rgba(0, 82, 190, 0.2)' }}>
                    <div style={{ color: '#9BD5FF', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Dato del día</div>
                    <strong style={{ display: 'block', color: '#FFF', fontSize: '1.5rem', marginTop: '7px' }}>{partidos.length}</strong>
                    <span style={{ color: '#C9E8FF', fontSize: '0.75rem' }}>partidos detectados hoy</span>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, rgba(22, 122, 105, 0.8), rgba(8, 48, 48, 0.9))', padding: '16px', borderRadius: '10px', border: '1px solid rgba(87, 226, 190, 0.4)' }}>
                    <div style={{ color: '#8FF4D5', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Comunidad</div>
                    <strong style={{ display: 'block', color: '#FFF', fontSize: '1.1rem', marginTop: '11px' }}>Tu opinión cuenta</strong>
                    <span style={{ color: '#C8FFF1', fontSize: '0.75rem' }}>Comparte tu análisis</span>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, rgba(116, 72, 178, 0.8), rgba(38, 20, 76, 0.9))', padding: '16px', borderRadius: '10px', border: '1px solid rgba(190, 143, 255, 0.4)' }}>
                    <div style={{ color: '#DDBBFF', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Predicción</div>
                    <strong style={{ display: 'block', color: '#FFF', fontSize: '1.1rem', marginTop: '11px' }}>¿Quién será campeón?</strong>
                    <span style={{ color: '#E9D7FF', fontSize: '0.75rem' }}>Defiende a tu favorito</span>
                  </div>
                </div>

                <div style={{ backgroundColor: col.cardInner, padding: '18px', borderRadius: '10px', border: `1px solid ${col.border}` }}>
                  <div style={{ color: esNeon ? '#FFD700' : '#3882FF', fontSize: '0.72rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Debate abierto</div>
                  <h4 style={{ margin: '0 0 8px 0', color: col.text, fontSize: '1rem' }}>¿Qué equipo llega mejor preparado para la próxima fecha?</h4>
                  <p style={{ margin: 0, color: col.textMuted, fontSize: '0.8rem' }}>Comparte tu pronóstico y explica qué jugador puede marcar la diferencia.</p>
                </div>
              </div>
            ) : ligaSeleccionada === null ? (
              <VistaPrincipalHome 
                partidos={partidos}
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
          colCardInner={col.cardInner}
          esNeon={esNeon}
          onSesionIniciada={setUsuarioActivo}
        />
      </div>
    </div>
  );
}