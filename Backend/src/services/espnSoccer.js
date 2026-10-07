const axios = require('axios');

const ESPN_LEAGUES = Object.freeze({
  1: { slug: 'uefa.champions', seasonType: 'european' },
  2: { slug: 'conmebol.libertadores', seasonType: 'calendar' },
  3: { slug: 'fifa.cwc', seasonType: 'calendar' },
  4: { slug: 'uefa.europa', seasonType: 'european' },
  5: { slug: 'conmebol.sudamericana', seasonType: 'calendar' },
  7: { slug: 'uefa.europa.conf', seasonType: 'european' },
  8: { slug: 'concacaf.champions', seasonType: 'calendar' },
  9: { slug: 'uefa.super_cup', seasonType: 'european' },
  10: { slug: 'arg.1', seasonType: 'calendar' },
  12: { slug: 'arg.2', seasonType: 'calendar' },
  20: { slug: 'bra.1', seasonType: 'calendar' },
  21: { slug: 'bra.2', seasonType: 'calendar' },
  30: { slug: 'col.1', seasonType: 'calendar' },
  31: { slug: 'col.2', seasonType: 'calendar' },
  40: { slug: 'chi.1', seasonType: 'calendar' },
  41: { slug: 'chi.2', seasonType: 'calendar' },
  50: { slug: 'uru.1', seasonType: 'calendar' },
  51: { slug: 'uru.2', seasonType: 'calendar' },
  60: { slug: 'par.1', seasonType: 'calendar' },
  70: { slug: 'ecu.1', seasonType: 'calendar' },
  71: { slug: 'ecu.2', seasonType: 'calendar' },
  80: { slug: 'per.1', seasonType: 'calendar' },
  81: { slug: 'per.2', seasonType: 'calendar' },
  100: { slug: 'esp.1', seasonType: 'european' },
  101: { slug: 'esp.2', seasonType: 'european' },
  102: { slug: 'esp.copa_del_rey', seasonType: 'european' },
  103: { slug: 'esp.super_cup', seasonType: 'european' },
  110: { slug: 'eng.1', seasonType: 'european' },
  111: { slug: 'eng.2', seasonType: 'european' },
  112: { slug: 'eng.fa', seasonType: 'european' },
  113: { slug: 'eng.league_cup', seasonType: 'european' },
  120: { slug: 'ita.1', seasonType: 'european' },
  121: { slug: 'ita.2', seasonType: 'european' },
  122: { slug: 'ita.coppa_italia', seasonType: 'european' },
  130: { slug: 'ger.1', seasonType: 'european' },
  131: { slug: 'ger.2', seasonType: 'european' },
  132: { slug: 'ger.dfb_pokal', seasonType: 'european' },
  140: { slug: 'fra.1', seasonType: 'european' },
  141: { slug: 'fra.2', seasonType: 'european' },
  142: { slug: 'fra.coupe_de_france', seasonType: 'european' },
  150: { slug: 'por.1', seasonType: 'european' },
  160: { slug: 'ned.1', seasonType: 'european' },
  170: { slug: 'tur.1', seasonType: 'european' },
  200: { slug: 'usa.1', seasonType: 'calendar' },
  205: { slug: 'mex.1', seasonType: 'calendar' },
  206: { slug: 'mex.2', seasonType: 'calendar' },
  220: { slug: 'crc.1', seasonType: 'calendar' },
  240: { slug: 'ksa.1', seasonType: 'calendar' },
  300: { slug: 'fifa.world', seasonType: 'calendar' },
  303: { slug: 'uefa.nations', seasonType: 'european' },
  305: { slug: 'uefa.euro', seasonType: 'european' }
});

const LIGAS_CON_TABLA_UNICA = new Set([
  20, 21, 40, 100, 101, 110, 111, 120, 121, 130, 131, 140, 141, 150, 160, 170, 240
]);
const URL_ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
const LIMITE_EVENTOS = 500;
const DURACION_CACHE_ESPN = 5 * 60 * 1000;
const cacheLigasESPN = new Map();
const solicitudesLigasESPN = new Map();

function obtenerConfiguracionESPN(idLiga) {
  return ESPN_LEAGUES[String(idLiga)] || null;
}

function obtenerTemporadaESPN(idLiga, fecha = new Date()) {
  const configuracion = obtenerConfiguracionESPN(idLiga);
  if (!configuracion) return null;

  const año = fecha.getUTCFullYear();
  const mes = fecha.getUTCMonth();
  return configuracion.seasonType === 'european' && mes < 7 ? año - 1 : año;
}

function partesFechaPeru(fecha) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Lima'
  }).formatToParts(new Date(fecha));
  const valores = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  return { año: Number(valores.year), mes: Number(valores.month), dia: Number(valores.day) };
}

function fechaDeInicioDeSemana(fecha) {
  const instantanea = new Date(fecha);
  if (Number.isNaN(instantanea.getTime())) return null;
  const { año, mes, dia } = partesFechaPeru(instantanea);
  const inicio = new Date(Date.UTC(año, mes - 1, dia));
  inicio.setUTCDate(inicio.getUTCDate() - ((inicio.getUTCDay() + 6) % 7));
  return inicio.toISOString().slice(0, 10);
}

function formatearFecha(fecha) {
  if (!fecha) return '';
  return new Date(fecha).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Lima'
  });
}

function formatearHora(fecha) {
  if (!fecha) return '';
  return new Date(fecha).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Lima'
  });
}

function obtenerJornadasPorSemana(eventos) {
  const semanas = [...new Set(eventos.map((evento) => fechaDeInicioDeSemana(evento.date)).filter(Boolean))].sort();
  return new Map(semanas.map((semana, indice) => [
    semana,
    { jornada: indice + 1, texto: `Semana del ${new Date(`${semana}T00:00:00Z`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', timeZone: 'UTC' })}` }
  ]));
}

function normalizarPartidoESPN(evento, liga, jornadas = new Map()) {
  const competencia = evento.competitions?.[0];
  const local = competencia?.competitors?.find((equipo) => equipo.homeAway === 'home');
  const visitante = competencia?.competitors?.find((equipo) => equipo.homeAway === 'away');
  if (!local?.team || !visitante?.team) return null;

  const tipoEstado = competencia?.status?.type || evento.status?.type || {};
  const estado = tipoEstado.state;
  const terminado = tipoEstado.completed === true || estado === 'post';
  const hora = tipoEstado.description || '';
  const textoEstado = estado === 'in'
    ? /half.?time|halftime|entretiempo/i.test(hora) ? 'Entretiempo' : 'En Vivo'
    : terminado ? 'Finalizado' : estado === 'pre' ? 'Por Jugar' : hora || 'Por Jugar';
  const golesLocal = local.score;
  const golesVisitante = visitante.score;
  const tieneMarcador = golesLocal !== null && golesLocal !== undefined &&
    golesVisitante !== null && golesVisitante !== undefined;
  const fecha = evento.date || '';
  const semana = jornadas.get(fechaDeInicioDeSemana(fecha));
  const fechaLocal = fecha ? partesFechaPeru(fecha) : null;
  const logos = (equipo) => equipo.team.logos?.[0]?.href || equipo.team.logo || '';

  return {
    id: evento.id,
    idLocal: local.team.id,
    idVisitante: visitante.team.id,
    local: local.team.displayName || local.team.name || 'Local',
    logoLocal: logos(local),
    visitante: visitante.team.displayName || visitante.team.name || 'Visitante',
    logoVisitante: logos(visitante),
    marcador: tieneMarcador ? `${golesLocal} - ${golesVisitante}` : 'VS',
    jornada: semana?.jornada || null,
    jornadaTexto: semana?.texto || '',
    finalizado: Boolean(terminado && tieneMarcador),
    fechaISO: fechaLocal
      ? `${fechaLocal.año}-${String(fechaLocal.mes).padStart(2, '0')}-${String(fechaLocal.dia).padStart(2, '0')}`
      : '',
    fechaUtc: fecha,
    proveedor: 'espn',
    fechaTexto: formatearFecha(fecha),
    hora: formatearHora(fecha),
    estadoPartido: textoEstado,
    liga: liga?.name || 'Competición',
    logoLiga: liga?.logos?.[0]?.href || '',
    pais: liga?.abbreviation || 'Internacional',
    streamUrl: '',
    stats: { posesion: '-', remates: '-', tarjetasAmarillas: '-' }
  };
}

function crearTablaESPN(eventos) {
  const tabla = new Map();

  for (const evento of eventos) {
    const competencia = evento.competitions?.[0];
    const tipoEstado = competencia?.status?.type || evento.status?.type || {};
    if (tipoEstado.completed !== true && tipoEstado.state !== 'post') continue;

    const local = competencia?.competitors?.find((equipo) => equipo.homeAway === 'home');
    const visitante = competencia?.competitors?.find((equipo) => equipo.homeAway === 'away');
    const hayMarcador = local?.score !== null && local?.score !== undefined &&
      visitante?.score !== null && visitante?.score !== undefined &&
      String(local?.score).trim() !== '' && String(visitante?.score).trim() !== '';
    if (!hayMarcador) continue;
    const golesLocal = Number(local?.score);
    const golesVisitante = Number(visitante?.score);
    if (!local?.team?.id || !visitante?.team?.id || !Number.isFinite(golesLocal) || !Number.isFinite(golesVisitante)) continue;

    const asegurarEquipo = (equipo) => {
      const id = String(equipo.team.id);
      if (!tabla.has(id)) {
        tabla.set(id, {
          id: equipo.team.id,
          proveedor: 'espn',
          equipo: equipo.team.displayName || equipo.team.name || 'Equipo',
          logo: equipo.team.logos?.[0]?.href || equipo.team.logo || '',
          j: 0,
          ganados: 0,
          empatados: 0,
          perdidos: 0,
          golesFavor: 0,
          golesContra: 0,
          pts: 0
        });
      }
      return tabla.get(id);
    };

    const filaLocal = asegurarEquipo(local);
    const filaVisitante = asegurarEquipo(visitante);
    filaLocal.j += 1;
    filaVisitante.j += 1;
    filaLocal.golesFavor += golesLocal;
    filaLocal.golesContra += golesVisitante;
    filaVisitante.golesFavor += golesVisitante;
    filaVisitante.golesContra += golesLocal;

    if (golesLocal > golesVisitante) {
      filaLocal.ganados += 1;
      filaLocal.pts += 3;
      filaVisitante.perdidos += 1;
    } else if (golesLocal < golesVisitante) {
      filaVisitante.ganados += 1;
      filaVisitante.pts += 3;
      filaLocal.perdidos += 1;
    } else {
      filaLocal.empatados += 1;
      filaVisitante.empatados += 1;
      filaLocal.pts += 1;
      filaVisitante.pts += 1;
    }
  }

  return [...tabla.values()]
    .map((fila) => ({
      ...fila,
      gol: `${fila.golesFavor}:${fila.golesContra}`,
      dif: fila.golesFavor - fila.golesContra
    }))
    .sort((a, b) => b.pts - a.pts || b.dif - a.dif || b.golesFavor - a.golesFavor || a.equipo.localeCompare(b.equipo))
    .map((fila, indice) => ({ ...fila, pos: indice + 1 }));
}

async function solicitarMarcador(slug, año) {
  const respuesta = await axios.get(`${URL_ESPN}/${slug}/scoreboard`, {
    params: { dates: año, limit: LIMITE_EVENTOS },
    timeout: 20000
  });
  return respuesta.data;
}

async function obtenerDatosLigaESPN(idLiga, fecha = new Date()) {
  const configuracion = obtenerConfiguracionESPN(idLiga);
  if (!configuracion) return null;

  const temporada = obtenerTemporadaESPN(idLiga, fecha);
  const clave = `${idLiga}-${temporada}`;
  const cacheada = cacheLigasESPN.get(clave);
  if (cacheada && Date.now() - cacheada.fecha < DURACION_CACHE_ESPN) return cacheada.datos;
  if (solicitudesLigasESPN.has(clave)) return solicitudesLigasESPN.get(clave);

  const solicitud = cargarDatosLigaESPN(idLiga, configuracion, temporada)
    .then((datos) => {
      cacheLigasESPN.set(clave, { fecha: Date.now(), datos });
      return datos;
    })
    .finally(() => solicitudesLigasESPN.delete(clave));
  solicitudesLigasESPN.set(clave, solicitud);
  return solicitud;
}

async function cargarDatosLigaESPN(idLiga, configuracion, temporada) {
  const añosConsulta = configuracion.seasonType === 'european'
    ? [temporada, temporada + 1]
    : [temporada];
  const respuestas = await Promise.all(añosConsulta.map((año) => solicitarMarcador(configuracion.slug, año)));
  const eventosPorId = new Map();

  for (const respuesta of respuestas) {
    if ((respuesta.events || []).length >= LIMITE_EVENTOS) {
      throw new Error(`ESPN devolvió el límite de ${LIMITE_EVENTOS} partidos para ${configuracion.slug}; se evita mostrar una temporada incompleta.`);
    }
    for (const evento of respuesta.events || []) {
      if (Number(evento.season?.year) === temporada) eventosPorId.set(String(evento.id), evento);
    }
  }

  const eventos = [...eventosPorId.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const liga = respuestas.map((respuesta) => respuesta.leagues?.[0]).find(Boolean) || null;
  const jornadas = obtenerJornadasPorSemana(eventos);
  const partidos = eventos.map((evento) => normalizarPartidoESPN(evento, liga, jornadas)).filter(Boolean);
  const tabla = LIGAS_CON_TABLA_UNICA.has(Number(idLiga)) ? crearTablaESPN(eventos) : [];
  const equipos = new Map();

  for (const evento of eventos) {
    for (const equipo of evento.competitions?.[0]?.competitors || []) {
      if (!equipo.team?.id) continue;
      equipos.set(String(equipo.team.id), {
        id: equipo.team.id,
        proveedor: 'espn',
        nombre: equipo.team.displayName || equipo.team.name || 'Equipo',
        logo: equipo.team.logos?.[0]?.href || equipo.team.logo || ''
      });
    }
  }

  return {
    partidos,
    tabla,
    equipos: [...equipos.values()].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    campeones: [],
    proveedor: 'espn',
    temporada,
    mensajeTabla: tabla.length
      ? ''
      : 'Esta competición no tiene una tabla general disponible; su formato puede ser de grupos o eliminación directa.',
    aviso: partidos.length
      ? ''
      : `ESPN no publicó partidos para la temporada ${temporada} de esta competición.`
  };
}

async function obtenerDatosEquipoESPN(idLiga, idEquipo, temporada = obtenerTemporadaESPN(idLiga)) {
  const configuracion = obtenerConfiguracionESPN(idLiga);
  if (!configuracion) return null;

  const [equipoResultado, plantillaResultado, ligaResultado] = await Promise.allSettled([
    axios.get(`${URL_ESPN}/${configuracion.slug}/teams/${encodeURIComponent(idEquipo)}`, { timeout: 15000 }),
    axios.get(`${URL_ESPN}/${configuracion.slug}/teams/${encodeURIComponent(idEquipo)}/roster`, {
      params: { season: temporada },
      timeout: 15000
    }),
    obtenerDatosLigaESPN(idLiga)
  ]);
  if (equipoResultado.status === 'rejected') throw equipoResultado.reason;
  if (plantillaResultado.status === 'rejected') {
    console.warn(`ESPN no devolvió el plantel del equipo ${idEquipo}:`, plantillaResultado.reason.response?.status || plantillaResultado.reason.message);
  }
  if (ligaResultado.status === 'rejected') {
    console.warn(`ESPN no devolvió los partidos de la liga ${idLiga}:`, ligaResultado.reason.response?.status || ligaResultado.reason.message);
  }

  const plantillaRespuesta = plantillaResultado.status === 'fulfilled' ? plantillaResultado.value : null;
  const datosLiga = ligaResultado.status === 'fulfilled' ? ligaResultado.value : null;
  const equipo = equipoResultado.value.data?.team;
  if (!equipo) throw new Error('ESPN no devolvió el perfil del club solicitado.');

  const plantilla = (plantillaRespuesta.data?.athletes || []).map((jugador) => ({
    id: jugador.id,
    nombre: jugador.fullName || jugador.displayName || 'Jugador',
    foto: jugador.headshot?.href || '',
    edad: jugador.age ?? null,
    posicion: jugador.position?.displayName || jugador.position?.name || 'Jugador',
    numero: jugador.jersey || ''
  }));
  const filaTabla = datosLiga?.tabla?.find((fila) => String(fila.id) === String(idEquipo)) || null;
  const partidosEquipo = (datosLiga?.partidos || []).filter((partido) =>
    String(partido.idLocal) === String(idEquipo) || String(partido.idVisitante) === String(idEquipo)
  );
  const perfil = {
    id: equipo.id,
    nombre: equipo.displayName || equipo.name || 'Equipo',
    logo: equipo.logos?.[0]?.href || '',
    apodo: equipo.abbreviation || '',
    fundacion: null,
    estadio: equipo.franchise?.venue?.fullName || equipo.venue?.fullName || 'Estadio no disponible',
    ciudad: equipo.location || '',
    direccion: '',
    capacidad: null,
    superficie: ''
  };
  const estadisticas = filaTabla ? {
    partidosJugados: filaTabla.j,
    ganados: filaTabla.ganados,
    empatados: filaTabla.empatados,
    perdidos: filaTabla.perdidos,
    golesFavor: filaTabla.golesFavor,
    golesContra: filaTabla.golesContra
  } : null;

  return {
    equipo: perfil,
    tabla: estadisticas ? {
      j: estadisticas.partidosJugados,
      ganados: estadisticas.ganados,
      empatados: estadisticas.empatados,
      perdidos: estadisticas.perdidos,
      golesFavor: estadisticas.golesFavor,
      golesContra: estadisticas.golesContra
    } : null,
    estadisticas,
    plantel: plantilla,
    lideres: { goleadores: [], asistencias: [], amarillas: [], rojas: [] },
    historial: [],
    proximos: partidosEquipo.filter((partido) => !partido.finalizado),
    resultados: partidosEquipo.filter((partido) => partido.finalizado)
  };
}

function normalizarDetallePartidoESPN(resumen) {
  const encabezado = resumen.header?.competitions?.[0];
  if (!encabezado) throw new Error('ESPN no devolvió el encabezado del partido.');

  const local = encabezado.competitors?.find((equipo) => equipo.homeAway === 'home');
  const visitante = encabezado.competitors?.find((equipo) => equipo.homeAway === 'away');
  const estado = encabezado.status?.type || {};
  const equipo = (participante) => ({
    id: participante?.team?.id,
    name: participante?.team?.displayName || participante?.team?.name || 'Equipo',
    logo: participante?.team?.logos?.[0]?.href || participante?.team?.logo || ''
  });
  const goles = (participante) => participante?.score === null || participante?.score === undefined
    ? null
    : Number(participante.score);
  const eventos = (resumen.keyEvents || []).map((evento) => ({
    detail: evento.text || evento.type?.text || 'Evento',
    type: evento.type?.text || '',
    player: { name: evento.participants?.[0]?.athlete?.displayName || '' },
    time: { elapsed: Number(String(evento.clock?.displayValue || '').match(/\d+/)?.[0]) || null },
    team: { name: evento.team?.displayName || '' }
  }));
  const estadisticas = (resumen.boxscore?.teams || []).map((equipoDatos) => ({
    team: { name: equipoDatos.team?.displayName || equipoDatos.team?.name || 'Equipo' },
    statistics: (equipoDatos.statistics || []).map((estadistica) => ({
      type: estadistica.label || estadistica.name || 'Estadística',
      value: estadistica.displayValue ?? estadistica.value ?? null
    }))
  }));
  const alineaciones = (resumen.rosters || []).map((roster) => {
    const normalizarJugador = (jugador) => ({
      player: {
        id: jugador.athlete?.id,
        name: jugador.athlete?.displayName || jugador.athlete?.fullName || 'Jugador',
        number: jugador.jersey || '',
        photo: jugador.athlete?.headshot?.href || '',
        pos: jugador.position?.displayName || jugador.position?.name || ''
      }
    });
    return {
      team: {
        id: roster.team?.id,
        name: roster.team?.displayName || roster.team?.name || 'Equipo',
        logo: roster.team?.logos?.[0]?.href || roster.team?.logo || ''
      },
      formation: roster.formation || '',
      startXI: (roster.roster || []).filter((jugador) => jugador.starter).map(normalizarJugador),
      substitutes: (roster.roster || []).filter((jugador) => !jugador.starter).map(normalizarJugador)
    };
  });
  const elapsed = Number(String(encabezado.status?.displayClock || '').match(/\d+/)?.[0]) || null;

  return {
    partido: {
      teams: { home: equipo(local), away: equipo(visitante) },
      goals: { home: goles(local), away: goles(visitante) },
      fixture: {
        date: encabezado.date || '',
        status: {
            long: estado.state === 'in'
              ? /half.?time|halftime/i.test(estado.description || '') ? 'Entretiempo' : 'En Vivo'
              : estado.description || estado.detail || 'Por Jugar',
            short: estado.state === 'in' ? 'LIVE' : estado.shortDetail || estado.name || 'NS',
            elapsed
          }
        }
    },
    eventos,
    estadisticas,
    alineaciones,
    alineacionEstado: alineaciones.length ? 'disponible' : 'no_publicada',
    alineacionDisponibleDesde: null
  };
}

async function obtenerDetallePartidoESPN(idLiga, idPartido) {
  const configuracion = obtenerConfiguracionESPN(idLiga);
  if (!configuracion) return null;
  const respuesta = await axios.get(`${URL_ESPN}/${configuracion.slug}/summary`, {
    params: { event: idPartido },
    timeout: 15000
  });
  return normalizarDetallePartidoESPN(respuesta.data);
}

module.exports = {
  obtenerConfiguracionESPN,
  obtenerTemporadaESPN,
  normalizarPartidoESPN,
  crearTablaESPN,
  obtenerDatosLigaESPN,
  obtenerDatosEquipoESPN,
  normalizarDetallePartidoESPN,
  obtenerDetallePartidoESPN
};
