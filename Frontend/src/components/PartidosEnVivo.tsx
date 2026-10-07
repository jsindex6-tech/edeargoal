import { useEffect, useState } from 'react';
import type { CanalPartido } from '../types';
import { detectarPaisVisitante, obtenerFuentesOficiales, paisesVisitante, type AgendaDelDia, type EventoAgenda } from '../services/agendaDelDia';
import { fetchApi, leerRespuestaJson } from '../services/api';

interface Props {
  colBorder: string;
  colText: string;
  colTextMuted: string;
}

interface PartidoEnVivo {
  id?: number | string;
  local: string;
  visitante: string;
  logoLocal?: string;
  logoVisitante?: string;
  marcador?: string;
  estadoPartido?: string;
  fechaUtc?: string;
  hora?: string;
  liga?: string;
  proveedor?: string;
  finalizado?: boolean;
}

interface RespuestaPartidosEnVivo {
  mensaje?: string;
  partidos?: PartidoEnVivo[];
  aviso?: string;
  proveedor?: string;
}

function fechaActualEnPeru() {
  const partes = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Lima'
  }).formatToParts(new Date());
  const valores = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  return `${valores.year}-${valores.month}-${valores.day}`;
}

function estaEnVivo(partido: PartidoEnVivo) {
  const estado = String(partido.estadoPartido || '').toLowerCase();
  return !partido.finalizado && (
    ['en vivo', 'entretiempo', 'in_play', 'live', '1h', '2h', 'et', 'ht', 'paused', 'in play'].includes(estado)
  );
}

export default function PartidosEnVivo({ colBorder, colText, colTextMuted }: Props) {
  const [partidoAbierto, setPartidoAbierto] = useState<string | null>(null);
  const [canalActivo, setCanalActivo] = useState<{ eventoId: string; canal: CanalPartido } | null>(null);
  const [agenda, setAgenda] = useState<EventoAgenda[]>([]);
  const [fechaTexto, setFechaTexto] = useState('');
  const [cargandoAgenda, setCargandoAgenda] = useState(true);
  const [errorAgenda, setErrorAgenda] = useState('');
  const [pais, setPais] = useState('');
  const [partidosEnVivo, setPartidosEnVivo] = useState<PartidoEnVivo[]>([]);
  const [cargandoEnVivo, setCargandoEnVivo] = useState(true);
  const [errorEnVivo, setErrorEnVivo] = useState('');

  useEffect(() => {
    const controlador = new AbortController();
    const cargarPartidosEnVivo = async () => {
      try {
        const fecha = fechaActualEnPeru();
        const respuesta = await fetchApi(`/api/partidos?fecha=${fecha}`, { signal: controlador.signal });
        const datos = await leerRespuestaJson<RespuestaPartidosEnVivo | PartidoEnVivo[]>(respuesta);
        if (!respuesta.ok) {
          throw new Error(Array.isArray(datos) ? 'No se pudo consultar el marcador en vivo.' : datos.mensaje || 'No se pudo consultar el marcador en vivo.');
        }
        const partidos = Array.isArray(datos) ? datos : datos.partidos || [];
        setPartidosEnVivo(partidos.filter(estaEnVivo));
        setErrorEnVivo(Array.isArray(datos) ? '' : datos.aviso || '');
      } catch (error) {
        if (!controlador.signal.aborted) {
          setErrorEnVivo(error instanceof Error ? error.message : 'No se pudo consultar el marcador en vivo.');
        }
      } finally {
        if (!controlador.signal.aborted) setCargandoEnVivo(false);
      }
    };

    void cargarPartidosEnVivo();
    const intervalo = window.setInterval(() => void cargarPartidosEnVivo(), 60 * 1000);
    return () => {
      controlador.abort();
      window.clearInterval(intervalo);
    };
  }, []);

  useEffect(() => {
    const controlador = new AbortController();
    const cargarAgenda = async () => {
      try {
        const respuesta = await fetchApi('/api/agenda-del-dia', { signal: controlador.signal });
        const datos = await leerRespuestaJson<AgendaDelDia>(respuesta);
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
      className="home-live-section"
    >
      <div className="agenda-board">
        <section className="live-scoreboard" aria-labelledby="live-scoreboard-title" aria-live="polite">
          <header className="live-scoreboard__header">
            <div>
              <span className="live-scoreboard__eyebrow">ACTUALIZACIÓN AUTOMÁTICA</span>
              <h2 id="live-scoreboard-title">Partidos en vivo</h2>
            </div>
            <span className="live-scoreboard__badge"><i aria-hidden="true" /> EN DIRECTO</span>
          </header>
          {cargandoEnVivo ? (
            <p className="live-scoreboard__message">Consultando los marcadores disponibles…</p>
          ) : partidosEnVivo.length ? (
            <div className="live-scoreboard__matches">
              {partidosEnVivo.map((partido, index) => (
                <article className="live-scoreboard__match" key={`${partido.proveedor || 'partido'}-${partido.id || index}`}>
                  <span className="live-scoreboard__league">{partido.liga || 'Fútbol'} · {partido.hora || ''}</span>
                  <div className="live-scoreboard__teams">
                    <span>{partido.logoLocal && <img src={partido.logoLocal} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}{partido.local}</span>
                    <strong>{partido.marcador && partido.marcador !== 'VS' ? partido.marcador : 'EN JUEGO'}</strong>
                    <span>{partido.logoVisitante && <img src={partido.logoVisitante} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}{partido.visitante}</span>
                  </div>
                  <span className="live-scoreboard__status">{partido.estadoPartido || 'En vivo'}</span>
                </article>
              ))}
            </div>
          ) : (
            <p className="live-scoreboard__message">
              {errorEnVivo && !errorEnVivo.includes('no devolvió partidos')
                ? 'El marcador en vivo no está disponible en este momento. La agenda sigue mostrando los horarios publicados.'
                : 'No hay partidos en vivo con datos disponibles en este momento. Revisa la agenda de hoy.'}
            </p>
          )}
          <p className="live-scoreboard__note">La actualización depende de la cobertura y frecuencia del proveedor de cada competición.</p>
        </section>

        <style>{`
          @keyframes liveBeacon {
            0%, 100% { box-shadow: 0 0 0 0 rgba(255, 79, 91, 0.5); }
            50% { box-shadow: 0 0 0 5px rgba(255, 79, 91, 0); }
          }
          .edeargoal-match-row:hover { background: rgba(67, 133, 211, 0.09) !important; }
          .edeargoal-channel:hover { border-color: #3478F6 !important; background: rgba(52,120,246,0.13) !important; }
        `}</style>
        <div className="agenda-board__header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <span style={{ color: '#91BAFF', fontSize: '0.61rem', fontWeight: 900, letterSpacing: '0.16em' }}>EDEARGOAL</span>
            <span style={{ color: '#F1F6FC', fontSize: '0.88rem', fontWeight: 850, letterSpacing: '0.03em', textTransform: 'uppercase' }}>Agenda deportiva</span>
          </div>
          <div className="agenda-board__toolbar">
            <span style={{ color: '#A8B6C9', fontSize: '0.72rem', fontWeight: 750 }}>
              {agenda.length} {agenda.length === 1 ? 'evento' : 'eventos'}
            </span>
            <label className="agenda-board__country" title="El país se detecta aproximadamente por IP y puedes cambiarlo manualmente." style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#A8B6C9', fontSize: '0.66rem' }}>
              <span>Canales de</span>
              <select
                aria-label="País para canales oficiales"
                value={pais}
                onChange={(event) => setPais(event.target.value)}
                className="agenda-board__country-select"
                style={{ maxWidth: '155px', border: '1px solid rgba(127,174,217,0.2)', borderRadius: '5px', background: '#0A1420', color: '#EAF3FC', padding: '7px 9px', fontSize: '0.7rem' }}
              >
                <option value="">Seleccionar país</option>
                {pais && !paisesVisitante.some((opcion) => opcion.code === pais) && <option value={pais}>{paisNombre}</option>}
                {paisesVisitante.map((opcion) => <option key={opcion.code} value={opcion.code}>{opcion.nombre}</option>)}
              </select>
            </label>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '6px 9px', border: '1px solid rgba(52,120,246,0.24)', borderRadius: '20px', background: 'rgba(52,120,246,0.09)', color: '#91BAFF', fontSize: '0.62rem', letterSpacing: '0.09em' }}>
              HOY
            </span>
          </div>
        </div>

        <div className="agenda-board__date" style={{ padding: '11px 16px', borderBottom: '1px solid rgba(110, 163, 220, 0.12)', color: '#A8B6C9', fontSize: '0.72rem', textTransform: 'capitalize' }}>
          {fechaTexto || (cargandoAgenda ? 'Cargando agenda…' : 'Agenda del día')}
        </div>

        {agenda.length === 0 ? (
          <div style={{ padding: '30px 16px', color: colTextMuted, fontSize: '0.85rem', textAlign: 'center' }}>
            {cargandoAgenda ? 'Cargando partidos del día…' : errorAgenda || 'La agenda de hoy todavía no está disponible.'}
          </div>
        ) : (
          <div className="agenda-board__events">
            {agenda.map((evento) => {
              const abierto = partidoAbierto === evento.id;
              const canales = pais ? obtenerFuentesOficiales(evento, pais) : [];
              const canalActual = canalActivo?.eventoId === evento.id ? canalActivo.canal : null;

              return (
                <div className="agenda-board__event" key={evento.id}>
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
                          <span style={{ flexShrink: 0, color: '#70849A', fontSize: '0.65rem' }}>contra</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{evento.visitante}</span>
                        </span>
                      </span>
                    </span>
                    <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: '25px', height: '25px', border: '1px solid rgba(127,174,217,0.18)', borderRadius: '50%', background: 'rgba(255,255,255,0.025)' }}>
                      <span style={{ width: '7px', height: '7px', borderRight: `1.5px solid ${abierto ? '#78A9FF' : '#8295AA'}`, borderBottom: `1.5px solid ${abierto ? '#78A9FF' : '#8295AA'}`, transform: abierto ? 'translateY(2px) rotate(225deg)' : 'translateY(-2px) rotate(45deg)', transition: 'transform 160ms ease' }} />
                    </span>
                  </button>

                  {abierto && (
                    <div className="agenda-board__event-details" style={{ padding: '3px 16px 16px 86px', background: 'linear-gradient(90deg, rgba(5,12,20,0.78), rgba(7,17,24,0.56))', borderTop: '1px solid rgba(52,120,246,0.18)' }}>
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
                              style={{ border: `1px solid ${canalActual?.id === canal.id ? '#3478F6' : 'rgba(127,174,217,0.2)'}`, borderRadius: '6px', background: canalActual?.id === canal.id ? 'rgba(52,120,246,0.16)' : 'rgba(255,255,255,0.035)', color: colText, padding: '9px 12px', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 780, transition: 'all 150ms ease' }}
                              >
                                <span style={{ display: 'block' }}>{canal.nombre}</span>
                                <span style={{ display: 'block', marginTop: '3px', color: canal.tipo === 'informacion' ? '#FFCA3A' : '#91BAFF', fontSize: '0.58rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
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
                                <span style={{ display: 'block', color: '#91BAFF', fontSize: '0.62rem', letterSpacing: '0.12em', marginBottom: '3px' }}>EDEARGOAL · {canalActual.tipo === 'informacion' ? 'FUENTE OFICIAL' : 'CANAL OFICIAL'}</span>
                                {canalActual.nombre}
                              </span>
                              <a href={canalActual.url} target="_blank" rel="noopener noreferrer" style={{ borderRadius: '5px', background: '#3478F6', color: '#F5F8FF', padding: '9px 12px', fontSize: '0.7rem', fontWeight: 900, whiteSpace: 'nowrap', textDecoration: 'none' }}>
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
