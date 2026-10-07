// src/components/Header.tsx
import { useState } from 'react';
import { enlacesRedes } from '../services/sociales';
import type { UsuarioCuenta } from '../types';

interface HeaderProps {
  onIrHome: () => void;
  temaActual: 'oscuro' | 'claro' | 'neon';
  onCambiarTema: () => void;
  vistaActiva: 'home' | 'cara-a-cara';
  onCambiarVistaCaraACara: () => void;
  onAbrirLogin: () => void;
  usuarioActivo: UsuarioCuenta | null;
  onCerrarSesion: () => void;
}

function formatearFecha(fecha: string | null | undefined, estilo: 'long' | 'medium') {
  if (!fecha) return null;
  const fechaValida = new Date(fecha);
  if (Number.isNaN(fechaValida.getTime())) return null;
  return new Intl.DateTimeFormat('es-PE', { dateStyle: estilo, timeZone: 'America/Lima' }).format(fechaValida);
}

export default function Header({
  onIrHome,
  temaActual,
  onCambiarTema,
  vistaActiva,
  onCambiarVistaCaraACara,
  onAbrirLogin,
  usuarioActivo,
  onCerrarSesion
}: HeaderProps) {
  const esOscuro = temaActual === 'oscuro' || temaActual === 'neon';
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const fechaUnion = formatearFecha(usuarioActivo?.fechaUnion, 'long') || 'Fecha no disponible';
  const fechaAceptacion = formatearFecha(usuarioActivo?.condicionesAceptadasEn, 'medium');

  return (
    <header className="site-header" style={{ 
      padding: '10px 20px',
      marginBottom: '18px', 
      display: 'flex', 
      justifyContent: 'space-between',
      alignItems: 'center', 
      width: '100%',
      boxSizing: 'border-box',
      background: esOscuro
        ? temaActual === 'neon'
          ? 'linear-gradient(135deg, rgba(11, 27, 54, 0.97) 0%, rgba(5, 14, 31, 0.97) 100%)'
          : 'linear-gradient(135deg, rgba(8, 11, 18, 0.96) 0%, rgba(5, 7, 11, 0.96) 100%)'
        : 'rgba(255, 255, 255, 0.85)',
      borderRadius: '14px',
      border: `1px solid ${esOscuro ? 'rgba(56, 130, 255, 0.35)' : 'rgba(0, 0, 0, 0.12)'}`,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      boxShadow: esOscuro
        ? `0 10px 30px -5px rgba(52, 120, 246, ${temaActual === 'neon' ? '0.24' : '0.16'}), inset 0 1px 1px rgba(255, 255, 255, 0.1)`
        : '0 8px 24px rgba(0, 0, 0, 0.08)'
    }}>
      {/* Identidad de EdearGoal */}
      <div 
        className="site-header__brand"
        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.2s ease' }} 
        onClick={onIrHome}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <img
          className="site-header__logo"
          src="./edeargoal.jpg"
          alt="EdearGoal"
          title="EdearGoal, inicio"
        />
      </div>

      {/* Centro: Redes Sociales y Selector de Temas */}
      <div className="site-header__socials" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <a 
          href={enlacesRedes.twitter} 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ textDecoration: 'none', color: '#FFF', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', boxSizing: 'border-box', transition: 'all 0.2s ease' }} 
          title="Síguenos en X"
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(29, 155, 240, 0.25)'; e.currentTarget.style.borderColor = '#1DA1F2'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
        
        <a 
          href={enlacesRedes.instagram} 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ textDecoration: 'none', color: '#FFF', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', boxSizing: 'border-box', transition: 'all 0.2s ease' }} 
          title="Síguenos en Instagram"
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(225, 48, 108, 0.25)'; e.currentTarget.style.borderColor = '#E1306C'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
        </a>

        <a 
          href={enlacesRedes.tiktok} 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ textDecoration: 'none', color: '#FFF', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', boxSizing: 'border-box', transition: 'all 0.2s ease' }} 
          title="Síguenos en TikTok"
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(37, 244, 238, 0.25)'; e.currentTarget.style.borderColor = '#25F4EE'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
        </a>

        {/* Botón Cambiar Tema */}
        <button
          className={`header-theme-button header-theme-button--${temaActual}`}
          onClick={onCambiarTema}
          aria-label={`Tema actual: ${temaActual === 'neon' ? 'azul noche' : temaActual}. Cambiar tema`}
          title={`Cambiar tema · ${temaActual === 'neon' ? 'azul noche' : 'oscuro'}`}
        >
          <img
            src="./theme-moon.svg"
            alt=""
            width="20"
            height="20"
            style={{ filter: 'drop-shadow(0 0 6px rgba(0, 170, 255, 0.8))' }}
          />
        </button>
      </div>

      {/* Derecha: acceso a la cuenta */}
      <div className="site-header__actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          type="button"
          className={`header-comparison-button${vistaActiva === 'cara-a-cara' ? ' header-comparison-button--active' : ''}`}
          onClick={onCambiarVistaCaraACara}
          aria-pressed={vistaActiva === 'cara-a-cara'}
        >
          COMPARAR EQUIPOS
        </button>
        {usuarioActivo ? (
          <div style={{ position: 'relative' }}>
            <button
              className="header-profile-button"
              onClick={() => setMenuPerfilAbierto((a) => !a)}
              title="Abrir perfil"
              aria-label="Abrir perfil"
              aria-expanded={menuPerfilAbierto}
            >
              {(usuarioActivo.apodo || usuarioActivo.nombre || usuarioActivo.correo).charAt(0).toUpperCase()}
            </button>
            {menuPerfilAbierto && (
              <div style={{ position: 'absolute', right: 0, top: '50px', width: 'min(280px, calc(100vw - 32px))', padding: '16px', background: 'rgba(10, 18, 38, 0.97)', border: '1px solid #3882FF', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)', zIndex: 20, backdropFilter: 'blur(10px)' }}>
                <div style={{ color: '#8A90A2', fontSize: '0.72rem', marginBottom: '4px' }}>MI CUENTA</div>
                <div style={{ color: '#FFF', fontSize: '1rem', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{usuarioActivo.apodo || usuarioActivo.nombre}</div>
                <div style={{ color: '#AAB7CC', fontSize: '0.78rem', overflowWrap: 'anywhere', margin: '3px 0 14px' }}>{usuarioActivo.correo}</div>
                <div style={{ borderTop: '1px solid rgba(145, 186, 255, 0.18)', paddingTop: '12px', display: 'grid', gap: '10px', marginBottom: '14px' }}>
                  <div>
                    <div style={{ color: '#8A90A2', fontSize: '0.68rem' }}>EQUIPO FAVORITO</div>
                    <div style={{ color: '#FFF', fontSize: '0.82rem' }}>{usuarioActivo.equipoFavorito || 'Aún no indicado'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#8A90A2', fontSize: '0.68rem' }}>MIEMBRO DESDE</div>
                    <div style={{ color: '#FFF', fontSize: '0.82rem' }}>{fechaUnion}</div>
                  </div>
                  {fechaAceptacion && (
                    <div>
                      <div style={{ color: '#8A90A2', fontSize: '0.68rem' }}>CONDICIONES ACEPTADAS</div>
                      <div style={{ color: '#FFF', fontSize: '0.82rem' }}>{fechaAceptacion}</div>
                      {usuarioActivo.versionCondiciones && (
                        <div style={{ color: '#AAB7CC', fontSize: '0.7rem' }}>Versión {usuarioActivo.versionCondiciones}</div>
                      )}
                    </div>
                  )}
                </div>
                <button className="header-logout-button" onClick={() => { setMenuPerfilAbierto(false); onCerrarSesion(); }}>
                  CERRAR SESIÓN
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            className="header-login-button"
            onClick={onAbrirLogin}
            title="Iniciar sesión"
          >
             INGRESAR
          </button>
        )}
      </div>
    </header>
  );
}