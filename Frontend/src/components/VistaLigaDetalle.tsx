import { useState, useEffect } from 'react';
import type { LigaConfig } from '../types';
import VistaEquipoDetalle from './VistaEquipoDetalle';
import VistaPartidoDetalle from './VistaPartidoDetalle';
import { fetchApi, leerRespuestaJson } from '../services/api';

interface Props {
  ligaSeleccionada: LigaConfig;
  onRegresarGeneral?: () => void;
}

interface PartidoLiga {
  id?: number | string;
  ligaId?: number | string;
  idLocal?: number | string;
  local?: string;
  logoLocal?: string;
  visitante?: string;
  logoVisitante?: string;
  marcador?: string;
  jornada?: number | string;
  finalizado?: boolean;
  fechaISO?: string;
  fechaUtc?: string;
  fechaTexto?: string;
  hora?: string;
  jornadaTexto?: string;
  estadoPartido?: string;
  estado?: string;
  proveedor?: string;
}

interface EquipoLiga {
  id?: number | string;
  proveedor?: string;
  nombre?: string;
  name?: string;
  equipo?: string | { nombre?: string; name?: string };
  logo?: string;
  pos?: number;
  pts?: number;
  j?: number;
  gol?: number | string;
  dif?: number;
}

interface CampeonLiga {
  temporada?: number | string;
  equipo?: string;
}

interface RespuestaLiga {
  mensaje?: string;
  partidos?: PartidoLiga[];
  matches?: PartidoLiga[];
  data?: PartidoLiga[];
  tabla?: EquipoLiga[];
  standings?: EquipoLiga[];
  equipos?: EquipoLiga[];
  teams?: EquipoLiga[];
  campeones?: CampeonLiga[];
  champions?: CampeonLiga[];
  mensajeTabla?: string;
  aviso?: string;
}

interface EquipoSeleccionado {
  id: number | string;
  nombre: string;
  logo?: string;
  proveedor?: string;
}

// Mapeo exhaustivo y seguro de logos de ligas y competiciones
const LOGOS_MAP: Record<string, string> = {
  // --- ESPAÑA ---
  laliga: 'https://upload.wikimedia.org/wikipedia/commons/5/54/LaLiga_logo_%282023%29.svg',
  hypermotion: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/LaLiga_Hypermotion_2023_Horizontal_Logo.svg',
  copadelrey: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Copa_del_Rey_logo_%282021%29.svg',
  supercopaespana: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Supercopa_España_Logotipo.png',

  // --- INGLATERRA ---
  premier: 'https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg',
  championship: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/EFL_Championship_Wordmark.svg',
  facup: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Emirates_FA_Cup_Logo_2020.jpg',
  carabao: 'https://upload.wikimedia.org/wikipedia/en/c/cb/EFL_Cup_logo_%282020%29.svg',

  // --- ITALIA ---
  seriea: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Serie_A_logo_2022.svg',
  serieb: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Serie_B_icon.svg',
  coppaitalia: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Coppa_Italia_Logo.svg',

  // --- ALEMANIA ---
  bundesliga: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Bundesliga_logo.svg',

  // --- FRANCIA ---
  ligue1: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Ligue_1_Logo.svg',
  ligue2: 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Ligue_2_logo.svg',

  // --- PORTUGAL, PAÍSES BAJOS, TURQUÍA ---
  primeiraliga: 'https://upload.wikimedia.org/wikipedia/commons/6/62/Liga_Portugal_Betclic_logo.svg',
  portugal: 'https://upload.wikimedia.org/wikipedia/commons/6/62/Liga_Portugal_Betclic_logo.svg',
  eredivisie: 'https://upload.wikimedia.org/wikipedia/commons/0/0f/Eredivisie_nieuw_logo_2017-.svg',
  paisesbajos: 'https://upload.wikimedia.org/wikipedia/commons/0/0f/Eredivisie_nieuw_logo_2017-.svg',
  superlig: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Trendyol_super_lig_logo.svg',
  turquia: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Trendyol_super_lig_logo.svg',

  // --- SUDAMÉRICA Y AMÉRICA LATINA ---
  colombia: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Liga_BetPlay_Dimayor_Logo.svg',
  chile: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Campeonato_Nacional_Banco_Estado.svg',
  uruguay: 'https://upload.wikimedia.org/wikipedia/commons/0/09/Liga_AUF_Uruguaya_-_logo_azul.png',
  paraguay: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/APF_logo.svg',
  ecuador: 'https://upload.wikimedia.org/wikipedia/commons/9/91/LigaPro_Ecuabet_2024.png',
  ligapro: 'https://upload.wikimedia.org/wikipedia/commons/9/91/LigaPro_Ecuabet_2024.png',
  peru: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Liga_1_%28Peru%29_logo.svg',
  liga1: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Liga_1_%28Peru%29_logo.svg',
  liga2: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Liga2_Caja_Cusco_logo.png',
  argentina: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Liga_Profesional_de_Fútbol_%28Argentina%29_wordmark.svg',
  brasileirao: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Campeonato_Brasileiro_Série_A_logo_%282024%29.svg',
  brasil: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Campeonato_Brasileiro_Série_A_logo_%282024%29.svg',

  // --- NORTEAMÉRICA, ASIA Y OTROS ---
  costarica: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Liga_FPD_Logo.svg',
  mls: 'https://upload.wikimedia.org/wikipedia/commons/7/76/Major_League_Soccer_logo.svg',
  ligamx: 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Liga_MX_logo.svg',
  mexico: 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Liga_MX_logo.svg',
  arabia: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Saudi_Pro_League_Logo.svg',
  saudi: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Saudi_Pro_League_Logo.svg',
  japon: 'https://upload.wikimedia.org/wikipedia/commons/8/81/J1_league_logo_2026.svg',
  jleague: 'https://upload.wikimedia.org/wikipedia/commons/8/81/J1_league_logo_2026.svg',
  corea: 'https://upload.wikimedia.org/wikipedia/commons/5/53/K_League_1_logo.svg',
  kleague: 'https://upload.wikimedia.org/wikipedia/commons/5/53/K_League_1_logo.svg',

  // --- TORNEOS INTERNACIONALES ---
  champions: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/UEFA_Champions_League_logo_2024.svg',
  europa: 'https://upload.wikimedia.org/wikipedia/commons/8/81/UEFA_Europa_League_logo_%282024_version%29.svg',
  conference: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/UEFA_Conference_League_full_logo_%282024_version%29.svg',
  libertadores: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Conmebol-libertadores.svg',
  sudamericana: 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Copa_Sudamericana_logo.svg',
  mundialclubes: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/FIFA_Club_World_Cup_logo.svg',
  concacaf: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/CONCACAF_Champions_Cup_logo.svg',
  supercup: 'https://upload.wikimedia.org/wikipedia/commons/2/23/UEFA_Super_Cup.svg'
};

const LOGO_GENERICO_TROFEO = 'https://upload.wikimedia.org/wikipedia/commons/f/f3/UEFA_Champions_League_logo_2024.svg';

export default function VistaLigaDetalle({ ligaSeleccionada, onRegresarGeneral }: Props) {
  const [pestanaActiva, setPestanaActiva] = useState<'tablas' | 'equipos' | 'campeones'>('tablas');
  const [partidosDerecha, setPartidosDerecha] = useState<PartidoLiga[]>([]);
  const [tablaDatos, setTablaDatos] = useState<EquipoLiga[]>([]);
  const [equiposDatos, setEquiposDatos] = useState<EquipoLiga[]>([]);
  const [campeonesDatos, setCampeonesDatos] = useState<CampeonLiga[]>([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<EquipoSeleccionado | null>(null);
  const [partidoSeleccionado, setPartidoSeleccionado] = useState<(PartidoLiga & { id: number | string; local: string; visitante: string }) | null>(null);
  const [jornadaSeleccionada, setJornadaSeleccionada] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorBackend, setErrorBackend] = useState<string | null>(null);
  const [mensajeTabla, setMensajeTabla] = useState('');
  const [avisoDatos, setAvisoDatos] = useState('');

  const nombreLiga = ligaSeleccionada?.nombreMostrar || 'Competición';
  const idLiga = ligaSeleccionada?.idLiga || '';

  // Función robusta para obtener el logo de la liga
  const obtenerLogoLiga = (): string => {
    const logoBackend = ligaSeleccionada.logo;
    if (logoBackend) return logoBackend;

    const textoNormalizado = `${ligaSeleccionada?.paisBuscado || ''} ${idLiga} ${nombreLiga}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

    for (const key of Object.keys(LOGOS_MAP)) {
      if (textoNormalizado.includes(key)) {
        return LOGOS_MAP[key];
      }
    }

    return LOGO_GENERICO_TROFEO;
  };

  const logoURL = obtenerLogoLiga();

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        setErrorBackend(null);
        setMensajeTabla('');
        setAvisoDatos('');

        const params = new URLSearchParams({
          liga: String(idLiga),
          nombre: nombreLiga,
          pais: ligaSeleccionada?.paisBuscado || ''
        });

        const respuesta = await fetchApi(`/api/partidos?${params.toString()}`);
        const data = await leerRespuestaJson<RespuestaLiga | PartidoLiga[]>(respuesta);

        if (!respuesta.ok) {
          throw new Error(Array.isArray(data) ? 'Error del servidor' : data.mensaje || 'Error del servidor');
        }

        const respuestaLiga: RespuestaLiga = Array.isArray(data) ? {} : data;
        const partidos = Array.isArray(data) ? data : (data.partidos || data.matches || data.data || []);
        const tabla = respuestaLiga.tabla || respuestaLiga.standings || [];
        const equipos = respuestaLiga.equipos || respuestaLiga.teams || [];
        const campeones = respuestaLiga.campeones || respuestaLiga.champions || [];

        setPartidosDerecha(Array.isArray(partidos) ? partidos : []);
        setTablaDatos(Array.isArray(tabla) ? tabla : []);
        setEquiposDatos(Array.isArray(equipos) ? equipos : []);
        setCampeonesDatos(Array.isArray(campeones) ? campeones : []);
        setMensajeTabla(respuestaLiga.mensajeTabla || '');
        setAvisoDatos(respuestaLiga.aviso || '');
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
        setMensajeTabla('');
        setAvisoDatos('');
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [idLiga, nombreLiga, ligaSeleccionada?.paisBuscado]);

  const puntajeTabla = tablaDatos;
  const partidosOrdenados = [...partidosDerecha].sort((a, b) =>
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

  const obtenerNombreEquipo = (equipo: EquipoLiga): string => {
    const nombre = equipo?.nombre ?? equipo?.name ?? equipo?.equipo;
    if (typeof nombre === 'string') return nombre;
    if (nombre && typeof nombre === 'object') return nombre.nombre || nombre.name || 'Equipo';
    return 'Equipo';
  };

  const seleccionarEquipo = (equipo: EquipoLiga) => {
    if (equipo.id === undefined || equipo.id === null) return;
    setEquipoSeleccionado({
      id: equipo.id,
      nombre: obtenerNombreEquipo(equipo),
      logo: equipo.logo,
      proveedor: equipo.proveedor
    });
  };

  const seleccionarPartido = (partido: PartidoLiga) => {
    if (partido.id === undefined || partido.id === null) return;
    setPartidoSeleccionado({
      ...partido,
      id: partido.id,
      ligaId: idLiga,
      local: partido.local || 'Local',
      visitante: partido.visitante || 'Visitante'
    });
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
      
      {/* Botón de Regresar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#A3A9B9', padding: '14px 0 8px' }}>
        <button 
          onClick={onRegresarGeneral}
          title="Volver"
          style={{ background: 'transparent', border: 'none', padding: '0', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <svg width="26" height="26" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="flechaAzulGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#78A9FF" />
                <stop offset="50%" stopColor="#3478F6" />
                <stop offset="100%" stopColor="#001144" />
              </linearGradient>
            </defs>
            <path d="M 45 15 C 75 15, 92 35, 88 65 C 85 80, 70 88, 55 85 C 70 80, 76 68, 73 55 C 68 38, 52 32, 45 32 L 45 45 L 10 23.5 L 45 2 Z" fill="url(#flechaAzulGrad)" stroke="#78A9FF" strokeWidth="2" strokeLinejoin="round" />
            <path d="M 45 6 L 16 23.5 L 45 41 L 45 32 C 55 32, 70 38, 74 55 C 75 42, 65 20, 45 18 Z" fill="white" fillOpacity="0.4" />
          </svg>
        </button>
        <span style={{ color: '#FFF', fontWeight: 700 }}>{nombreLiga.toUpperCase()}</span>
      </div>

      {/* Cabecera con Logo Mejorado e Integrado */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', margin: '6px 0 16px', paddingBottom: '16px', borderBottom: '1px solid #1C2332' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '60px', height: '60px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          <img 
            src={logoURL} 
            alt={nombreLiga} 
            style={{ maxHeight: '42px', maxWidth: '45px', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }} 
            onError={(e) => {
              e.currentTarget.src = LOGO_GENERICO_TROFEO;
            }}
          />
        </div>
        <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem, 2vw, 2.6rem)', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#F3F4F8' }}>
          {nombreLiga.toUpperCase()}
        </h1>
      </div>

      {/* Pestañas de Navegación */}
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
                borderBottom: activo ? '2px solid #3478F6' : 'none',
                paddingBottom: '10px',
                transition: 'color 0.2s ease'
              }}
            >
              {label}
            </span>
          );
        })}
      </div>

      {/* Contenido de Tablas */}
      {pestanaActiva === 'tablas' && (
        <>
          {cargando && (
            <div style={{ padding: '14px 16px', marginBottom: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#A7ADBA', fontSize: '0.78rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Cargando datos de la liga...
            </div>
          )}
          {avisoDatos && (
            <div style={{ padding: '12px 14px', marginBottom: '12px', borderRadius: '8px', background: 'rgba(255,207,74,0.08)', border: '1px solid rgba(255,207,74,0.25)', color: '#E8D49B', fontSize: '0.8rem' }}>
              {avisoDatos}
            </div>
          )}

          <div style={{ marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px', color: '#FFF', fontWeight: 800, fontSize: '0.83rem', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            Tabla de posiciones real
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(220px, 0.75fr)', gap: '18px' }}>
            {/* Tabla de Clasificación */}
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
                      <tr key={equipo.id ?? index} onClick={() => seleccionarEquipo(equipo)} style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: index % 2 === 0 ? '#111823' : '#0D131C', color: '#FFF', cursor: equipo.id ? 'pointer' : 'default' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 800, color: '#C9CFD8' }}>{equipo.pos ?? index + 1}</td>
                        <td style={{ padding: '12px 8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {equipo.logo ? (
                            <img src={equipo.logo} alt="" style={{ width: '22px', height: '22px', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          ) : (
                            <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#343B49', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.52rem', fontWeight: 900 }}>
                              {obtenerNombreEquipo(equipo).split(' ').map((p: string) => p[0]).join('').slice(0, 2)}
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
                          {mensajeTabla || 'La API no devolvió la tabla de posiciones.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Panel Lateral de Partidos por Jornada */}
            <div style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 12px', background: '#121923', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#FFF', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                Temporada
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 10px 8px', color: '#EDEFFE', fontWeight: 700 }}>
                <button
                  type="button"
                  className="match-round-nav"
                  onClick={() => indiceJornada > 0 && setJornadaSeleccionada(jornadas[indiceJornada - 1])}
                  disabled={indiceJornada <= 0}
                  aria-label="Ver fecha anterior"
                  title="Fecha anterior"
                >
                  <span className="match-round-nav__chevron" aria-hidden="true" />
                </button>
                <span style={{ fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {jornadaActiva ? partidosDeJornada[0]?.jornadaTexto || `Fecha ${jornadaActiva}` : 'Sin jornada'}
                </span>
                <button
                  type="button"
                  className="match-round-nav"
                  onClick={() => indiceJornada >= 0 && indiceJornada < jornadas.length - 1 && setJornadaSeleccionada(jornadas[indiceJornada + 1])}
                  disabled={indiceJornada < 0 || indiceJornada >= jornadas.length - 1}
                  aria-label="Ver fecha siguiente"
                  title="Fecha siguiente"
                >
                  <span className="match-round-nav__chevron match-round-nav__chevron--next" aria-hidden="true" />
                </button>
              </div>

              <div style={{ padding: '0 10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {partidosDeJornada.map((partido, index) => {
                  const partidoFinalizado = partido.finalizado ?? Boolean(partido.marcador && partido.marcador !== 'VS');
                  const estadoPartido = String(partido.estadoPartido || '').toLowerCase();
                  const partidoEnVivo = estadoPartido.includes('vivo') || estadoPartido.includes('entretiempo');
                  const tieneMarcador = Boolean(partido.marcador && partido.marcador !== 'VS');
                  const colorEstado = partidoEnVivo ? '#FFCF4A' : partidoFinalizado ? '#FF8FA3' : '#91BAFF';
                  return (
                    <div key={partido.id || index} onClick={() => seleccionarPartido(partido)} style={{ background: partidoEnVivo ? 'linear-gradient(135deg, #252015, #151922)' : 'linear-gradient(135deg, #111A27, #0F141D)', borderRadius: '8px', padding: '10px', border: `1px solid ${partidoEnVivo ? 'rgba(255,207,74,0.65)' : 'rgba(52,120,246,0.18)'}`, cursor: partido.id ? 'pointer' : 'default' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: colorEstado, fontWeight: 900, textTransform: 'uppercase' }}>
                        {partidoFinalizado || partidoEnVivo ? <span>{partido.estadoPartido || partido.estado || 'En Vivo'}</span> : <span>{partido.fechaTexto || partido.fechaISO || ''}</span>}
                        <span>{partidoFinalizado ? partido.fechaTexto || partido.fechaISO || '' : partido.hora || ''}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginTop: '8px', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0, color: '#FFF', fontSize: '0.72rem', fontWeight: 800 }}>
                          {partido.logoLocal && <img src={partido.logoLocal} alt="" style={{ width: '25px', height: '25px', objectFit: 'contain', flexShrink: 0 }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                          <span>{partido.local}</span>
                        </div>
                        {(partidoFinalizado || partidoEnVivo) && tieneMarcador && <div style={{ fontSize: '0.82rem', fontWeight: 950, color: '#91BAFF' }}>{partido.marcador}</div>}
                        {!partidoFinalizado && !partidoEnVivo && <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#91BAFF' }}>CONTRA</div>}
                        {partidoEnVivo && !tieneMarcador && <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#FFCF4A' }}>EN VIVO</div>}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '7px', minWidth: 0, textAlign: 'right', color: '#FFF', fontSize: '0.72rem', fontWeight: 800 }}>
                          <span>{partido.visitante}</span>
                          {partido.logoVisitante && <img src={partido.logoVisitante} alt="" style={{ width: '25px', height: '25px', objectFit: 'contain', flexShrink: 0 }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Pestaña de Equipos */}
      {pestanaActiva === 'equipos' && (
        <div style={{ padding: '18px', color: '#A7ADBA', background: '#0D1117', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ color: '#FFF', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Equipos de {nombreLiga}</h3>
          {equiposDatos.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px' }}>
              {equiposDatos.map((equipo, index) => (
                <div key={equipo.id || index} onClick={() => seleccionarEquipo(equipo)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: index % 2 === 0 ? '#111823' : '#0D131C', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '7px', color: '#FFF', fontWeight: 700, cursor: equipo.id ? 'pointer' : 'default' }}>
                  {equipo.logo ? <img src={equipo.logo} alt="" style={{ width: '28px', height: '28px', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#3478F6', color: '#F5F8FF', display: 'grid', placeItems: 'center', fontSize: '0.65rem' }}>{obtenerNombreEquipo(equipo).slice(0, 2).toUpperCase()}</span>}
                  <span>{obtenerNombreEquipo(equipo)}</span>
                </div>
              ))}
            </div>
          ) : <p style={{ margin: 0 }}>El proveedor no devolvió equipos para esta competición.</p>}
        </div>
      )}

      {/* Pestaña de Campeones */}
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