// src/components/Header.tsx
import { useState } from 'react';
import { enlacesRedes } from '../services/sociales';

interface HeaderProps {
  onIrHome: () => void;
  temaActual: 'oscuro' | 'claro' | 'neon';
  onCambiarTema: () => void;
  vistaActiva: 'home' | 'foro';
  onCambiarVistaForo: () => void;
  onAbrirLogin: () => void;
  usuarioActivo: string;
  onCerrarSesion: () => void;
}

export default function Header({
  onIrHome,
  temaActual,
  onCambiarTema,
  vistaActiva,
  onCambiarVistaForo,
  onAbrirLogin,
  usuarioActivo,
  onCerrarSesion
}: HeaderProps) {
  const esOscuro = temaActual === 'oscuro' || temaActual === 'neon';
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);

  return (
    <header style={{ 
      borderBottom: `1px solid ${esOscuro ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.1)'}`, 
      padding: '12px 16px 16px',
      marginBottom: '15px', 
      display: 'flex', 
        justifyContent: 'space-between',
      alignItems: 'center', 
      width: '100%',
      background: esOscuro ? 'rgba(8, 12, 27, 0.78)' : 'rgba(255, 255, 255, 0.88)',
      borderRadius: '10px',
      boxShadow: esOscuro ? '0 8px 34px rgba(0, 87, 255, 0.3)' : '0 8px 24px rgba(0, 0, 0, 0.08)'
    }}>
      {/* Izquierda: Logo Oficial Personalizado */}
      <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={onIrHome}>
        <img 
          src="/edeargoal.jpg" 
          alt="EDEARGOAL Logo" 
           style={{
             height: '56px',
             width: '138px',
            objectFit: 'contain',
            borderRadius: '8px',
             filter: 'drop-shadow(0 0 9px rgba(0, 132, 255, 0.85)) drop-shadow(0 0 18px rgba(0, 72, 255, 0.48))'
          }} 
        />
      </div>

      {/* Centro: Redes Sociales y Selector de 3 Temas */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <a href={enlacesRedes.twitter} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#D8EAFF', background: 'linear-gradient(145deg, rgba(24, 111, 255, 0.42), rgba(10, 20, 48, 0.92))', cursor: 'pointer', border: '1px solid rgba(74, 150, 255, 0.7)', padding: '8px 11px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '38px', minWidth: '38px', boxSizing: 'border-box', boxShadow: '0 0 14px rgba(0, 109, 255, 0.3)' }} title="Síguenos en X">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
        
        <a href={enlacesRedes.instagram} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#D8EAFF', background: 'linear-gradient(145deg, rgba(45, 132, 255, 0.46), rgba(10, 20, 48, 0.92))', cursor: 'pointer', border: '1px solid rgba(94, 169, 255, 0.7)', padding: '8px 11px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '38px', minWidth: '38px', boxSizing: 'border-box', boxShadow: '0 0 14px rgba(0, 109, 255, 0.3)' }} title="Síguenos en Instagram">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
        </a>

        <a href={enlacesRedes.tiktok} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#D8EAFF', background: 'linear-gradient(145deg, rgba(30, 119, 255, 0.48), rgba(10, 20, 48, 0.92))', cursor: 'pointer', border: '1px solid rgba(94, 169, 255, 0.7)', padding: '8px 11px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '38px', minWidth: '38px', boxSizing: 'border-box', boxShadow: '0 0 14px rgba(0, 109, 255, 0.3)' }} title="Síguenos en TikTok">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
        </a>

        {/* Botón de 3 Temas con indicador visual */}
        <button 
          onClick={onCambiarTema} 
          style={{ 
            background: temaActual === 'neon' ? 'rgba(255, 215, 0, 0.15)' : 'transparent', 
            color: esOscuro ? '#8A90A2' : '#555', 
            cursor: 'pointer', 
            border: `1px solid ${temaActual === 'neon' ? '#FFD700' : (esOscuro ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)')}`, 
            padding: '6px 12px', 
            borderRadius: '6px', 
            height: '32px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px',
            fontSize: '0.75rem',
            fontWeight: 'bold'
          }} 
          title="Cambiar tema: luna, sol y pelota"
        >
          <img
            src={temaActual === 'oscuro' ? '/theme-moon.svg' : temaActual === 'claro' ? '/theme-sun.svg' : '/theme-ball.svg'}
            alt=""
            width="22"
            height="22"
            style={{ display: 'block', filter: 'drop-shadow(0 0 5px rgba(61, 159, 255, 0.7))' }}
          />
        </button>
      </div>

      {/* Derecha: Botones de Foro e Ingresar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={onCambiarVistaForo} style={{ backgroundColor: vistaActiva === 'foro' ? '#3882FF' : (esOscuro ? '#131722' : '#E2E6EE'), color: vistaActiva === 'foro' ? '#FFF' : (esOscuro ? '#D0D5E5' : '#333'), border: `1px solid ${esOscuro ? '#23293D' : '#CCC'}`, padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          💬 FORO
        </button>
        {usuarioActivo ? (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setMenuPerfilAbierto((abierto) => !abierto)} title="Abrir perfil" aria-label="Abrir perfil" style={{ width: '42px', height: '42px', borderRadius: '50%', border: '2px solid #55B7FF', background: 'linear-gradient(135deg, #2f9bff, #1451c4)', color: '#FFF', cursor: 'pointer', fontSize: '1rem', fontWeight: '900', boxShadow: '0 0 18px rgba(47, 155, 255, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {usuarioActivo.charAt(0).toUpperCase()}
            </button>
            {menuPerfilAbierto && (
              <div style={{ position: 'absolute', right: 0, top: '52px', width: '245px', padding: '14px', background: 'linear-gradient(155deg, #142B50, #081326)', border: '1px solid #3E9DFF', borderRadius: '12px', boxShadow: '0 12px 32px rgba(0, 50, 130, 0.55)', zIndex: 20 }}>
                <div style={{ color: '#BFE4FF', fontSize: '0.72rem', marginBottom: '5px' }}>Sesión iniciada</div>
                <div style={{ color: '#FFF', fontSize: '0.8rem', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '12px' }}>{usuarioActivo}</div>
                <button onClick={() => { setMenuPerfilAbierto(false); onCerrarSesion(); }} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #67C5FF', background: 'linear-gradient(135deg, #168DFF, #0752C7)', color: '#FFF', cursor: 'pointer', fontWeight: '900', fontSize: '0.72rem', boxShadow: '0 0 15px rgba(22, 141, 255, 0.48)' }}>
                  CERRAR SESIÓN
                </button>
              </div>
            )}
          </div>
        ) : (
          <button onClick={onAbrirLogin} title="Iniciar sesión" style={{ background: 'linear-gradient(135deg, #ff3b30, #b71c1c)', color: '#FFF', border: '1px solid #ff6b61', padding: '9px 18px', borderRadius: '7px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 0 18px rgba(255, 59, 48, 0.2)' }}>
            👤 INGRESAR
          </button>
        )}
      </div>
    </header>
  );
}