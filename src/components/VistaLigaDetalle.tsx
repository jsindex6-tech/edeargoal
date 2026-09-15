import { useEffect, useState } from 'react';
import type { LigaConfig } from '../types';
import VistaEquipoDetalle from './VistaEquipoDetalle';
import VistaPartidoDetalle from './VistaPartidoDetalle';

interface Props {
  ligaSeleccionada: LigaConfig;
  onRegresarGeneral?: () => void;
}

export default function VistaLigaDetalle({ ligaSeleccionada, onRegresarGeneral }: Props) {
  const [pestanaActiva, setPestanaActiva] = useState<'tablas' | 'equipos' | 'campeones'>('tablas');
  const [partidosDerecha, setPartidosDerecha] = useState<any[]>([]);
  const [tablaDatos, setTablaDatos] = useState<any[]>([]);
  const [equiposDatos, setEquiposDatos] = useState<any[]>([]);
  const [campeonesDatos, setCampeonesDatos] = useState<any[]>([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<any>(null);
  const [partidoSeleccionado, setPartidoSeleccionado] = useState<any>(null);
  const [jornadaSeleccionada, setJornadaSeleccionada] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorBackend, setErrorBackend] = useState<string | null>(null);

  const nombreLiga = ligaSeleccionada?.nombreMostrar || 'Competición';
  const idLiga = ligaSeleccionada?.idLiga || '';
  const siglaLiga = nombreLiga
    .split(/\s+/)
    .filter(Boolean)
    .map((palabra) => palabra[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        setErrorBackend(null);

        const params = new URLSearchParams({
          liga: String(idLiga),
          nombre: nombreLiga,
          pais: ligaSeleccionada.paisBuscado
        });

        const respuesta = await fetch(`http://localhost:3001/api/partidos?${params.toString()}`);
        const data = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(data?.mensaje || 'Error del servidor');
        }

        const partidos = Array.isArray(data) ? data : (data.partidos || data.matches || data.data || []);
        const tabla = data.tabla || data.standings || [];
        const equipos = data.equipos || data.teams || [];
        const campeones = data.campeones || data.champions || [];

        setPartidosDerecha(Array.isArray(partidos) ? partidos : []);
        setTablaDatos(Array.isArray(tabla) ? tabla : []);
        setEquiposDatos(Array.isArray(equipos) ? equipos : []);
        setCampeonesDatos(Array.isArray(campeones) ? campeones : []);
        setEquipoSeleccionado(null);
        setPartidoSeleccionado(null);
        setJornadaSeleccionada(null);
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : 'No se pudo cargar la información';
        setErrorBackend(mensaje);
        setPartidosDerecha([]);
        setTablaDatos([]);
        setEquiposDatos([]);
        setCampeonesDatos([]);
        setEquipoSeleccionado(null);
        setPartidoSeleccionado(null);
        setJornadaSeleccionada(null);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [idLiga, nombreLiga, ligaSeleccionada.paisBuscado]);

  const mostrarTabla = tablaDatos;
  const mostrarPartidos = partidosDerecha;

  const puntajeTabla = mostrarTabla;
  const partidosOrdenados = [...mostrarPartidos].sort((a, b) =>
    String(a.fechaUtc || a.fechaISO || '').localeCompare(String(b.fechaUtc || b.fechaISO || ''))
  );
  const jornadas = Array.from(new Set(
    partidosOrdenados
      .map((partido) => Number(partido.jornada))
      .filter((jornada) => Number.isFinite(jornada) && jornada > 0)
  )).sort((a, b) => a - b);
  const jornadasIniciadas = jornadas.filter((jornada) =>
    partidosOrdenados.some((partido) => {
      if (Number(partido.jornada) !== jornada) return false;
      const fecha = new Date(partido.fechaUtc || partido.fechaISO || '').getTime();
      return Number.isFinite(fecha) && fecha <= Date.now();
    })
  );
  const jornadaActual = jornadasIniciadas[jornadasIniciadas.length - 1] || jornadas[0];
  const jornadaActiva = jornadaSeleccionada && jornadas.includes(jornadaSeleccionada)
    ? jornadaSeleccionada
    : jornadaActual;
  const indiceJornada = jornadaActiva ? jornadas.indexOf(jornadaActiva) : -1;
  const partidosDeJornada = jornadaActiva
    ? partidosOrdenados.filter((partido) => Number(partido.jornada) === jornadaActiva)
    : [];
  const obtenerNombreEquipo = (equipo: any) => {
    const nombre = equipo?.nombre ?? equipo?.name ?? equipo?.equipo;
    if (typeof nombre === 'string') return nombre;
    if (nombre && typeof nombre === 'object') return nombre.nombre || nombre.name || 'Equipo';
    return 'Equipo';
  };

  if (equipoSeleccionado) {
    return (
      <VistaEquipoDetalle
        equipo={equipoSeleccionado}
        ligaId={ligaSeleccionada.idLiga}
        nombreLiga={nombreLiga}
        onRegresar={() => setEquipoSeleccionado(null)}
      />
    );
  }

  if (partidoSeleccionado) {
    return <VistaPartidoDetalle partido={partidoSeleccionado} onRegresar={() => setPartidoSeleccionado(null)} />;
  }

  return (
    <div style={{ width: '100%', minHeight: '100%', color: '#FFF', background: '#070A13', padding: '0 10px 10px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#A3A9B9', letterSpacing: '0.02em', padding: '14px 0 8px' }}>
        <button
          onClick={onRegresarGeneral}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#FFF',
            fontSize: '1.2rem',
            cursor: 'pointer',
            padding: 0,
            lineHeight: 1,
          }}
        >
          ←
        </button>
        <span>INICIO</span>
        <span style={{ color: '#A3A9B9' }}>/</span>
        <span style={{ color: '#FFF', fontWeight: 700 }}>{nombreLiga.toUpperCase()}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', margin: '2px 0 12px', paddingBottom: '12px', borderBottom: '1px solid #1C2332' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#D8F95B', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#0d1320', fontSize: '1rem' }}>
          {siglaLiga}
        </div>
        <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 2vw, 3rem)', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#F3F4F8' }}>{nombreLiga.toUpperCase()}</h1>
        <span style={{ color: '#F2E75A', fontSize: '1.2rem', transform: 'translateY(-2px)' }}>☆</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '34px', fontWeight: 800, fontSize: '0.82rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#A7ADBA', marginBottom: '18px' }}>
        {['tablas', 'equipos', 'campeones'].map((tab) => {
          const activo = pestanaActiva === tab;
          const label = tab === 'tablas' ? 'Tablas' : tab === 'equipos' ? 'Equipos' : 'Campeones';
          return (
            <span
              key={tab}
              onClick={() => setPestanaActiva(tab as 'tablas' | 'equipos' | 'campeones')}
              style={{
                cursor: 'pointer',
                color: activo ? '#FFF' : '#A7ADBA',
                borderBottom: activo ? '2px solid #D8F95B' : 'none',
                paddingBottom: '10px',
                textDecoration: 'none'
              }}
            >
              {label}
            </span>
          );
        })}
      </div>

      {pestanaActiva === 'tablas' && (
        <>
          {cargando && (
            <div style={{ padding: '14px 16px', marginBottom: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#A7ADBA', fontSize: '0.78rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Cargando datos de la liga...
            </div>
          )}

          <div style={{ marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px', color: '#FFF', fontWeight: 800, fontSize: '0.83rem', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            Tabla de posiciones real
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(220px, 0.75fr)', gap: '18px' }}>
            <div style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.01)', color: '#A3A9B9', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      <th style={{ padding: '10px 8px', textAlign: 'left', width: '28px' }}>#</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left' }}>Equipos</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center' }}>Pts</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center' }}>J</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center' }}>Gol</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center' }}>+/-</th>
                    </tr>
                  </thead>
                  <tbody>
                    {puntajeTabla.map((equipo, index) => (
                      <tr key={equipo.pos ?? index} onClick={() => equipo.id && setEquipoSeleccionado({ id: equipo.id, nombre: obtenerNombreEquipo(equipo), logo: equipo.logo, proveedor: equipo.proveedor })} style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: index % 2 === 0 ? '#111823' : '#0D131C', color: '#FFF', cursor: equipo.id ? 'pointer' : 'default' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 800, color: '#C9CFD8' }}>{equipo.pos ?? index + 1}</td>
                        <td style={{ padding: '12px 8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {equipo.logo ? (
                            <img src={equipo.logo} alt="" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                          ) : (
                            <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#343B49', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.52rem', fontWeight: 900 }}>
                              {obtenerNombreEquipo(equipo).split(' ').map((palabra: string) => palabra[0]).join('').slice(0, 2)}
                            </span>
                          )}
                          {obtenerNombreEquipo(equipo)}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 800 }}>{equipo.pts}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'center', color: '#A7ADBA' }}>{equipo.j}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'center', color: '#A7ADBA' }}>{equipo.gol}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'center', color: '#80f0aa', fontWeight: 700 }}>{equipo.dif}</td>
                      </tr>
                    ))}
                    {!cargando && puntajeTabla.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#A7ADBA' }}>
                          La API no devolvió la tabla de posiciones.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 12px', background: '#121923', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#FFF', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                Temporada
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 10px 8px', color: '#EDEFFE', fontWeight: 700 }}>
                <button
                  onClick={() => indiceJornada > 0 && setJornadaSeleccionada(jornadas[indiceJornada - 1])}
                  disabled={indiceJornada <= 0}
                  style={{ background: 'transparent', border: 'none', color: indiceJornada > 0 ? '#FFF' : '#4C5361', fontSize: '1.2rem', cursor: indiceJornada > 0 ? 'pointer' : 'default' }}
                >
                  ‹
                </button>
                <span style={{ fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {jornadaActiva ? `Fecha ${jornadaActiva}` : 'Sin jornada'}
                </span>
                <button
                  onClick={() => indiceJornada >= 0 && indiceJornada < jornadas.length - 1 && setJornadaSeleccionada(jornadas[indiceJornada + 1])}
                  disabled={indiceJornada < 0 || indiceJornada >= jornadas.length - 1}
                  style={{ background: 'transparent', border: 'none', color: indiceJornada >= 0 && indiceJornada < jornadas.length - 1 ? '#FFF' : '#4C5361', fontSize: '1.2rem', cursor: indiceJornada >= 0 && indiceJornada < jornadas.length - 1 ? 'pointer' : 'default' }}
                >
                  ›
                </button>
              </div>

              <div style={{ padding: '0 10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {partidosDeJornada.map((partido, index) => {
                  const partidoFinalizado = partido.finalizado ?? Boolean(partido.marcador && partido.marcador !== 'VS');
                  const partidoEnVivo = String(partido.estadoPartido || '').toLowerCase().includes('vivo');
                  const colorEstado = partidoEnVivo ? '#FFCF4A' : partidoFinalizado ? '#FF8FA3' : '#62E6FF';
                  return (
                  <div key={partido.id || index} onClick={() => partido.id && setPartidoSeleccionado(partido)} style={{ background: partidoEnVivo ? 'linear-gradient(135deg, #252015, #151922)' : 'linear-gradient(135deg, #111A27, #0F141D)', borderRadius: '8px', padding: '10px', border: `1px solid ${partidoEnVivo ? 'rgba(255,207,74,0.65)' : 'rgba(98,230,255,0.15)'}`, boxShadow: partidoEnVivo ? '0 0 16px rgba(255,207,74,0.12)' : '0 4px 12px rgba(0,0,0,0.16)', cursor: partido.id ? 'pointer' : 'default' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: colorEstado, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      {partidoFinalizado ? <span>{partido.estadoPartido || partido.estado || 'Finalizado'}</span> : <span>{partido.fechaTexto || partido.fechaISO || ''}</span>}
                      <span>{partidoFinalizado ? partido.fechaTexto || partido.fechaISO || '' : partido.hora || ''}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginTop: '8px', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0, color: '#FFF', fontSize: '0.72rem', fontWeight: 800, lineHeight: 1.3 }}>
                        {partido.logoLocal && <img src={partido.logoLocal} alt="" style={{ width: '25px', height: '25px', objectFit: 'contain', flexShrink: 0 }} />}
                        <span>{partido.local}</span>
                      </div>
                      {partidoFinalizado && <div style={{ fontSize: '0.82rem', fontWeight: 950, color: '#D8F95B', whiteSpace: 'nowrap', textShadow: '0 0 10px rgba(216,249,91,0.35)' }}>{partido.marcador}</div>}
                      {!partidoFinalizado && <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#62E6FF', whiteSpace: 'nowrap' }}>VS</div>}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '7px', minWidth: 0, textAlign: 'right', color: '#FFF', fontSize: '0.72rem', fontWeight: 800, lineHeight: 1.3 }}>
                        <span>{partido.visitante}</span>
                        {partido.logoVisitante && <img src={partido.logoVisitante} alt="" style={{ width: '25px', height: '25px', objectFit: 'contain', flexShrink: 0 }} />}
                      </div>
                    </div>
                  </div>
                  );
                })}
                {!cargando && partidosDeJornada.length === 0 && (
                  <div style={{ padding: '18px 10px', color: '#A7ADBA', textAlign: 'center', fontSize: '0.76rem' }}>
                    La API no devolvió partidos para esta fecha.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {pestanaActiva === 'equipos' && (
        <div style={{ padding: '18px', color: '#A7ADBA', background: '#0D1117', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ color: '#FFF', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Equipos de {nombreLiga}</h3>
          {equiposDatos.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px' }}>
              {equiposDatos.map((equipo, index) => (
                <div key={equipo.id || index} onClick={() => equipo.id && setEquipoSeleccionado(equipo)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: index % 2 === 0 ? '#111823' : '#0D131C', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '7px', color: '#FFF', fontWeight: 700, cursor: equipo.id ? 'pointer' : 'default', transition: 'transform 160ms ease, border-color 160ms ease' }}>
                  {equipo.logo ? <img src={equipo.logo} alt="" style={{ width: '28px', height: '28px', objectFit: 'contain' }} /> : <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#D8F95B', color: '#0D1117', display: 'grid', placeItems: 'center', fontSize: '0.65rem' }}>{obtenerNombreEquipo(equipo).slice(0, 2).toUpperCase()}</span>}
                  <span>{obtenerNombreEquipo(equipo)}</span>
                </div>
              ))}
            </div>
          ) : <p style={{ margin: 0 }}>El proveedor no devolvió equipos para esta competición.</p>}
        </div>
      )}

      {pestanaActiva === 'campeones' && (
        <div style={{ padding: '18px', color: '#A7ADBA', background: '#0D1117', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ color: '#FFF', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Historial de campeones</h3>
          {campeonesDatos.length > 0 ? (
            <div style={{ display: 'grid', gap: '8px' }}>
              {campeonesDatos.map((campeon, index) => (
                <div key={`${campeon.temporada}-${index}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 14px', background: index % 2 === 0 ? '#111823' : '#0D131C', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '7px' }}>
                  <span style={{ color: '#A7ADBA', fontWeight: 700 }}>{campeon.temporada || 'Temporada'}</span>
                  <span style={{ color: '#FFF', fontWeight: 800 }}>{campeon.equipo || 'Ganador no disponible'}</span>
                </div>
              ))}
            </div>
          ) : <p style={{ margin: 0 }}>El proveedor no devolvió historial de campeones para esta competición.</p>}
        </div>
      )}

      {errorBackend && (
        <div style={{ marginTop: '14px', padding: '12px 14px', borderRadius: '8px', background: 'rgba(255, 92, 92, 0.08)', border: '1px solid rgba(255,92,92,0.2)', color: '#ffb3b3', fontSize: '0.8rem' }}>
          No se pudo cargar la información real del backend: {errorBackend}
        </div>
      )}
    </div>
  );
}