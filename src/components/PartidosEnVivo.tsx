import { useEffect, useState } from 'react';
import type { CanalPartido } from '../types';
import { detectarPaisVisitante, obtenerFuentesOficiales, paisesVisitante, type AgendaDelDia, type EventoAgenda } from '../services/agendaDelDia';
import { apiUrl } from '../services/api';

interface Props {
  colBorder: string;
  colText: string;
  colTextMuted: string;
}

export default function PartidosEnVivo({ colBorder, colText, colTextMuted }: Props) {
  const [partidoAbierto, setPartidoAbierto] = useState<string | null>(null);
  const [canalActivo, setCanalActivo] = useState<{ eventoId: string; canal: CanalPartido } | null>(null);
  const [agenda, setAgenda] = useState<EventoAgenda[]>([]);
  const [fechaTexto, setFechaTexto] = useState('');
  const [cargandoAgenda, setCargandoAgenda] = useState(true);
  const [errorAgenda, setErrorAgenda] = useState('');
  const [pais, setPais] = useState('');

  useEffect(() => {
    const controlador = new AbortController();
    const cargarAgenda = async () => {
      try {
        const respuesta = await fetch(apiUrl('/api/agenda-del-dia'), { signal: controlador.signal });
        const datos: AgendaDelDia = await respuesta.json();
        if (!respuesta.ok) throw new Error('No se pudo actualizar la agenda.');
        setAgenda(Array.isArray(datos.eventos) ? datos.eventos : []);
        setFechaTexto(datos.fechaTexto || '');
        setErrorAgenda('');
      } catch (error) {
        if (!controlador.signal.aborted) setErrorAgenda(error instanceof Error ? error.message : 'No se pudo actualizar la agenda.');
      } finally {
        if (!controlador.signal.aborted) setCargandoAgenda(false);
      }
    };

    cargarAgenda();
    const intervalo = window.setInterval(cargarAgenda, 5 * 60 * 1000);
    return () => {
      controlador.abort();
      window.clearInterval(intervalo);
    };
  }, []);

  useEffect(() => {
    const controlador = new AbortController();
    detectarPaisVisitante(controlador.signal)
      .then(setPais)
      .catch(() => {
        const regionNavegador = navigator.language.split('-')[1]?.toUpperCase() || '';
        if (/^[A-Z]{2}$/.test(regionNavegador)) setPais(regionNavegador);
      });
    return () => controlador.abort();
  }, []);

  const paisSeleccionado = paisesVisitante.find((opcion) => opcion.code === pais);
  const paisNombre = paisSeleccionado?.nombre || (pais
    ? new Intl.DisplayNames(['es'], { type: 'region' }).of(pais) || pais
    : 'Selecciona tu país');

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        marginTop: '18px',
        padding: '0 18px 20px',
      }}
    >
      <div
        style={{
          maxWidth: '1120px',
          margin: '0 auto',
          background: 'linear-gradient(155deg, rgba(9,17,31,0.98), rgba(5,10,19,0.97))',
          border: '1px solid rgba(96, 172, 255, 0.28)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 18px 48px rgba(0, 5, 15, 0.48), inset 0 1px rgba(255,255,255,0.04)',
        }}
      >
        <style>{`
          @keyframes liveBeacon {
            0%, 100% { box-shadow: 0 0 0 0 rgba(255, 79, 91, 0.5); }
            50% { box-shadow: 0 0 0 5px rgba(255, 79, 91, 0); }
          }
          .edeargoal-match-row:hover { background: rgba(67, 133, 211, 0.09) !important; }
          .edeargoal-channel:hover { border-color: #65D99A !important; background: rgba(54,198,119,0.13) !important; }
        `}</style>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '14px 16px',
            borderBottom: '1px solid rgba(110, 163, 220, 0.16)',
            background: 'linear-gradient(100deg, rgba(32, 85, 143, 0.22), rgba(13, 23, 39, 0.65) 55%, rgba(16, 39, 36, 0.38))',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <span style={{ color: '#65D99A', fontSize: '0.61rem', fontWeight: 900, letterSpacing: '0.16em' }}>EDEARGOAL</span>
            <span style={{ color: '#F1F6FC', fontSize: '0.88rem', fontWeight: 850, letterSpacing: '0.03em', textTransform: 'uppercase' }}>Agenda deportiva</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ color: '#A8B6C9', fontSize: '0.72rem', fontWeight: 750 }}>
              {agenda.length} {agenda.length === 1 ? 'evento' : 'eventos'}
            </span>
            <label title="El país se detecta aproximadamente por IP y puedes cambiarlo manualmente." style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#A8B6C9', fontSize: '0.66rem' }}>
              <span>Canales de</span>
              <select
                aria-label="País para canales oficiales"
                value={pais}
                onChange={(event) => setPais(event.target.value)}
                style={{ maxWidth: '155px', border: '1px solid rgba(127,174,217,0.2)', borderRadius: '5px', background: '#0A1420', color: '#EAF3FC', padding: '7px 9px', fontSize: '0.7rem' }}
              >
                <option value="">Seleccionar país</option>
                {pais && !paisesVisitante.some((opcion) => opcion.code === pais) && <option value={pais}>{paisNombre}</option>}
                {paisesVisitante.map((opcion) => <option key={opcion.code} value={opcion.code}>{opcion.nombre}</option>)}
              </select>
            </label>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '6px 9px', border: '1px solid rgba(101,217,154,0.22)', borderRadius: '20px', background: 'rgba(54,198,119,0.07)', color: '#81DFA9', fontSize: '0.62rem', letterSpacing: '0.09em' }}>
              HOY
            </span>
          </div>
        </div>

        <div style={{ padding: '11px 16px', borderBottom: '1px solid rgba(110, 163, 220, 0.12)', color: '#A8B6C9', fontSize: '0.72rem', textTransform: 'capitalize' }}>
          {fechaTexto || (cargandoAgenda ? 'Cargando agenda…' : 'Agenda del día')}
        </div>

        {agenda.length === 0 ? (
          <div style={{ padding: '30px 16px', color: colTextMuted, fontSize: '0.85rem', textAlign: 'center' }}>
            {cargandoAgenda ? 'Cargando partidos del día…' : errorAgenda || 'La agenda de hoy todavía no está disponible.'}
          </div>
        ) : (
          <div>
            {agenda.map((evento) => {
              const abierto = partidoAbierto === evento.id;
              const canales = pais ? obtenerFuentesOficiales(evento, pais) : [];
              const canalActual = canalActivo?.eventoId === evento.id ? canalActivo.canal : null;

              return (
                <div key={evento.id} style={{ borderTop: '1px solid rgba(255,255,255,0.055)' }}>
                  <button
                    className="edeargoal-match-row"
                    type="button"
                    onClick={() => {
                      setPartidoAbierto(abierto ? null : evento.id);
                      setCanalActivo(null);
                    }}
                    aria-expanded={abierto}
                    style={{ width: '100%', display: 'grid', gridTemplateColumns: '58px minmax(0, 1fr) auto', alignItems: 'center', gap: '12px', border: 0, background: abierto ? 'linear-gradient(90deg, rgba(40,103,174,0.2), rgba(18,36,57,0.15))' : 'transparent', color: colText, padding: '12px 16px', cursor: 'pointer', textAlign: 'left', transition: 'background 160ms ease' }}
                  >
                    <span style={{ color: '#DCE9F7', fontSize: '0.8rem', fontWeight: 850, fontVariantNumeric: 'tabular-nums' }}>{evento.hora}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <img src={evento.logoLiga} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} style={{ width: '27px', height: '27px', objectFit: 'contain', flexShrink: 0, borderRadius: '4px' }} />
                      <span style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                        <span style={{ color: '#8EC9FF', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.025em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{evento.liga}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, color: colText, fontSize: '0.82rem', fontWeight: 730 }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{evento.local}</span>
                          <span style={{ flexShrink: 0, color: '#70849A', fontSize: '0.65rem' }}>vs</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{evento.visitante}</span>
                        </span>
                      </span>
                    </span>
                    <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: '25px', height: '25px', border: '1px solid rgba(127,174,217,0.18)', borderRadius: '50%', background: 'rgba(255,255,255,0.025)' }}>
                      <span style={{ width: '7px', height: '7px', borderRight: `1.5px solid ${abierto ? '#65D99A' : '#8295AA'}`, borderBottom: `1.5px solid ${abierto ? '#65D99A' : '#8295AA'}`, transform: abierto ? 'translateY(2px) rotate(225deg)' : 'translateY(-2px) rotate(45deg)', transition: 'transform 160ms ease' }} />
                    </span>
                  </button>

                  {abierto && (
                    <div style={{ padding: '3px 16px 16px 86px', background: 'linear-gradient(90deg, rgba(5,12,20,0.78), rgba(7,17,24,0.56))', borderTop: '1px solid rgba(101,217,154,0.16)' }}>
                      <div style={{ padding: '11px 0 9px', color: '#C5D0DC', fontSize: '0.66rem', fontWeight: 850, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                        Canales y fuentes oficiales · {paisNombre}
                      </div>
                      {!pais ? (
                        <p style={{ margin: 0, padding: '11px 12px', border: '1px solid rgba(255,202,58,0.16)', borderLeft: '3px solid #FFCA3A', borderRadius: '5px', background: 'rgba(255,202,58,0.045)', color: colTextMuted, fontSize: '0.75rem', lineHeight: 1.5 }}>
                          Detectando el país. También puedes seleccionarlo arriba para ver las opciones correctas.
                        </p>
                      ) : canales.length ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {canales.map((canal) => (
                            <button
                              className="edeargoal-channel"
                              key={canal.id}
                              type="button"
                              onClick={() => setCanalActivo({ eventoId: evento.id, canal })}
                              style={{ border: `1px solid ${canalActual?.id === canal.id ? '#65D99A' : 'rgba(127,174,217,0.2)'}`, borderRadius: '6px', background: canalActual?.id === canal.id ? 'rgba(54,198,119,0.16)' : 'rgba(255,255,255,0.035)', color: colText, padding: '9px 12px', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 780, transition: 'all 150ms ease' }}
                              >
                                <span style={{ display: 'block' }}>{canal.nombre}</span>
                                <span style={{ display: 'block', marginTop: '3px', color: canal.tipo === 'informacion' ? '#FFCA3A' : '#81DFA9', fontSize: '0.58rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                  {canal.tipo === 'informacion' ? 'Información oficial' : 'Canal oficial'}
                                </span>
                              </button>
                          ))}
                        </div>
                      ) : (
                        <p style={{ margin: 0, padding: '11px 12px', border: '1px solid rgba(255,202,58,0.16)', borderLeft: '3px solid #FFCA3A', borderRadius: '5px', background: 'rgba(255,202,58,0.045)', color: colTextMuted, fontSize: '0.75rem', lineHeight: 1.5 }}>
                          No hay una opción de transmisión autorizada verificada para este país.
                        </p>
                      )}
                      {canalActual && (
                        <div style={{ marginTop: '14px', overflow: 'hidden', border: `1px solid ${colBorder}`, borderRadius: '8px', background: '#000' }}>
                          <div style={{ padding: '12px', background: '#101725', color: colText, fontSize: '0.76rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                              <span style={{ minWidth: 0, fontWeight: 800 }}>
                                <span style={{ display: 'block', color: '#65D99A', fontSize: '0.62rem', letterSpacing: '0.12em', marginBottom: '3px' }}>EDEARGOAL · {canalActual.tipo === 'informacion' ? 'FUENTE OFICIAL' : 'CANAL OFICIAL'}</span>
                                {canalActual.nombre}
                              </span>
                              <a href={canalActual.url} target="_blank" rel="noopener noreferrer" style={{ borderRadius: '5px', background: '#65D99A', color: '#07120C', padding: '9px 12px', fontSize: '0.7rem', fontWeight: 900, whiteSpace: 'nowrap', textDecoration: 'none' }}>
                                {canalActual.tipo === 'informacion' ? 'VER INFORMACIÓN ↗' : 'ABRIR CANAL ↗'}
                              </a>
                            </div>
                            {canalActual.nota && <p style={{ margin: '10px 0 0', color: colTextMuted, fontSize: '0.72rem', lineHeight: 1.5 }}>{canalActual.nota}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
