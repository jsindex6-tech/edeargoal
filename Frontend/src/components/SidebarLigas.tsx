// src/components/SidebarLigas.tsx
import { useState } from 'react';
import type { LigaConfig } from '../types';
import { obtenerLogoLiga } from '../services/logosLigas';

interface Props {
  listaLigas: LigaConfig[];
  onSeleccionarLiga: (liga: LigaConfig) => void;
  temaActual?: 'oscuro' | 'claro' | 'neon';
}

export default function SidebarLigas({ listaLigas, onSeleccionarLiga, temaActual = 'oscuro' }: Props) {
  const [busquedaLiga, setBusquedaLiga] = useState<string>("");
  const [regionesAbiertas, setRegionesAbiertas] = useState<Record<string, boolean>>({
    "Sudamérica": true,
    "Internacional": false,
    "Europa": false,
    "Norteamérica": false,
    "Centroamérica": false,
    "Asia": false,
    "Selecciones": false
  });

  const [paisesAbiertos, setPaisesAbiertos] = useState<Record<string, boolean>>({
    "Argentina": true
  });

  const toggleRegion = (region: string) => {
    setRegionesAbiertas(prev => ({ ...prev, [region]: !prev[region] }));
  };

  const togglePais = (pais: string) => {
    setPaisesAbiertos(prev => ({ ...prev, [pais]: !prev[pais] }));
  };

  const regionesDisponibles: Array<LigaConfig['region']> = [
    'Internacional', 'Sudamérica', 'Europa', 'Norteamérica', 'Centroamérica', 'Asia', 'Selecciones'
  ];
  const esClaro = temaActual === 'claro';

  return (
    <>
      <style>{`
        @keyframes moverFondo {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <div style={{ backgroundColor: esClaro ? 'rgba(247, 251, 255, 0.92)' : 'rgba(13, 18, 36, 0.82)', border: `1px solid ${esClaro ? 'rgba(39, 104, 180, 0.24)' : 'rgba(90, 135, 255, 0.22)'}`, borderRadius: '10px', padding: '15px', height: '100%', minHeight: 0, boxSizing: 'border-box', overflow: 'hidden', display: 'flex', flexDirection: 'column', backdropFilter: 'blur(8px)', boxShadow: esClaro ? '0 12px 35px rgba(35, 94, 150, 0.14)' : '0 12px 35px rgba(0, 0, 0, 0.24)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1E2338', paddingBottom: '10px', marginBottom: '10px' }}>
          <span style={{
            color: '#FFFFFF',
            fontWeight: 900,
            fontSize: '1.05rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontFamily: 'Impact, Haettenschweiler, "Arial Black", sans-serif',
            textShadow: 'none',
          }}>COMPETENCIAS</span>
          <span style={{ color: esClaro ? '#46627F' : '#A0A5B5', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.08em' }}>{listaLigas.length}</span>
        </div>

      <input
        type="text"
        placeholder="Buscar competencia..."
        value={busquedaLiga}
        onChange={(e) => setBusquedaLiga(e.target.value)}
        style={{ width: '100%', padding: '8px', backgroundColor: esClaro ? '#FFFFFF' : '#0B0D17', border: `1px solid ${esClaro ? '#A9C9E8' : '#1E2338'}`, color: esClaro ? '#10233F' : '#FFF', borderRadius: '5px', marginBottom: '10px', fontSize: '0.85rem', boxSizing: 'border-box' }}
      />

      <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, paddingRight: '5px' }}>
        {regionesDisponibles.map((region) => {
          const ligasEnRegion = listaLigas.filter(l => 
            l.region === region && 
            (l.nombreMostrar.toLowerCase().includes(busquedaLiga.toLowerCase()) ||
             l.paisBuscado.toLowerCase().includes(busquedaLiga.toLowerCase()) ||
             region.toLowerCase().includes(busquedaLiga.toLowerCase()))
          );

          if (busquedaLiga && ligasEnRegion.length === 0) return null;
          const regionAbierta = regionesAbiertas[region] || busquedaLiga.length > 0;
          const paisesEnRegion = Array.from(new Set(ligasEnRegion.map(l => l.paisBuscado)));

          return (
            <div key={region} style={{ marginBottom: '8px' }}>
              <div
                onClick={() => toggleRegion(region)}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  padding: '9px 10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontWeight: 900,
                  fontSize: '0.78rem',
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  fontFamily: 'Impact, Haettenschweiler, "Arial Black", sans-serif',
                  color: '#FFFFFF',
                  background: 'linear-gradient(90deg, rgba(17, 22, 36, 0.96), rgba(21, 27, 42, 0.88))',
                  backgroundSize: '100% 100%',
                  animation: 'none',
                  borderLeft: '3px solid rgba(255,255,255,0.8)',
                  borderRadius: '6px',
                  marginBottom: '5px',
                  textShadow: 'none',
                  boxShadow: 'inset 0 0 12px rgba(255,255,255,0.02)'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '16px', height: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.4))' }}>🏆</span>
                  {region.toUpperCase()}
                </span>
                <span style={{ fontSize: '0.7rem', opacity: 0.9 }}>{regionAbierta ? '▲' : '▼'}</span>
              </div>

              {regionAbierta && paisesEnRegion.map((pais) => {
                const ligasDelPais = ligasEnRegion.filter(l => l.paisBuscado === pais);
                const codigoPais = ligasDelPais[0]?.codigoPais || 'un';
                const paisAbierto = paisesAbiertos[pais] || busquedaLiga.length > 0;

                return (
                  <div key={pais} style={{ marginLeft: '4px', marginBottom: '4px' }}>
                    <div
                      onClick={() => togglePais(pais)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        color: '#FFFFFF',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        fontFamily: 'Arial Black, Impact, sans-serif',
                        backgroundColor: 'rgba(255,255,255,0.02)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        textShadow: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <img src={`https://flagcdn.com/w40/${codigoPais}.png`} alt={pais} style={{ width: '14px', height: '10px', objectFit: 'cover', borderRadius: '2px', boxShadow: '0 0 0 1px rgba(255,255,255,0.1)' }} />
                        <span>{pais}</span>
                      </div>
                      <span style={{ fontSize: '0.62rem', opacity: 0.8 }}>{paisAbierto ? '▲' : '▼'}</span>
                    </div>

                    {paisAbierto && (
                      <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '10px', marginTop: '3px', borderLeft: '1px solid #1E2338', paddingLeft: '6px' }}>
                        {ligasDelPais.map((item: LigaConfig) => (
                          <div
                            key={item.idLiga}
                            onClick={() => onSeleccionarLiga({ ...item, logo: obtenerLogoLiga(item.idLiga) })}
                            style={{
                              padding: '6px 7px',
                              cursor: 'pointer',
                              color: '#FFFFFF',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              letterSpacing: '0.04em',
                              fontFamily: 'Segoe UI, Arial, sans-serif',
                              borderRadius: '5px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '7px',
                              background: 'rgba(255,255,255,0.02)',
                              marginBottom: '2px',
                              boxShadow: 'inset 0 0 10px rgba(255,255,255,0.02)',
                              textTransform: 'uppercase'
                            }}
                          >
                            <span style={{ position: 'relative', width: '20px', height: '20px', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', color: '#FFFFFF', fontSize: '0.48rem', fontWeight: 900, overflow: 'hidden' }}>
                              <span>{item.nombreMostrar.split(' ').map((palabra) => palabra[0]).join('').slice(0, 2)}</span>
                              <img
                                src={obtenerLogoLiga(item.idLiga)}
                                alt=""
                                loading="eager"
                                onError={(event) => { event.currentTarget.style.display = 'none'; }}
                                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', background: 'rgba(14,18,30,0.88)' }}
                              />
                            </span>
                            <span style={{ textShadow: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.nombreMostrar}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
    </>
  );
}