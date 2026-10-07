import { useEffect, useState } from 'react';
import { fetchApi } from '../services/api';
import { traducirEstadoPartido, traducirEstadisticaPartido, traducirEventoPartido } from '../utils/traduccionesFutbol';

interface PartidoDetalleSeleccionado {
  id: number | string;
  ligaId?: number | string;
  proveedor?: string;
  liga?: string;
  jornada?: number | string;
  local: string;
  logoLocal?: string;
  visitante: string;
  logoVisitante?: string;
  marcador?: string;
  estadoPartido?: string;
}

interface EquipoPartidoApi {
  id?: number | string;
  name?: string;
  logo?: string;
  crest?: string;
  colors?: { player?: { primary?: string } };
}

interface JugadorAlineacion {
  player?: {
    id?: number | string;
    name?: string;
    number?: number | string;
    photo?: string;
    pos?: string;
    position?: string;
  };
}

interface EquipoAlineacion {
  team?: EquipoPartidoApi;
  formation?: string;
  startXI?: JugadorAlineacion[];
  substitutes?: JugadorAlineacion[];
}

interface EventoPartido {
  detail?: string;
  type?: string;
  player?: { name?: string };
  time?: { elapsed?: number | null };
  team?: { name?: string };
}

interface EstadisticaPartido {
  type?: string;
  value?: number | string | null;
}

interface EstadisticaEquipo {
  team?: { name?: string };
  statistics?: EstadisticaPartido[];
}

interface DatosDetallePartido {
  mensaje?: string;
  partido?: {
    teams?: { home?: EquipoPartidoApi; away?: EquipoPartidoApi };
    goals?: { home?: number | null; away?: number | null };
    fixture?: {
      status?: { long?: string; short?: string; elapsed?: number | null };
    };
  };
  eventos?: EventoPartido[];
  estadisticas?: EstadisticaEquipo[];
  alineaciones?: EquipoAlineacion[];
  alineacionEstado?: string;
  alineacionDisponibleDesde?: string;
}

interface Props { partido: PartidoDetalleSeleccionado; onRegresar: () => void }

export default function VistaPartidoDetalle({ partido, onRegresar }: Props) {
  const [datos, setDatos] = useState<DatosDetallePartido | null>(null);
  const [pestana, setPestana] = useState<'resumen' | 'alineacion' | 'charla'>('resumen');
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    const cargarDetalle = async () => {
      try {
        const parametros = new URLSearchParams({
          proveedor: partido.proveedor || 'api-football',
          liga: String(partido.ligaId || ''),
          refresh: '1'
        });
        const respuesta = await fetchApi(`/api/partidos/${partido.id}/detalle?${parametros.toString()}`);
        const contenido = await respuesta.text();
        let data: DatosDetallePartido = {};
        try { data = contenido ? JSON.parse(contenido) as DatosDetallePartido : {}; } catch { throw new Error('El backend no devolvió JSON. Reinicia el servidor Backend.'); }
        if (!respuesta.ok) throw new Error(data.mensaje || 'No se pudo cargar el detalle del partido');
        if (activo) { setDatos(data); setError(''); }
      } catch (err) {
        if (activo) setError(err instanceof Error ? err.message : 'No se pudo cargar el partido');
      }
    };
    cargarDetalle();
    const intervalo = window.setInterval(cargarDetalle, 60000);
    return () => { activo = false; window.clearInterval(intervalo); };
  }, [partido.id, partido.ligaId, partido.proveedor]);

  const partidoApi = datos?.partido;
  const local = partidoApi?.teams?.home?.name || partido.local;
  const visitante = partidoApi?.teams?.away?.name || partido.visitante;
  const logoLocal = partidoApi?.teams?.home?.logo || partido.logoLocal;
  const logoVisitante = partidoApi?.teams?.away?.logo || partido.logoVisitante;
  const golesLocal = partidoApi?.goals?.home ?? (partido.marcador?.split(' - ')[0] || '-');
  const golesVisitante = partidoApi?.goals?.away ?? (partido.marcador?.split(' - ')[1] || '-');
  const estadoProveedor = String(partidoApi?.fixture?.status?.long || partidoApi?.fixture?.status?.short || partido.estadoPartido || '');
  const estadoActual = traducirEstadoPartido(estadoProveedor);
  const minutoActual = partidoApi?.fixture?.status?.elapsed;
  const eventos = datos?.eventos || [];
  const alineaciones = datos?.alineaciones || [];
  const estadisticas = datos?.estadisticas || [];
  const alineacionEstado = datos?.alineacionEstado || (alineaciones.length ? 'disponible' : 'esperando');
  const horaAlineacion = datos?.alineacionDisponibleDesde
    ? new Date(datos.alineacionDisponibleDesde).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
    : '';
  const colorCamiseta = (equipo: EquipoAlineacion, index: number) => equipo.team?.colors?.player?.primary || (index === 0 ? '#2563EB' : '#F8FAFC');
  const obtenerFotoJugador = (jugador: JugadorAlineacion) => jugador.player?.photo || (partido.proveedor !== 'espn' && jugador.player?.id
    ? `https://media.api-sports.io/football/players/${jugador.player.id}.png`
    : '');
  const posicionesCancha = [
    { x: 8, y: 50 },
    { x: 21, y: 18 }, { x: 21, y: 39 }, { x: 21, y: 61 }, { x: 21, y: 82 },
    { x: 33, y: 28 }, { x: 33, y: 50 }, { x: 33, y: 72 },
    { x: 43, y: 30 }, { x: 43, y: 50 }, { x: 43, y: 70 }
  ];

  return (
    <div style={{ minHeight: '100%', background: '#080A0D', color: '#FFF', padding: '22px 28px 40px' }}>
      <button onClick={onRegresar} style={{ border: 0, background: 'transparent', color: '#FFF', cursor: 'pointer', fontWeight: 900, marginBottom: '22px' }}>← INICIO / PARTIDO</button>
      <div style={{ border: '1px solid rgba(255,255,255,0.12)', background: '#111', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ padding: '9px 14px', color: '#A7ADBA', fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between' }}><span>{partido.liga || 'Competición'} / Fecha {partido.jornada || '-'}</span><strong style={{ color: ['En vivo', 'Entretiempo'].includes(estadoActual) ? '#91BAFF' : '#FF91A4' }}>{estadoActual}</strong></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '25px 20px', textAlign: 'center' }}>
          <div><img src={logoLocal} alt="" style={{ width: '64px', height: '64px', objectFit: 'contain' }} /><h2 style={{ fontSize: '1rem', margin: '8px 0 0' }}>{local}</h2></div>
          <div><strong style={{ fontSize: '2.5rem', color: '#91BAFF' }}>{golesLocal} - {golesVisitante}</strong><div style={{ color: '#91BAFF', fontSize: '0.72rem', fontWeight: 900, marginTop: '5px' }}>{minutoActual ? `${minutoActual}' · ` : ''}{estadoActual}</div></div>
          <div><img src={logoVisitante} alt="" style={{ width: '64px', height: '64px', objectFit: 'contain' }} /><h2 style={{ fontSize: '1rem', margin: '8px 0 0' }}>{visitante}</h2></div>
        </div>
      </div>
      <div style={{ maxWidth: '1100px', margin: '18px auto 0', display: 'flex', gap: '28px', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
        {(['resumen', 'alineacion', 'charla'] as const).map((item) => <button key={item} onClick={() => setPestana(item)} style={{ border: 0, borderBottom: pestana === item ? '2px solid #3478F6' : '2px solid transparent', background: 'transparent', color: pestana === item ? '#91BAFF' : '#A7ADBA', padding: '12px 4px', fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer' }}>{item === 'resumen' ? 'Resumen' : item === 'alineacion' ? 'Alineación' : 'Charla'}</button>)}
      </div>
      {error && <div style={{ maxWidth: '1100px', margin: '18px auto', color: '#FF91A4' }}>{error}</div>}
      {pestana === 'resumen' && <div style={{ maxWidth: '1100px', margin: '18px auto', display: 'grid', gap: '14px' }}>
        <section style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.1)' }}><h3 style={{ textAlign: 'center', color: '#A7ADBA', letterSpacing: '0.1em' }}>MINUTO A MINUTO</h3>{eventos.length ? eventos.map((evento, index) => <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 1fr', padding: '12px', borderTop: '1px solid rgba(255,255,255,0.07)' }}><span>{traducirEventoPartido(evento.detail || evento.type || '')}<small style={{ display: 'block', color: '#A7ADBA' }}>{evento.player?.name || ''}</small></span><strong style={{ textAlign: 'center', color: '#91BAFF' }}>{evento.time?.elapsed ? `${evento.time.elapsed}'` : ''}</strong><span style={{ textAlign: 'right' }}>{evento.team?.name || ''}</span></div>) : <p style={{ padding: '12px', color: '#A7ADBA' }}>No hay eventos registrados todavía.</p>}</section>
        <section style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.1)', padding: '14px' }}><h3 style={{ textAlign: 'center', color: '#A7ADBA', letterSpacing: '0.1em' }}>ESTADÍSTICAS</h3>{estadisticas.map((equipo, index) => <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '12px' }}><strong>{equipo.team?.name}</strong>{(equipo.statistics || []).map((item, itemIndex) => <div key={itemIndex} style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '7px', color: '#A7ADBA' }}><span>{traducirEstadisticaPartido(item.type || '')}</span><strong style={{ color: '#FFF' }}>{item.value ?? '-'}</strong></div>)}</div>)}</section>
      </div>}
      {pestana === 'alineacion' && (
        <div style={{ maxWidth: '1100px', margin: '18px auto', background: '#0D1117', padding: '18px', border: '1px solid rgba(52,120,246,0.18)' }}>
          <style>{`
            .lineup-layout {
              display: flex;
              flex-direction: column;
              gap: 14px;
            }
            .lineup-header {
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 18px;
              color: #91BAFF;
              letter-spacing: 0.12em;
              font-weight: 900;
              text-transform: uppercase;
              font-size: 0.84rem;
              padding: 6px 8px 12px;
            }
            .lineup-field-wrap {
              position: relative;
              overflow: hidden;
              border-radius: 14px;
              background: linear-gradient(180deg, rgba(5, 22, 16, 0.95), rgba(5, 26, 17, 0.9));
              border: 1px solid rgba(154, 220, 173, 0.45);
              box-shadow: inset 0 0 0 2px rgba(255,255,255,0.08), 0 16px 40px rgba(0,0,0,0.42);
            }
            .lineup-field {
              position: relative;
              width: 100%;
              min-height: 460px;
              background:
                linear-gradient(90deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 9%),
                linear-gradient(180deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 7%),
                radial-gradient(circle at center, rgba(24, 118, 68, 0.42), rgba(6, 33, 18, 0.98) 58%, rgba(7, 21, 15, 0.98));
              border: 2px solid rgba(186, 243, 205, 0.5);
              border-radius: 12px;
              overflow: hidden;
            }
            .lineup-field::before,
            .lineup-field::after {
              content: "";
              position: absolute;
              inset: 16px;
              pointer-events: none;
            }
            .lineup-field::before {
              border: 2px solid rgba(229,255,231,0.5);
              border-radius: 12px;
            }
            .lineup-field::after {
              left: 50%;
              top: 0;
              bottom: 0;
              width: 2px;
              background: rgba(229,255,231,0.5);
              transform: translateX(-50%);
            }
            .center-circle {
              position: absolute;
              left: 50%;
              top: 50%;
              width: 120px;
              height: 120px;
              border: 2px solid rgba(229,255,231,0.45);
              border-radius: 50%;
              transform: translate(-50%, -50%);
            }
            .penalty-box-left, .penalty-box-right {
              position: absolute;
              top: 50%;
              width: 18%;
              height: 42%;
              transform: translateY(-50%);
              border: 2px solid rgba(229,255,231,0.45);
            }
            .penalty-box-left { left: 12px; border-left: 0; }
            .penalty-box-right { right: 12px; border-right: 0; }
            .goal-box-left, .goal-box-right {
              position: absolute;
              top: 50%;
              width: 8%;
              height: 20%;
              transform: translateY(-50%);
              border: 2px solid rgba(229,255,231,0.35);
            }
            .goal-box-left { left: 12px; border-left: 0; }
            .goal-box-right { right: 12px; border-right: 0; }
            .pitch-team-label {
              position: absolute;
              top: 12px;
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 0.68rem;
              font-weight: 900;
              color: #fff;
              z-index: 2;
              text-shadow: 0 2px 6px rgba(0,0,0,0.8);
            }
            .pitch-team-label.home { left: 18px; }
            .pitch-team-label.away { right: 18px; }
            .pitch-team-label .formation {
              color: #91BAFF;
              letter-spacing: 0.06em;
            }
            .player-node {
              position: absolute;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 6px;
              transform: translate(-50%, -50%);
              z-index: 2;
              width: 92px;
            }
            .player-head {
              position: relative;
              width: 36px;
              height: 36px;
              border-radius: 50%;
              background: rgba(17, 24, 31, 0.95);
              border: 2px solid rgba(255,255,255,0.8);
              box-shadow: 0 6px 18px rgba(0,0,0,0.28);
              overflow: hidden;
            }
            .player-head img {
              width: 100%;
              height: 100%;
              object-fit: cover;
              border-radius: 50%;
              display: block;
            }
            .player-body {
              position: absolute;
              left: 50%;
              bottom: -4px;
              transform: translateX(-50%);
              width: 24px;
              height: 20px;
              border-radius: 11px 11px 6px 6px;
              border: 2px solid rgba(255,255,255,0.82);
              box-shadow: inset 0 -2px 0 rgba(255,255,255,0.2);
            }
            .player-badge {
              position: absolute;
              left: 50%;
              top: 2px;
              transform: translateX(-50%);
              min-width: 16px;
              height: 16px;
              padding: 0 4px;
              border-radius: 10px;
              background: rgba(9, 12, 14, 0.9);
              border: 1px solid rgba(255,255,255,0.12);
              color: #fff;
              font-size: 0.52rem;
              font-weight: 900;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .player-name {
              display: inline-block;
              max-width: 90px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              color: #fff;
              font-size: 0.56rem;
              font-weight: 900;
              background: rgba(0,0,0,0.75);
              border: 1px solid rgba(255,255,255,0.12);
              border-radius: 6px;
              padding: 3px 6px;
            }
            .substitutes {
              display: flex;
              flex-wrap: wrap;
              gap: 8px 12px;
              padding: 10px 4px 2px;
              color: #C4D2C6;
              font-size: 0.7rem;
            }
            .substitutes strong {
              color: #fff;
            }
            @media (max-width: 767px) {
              .lineup-field {
                min-height: 420px;
              }
              .player-node {
                width: 72px;
              }
              .player-name {
                max-width: 68px;
                font-size: 0.48rem;
              }
              .pitch-team-label {
                font-size: 0.56rem;
              }
              .lineup-header {
                letter-spacing: 0.08em;
                font-size: 0.72rem;
              }
            }
          `}</style>
          <div className="lineup-layout">
            <div className="lineup-header">
              <span>ALINEACIONES Y FORMACIÓN</span>
            </div>
            {alineaciones.length ? (
              <>
                <div className="lineup-field-wrap">
                  <div className="lineup-field">
                    <div className="center-circle" />
                    <div className="penalty-box-left" />
                    <div className="penalty-box-right" />
                    <div className="goal-box-left" />
                    <div className="goal-box-right" />

                    {alineaciones.map((equipo, index) => {
                      const color = colorCamiseta(equipo, index);
                      const jugadoresTitulares = (equipo.startXI || []).slice(0, 11);
                      return (
                        <div key={index}>
                          <div className={`pitch-team-label ${index === 0 ? 'home' : 'away'}`}>
                            <span>{equipo.team?.name || 'Equipo'}</span>
                            {equipo.formation && <span className="formation">{equipo.formation}</span>}
                          </div>
                          {jugadoresTitulares.map((jugador, playerIndex) => {
                            const base = posicionesCancha[playerIndex] || { x: 50, y: 50 };
                            const x = index === 0 ? base.x : 100 - base.x;
                            const nombre = jugador.player?.name || 'Jugador';
                            const foto = obtenerFotoJugador(jugador);
                            const dorsal = jugador.player?.number ?? '';
                            return (
                              <div
                                key={playerIndex}
                                className="player-node"
                                title={nombre}
                                style={{ left: `${x}%`, top: `${base.y}%` }}
                              >
                                <div className="player-head" style={{ borderColor: color }}>
                                  {foto ? <img src={foto} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : null}
                                  {dorsal ? <span className="player-badge" style={{ color }}>{dorsal}</span> : null}
                                  <span className="player-body" style={{ background: color }} />
                                </div>
                                <span className="player-name">{nombre}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="substitutes">
                  {alineaciones.map((equipo, index) => (
                    <div key={`subs-${index}`}>
                      <strong>{equipo.team?.name || 'Equipo'}:</strong>{' '}
                      {(equipo.substitutes || []).map((jugador) => jugador.player?.name).filter(Boolean).join(', ') || 'No disponibles'}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ padding: '26px 12px', textAlign: 'center', color: '#A7ADBA', border: '1px dashed rgba(52,120,246,0.25)', borderRadius: '8px' }}>
                <strong style={{ display: 'block', color: '#FFF', marginBottom: '8px' }}>
                  {alineacionEstado === 'esperando' ? 'Alineaciones antes del partido' : 'Alineación real no disponible'}
                </strong>
                {alineacionEstado === 'esperando'
                  ? `La consulta comenzará una hora antes${horaAlineacion ? `, desde las ${horaAlineacion}` : ''}. Se actualizará automáticamente.`
                  : estadoActual.toLowerCase().includes('finalizado')
                    ? 'El proveedor no entregó los onces oficiales de este encuentro; no se muestra la plantilla del club como sustituto.'
                    : 'El proveedor todavía no confirmó los onces. Se seguirá consultando automáticamente.'}
              </div>
            )}
          </div>
        </div>
      )}
      {pestana === 'charla' && <div style={{ maxWidth: '1100px', margin: '18px auto', background: '#0D1117', padding: '24px', color: '#A7ADBA' }}>La charla del partido estará disponible para los usuarios registrados.</div>}
    </div>
  );
}
