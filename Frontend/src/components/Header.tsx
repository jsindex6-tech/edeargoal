// src/components/Header.tsx
import { useState } from 'react';
import { enlacesRedes } from '../services/sociales';

interface HeaderProps {
  onIrHome: () => void;
  temaActual: 'oscuro' | 'claro' | 'neon';
  onCambiarTema: () => void;
  vistaActiva: 'home' | 'cara-a-cara';
  onCambiarVistaCaraACara: () => void;
  onAbrirLogin: () => void;
  usuarioActivo: string;
  onCerrarSesion: () => void;
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
        ? 'linear-gradient(135deg, rgba(10, 18, 38, 0.75) 0%, rgba(5, 10, 24, 0.85) 100%)' 
        : 'rgba(255, 255, 255, 0.85)',
      borderRadius: '14px',
      border: `1px solid ${esOscuro ? 'rgba(56, 130, 255, 0.35)' : 'rgba(0, 0, 0, 0.12)'}`,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      boxShadow: esOscuro 
        ? '0 10px 30px -5px rgba(0, 102, 255, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.15)' 
        : '0 8px 24px rgba(0, 0, 0, 0.08)'
    }}>
      {/* Izquierda: Logo Oficial Personalizado */}
      <div 
        className="site-header__brand"
        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.2s ease' }} 
        onClick={onIrHome}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <img 
          src="./edeargoal.jpg" 
          alt="EDEARGOAL Logo" 
          style={{
            height: '48px',
            width: 'auto',
            objectFit: 'contain',
            borderRadius: '8px',
            filter: 'drop-shadow(0 0 12px rgba(0, 140, 255, 0.9))'
          }} 
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
          onClick={onCambiarTema} 
          style={{ 
            background: temaActual === 'neon' ? 'rgba(255, 215, 0, 0.18)' : 'rgba(255, 255, 255, 0.05)', 
            color: esOscuro ? '#FFF' : '#333', 
            cursor: 'pointer', 
            border: `1px solid ${temaActual === 'neon' ? '#FFD700' : 'rgba(255, 255, 255, 0.15)'}`, 
            padding: '6px 10px', 
            borderRadius: '10px', 
            height: '38px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }} 
          title="Cambiar tema"
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
              onClick={() => setMenuPerfilAbierto((a) => !a)} 
              title="Abrir perfil" 
              style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #3882FF', background: 'linear-gradient(135deg, #1E68FF, #0A2540)', color: '#FFF', cursor: 'pointer', fontSize: '1rem', fontWeight: '900', boxShadow: '0 0 15px rgba(56, 130, 255, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 22px rgb(255, 129, 45)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 18px rgb(255, 129, 45)'; }}
            >
              {usuarioActivo.charAt(0).toUpperCase()}
            </button>
            {menuPerfilAbierto && (
              <div style={{ position: 'absolute', right: 0, top: '50px', width: '220px', padding: '14px', background: 'rgba(10, 18, 38, 0.95)', border: '1px solid #3882FF', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)', zIndex: 20, backdropFilter: 'blur(10px)' }}>
                <div style={{ color: '#8A90A2', fontSize: '0.72rem', marginBottom: '4px' }}>Sesión iniciada</div>
                <div style={{ color: '#FFF', fontSize: '0.85rem', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '12px' }}>{usuarioActivo}</div>
                <button onClick={() => { setMenuPerfilAbierto(false); onCerrarSesion(); }} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid rgba(255, 59, 48, 0.6)', background: 'rgba(255, 59, 48, 0.15)', color: '#FF453A', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', transition: 'all 0.2s ease' }}>
                  CERRAR SESIÓN
                </button>
              </div>
            )}
          </div>
        ) : (
          <button 
            onClick={onAbrirLogin} 
            title="Iniciar sesión" 
            style={{ 
              background: 'linear-gradient(135deg, #3e30fffd 0%, #3e30fffd 0%', 
              color: '#FFF', 
              border: 'none', 
              padding: '9px 20px', 
              borderRadius: '9px', 
              cursor: 'pointer', 
              fontWeight: '800', 
              fontSize: '0.8rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              letterSpacing: '0.03em',
              boxShadow: '0 4px 18px rgba(255, 45, 85, 0.45)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(108, 45, 255, 0.6)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 18px rgb(195, 45, 255)'; }}
          >
             INGRESAR
          </button>
        )}
      </div>
    </header>
  );
}