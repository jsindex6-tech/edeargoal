import { useState } from 'react';
import type { LigaConfig, Partido } from '../types';
import { fetchApi } from '../services/api';

interface Props {
  ligas: LigaConfig[];
  temaActual: 'oscuro' | 'claro' | 'neon';
}

interface EquipoOpcion {
  id: string;
  nombre: string;
  logo: string;
}

interface PartidoComparacion extends Partido {
  idLocal?: number | string;
  idVisitante?: number | string;
  finalizado?: boolean;
}

interface RespuestaLiga {
  partidos?: PartidoComparacion[];
  tabla?: Array<{
    id?: number | string;
    equipo?: string;
    pts?: number;
    j?: number;
    gol?: string;
    dif?: number;
    pos?: number;
  }>;
  equipos?: Array<{
    id?: number | string;
    nombre?: string;
    name?: string;
    equipo?: string;
    logo?: string;
  }>;
}

function claveEquipo(id: number | string | undefined, nombre: string) {
  return String(id ?? nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase());
}

export default function VistaCaraACara({ ligas, temaActual }: Props) {
  const [ligaId, setLigaId] = useState('');
  const [equipos, setEquipos] = useState<EquipoOpcion[]>([]);
  const [partidos, setPartidos] = useState<PartidoComparacion[]>([]);
  const [tabla, setTabla] = useState<NonNullable<RespuestaLiga['tabla']>>([]);
  const [equipoA, setEquipoA] = useState('');
  const [equipoB, setEquipoB] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const esClaro = temaActual === 'claro';

  const cargarCompeticion = async (id: string) => {
    setLigaId(id);
    setEquipos([]);
    setPartidos([]);
    setTabla([]);
    setEquipoA('');
    setEquipoB('');
    setError('');
    if (!id) return;

    const liga = ligas.find((item) => String(item.idLiga) === id);
    if (!liga) return;

    const controlador = new AbortController();
    setCargando(true);
    try {
      const parametros = new URLSearchParams({
        liga: id,
        nombre: liga.nombreMostrar,
        pais: liga.paisBuscado
      });
      const respuesta = await fetchApi(`/api/partidos?${parametros.toString()}`, { signal: controlador.signal });
      const datos = await respuesta.json() as RespuestaLiga | PartidoComparacion[];
      if (!respuesta.ok) throw new Error(!Array.isArray(datos) ? (datos as RespuestaLiga & { mensaje?: string }).mensaje || 'No se pudo cargar esta competición.' : 'No se pudo cargar esta competición.');

      const listaPartidos = Array.isArray(datos) ? datos : datos.partidos || [];
      const equiposDeRespuesta = Array.isArray(datos) ? [] : datos.equipos || [];
      setTabla(Array.isArray(datos) ? [] : datos.tabla || []);
      const equiposPorId = new Map<string, EquipoOpcion>();

      equiposDeRespuesta.forEach((equipo) => {
        const nombre = equipo.nombre || equipo.name || equipo.equipo || '';
        if (!nombre) return;
        const idEquipo = claveEquipo(equipo.id, nombre);
        equiposPorId.set(idEquipo, { id: idEquipo, nombre, logo: equipo.logo || '' });
      });

      listaPartidos.forEach((partido) => {
        const localId = claveEquipo(partido.idLocal, partido.local);
        const visitanteId = claveEquipo(partido.idVisitante, partido.visitante);
        if (!equiposPorId.has(localId)) equiposPorId.set(localId, { id: localId, nombre: partido.local, logo: partido.logoLocal || '' });
        if (!equiposPorId.has(visitanteId)) equiposPorId.set(visitanteId, { id: visitanteId, nombre: partido.visitante, logo: partido.logoVisitante || '' });
      });

      setPartidos(listaPartidos);
      setEquipos([...equiposPorId.values()].sort((primero, segundo) => primero.nombre.localeCompare(segundo.nombre, 'es')));
    } catch (fallo) {
      if (!controlador.signal.aborted) setError(fallo instanceof Error ? fallo.message : 'No se pudo cargar esta competición.');
    } finally {
      if (!controlador.signal.aborted) setCargando(false);
    }
  };

  const seleccionA = equipos.find((equipo) => equipo.id === equipoA);
  const seleccionB = equipos.find((equipo) => equipo.id === equipoB);
  const estadisticasDe = (equipo?: EquipoOpcion) => {
    if (!equipo) return null;
    return tabla.find((fila) =>
      String(fila.id) === equipo.id || (fila.equipo && claveEquipo(undefined, fila.equipo) === claveEquipo(undefined, equipo.nombre))
    ) || null;
  };
  const estadisticasA = estadisticasDe(seleccionA);
  const estadisticasB = estadisticasDe(seleccionB);
  const posicionA = estadisticasA?.pos;
  const posicionB = estadisticasB?.pos;
  const mejorEnTabla = posicionA && posicionB
    ? posicionA < posicionB ? seleccionA?.nombre : posicionB < posicionA ? seleccionB?.nombre : 'Empatados en la tabla'
    : null;
  const enfrentamientos = seleccionA && seleccionB
    ? partidos.filter((partido) => {
      const localId = claveEquipo(partido.idLocal, partido.local);
      const visitanteId = claveEquipo(partido.idVisitante, partido.visitante);
      return (localId === equipoA && visitanteId === equipoB) || (localId === equipoB && visitanteId === equipoA);
    }).filter((partido) => partido.finalizado === true && partido.marcador && partido.marcador !== 'VS')
      .sort((primero, segundo) => String(segundo.fechaUtc || segundo.fechaISO || '').localeCompare(String(primero.fechaUtc || primero.fechaISO || '')))
    : [];

  const resumen = enfrentamientos.reduce((actual, partido) => {
    const [golesLocal, golesVisitante] = partido.marcador.split('-').map((gol) => Number(gol.trim()));
    if (!Number.isFinite(golesLocal) || !Number.isFinite(golesVisitante)) return actual;
    const aEsLocal = claveEquipo(partido.idLocal, partido.local) === equipoA;
    const golesA = aEsLocal ? golesLocal : golesVisitante;
    const golesB = aEsLocal ? golesVisitante : golesLocal;
    return {
      partidos: actual.partidos + 1,
      victoriasA: actual.victoriasA + Number(golesA > golesB),
      empates: actual.empates + Number(golesA === golesB),
      victoriasB: actual.victoriasB + Number(golesB > golesA),
      golesA: actual.golesA + golesA,
      golesB: actual.golesB + golesB
    };
  }, { partidos: 0, victoriasA: 0, empates: 0, victoriasB: 0, golesA: 0, golesB: 0 });
  const golesAFavorA = Number(estadisticasA?.gol?.split(':')[0]);
  const golesEnContraA = Number(estadisticasA?.gol?.split(':')[1]);
  const golesAFavorB = Number(estadisticasB?.gol?.split(':')[0]);
  const golesEnContraB = Number(estadisticasB?.gol?.split(':')[1]);
  const estadisticasTemporada = [
    { nombre: 'Posición', valorA: estadisticasA?.pos, valorB: estadisticasB?.pos },
    { nombre: 'Puntos', valorA: estadisticasA?.pts, valorB: estadisticasB?.pts },
    { nombre: 'Partidos jugados', valorA: estadisticasA?.j, valorB: estadisticasB?.j },
    { nombre: 'Goles a favor', valorA: Number.isFinite(golesAFavorA) ? golesAFavorA : undefined, valorB: Number.isFinite(golesAFavorB) ? golesAFavorB : undefined },
    { nombre: 'Goles en contra', valorA: Number.isFinite(golesEnContraA) ? golesEnContraA : undefined, valorB: Number.isFinite(golesEnContraB) ? golesEnContraB : undefined },
    { nombre: 'Diferencia de goles', valorA: estadisticasA?.dif, valorB: estadisticasB?.dif }
  ];

  return (
    <section className={`cara-a-cara${esClaro ? ' cara-a-cara--light' : ''}`}>
      <header className="cara-a-cara__header">
        <div>
          <span className="cara-a-cara__eyebrow">COMPARADOR DE EQUIPOS</span>
          <h1>Cara a cara</h1>
          <p>Enfrentamientos directos registrados en una competición.</p>
        </div>
        <span className="cara-a-cara__mark" aria-hidden="true">VS</span>
      </header>

      <div className="cara-a-cara__selectors">
        <label>
          <span>Competición</span>
          <select value={ligaId} onChange={(event) => void cargarCompeticion(event.target.value)}>
            <option value="">Selecciona una competición</option>
            {ligas.map((liga) => <option key={liga.idLiga} value={liga.idLiga}>{liga.paisBuscado} · {liga.nombreMostrar}</option>)}
          </select>
        </label>
        <label>
          <span>Equipo 1</span>
          <select value={equipoA} onChange={(event) => setEquipoA(event.target.value)} disabled={!equipos.length}>
            <option value="">Selecciona un equipo</option>
            {equipos.map((equipo) => <option key={equipo.id} value={equipo.id}>{equipo.nombre}</option>)}
          </select>
        </label>
        <span className="cara-a-cara__versus" aria-hidden="true">VS</span>
        <label>
          <span>Equipo 2</span>
          <select value={equipoB} onChange={(event) => setEquipoB(event.target.value)} disabled={!equipos.length}>
            <option value="">Selecciona un equipo</option>
            {equipos.filter((equipo) => equipo.id !== equipoA).map((equipo) => <option key={equipo.id} value={equipo.id}>{equipo.nombre}</option>)}
          </select>
        </label>
      </div>

      {cargando && <p className="cara-a-cara__message" role="status">Cargando resultados reales de la competición...</p>}
      {error && <p className="cara-a-cara__message cara-a-cara__message--error" role="alert">{error}</p>}
      {!cargando && !error && ligaId && equipos.length === 0 && <p className="cara-a-cara__message">El proveedor no devolvió equipos para esta competición.</p>}
      {!cargando && !error && seleccionA && seleccionB && (
        <>
          <section className="cara-a-cara__season">
            <header className="cara-a-cara__season-header">
              <div>
                <span>RENDIMIENTO REAL</span>
                <h2>En esta competición</h2>
              </div>
              {mejorEnTabla && <strong>{mejorEnTabla === 'Empatados en la tabla' ? mejorEnTabla : `Mejor en la tabla: ${mejorEnTabla}`}</strong>}
            </header>
            <div className="cara-a-cara__season-teams">
              <span>{seleccionA.logo && <img src={seleccionA.logo} alt="" />}{seleccionA.nombre}</span>
              <span>ESTADÍSTICA</span>
              <span>{seleccionB.logo && <img src={seleccionB.logo} alt="" />}{seleccionB.nombre}</span>
            </div>
            {estadisticasTemporada.map((estadistica) => (
              <div className="cara-a-cara__season-row" key={estadistica.nombre}>
                <strong>{estadistica.valorA ?? '—'}</strong>
                <span>{estadistica.nombre}</span>
                <strong>{estadistica.valorB ?? '—'}</strong>
              </div>
            ))}
          </section>

          {resumen.partidos > 0 ? (
            <>
            <div className="cara-a-cara__summary" aria-label="Resumen de enfrentamientos">
              <div className="cara-a-cara__team-heading">
                {seleccionA.logo && <img src={seleccionA.logo} alt="" />}
                <strong>{seleccionA.nombre}</strong>
                <span>{resumen.victoriasA} victorias</span>
              </div>
              <div className="cara-a-cara__totals">
                <span>{resumen.golesA}</span>
                <small>GOLES</small>
                <span>{resumen.golesB}</span>
              </div>
              <div className="cara-a-cara__team-heading cara-a-cara__team-heading--right">
                {seleccionB.logo && <img src={seleccionB.logo} alt="" />}
                <strong>{seleccionB.nombre}</strong>
                <span>{resumen.victoriasB} victorias</span>
              </div>
              <span className="cara-a-cara__draws">{resumen.partidos} partidos · {resumen.empates} empates</span>
            </div>

            <div className="cara-a-cara__results">
              <h2>Historial directo · {resumen.partidos} partidos</h2>
              {enfrentamientos.map((partido) => (
                <article className="cara-a-cara__result" key={`${partido.proveedor || 'partido'}-${partido.id}`}>
                  <span className="cara-a-cara__result-date">{partido.fechaTexto || partido.fechaISO || 'Fecha no disponible'}</span>
                  <span className="cara-a-cara__result-team">{partido.local}</span>
                  <strong>{partido.marcador}</strong>
                  <span className="cara-a-cara__result-team">{partido.visitante}</span>
                  <span className="cara-a-cara__result-league">{partido.liga}</span>
                </article>
              ))}
            </div>
            </>
          ) : <p className="cara-a-cara__message">Todavía no hay enfrentamientos directos registrados entre estos equipos en la temporada disponible.</p>}
        </>
      )}
    </section>
  );
}