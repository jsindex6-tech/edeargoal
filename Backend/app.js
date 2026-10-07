const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const { evaluarVentanaAlineacion, debeMantenerAlineacionesGuardadas } = require('./src/utils/ventanaAlineacion');

const app = express();
const PORT = process.env.PORT || 3001;
const origenesPermitidos = new Set([
  ...String(process.env.FRONTEND_ORIGIN || '').split(',').map((origen) => origen.trim()).filter(Boolean),
  'https://jsindex6-tech.github.io',
  'https://edeargoal.onrender.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3001',
  'http://127.0.0.1:3001'
]);

app.use(cors({
  origin: (origen, callback) => {
    if (!origen || origenesPermitidos.has(origen) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('Origen no permitido.'));
  },
  credentials: true
}));
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());

// IDs definidos en el frontend y códigos de football-data.org.
const competenciasFootballData = {
  1: "CL",
  100: "PD",
  110: "PL",
  120: "SA",
  130: "BL1",
  140: "FL1",
  150: "PPL",
  160: "DED",
  20: "BSA",
  200: "MLS",
  205: "BSA",
  300: "WC",
  305: "EC"
};
const codigosFootballData = new Set(Object.values(competenciasFootballData));
const cacheDatosLigas = new Map();
const solicitudesEnCurso = new Map();
const solicitudesPorIp = new Map();
const DURACION_CACHE = {
  partidos: 5 * 60 * 1000,
  enVivo: 20 * 1000,
  tabla: 15 * 60 * 1000,
  catalogo: 24 * 60 * 60 * 1000,
  alineaciones: 60 * 1000
};
const LIMITE_SOLICITUDES_IP = 60;
const VENTANA_SOLICITUDES_MS = 60 * 1000;
const DURACION_CACHE_AGENDA = 5 * 60 * 1000;
const URL_AGENDA_PUBLICA = 'https://api.wqxag.com/diaries.json';
const archivoCache = path.join(__dirname, '.cache-ligas.json');
let cacheAgendaPublica = null;
let solicitudAgendaPublica = null;

try {
  const cacheGuardada = JSON.parse(fs.readFileSync(archivoCache, 'utf8'));
  Object.entries(cacheGuardada).forEach(([clave, valor]) => cacheDatosLigas.set(clave, valor));
} catch {
  // La aplicación comienza con la caché vacía en la primera ejecución.
}

function guardarCache() {
  try {
    fs.writeFileSync(archivoCache, JSON.stringify(Object.fromEntries(cacheDatosLigas)), 'utf8');
  } catch (error) {
    console.error('No se pudo guardar la caché:', error.message);
  }
}

function leerCache(clave, duracion) {
  const entrada = cacheDatosLigas.get(clave);
  return entrada && Date.now() - entrada.fecha < duracion ? entrada.datos : null;
}

function leerCachePartidos(clave) {
  const entrada = cacheDatosLigas.get(clave);
  if (!entrada) return null;
  const partidos = entrada.datos?.partidos ? entrada.datos.partidos : [entrada.datos?.partido];
  const hayPartidoEnVivo = partidos.some((partido) => {
    const estado = String(partido?.estadoPartido || partido?.status?.short || partido?.fixture?.status?.short || partido?.fixture?.status?.long || '').toLowerCase();
    return estado.includes('vivo') || estado.includes('entretiempo') || ['1h', '2h', 'et'].includes(estado);
  });
  const duracion = hayPartidoEnVivo ? DURACION_CACHE.enVivo : DURACION_CACHE.partidos;
  return Date.now() - entrada.fecha < duracion ? entrada.datos : null;
}

function guardarDatosCache(clave, datos) {
  cacheDatosLigas.set(clave, { fecha: Date.now(), datos });
  guardarCache();
}

function obtenerPartidosCacheadosPorFecha(fecha) {
  const partidos = new Map();
  for (const clave of cacheDatosLigas.keys()) {
    if (!clave.endsWith('-jornadas-v6')) continue;
    const datos = leerCachePartidos(clave);
    for (const partido of datos?.partidos || []) {
      if (String(partido.fechaUtc || partido.fechaISO || '').slice(0, 10) === fecha) {
        partidos.set(String(partido.id), partido);
      }
    }
  }
  return [...partidos.values()];
}

async function reutilizarSolicitud(clave, cargar) {
  if (solicitudesEnCurso.has(clave)) return solicitudesEnCurso.get(clave);
  const solicitud = cargar().finally(() => solicitudesEnCurso.delete(clave));
  solicitudesEnCurso.set(clave, solicitud);
  return solicitud;
}

function normalizarTextoAgenda(texto) {
  return String(texto || '').replace(/\s+/g, ' ').trim();
}

function extraerDatosAgenda(respuesta) {
  const filas = Array.isArray(respuesta?.data) ? respuesta.data : [];
  const eventos = filas.map((fila) => {
    const atributos = fila?.attributes || {};
    const descripcion = normalizarTextoAgenda(atributos.diary_description);
    const liga = normalizarTextoAgenda(atributos.country?.data?.attributes?.name) || 'Competición';
    const separadorLiga = descripcion.match(/^(.+?):\s*(.+)$/);
    const separadorDeporte = descripcion.match(/^(.+?)\s+[–-]\s+(.+)$/);
    const enfrentamiento = separadorLiga?.[2] || separadorDeporte?.[2] || descripcion;
    const nombreLiga = separadorLiga?.[1] || separadorDeporte?.[1] || liga;
    const equipos = enfrentamiento.match(/^(.+?)\s+vs\.?\s+(.+)$/i);
    if (!equipos || !atributos.diary_hour || !atributos.date_diary) return null;

    const rutaEscudo = atributos.country?.data?.attributes?.image?.data?.attributes?.url || '';
    return {
      id: String(fila.id),
      hora: normalizarTextoAgenda(atributos.diary_hour).slice(0, 5),
      liga: normalizarTextoAgenda(nombreLiga),
      logoLiga: /^https?:\/\//i.test(rutaEscudo) ? rutaEscudo : new URL(rutaEscudo, 'https://img.wqxag.com').href,
      local: equipos[1].trim(),
      visitante: equipos[2].trim(),
      fechaISO: String(atributos.date_diary)
    };
  }).filter(Boolean);

  if (!eventos.length) throw new Error('La API de agenda no devolvió partidos reconocibles.');
  const fechaISO = eventos[0].fechaISO;
  const fechaTexto = new Date(`${fechaISO}T12:00:00`).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  return { fechaTexto, fechaISO, eventos, actualizadaEn: new Date().toISOString() };
}

async function obtenerAgendaPublica() {
  if (cacheAgendaPublica && Date.now() - cacheAgendaPublica.fecha < DURACION_CACHE_AGENDA) {
    return cacheAgendaPublica.datos;
  }
  if (solicitudAgendaPublica) return solicitudAgendaPublica;

  solicitudAgendaPublica = axios.get(URL_AGENDA_PUBLICA, {
    timeout: 12000,
    headers: { 'User-Agent': 'EdearGoal/1.0 (daily match agenda)' }
  }).then((respuesta) => {
    const datos = extraerDatosAgenda(respuesta.data);
    cacheAgendaPublica = { fecha: Date.now(), datos };
    return datos;
  }).catch((error) => {
    if (cacheAgendaPublica?.datos) return cacheAgendaPublica.datos;
    throw error;
  }).finally(() => {
    solicitudAgendaPublica = null;
  });

  return solicitudAgendaPublica;
}

function limitarSolicitudes(req, res, next) {
  const ahora = Date.now();
  const ip = req.ip || req.socket.remoteAddress || 'desconocida';
  const registro = solicitudesPorIp.get(ip);
  if (!registro || ahora - registro.inicio >= VENTANA_SOLICITUDES_MS) {
    solicitudesPorIp.set(ip, { inicio: ahora, cantidad: 1 });
    return next();
  }
  if (registro.cantidad >= LIMITE_SOLICITUDES_IP) {
    return res.status(429).json({
      error: 'LIMITE_SOLICITUDES',
      mensaje: 'Demasiadas solicitudes. Los datos guardados en caché seguirán disponibles al reintentar.'
    });
  }
  registro.cantidad += 1;
  next();
}

app.use('/api/auth', require('./src/routes/auth'));

const competenciasApiFootball = {
  1: 2,
  2: 13,
  3: 15,
  4: 3,
  5: 11,
  6: 17,
  7: 848,
  8: 16,
  9: 531,
  10: 128,
  11: 130,
  12: 129,
  20: 71,
  21: 72,
  22: 73,
  23: 475,
  24: 624,
  30: 239,
  31: 240,
  32: 242,
  40: 265,
  41: 266,
  42: 267,
  50: 268,
  51: 269,
  60: 250,
  70: 242,
  71: 243,
  80: 281,
  81: 282,
  100: 140,
  101: 141,
  102: 143,
  103: 556,
  110: 39,
  111: 40,
  112: 45,
  113: 48,
  114: 528,
  120: 135,
  121: 136,
  122: 137,
  130: 78,
  131: 79,
  132: 81,
  140: 61,
  141: 62,
  142: 66,
  150: 94,
  151: 96,
  160: 88,
  170: 203,
  200: 253,
  201: 254,
  205: 262,
  206: 263,
  220: 162,
  240: 307,
  241: 98,
  242: 292,
  300: 1,
  301: 34,
  302: 32,
  303: 5,
  304: 9,
  305: 4
};

function traducirEstado(status) {
  if (!status) return "Por Jugar";
  const statusLower = status.toLowerCase();
  if (statusLower === "finished" || statusLower === "ft") return "Finalizado";
  if (statusLower === "paused" || statusLower === "ht") return "Entretiempo";
  if (statusLower === "in_play" || statusLower === "live") return "En Vivo";
  if (statusLower === "postponed") return "Pospuesto";
  if (statusLower === "cancelled") return "Cancelado";
  if (statusLower === "scheduled" || statusLower === "timed") return "Por Jugar";
  return status;
}

function normalizarNombreClub(nombre) {
  return String(nombre || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(fc|cf|sc|ac|club|football|futbol)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizarTextoPlana(valor) {
  return String(valor || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizarSlugSofascore(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function encontrarLineupsEnObjeto(objeto, resultados = []) {
  if (!objeto || typeof objeto !== 'object') return resultados;
  if (Array.isArray(objeto)) {
    objeto.forEach((valor) => encontrarLineupsEnObjeto(valor, resultados));
    return resultados;
  }

  for (const [clave, valor] of Object.entries(objeto)) {
    const llave = String(clave || '').toLowerCase();
    const esLineup = ['lineup', 'lineups', 'startlineup', 'startlineups', 'startinglineup', 'players', 'lineupsdata', 'teamlineups', 'home-starting-lineup', 'away-starting-lineup'].some((token) => llave.includes(token));
    if (esLineup && valor !== null && valor !== undefined) {
      resultados.push(valor);
    }
    if (valor && typeof valor === 'object') {
      encontrarLineupsEnObjeto(valor, resultados);
    }
  }
  return resultados;
}

function normalizarEquipoSofascore(entry) {
  const equipo = entry?.team || entry?.equipo || entry;
  const nombreEquipo = equipo?.name || equipo?.shortName || equipo?.teamName || entry?.name || 'Equipo';
  const formacion = entry?.formation || equipo?.formation || entry?.team?.formation || '';
  const listaJugadores = Array.isArray(entry?.players)
    ? entry.players
    : Array.isArray(entry?.startXI)
      ? entry.startXI
      : Array.isArray(entry?.lineup)
        ? entry.lineup
        : Array.isArray(entry?.startingLineup)
          ? entry.startingLineup
          : [];

  const jugadores = listaJugadores.map((jugador) => {
    const player = jugador?.player || jugador;
    const nombre = player?.name || player?.fullName || player?.displayName || jugador?.name || 'Jugador';
    const dorsal = jugador?.number ?? player?.number ?? player?.shirtNumber ?? player?.jerseyNumber ?? '';
    const foto = player?.photo || player?.image || player?.imageUrl || jugador?.photo || jugador?.image || '';
    return { player: { name: nombre, number: dorsal, photo: foto, pos: jugador?.position || player?.position || '' } };
  });

  return {
    team: { name: nombreEquipo, logo: equipo?.logo || equipo?.image || entry?.team?.logo || entry?.logo || '' },
    formation: formacion,
    startXI: jugadores,
    substitutes: Array.isArray(entry?.substitutes) ? entry.substitutes.map((jugador) => ({ player: { name: jugador?.player?.name || jugador?.name || 'Jugador', number: jugador?.number || jugador?.player?.number || '' } })) : []
  };
}

function extraerAlineacionesDesdeHtmlSofascore(html) {
  if (!html) return [];

  const candidatos = [
    /window\.__INITIAL_STATE__\s*=\s*({.*?});?\s*(?:<\/script>|$)/s,
    /window\.__NUXT__\s*=\s*({.*?});?\s*(?:<\/script>|$)/s,
    /<script[^>]*type="application\/json"[^>]*>(.*?)<\/script>/s,
    /__NEXT_DATA__\s*=\s*({.*?});?\s*(?:<\/script>|$)/s
  ];

  for (const regex of candidatos) {
    const match = html.match(regex);
    if (!match) continue;

    try {
      const texto = match[1] || match[0];
      const json = texto.includes('window.__') ? texto.replace(/^[^\{]*\{/, '{').replace(/\}\s*;?[^\}]*$/, '}') : texto;
      const parsed = JSON.parse(json);
      const hallados = encontrarLineupsEnObjeto(parsed);
      const equipos = [];

      hallados.forEach((bloque) => {
        if (!bloque || typeof bloque !== 'object') return;
        const equipoList = Array.isArray(bloque) ? bloque : [bloque];
        equipoList.forEach((entrada) => {
          if (!entrada || typeof entrada !== 'object') return;
          const normalizado = normalizarEquipoSofascore(entrada);
          if (normalizado.team?.name && normalizado.startXI?.length) {
            equipos.push(normalizado);
          }
        });
      });

      if (equipos.length) return equipos.slice(0, 2);
    } catch {
      // No se pudo parsear el bloque JSON; se intenta con otros candidatos.
    }
  }

  const coincidencias = [...html.matchAll(/(home|away|teamLineups|startLineups|lineups|lineup)[^\n]{0,200}(\{.*?\})/gis)];
  for (const item of coincidencias) {
    try {
      const texto = item[0] || '';
      const json = texto.match(/\{.*\}/s)?.[0];
      if (!json) continue;
      const parsed = JSON.parse(json);
      const equipos = encontrarLineupsEnObjeto(parsed).map((entrada) => normalizarEquipoSofascore(entrada)).filter((equipo) => equipo?.team?.name && equipo?.startXI?.length);
      if (equipos.length) return equipos.slice(0, 2);
    } catch {
      // Ignorar patrones no extraíbles.
    }
  }

  return [];
}

async function obtenerLineupsDesdeSofascore(partido) {
  if (!partido) return [];

  const local = partido.teams?.home?.name || partido.local || '';
  const visitante = partido.teams?.away?.name || partido.visitante || '';
  if (!local || !visitante) return [];

  const fecha = partido.fixture?.date || partido.fechaUtc || partido.utcDate || '';
  const fechaTexto = fecha ? new Date(fecha).toISOString().slice(0, 10) : '';
  const query = encodeURIComponent([local, visitante, fechaTexto].filter(Boolean).join(' '));

  const urls = [
    `https://www.sofascore.com/search?q=${query}`,
    `https://www.sofascore.com/football/match/${normalizarSlugSofascore(local)}-${normalizarSlugSofascore(visitante)}`,
    `https://www.sofascore.com/football/match/${normalizarSlugSofascore(local)}-${normalizarSlugSofascore(visitante)}-${fechaTexto}`
  ];

  for (const url of urls) {
    try {
      const respuesta = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'es-ES,es;q=0.9' },
        timeout: 15000
      });
      const contenido = respuesta.data || '';
      const matchUrl = (contenido.match(/\/football\/match\/[^\"'\s<>]+/gi) || [])
        .map((ruta) => `https://www.sofascore.com${ruta}`)
        .find((ruta) => normalizarNombreClub(local).length && ruta.toLowerCase().includes(normalizarNombreClub(local).split(' ')[0])) || null;

      const html = matchUrl ? (await axios.get(matchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'es-ES,es;q=0.9' },
        timeout: 15000
      })).data || contenido : contenido;

      const ubicacion = extraerAlineacionesDesdeHtmlSofascore(html);
      if (ubicacion.length) return ubicacion;
    } catch {
      // Se intenta la siguiente URL.
    }
  }

  return [];
}

function partidoFinalizado(status, golesLocal, golesVisitante) {
  const estado = String(status || '').toLowerCase();
  return ['finished', 'ft', 'aet', 'pen', 'finalizado'].includes(estado) ||
    (golesLocal !== null && golesLocal !== undefined && golesVisitante !== null && golesVisitante !== undefined);
}

function formatearFechaEspanol(utcDate) {
  if (!utcDate) return "";
  const fechaObj = new Date(utcDate);
  if (isNaN(fechaObj.getTime())) return "";
  const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  let fechaFormateada = fechaObj.toLocaleDateString('es-ES', opciones);
  return fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
}

function formatearHora(utcDate) {
  if (!utcDate) return "";
  const fechaObj = new Date(utcDate);
  if (isNaN(fechaObj.getTime())) return "";
  return fechaObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) + " hs";
}

function normalizarPartidoFootballData(partido, competencia) {
  const homeScore = partido.score?.fullTime?.home;
  const awayScore = partido.score?.fullTime?.away;
  const marcador = homeScore !== null && homeScore !== undefined &&
    awayScore !== null && awayScore !== undefined
    ? `${homeScore} - ${awayScore}`
    : "VS";

  return {
    id: partido.id,
    idLocal: partido.homeTeam?.id || null,
    idVisitante: partido.awayTeam?.id || null,
    local: partido.homeTeam?.name || "Local",
    logoLocal: partido.homeTeam?.crest || "",
    visitante: partido.awayTeam?.name || "Visitante",
    logoVisitante: partido.awayTeam?.crest || "",
    marcador,
    jornada: partido.matchday || null,
    finalizado: partidoFinalizado(partido.status, homeScore, awayScore),
    fechaISO: partido.utcDate?.slice(0, 10),
    fechaUtc: partido.utcDate,
    proveedor: 'football-data',
    fechaTexto: formatearFechaEspanol(partido.utcDate),
    hora: formatearHora(partido.utcDate),
    estadoPartido: traducirEstado(partido.status),
    liga: competencia?.name || partido.competition?.name || "Competición",
    logoLiga: competencia?.emblem || partido.competition?.emblem || "",
    pais: competencia?.area?.name || partido.area?.name || "Internacional",
    streamUrl: "",
    stats: { posesion: "-", remates: "-", tarjetasAmarillas: "-" }
  };
}

async function obtenerPartidosPorFecha(fecha, apiFootballKey, apiKeyFootballData) {
  let errorApiFootball = null;
  if (apiFootballKey) {
    try {
      const response = await axios.get('https://v3.football.api-sports.io/fixtures', {
        headers: { 'x-apisports-key': apiFootballKey },
        params: { date: fecha }
      });
      if (response.data?.errors && Object.keys(response.data.errors).length > 0) {
        throw new Error(JSON.stringify(response.data.errors));
      }
      const partidos = (response.data?.response || []).map(normalizarPartidoApiFootball);
      if (partidos.length) return { partidos, proveedor: 'api-football', aviso: '' };
    } catch (error) {
      errorApiFootball = error;
    }
  }

  const detalleErrorApiFootball = JSON.stringify(
    errorApiFootball?.response?.data?.errors || errorApiFootball?.message || ''
  );
  const alcanzoLimiteApiFootball = errorApiFootball?.response?.status === 429 ||
    /request.?limit|rate.?limit|too many|429/i.test(detalleErrorApiFootball);
  const avisoApiFootball = !errorApiFootball
    ? ''
    : alcanzoLimiteApiFootball
      ? 'API-Football alcanzó el límite diario; los datos de respaldo pueden tener cobertura parcial.'
      : 'API-Football no está disponible; se consultaron fuentes de respaldo.';

  const partidosCacheados = obtenerPartidosCacheadosPorFecha(fecha);
  if (partidosCacheados.length) {
    return {
      partidos: partidosCacheados,
      proveedor: 'cache-api-football',
      aviso: avisoApiFootball
    };
  }

  if (!apiKeyFootballData) {
    return {
      partidos: [],
      proveedor: 'sin-proveedor',
      aviso: errorApiFootball ? 'API-Football alcanzó un límite o no está disponible y no hay una fuente secundaria configurada.' : 'No hay un proveedor de partidos configurado.'
    };
  }

  try {
    const response = await axios.get('https://api.football-data.org/v4/matches', {
      headers: { 'X-Auth-Token': apiKeyFootballData },
      params: { dateFrom: fecha, dateTo: fecha }
    });
    const partidos = (response.data?.matches || []).map((partido) =>
      normalizarPartidoFootballData(partido, partido.competition)
    );
    return {
      partidos,
      proveedor: 'football-data',
      aviso: avisoApiFootball
    };
  } catch (errorFootballData) {
    if (errorApiFootball) {
      return {
        partidos: [],
        proveedor: 'sin-datos',
        aviso: alcanzoLimiteApiFootball
          ? 'API-Football alcanzó el límite diario y football-data no devolvió partidos para esta fecha.'
          : 'Los proveedores conectados no pudieron cargar partidos para esta fecha.'
      };
    }
    throw errorFootballData;
  }
}

function normalizarPartidoApiFootball(partido) {
  const golesLocal = partido.goals?.home;
  const golesVisitante = partido.goals?.away;
  const tieneMarcador = golesLocal !== null && golesLocal !== undefined &&
    golesVisitante !== null && golesVisitante !== undefined;

  return {
    id: partido.fixture?.id,
    idLocal: partido.teams?.home?.id || null,
    idVisitante: partido.teams?.away?.id || null,
    jornada: Number(String(partido.league?.round || '').match(/\d+/)?.[0]) || null,
    local: partido.teams?.home?.name || "Local",
    logoLocal: partido.teams?.home?.logo || "",
    visitante: partido.teams?.away?.name || "Visitante",
    logoVisitante: partido.teams?.away?.logo || "",
    marcador: tieneMarcador ? `${golesLocal} - ${golesVisitante}` : "VS",
    finalizado: partidoFinalizado(partido.fixture?.status?.short, golesLocal, golesVisitante),
    fechaISO: partido.fixture?.date?.slice(0, 10),
    fechaUtc: partido.fixture?.date,
    proveedor: 'api-football',
    fechaTexto: formatearFechaEspanol(partido.fixture?.date),
    hora: formatearHora(partido.fixture?.date),
    estadoPartido: traducirEstado(partido.fixture?.status?.short),
    liga: partido.league?.name || "Competición",
    logoLiga: partido.league?.logo || "",
    pais: partido.league?.country || "Internacional",
    streamUrl: "",
    stats: {
      posesion: "-",
      remates: "-",
      tarjetasAmarillas: "-"
    }
  };
}

async function obtenerPartidosApiFootball(idLiga, apiKey) {
  const ligaApi = competenciasApiFootball[String(idLiga)];
  if (!ligaApi) return null;

  return obtenerDatosApiFootballPorId(ligaApi, apiKey);
}

function normalizarTablaApiFootball(respuesta) {
  const filas = respuesta.data?.response?.[0]?.league?.standings?.[0] || [];
  return filas.map((fila) => ({
    id: fila.team?.id,
    proveedor: 'api-football',
    pos: fila.rank,
    equipo: fila.team?.name || "Equipo",
    logo: fila.team?.logo || (fila.team?.id ? `https://media.api-sports.io/football/teams/${fila.team.id}.png` : ""),
    pts: fila.points ?? 0,
    j: fila.all?.played ?? 0,
    gol: `${fila.all?.goals?.for ?? 0}:${fila.all?.goals?.against ?? 0}`,
    dif: fila.goalsDiff ?? 0
  }));
}

function normalizarEquiposApiFootball(respuesta) {
  const filas = respuesta.data?.response?.[0]?.league?.standings?.[0] || [];
  return filas.map((fila) => ({
    id: fila.team?.id,
    proveedor: 'api-football',
    nombre: fila.team?.name || 'Equipo',
    logo: fila.team?.logo || (fila.team?.id ? `https://media.api-sports.io/football/teams/${fila.team.id}.png` : '')
  }));
}

function normalizarCampeonesApiFootball(respuesta) {
  const liga = respuesta.data?.response?.[0]?.league;
  return (liga?.seasons || [])
    .filter((temporada) => temporada.winner?.name)
    .sort((a, b) => Number(b.year) - Number(a.year))
    .map((temporada) => ({
      temporada: temporada.year,
      equipo: temporada.winner.name,
      logo: temporada.winner.logo || ''
    }));
}

async function obtenerDatosApiFootballPorId(ligaApi, apiKey) {
  const temporada = process.env.API_FOOTBALL_SEASON || new Date().getUTCFullYear();
  const claveCache = `${ligaApi}-${temporada}-jornadas-v6`;
  const datoGuardado = leerCachePartidos(claveCache);
  if (datoGuardado) return datoGuardado;

  return reutilizarSolicitud(claveCache, async () => {
    const cacheActualizado = leerCachePartidos(claveCache);
    if (cacheActualizado) return cacheActualizado;

    const configuracion = { headers: { 'x-apisports-key': apiKey } };
    const [partidosResponse, tablaResponse, ligaResponse] = await Promise.all([
      axios.get('https://v3.football.api-sports.io/fixtures', {
        ...configuracion,
        params: { league: ligaApi, season: temporada }
      }),
      axios.get('https://v3.football.api-sports.io/standings', {
        ...configuracion,
        params: { league: ligaApi, season: temporada }
      }),
      axios.get('https://v3.football.api-sports.io/leagues', {
        ...configuracion,
        params: { id: ligaApi }
      })
    ]);

    for (const respuesta of [partidosResponse, tablaResponse, ligaResponse]) {
      if (respuesta.data?.errors && Object.keys(respuesta.data.errors).length > 0) {
        throw new Error(JSON.stringify(respuesta.data.errors));
      }
    }

    const datos = {
      partidos: (partidosResponse.data?.response || []).map(normalizarPartidoApiFootball),
      tabla: normalizarTablaApiFootball(tablaResponse),
      equipos: normalizarEquiposApiFootball(tablaResponse),
      campeones: normalizarCampeonesApiFootball(ligaResponse)
    };
    guardarDatosCache(claveCache, datos);
    return datos;
  });
}

async function buscarLigaApiFootball(nombre, pais, apiKey) {
  if (!nombre) return null;

  const response = await axios.get('https://v3.football.api-sports.io/leagues', {
    headers: { 'x-apisports-key': apiKey },
    params: { search: nombre, country: pais }
  });

  const resultados = response.data?.response || [];
  const nombreNormalizado = nombre.toLowerCase();
  const resultadoExacto = resultados.find((item) =>
    item.league?.name?.toLowerCase() === nombreNormalizado
  );

  return resultadoExacto?.league?.id || resultados[0]?.league?.id || null;
}

async function obtenerPartidosApiFootballPorId(ligaApi, apiKey) {
  return obtenerDatosApiFootballPorId(ligaApi, apiKey);
}

app.get('/api/partidos/:partidoId/alineaciones', async (req, res) => {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return res.status(503).json({ mensaje: 'Las alineaciones necesitan API_FOOTBALL_KEY.' });
  }

  try {
    const configuracion = { headers: { 'x-apisports-key': apiKey } };
    const fixtureResponse = await axios.get('https://v3.football.api-sports.io/fixtures', {
      ...configuracion,
      params: { id: req.params.partidoId }
    });
    const partido = fixtureResponse.data?.response?.[0];
    if (!partido) return res.status(404).json({ mensaje: 'No se encontró el partido.' });

    const ventanaAlineacion = evaluarVentanaAlineacion(partido);
    if (!ventanaAlineacion.puedeConsultar) {
      return res.json({
        equipos: [],
        alineacionEstado: 'esperando',
        alineacionDisponibleDesde: ventanaAlineacion.fechaDisponible
      });
    }

    const claveCache = `alineacion-${req.params.partidoId}`;
    const datoGuardado = leerCache(claveCache, DURACION_CACHE.alineaciones);
    if (datoGuardado) return res.json(datoGuardado);

    let equipos = [];
    try {
      const response = await axios.get('https://v3.football.api-sports.io/fixtures/lineups', {
        ...configuracion,
        params: { fixture: req.params.partidoId }
      });

      if (response.data?.errors && Object.keys(response.data.errors).length > 0) {
        throw new Error(JSON.stringify(response.data.errors));
      }

      equipos = (response.data?.response || []).map((equipo) => ({
        equipo: equipo.team?.name || 'Equipo',
        logo: equipo.team?.logo || '',
        titulares: (equipo.startXI || []).map(({ player }) => ({
          nombre: player?.name || 'Jugador',
          numero: player?.number || '',
          posicion: player?.pos || ''
        })),
        suplentes: (equipo.substitutes || []).map(({ player }) => ({
          nombre: player?.name || 'Jugador',
          numero: player?.number || '',
          posicion: player?.pos || ''
        }))
      }));
    } catch {
      // Si la API principal no responde, se intenta Sofascore como respaldo real.
      const equipoFallback = await obtenerLineupsDesdeSofascore(partido);
      equipos = equipoFallback.map((equipo) => ({
        equipo: equipo.team?.name || 'Equipo',
        logo: equipo.team?.logo || '',
        titulares: (equipo.startXI || []).map((jugador) => ({
          nombre: jugador?.player?.name || 'Jugador',
          numero: jugador?.player?.number || '',
          posicion: jugador?.player?.pos || ''
        })),
        suplentes: (equipo.substitutes || []).map((jugador) => ({
          nombre: jugador?.player?.name || 'Jugador',
          numero: jugador?.player?.number || '',
          posicion: jugador?.player?.pos || ''
        }))
      }));
    }

    const datos = {
      equipos,
      alineacionEstado: equipos.length ? 'disponible' : 'no_publicada',
      alineacionDisponibleDesde: ventanaAlineacion.fechaDisponible
    };
    guardarDatosCache(claveCache, datos);
    res.json(datos);
  } catch (error) {
    console.error('Error consultando alineaciones:', error.response?.data || error.message);
    res.status(error.response?.status || 502).json({
      mensaje: 'Las alineaciones todavía no están confirmadas o el proveedor no está disponible.'
    });
  }
});

app.get('/api/partidos/:partidoId/detalle', limitarSolicitudes, async (req, res) => {
  const apiKey = process.env.API_FOOTBALL_KEY;
  const apiKeyFootballData = process.env.FOOTBALL_DATA_API_KEY;
  const detalleFootballData = req.query.proveedor === 'football-data' && apiKeyFootballData;
  if (!apiKey && !detalleFootballData) {
    return res.status(503).json({ mensaje: 'Configura un proveedor de partidos en el backend para abrir los detalles.' });
  }
  const claveCache = `partido-detalle-${req.params.partidoId}-${req.query.proveedor || 'api-football'}-v3`;
  const cacheado = req.query.refresh === '1' ? null : leerCachePartidos(claveCache);
  if (cacheado) return res.json(cacheado);
  try {
    if (detalleFootballData) {
      const response = await axios.get(`https://api.football-data.org/v4/matches/${req.params.partidoId}`, {
        headers: { 'X-Auth-Token': apiKeyFootballData }
      });
      const partido = normalizarPartidoFootballData(response.data, response.data.competition);
      let alineacionesReales = [];
      let fixtureApi = null;
      if (apiKey) {
        try {
          const fecha = partido.fechaISO;
          const fixtureResponse = await axios.get('https://v3.football.api-sports.io/fixtures', {
            headers: { 'x-apisports-key': apiKey },
            params: { date: fecha }
          });
          fixtureApi = (fixtureResponse.data?.response || []).find((item) =>
            normalizarNombreClub(item.teams?.home?.name) === normalizarNombreClub(partido.local) &&
            normalizarNombreClub(item.teams?.away?.name) === normalizarNombreClub(partido.visitante)
          );
        } catch (errorAlineaciones) {
          console.warn('No se pudo resolver el partido para consultar alineaciones:', errorAlineaciones.response?.data || errorAlineaciones.message);
        }
      }

      const ventanaAlineacion = evaluarVentanaAlineacion(
        fixtureApi || response.data,
        partido.fechaUtc,
        response.data.status
      );
      if (fixtureApi?.fixture?.id && ventanaAlineacion.puedeConsultar) {
        try {
          const alineacionResponse = await axios.get('https://v3.football.api-sports.io/fixtures/lineups', {
            headers: { 'x-apisports-key': apiKey },
            params: { fixture: fixtureApi.fixture.id }
          });
          alineacionesReales = alineacionResponse.data?.response || [];
        } catch (errorAlineaciones) {
          console.warn('No se pudieron consultar alineaciones oficiales:', errorAlineaciones.response?.data || errorAlineaciones.message);
        }
      }
      const alineacionEstado = alineacionesReales.length
        ? 'disponible'
        : ventanaAlineacion.puedeConsultar ? 'no_publicada' : 'esperando';
      const datos = {
        partido: fixtureApi || { teams: { home: { name: partido.local, crest: partido.logoLocal }, away: { name: partido.visitante, crest: partido.logoVisitante } }, goals: { home: response.data.score?.fullTime?.home, away: response.data.score?.fullTime?.away }, fixture: { date: partido.fechaUtc, status: { long: partido.estadoPartido, short: response.data.status } } },
        eventos: [],
        estadisticas: [],
        alineaciones: alineacionesReales,
        alineacionEstado,
        alineacionDisponibleDesde: ventanaAlineacion.fechaDisponible
      };
      guardarDatosCache(claveCache, datos);
      return res.json(datos);
    }
    const configuracion = { headers: { 'x-apisports-key': apiKey } };
    const fixture = await axios.get('https://v3.football.api-sports.io/fixtures', {
      ...configuracion,
      params: { id: req.params.partidoId }
    });
    const partido = fixture.data?.response?.[0] || null;
    const ventanaAlineacion = evaluarVentanaAlineacion(partido);
    const solicitudAlineaciones = ventanaAlineacion.puedeConsultar
      ? axios.get('https://v3.football.api-sports.io/fixtures/lineups', {
        ...configuracion,
        params: { fixture: req.params.partidoId }
      })
      : Promise.resolve({ data: { response: [] } });
    const [eventos, estadisticas, alineaciones] = await Promise.allSettled([
      axios.get('https://v3.football.api-sports.io/fixtures/events', { ...configuracion, params: { fixture: req.params.partidoId } }),
      axios.get('https://v3.football.api-sports.io/fixtures/statistics', { ...configuracion, params: { fixture: req.params.partidoId } }),
      solicitudAlineaciones
    ]);
    let alineacionesReales = alineaciones.status === 'fulfilled' ? alineaciones.value.data?.response || [] : [];
    const datosGuardados = leerCache(claveCache, DURACION_CACHE.partidos) || leerCache(claveCache, DURACION_CACHE.alineaciones) || null;

    if (!alineacionesReales.length && partido) {
      try {
        const respaldoSofascore = await obtenerLineupsDesdeSofascore(partido);
        if (respaldoSofascore.length) alineacionesReales = respaldoSofascore;
      } catch {
        // Si Sofascore no devuelve datos, se conserva la política de no inventar.
      }
    }

    const alineacionesFinales = debeMantenerAlineacionesGuardadas(partido, datosGuardados)
      ? datosGuardados.alineaciones
      : alineacionesReales;
    const estadoAlineacion = alineacionesFinales.length
      ? 'disponible'
      : ventanaAlineacion.puedeConsultar ? 'no_publicada' : 'esperando';
    const datos = {
      partido,
      eventos: eventos.status === 'fulfilled' ? eventos.value.data?.response || [] : [],
      estadisticas: estadisticas.status === 'fulfilled' ? estadisticas.value.data?.response || [] : [],
      alineaciones: alineacionesFinales,
      alineacionEstado: estadoAlineacion,
      alineacionDisponibleDesde: ventanaAlineacion.fechaDisponible
    };
    guardarDatosCache(claveCache, datos);
    res.json(datos);
  } catch (error) {
    console.error('Error consultando detalle del partido:', error.response?.data || error.message);
    res.status(502).json({ mensaje: 'No se pudo cargar el detalle real del partido.' });
  }
});

app.get('/api/equipos/:equipoId', limitarSolicitudes, async (req, res) => {
  const apiKey = process.env.API_FOOTBALL_KEY;
  const ligaApi = competenciasApiFootball[String(req.query.liga)];
  const codigoFootballData = competenciasFootballData[String(req.query.liga)];
  const apiKeyFootballData = process.env.FOOTBALL_DATA_API_KEY;
  const temporada = process.env.API_FOOTBALL_SEASON || new Date().getUTCFullYear();

  if (!apiKey || !ligaApi || req.query.proveedor === 'football-data') {
    if (!codigoFootballData || !apiKeyFootballData) {
      return res.status(503).json({
        mensaje: 'No hay una fuente de datos configurada para los clubes de esta competición. Configura API_FOOTBALL_KEY o FOOTBALL_DATA_API_KEY en el backend.'
      });
    }

    const nombreEquipo = String(req.query.nombre || '').trim();
    const claveCacheFootballData = `equipo-football-data-${req.params.equipoId}-${codigoFootballData}-${temporada}-v1`;
    const cacheFootballData = leerCache(claveCacheFootballData, DURACION_CACHE.catalogo);
    if (cacheFootballData) return res.json(cacheFootballData);

    const configuracion = { headers: { 'X-Auth-Token': apiKeyFootballData }, timeout: 15000 };
    try {
      const [equipoResultado, partidosResultado, tablaResultado] = await Promise.allSettled([
        axios.get(`https://api.football-data.org/v4/teams/${req.params.equipoId}`, configuracion),
        axios.get(`https://api.football-data.org/v4/teams/${req.params.equipoId}/matches`, {
          ...configuracion,
          params: { competitions: codigoFootballData, season: temporada, limit: 100 }
        }),
        axios.get(`https://api.football-data.org/v4/competitions/${codigoFootballData}/standings`, {
          ...configuracion,
          params: { season: temporada }
        })
      ]);

      if (equipoResultado.status === 'rejected') throw equipoResultado.reason;

      const equipo = equipoResultado.value.data;
      const partidos = partidosResultado.status === 'fulfilled'
        ? (partidosResultado.value.data?.matches || []).map((partido) =>
          normalizarPartidoFootballData(partido, partido.competition)
        )
        : [];
      const filasTabla = tablaResultado.status === 'fulfilled'
        ? tablaResultado.value.data?.standings?.[0]?.table || []
        : [];
      const filaTabla = filasTabla.find((fila) => String(fila.team?.id) === String(req.params.equipoId)) || null;
      const plantilla = Array.isArray(equipo.squad) ? equipo.squad : [];
      const plantel = plantilla.map((jugador) => ({
        id: jugador.id,
        nombre: jugador.name || 'Jugador',
        foto: '',
        edad: null,
        posicion: jugador.position || 'Jugador',
        numero: jugador.shirtNumber || '',
        goles: 0,
        asistencias: 0,
        amarillas: 0,
        rojas: 0
      }));

      const datos = {
        equipo: {
          id: equipo.id,
          nombre: equipo.name || nombreEquipo || 'Equipo',
          logo: equipo.crest || '',
          apodo: equipo.tla || '',
          fundacion: equipo.founded || null,
          estadio: equipo.venue || 'Estadio no disponible',
          ciudad: equipo.address || '',
          direccion: equipo.address || '',
          capacidad: null,
          superficie: equipo.clubColors || ''
        },
        tabla: filaTabla ? {
          j: filaTabla.playedGames || 0,
          ganados: filaTabla.won || 0,
          empatados: filaTabla.draw || 0,
          perdidos: filaTabla.lost || 0,
          golesFavor: filaTabla.goalsFor || 0,
          golesContra: filaTabla.goalsAgainst || 0
        } : null,
        estadisticas: filaTabla ? {
          partidosJugados: filaTabla.playedGames || 0,
          ganados: filaTabla.won || 0,
          empatados: filaTabla.draw || 0,
          perdidos: filaTabla.lost || 0,
          golesFavor: filaTabla.goalsFor || 0,
          golesContra: filaTabla.goalsAgainst || 0
        } : null,
        plantel,
        lideres: { goleadores: [], asistencias: [], amarillas: [], rojas: [] },
        historial: [],
        proximos: partidos.filter((partido) => !partido.finalizado),
        resultados: partidos.filter((partido) => partido.finalizado)
      };
      guardarDatosCache(claveCacheFootballData, datos);
      return res.json(datos);
    } catch (error) {
      console.error('Error consultando club en football-data:', error.response?.data || error.message);
      return res.status(error.response?.status || 502).json({
        mensaje: 'No se pudo cargar el club desde football-data. Comprueba que la clave tenga acceso a esta competición.'
      });
    }
  }

  const nombreCache = String(req.query.nombre || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const claveCache = `equipo-${req.params.equipoId}-${nombreCache}-${ligaApi}-${temporada}-v6`;
  const cacheado = leerCache(claveCache, DURACION_CACHE.catalogo);
  if (cacheado) return res.json(cacheado);

  try {
    let datosLiga;
    try {
      datosLiga = await obtenerDatosApiFootballPorId(ligaApi, apiKey);
    } catch (errorApiFootball) {
      const codigo = competenciasFootballData[String(req.query.liga)];
      if (!codigo || !process.env.FOOTBALL_DATA_API_KEY) throw errorApiFootball;
      const configuracionFootballData = { headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY } };
      const [partidosResponse, tablaResponse] = await Promise.all([
        axios.get(`https://api.football-data.org/v4/competitions/${codigo}/matches`, configuracionFootballData),
        axios.get(`https://api.football-data.org/v4/competitions/${codigo}/standings`, configuracionFootballData)
      ]);
      const partidos = (partidosResponse.data?.matches || []).map((partido) => ({
        id: partido.id,
        idLocal: partido.homeTeam?.id,
        idVisitante: partido.awayTeam?.id,
        local: partido.homeTeam?.name || 'Local',
        visitante: partido.awayTeam?.name || 'Visitante',
        logoLocal: partido.homeTeam?.crest || '',
        logoVisitante: partido.awayTeam?.crest || '',
        marcador: partido.score?.fullTime?.home !== null && partido.score?.fullTime?.home !== undefined && partido.score?.fullTime?.away !== null && partido.score?.fullTime?.away !== undefined ? `${partido.score.fullTime.home} - ${partido.score.fullTime.away}` : 'VS',
        finalizado: partido.status === 'FINISHED',
        fechaUtc: partido.utcDate,
        fechaISO: partido.utcDate?.slice(0, 10),
        fechaTexto: formatearFechaEspanol(partido.utcDate),
        hora: formatearHora(partido.utcDate)
      }));
      const tabla = (tablaResponse.data?.standings?.[0]?.table || []).map((fila) => ({
        id: fila.team?.id,
        equipo: fila.team?.name || 'Equipo',
        logo: fila.team?.crest || '',
        j: fila.playedGames || 0,
        pts: fila.points || 0
      }));
      datosLiga = { partidos, tabla };
    }
    let fichaFootballData = null;
    if (req.query.proveedor === 'football-data' && codigoFootballData && apiKeyFootballData) {
      try {
        const fichaResponse = await axios.get(`https://api.football-data.org/v4/teams/${req.params.equipoId}`, {
          headers: { 'X-Auth-Token': apiKeyFootballData }
        });
        if (fichaResponse.data?.name) fichaFootballData = fichaResponse.data;
      } catch (errorFicha) {
        console.warn('No se pudo cargar la plantilla de football-data:', errorFicha.response?.data || errorFicha.message);
      }
    }
    const nombreSolicitado = String(req.query.nombre || '').toLowerCase();
    const nombreClubNormalizado = normalizarNombreClub(req.query.nombre);
    let idApiFootball = req.params.equipoId;
    if (nombreSolicitado) {
      const claveMapaClub = `mapa-club-${req.query.liga}-${nombreCache}`;
      const mapaGuardado = leerCache(claveMapaClub, DURACION_CACHE.catalogo);
      if (mapaGuardado) {
        idApiFootball = mapaGuardado.id;
      } else {
        try {
          const busquedaClub = await axios.get('https://v3.football.api-sports.io/teams', {
            headers: { 'x-apisports-key': apiKey },
            params: { search: req.query.nombre }
          });
          const candidatos = busquedaClub.data?.response || [];
          const encontrado = candidatos.find((item) => normalizarNombreClub(item.team?.name) === nombreClubNormalizado) ||
            candidatos.find((item) => normalizarNombreClub(item.team?.name).includes(nombreClubNormalizado) || nombreClubNormalizado.includes(normalizarNombreClub(item.team?.name)));
          if (encontrado?.team?.id) {
            idApiFootball = encontrado.team.id;
            guardarDatosCache(claveMapaClub, { id: idApiFootball });
          }
        } catch (errorBusqueda) {
          console.warn('No se pudo resolver el ID de API-Football:', errorBusqueda.response?.data || errorBusqueda.message);
        }
      }
    }
    const [equipoResponse, estadisticasResponse, jugadoresResponse, plantillaResponse, trofeosResponse] = await Promise.allSettled([
      axios.get('https://v3.football.api-sports.io/teams', {
        headers: { 'x-apisports-key': apiKey },
        params: { id: idApiFootball }
      }),
      axios.get('https://v3.football.api-sports.io/teams/statistics', {
        headers: { 'x-apisports-key': apiKey },
        params: { team: idApiFootball, league: ligaApi, season: temporada }
      }),
      axios.get('https://v3.football.api-sports.io/players', {
        headers: { 'x-apisports-key': apiKey },
        params: { team: idApiFootball, league: ligaApi, season: temporada, page: 1 }
      }),
      axios.get('https://v3.football.api-sports.io/players/squads', {
        headers: { 'x-apisports-key': apiKey },
        params: { team: idApiFootball }
      }),
      axios.get('https://v3.football.api-sports.io/trophies', {
        headers: { 'x-apisports-key': apiKey },
        params: { team: idApiFootball }
      })
    ]);

    const partidosEquipo = datosLiga.partidos.filter((partido) =>
      String(partido.idLocal) === String(req.params.equipoId) || String(partido.idVisitante) === String(req.params.equipoId) ||
      partido.local?.toLowerCase() === nombreSolicitado || partido.visitante?.toLowerCase() === nombreSolicitado
    );
    const resultados = partidosEquipo.filter((partido) => partido.finalizado);
    const proximos = partidosEquipo.filter((partido) => !partido.finalizado);
    const filaTabla = datosLiga.tabla.find((fila) => String(fila.id) === String(req.params.equipoId) || fila.equipo?.toLowerCase() === nombreSolicitado);
    let equipoApi = fichaFootballData
      ? null
      : (equipoResponse.status === 'fulfilled' ? equipoResponse.value.data?.response?.[0] : null);
    const estadisticas = estadisticasResponse.status === 'fulfilled' ? estadisticasResponse.value.data?.response : null;
    const jugadoresTemporada = fichaFootballData ? [] : (jugadoresResponse.status === 'fulfilled' ? jugadoresResponse.value.data?.response || [] : []);
    const jugadoresPlantilla = plantillaResponse.status === 'fulfilled' ? plantillaResponse.value.data?.response?.[0]?.players || [] : [];
    const jugadoresFootballData = fichaFootballData?.squad || [];
    const trofeos = trofeosResponse.status === 'fulfilled' ? trofeosResponse.value.data?.response || [] : [];
    const jugadores = jugadoresTemporada.length > 0
      ? jugadoresTemporada
      : jugadoresPlantilla.length > 0
        ? jugadoresPlantilla.map((jugador) => ({ player: jugador, statistics: [{}] }))
        : jugadoresFootballData.map((jugador) => ({ player: jugador, statistics: [{}] }));
    const partidoConEquipo = partidosEquipo.find((partido) => String(partido.idLocal) === String(req.params.equipoId) || String(partido.idVisitante) === String(req.params.equipoId) || partido.local?.toLowerCase() === nombreSolicitado || partido.visitante?.toLowerCase() === nombreSolicitado);
    const equipoEsLocal = partidoConEquipo && (String(partidoConEquipo.idLocal) === String(req.params.equipoId) || partidoConEquipo.local?.toLowerCase() === nombreSolicitado);
    const nombreEquipo = filaTabla?.equipo || (equipoEsLocal ? partidoConEquipo?.local : partidoConEquipo?.visitante);
    const logoEquipo = filaTabla?.logo || (equipoEsLocal ? partidoConEquipo?.logoLocal : partidoConEquipo?.logoVisitante);
    if (!equipoApi?.team && partidoConEquipo && process.env.FOOTBALL_DATA_API_KEY) {
      const idFootballData = equipoEsLocal ? partidoConEquipo.idLocal : partidoConEquipo.idVisitante;
      if (idFootballData) {
        try {
          const ficha = await axios.get(`https://api.football-data.org/v4/teams/${idFootballData}`, {
            headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY }
          });
          const fichaEquipo = ficha.data;
          equipoApi = {
            team: { id: req.params.equipoId, name: fichaEquipo.name, logo: fichaEquipo.crest, founded: fichaEquipo.founded, code: fichaEquipo.tla },
            venue: { name: fichaEquipo.venue, city: fichaEquipo.address, address: fichaEquipo.address, capacity: fichaEquipo.capacity, surface: fichaEquipo.clubColors }
          };
        } catch (errorFicha) {
          console.warn('No se pudo cargar la ficha del club:', errorFicha.response?.data || errorFicha.message);
        }
      }
    }
    if (!equipoApi?.team && !nombreEquipo) throw new Error('Club no encontrado');
    const plantel = jugadores.map((item) => {
      const estadistica = item.statistics?.[0] || {};
      return {
        id: item.player?.id,
        nombre: item.player?.name || 'Jugador',
        foto: item.player?.photo || '',
        edad: item.player?.age || null,
        nacimiento: item.player?.birth?.date || '',
        posicion: estadistica.games?.position || item.player?.position || 'Jugador',
        numero: estadistica.games?.number || '',
        altura: item.player?.height || '',
        goles: estadistica.goals?.total || 0,
        asistencias: estadistica.goals?.assists || 0,
        amarillas: estadistica.cards?.yellow || 0,
        rojas: estadistica.cards?.red || 0
      };
    });
    const ordenarJugadores = (campo) => plantel.filter((jugador) => jugador[campo] > 0).sort((a, b) => b[campo] - a[campo]).slice(0, 10);
    const datos = {
      equipo: {
        id: equipoApi?.team?.id || Number(req.params.equipoId),
        nombre: equipoApi?.team?.name || fichaFootballData?.name || nombreEquipo,
        logo: equipoApi?.team?.logo || fichaFootballData?.crest || logoEquipo || '',
        apodo: equipoApi?.team?.code || '',
        fundacion: equipoApi?.team?.founded || null,
        estadio: equipoApi?.venue?.name || fichaFootballData?.venue || 'Estadio no disponible',
        ciudad: equipoApi?.venue?.city || '',
        direccion: equipoApi?.venue?.address || fichaFootballData?.address || '',
        capacidad: equipoApi?.venue?.capacity || fichaFootballData?.capacity || null,
        superficie: equipoApi?.venue?.surface || ''
      },
      tabla: filaTabla || null,
      estadisticas: estadisticas ? {
        partidosJugados: estadisticas.fixtures?.played?.total || filaTabla?.j || 0,
        ganados: estadisticas.fixtures?.wins?.total || 0,
        empatados: estadisticas.fixtures?.draws?.total || 0,
        perdidos: estadisticas.fixtures?.loses?.total || 0,
        golesFavor: estadisticas.goals?.for?.total?.total || 0,
        golesContra: estadisticas.goals?.against?.total?.total || 0
      } : null,
      plantel,
      lideres: {
        goleadores: ordenarJugadores('goles'),
        asistencias: ordenarJugadores('asistencias'),
        amarillas: ordenarJugadores('amarillas'),
        rojas: ordenarJugadores('rojas')
      },
      historial: trofeos.map((trofeo) => ({
        competencia: trofeo.league || trofeo.name || 'Competición',
        temporada: trofeo.season || '',
        subcampeon: trofeo.runnerUp || ''
      })),
      proximos,
      resultados
    };
    guardarDatosCache(claveCache, datos);
    return res.json(datos);
  } catch (error) {
    console.error('Error consultando club:', error.response?.data || error.message);
    return res.status(error.response?.status || 502).json({ mensaje: 'No se pudo cargar la información real del club.' });
  }
});

app.get('/api/agenda-del-dia', limitarSolicitudes, async (_req, res) => {
  try {
    const agenda = await obtenerAgendaPublica();
    return res.json(agenda);
  } catch (error) {
    console.error('Error consultando agenda pública:', error.response?.status || error.message);
    return res.status(502).json({ mensaje: 'No se pudo actualizar la agenda del día.' });
  }
});

app.get('/api/partidos', limitarSolicitudes, async (req, res) => {
  try {
    const ligaIngresada = req.query.liga;

    if (!ligaIngresada || ligaIngresada === 'undefined') {
      const fecha = String(req.query.fecha || new Date().toISOString().slice(0, 10));
      const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(fecha) &&
        !Number.isNaN(Date.parse(`${fecha}T00:00:00Z`)) &&
        new Date(`${fecha}T00:00:00Z`).toISOString().slice(0, 10) === fecha;
      if (!fechaValida) {
        return res.status(400).json({ mensaje: 'La fecha debe tener el formato AAAA-MM-DD.' });
      }

      const consultaCalendario = req.query.fecha !== undefined;
      const claveCalendario = `calendario-v3-${fecha}`;
      const partidosGuardados = leerCache(claveCalendario, DURACION_CACHE.partidos);
      if (partidosGuardados) return res.json(consultaCalendario ? partidosGuardados : partidosGuardados.partidos);

      const resultado = await obtenerPartidosPorFecha(
        fecha,
        process.env.API_FOOTBALL_KEY,
        process.env.FOOTBALL_DATA_API_KEY
      );
      guardarDatosCache(claveCalendario, resultado);
      return res.json(consultaCalendario ? resultado : resultado.partidos);
    }

    const apiFootballKey = process.env.API_FOOTBALL_KEY;
    if (apiFootballKey) {
      try {
        const partidosApiFootball = await obtenerPartidosApiFootball(ligaIngresada, apiFootballKey);
        if (partidosApiFootball) return res.json(partidosApiFootball);

        const ligaApi = await buscarLigaApiFootball(
          req.query.nombre,
          req.query.pais,
          apiFootballKey
        );
        if (ligaApi) return res.json(await obtenerPartidosApiFootballPorId(ligaApi, apiFootballKey));
      } catch (errorApiFootball) {
        const limiteAlcanzado = errorApiFootball.response?.data?.errors?.rateLimit ||
          errorApiFootball.response?.data?.rateLimit;
        const temporadaNoDisponible = JSON.stringify(errorApiFootball.response?.data || errorApiFootball.message || '')
          .includes('Free plans do not have access to this season');
        const tieneFallbackActual = Boolean(competenciasFootballData[String(ligaIngresada)] && process.env.FOOTBALL_DATA_API_KEY);
        if ((!limiteAlcanzado && !temporadaNoDisponible) || !tieneFallbackActual) {
          throw errorApiFootball;
        }
      }
    }

    const codigoFootballData = competenciasFootballData[String(ligaIngresada)];
    if (competenciasApiFootball[String(ligaIngresada)] && !apiFootballKey && !codigoFootballData) {
      return res.status(500).json({
        error: "API_FOOTBALL_KEY_FALTANTE",
        mensaje: "Süper Lig necesita API_FOOTBALL_KEY en Backend/.env porque football-data.org no ofrece esta competición."
      });
    }

    const apiKey = process.env.FOOTBALL_DATA_API_KEY;

    const ligaId = competenciasFootballData[String(ligaIngresada)] || String(ligaIngresada).toUpperCase();

    // Evita consultar códigos inventados: el frontend puede seguir mostrando
    // toda la navegación, pero esta fuente solo ofrece algunas competencias.
    const codigoValido = codigosFootballData.has(ligaId);

    if (!codigoValido) {
      return res.status(422).json({
        error: "COMPETENCIA_NO_DISPONIBLE",
        mensaje: "Esta competencia necesita un proveedor de datos compatible.",
        liga: ligaIngresada
      });
    }

    if (!apiKey) {
      return res.status(500).json({
        error: "API_KEY_FALTANTE",
        mensaje: "Configura FOOTBALL_DATA_API_KEY en Backend/.env"
      });
    }

    const urlApi = `https://api.football-data.org/v4/competitions/${ligaId}/matches`;
    const claveCache = `football-data-${ligaId}-jornadas-v6`;
    const datoGuardado = leerCachePartidos(claveCache);
    if (datoGuardado) return res.json(datoGuardado);

    const configuracion = {
      headers: { 'X-Auth-Token': apiKey }
    };
    const [response, standingsResponse, competitionResponse] = await Promise.all([
      axios.get(urlApi, configuracion),
      axios.get(`https://api.football-data.org/v4/competitions/${ligaId}/standings`, configuracion),
      axios.get(`https://api.football-data.org/v4/competitions/${ligaId}`, configuracion)
    ]);

    const matches = response.data.matches || [];

    const partidosMap = matches.map((m) => {
      let marcadorFinal = "VS";
      const homeScore = m.score?.fullTime?.home;
      const awayScore = m.score?.fullTime?.away;

      if (homeScore !== null && homeScore !== undefined && awayScore !== null && awayScore !== undefined) {
        marcadorFinal = `${homeScore} - ${awayScore}`;
      }

      return {
        id: m.id,
        idLocal: m.homeTeam?.id || null,
        idVisitante: m.awayTeam?.id || null,
        local: m.homeTeam?.name || "Local",
        logoLocal: m.homeTeam?.crest || "https://crests.football-data.org/764.svg",
        visitante: m.awayTeam?.name || "Visitante",
        logoVisitante: m.awayTeam?.crest || "https://crests.football-data.org/764.svg",
        marcador: marcadorFinal,
        jornada: m.matchday || null,
        finalizado: partidoFinalizado(m.status, homeScore, awayScore),
        proveedor: 'football-data',
        fechaISO: m.utcDate?.slice(0, 10),
        fechaUtc: m.utcDate,
        fechaTexto: formatearFechaEspanol(m.utcDate),
        hora: formatearHora(m.utcDate),
        estadoPartido: traducirEstado(m.status),
        liga: response.data.competition?.name || "Competición",
        logoLiga: response.data.competition?.emblem || "https://crests.football-data.org/CL.svg",
        pais: response.data.area?.name || "Internacional",
        streamUrl: "https://www.youtube.com/embed/live_stream?channel=UC4i_9WvfPRTuRWEaA6BdCTw",
        stats: {
          posesion: "50% - 50%",
          remates: "0 - 0",
          tarjetasAmarillas: "0 - 0"
        }
      };
    });

    const filasTabla = standingsResponse.data?.standings?.[0]?.table || [];
    const tabla = filasTabla.map((fila) => ({
      id: fila.team?.id,
      proveedor: 'football-data',
      pos: fila.position,
      equipo: fila.team?.name || "Equipo",
      logo: fila.team?.crest || (fila.team?.id ? `https://crests.football-data.org/${fila.team.id}.svg` : ""),
      pts: fila.points ?? 0,
      j: fila.playedGames ?? 0,
      gol: `${fila.goalsFor ?? 0}:${fila.goalsAgainst ?? 0}`,
      dif: fila.goalDifference ?? 0
    })) || [];

    const equipos = filasTabla.map((fila) => ({
      id: fila.team?.id,
      proveedor: 'football-data',
      nombre: fila.team?.name || 'Equipo',
      logo: fila.team?.crest || (fila.team?.id ? `https://crests.football-data.org/${fila.team.id}.svg` : '')
    }));
    const campeones = (competitionResponse.data?.seasons || [])
      .filter((temporada) => temporada.winner?.name)
      .sort((a, b) => Number(b.startDate?.slice(0, 4)) - Number(a.startDate?.slice(0, 4)))
      .map((temporada) => ({
        temporada: temporada.startDate?.slice(0, 4),
        equipo: temporada.winner.name,
        logo: temporada.winner.crest || ''
      }));

    const datos = { partidos: partidosMap, tabla, equipos, campeones };
    guardarDatosCache(claveCache, datos);
    res.json(datos);
  } catch (error) {
    console.error("Error consultando partidos:", error.response?.data || error.message);
    const proveedorIndicaLimite = error.response?.data?.errors?.rateLimit ||
      error.response?.data?.rateLimit;
    const temporadaNoDisponible = JSON.stringify(error.response?.data || error.message || '')
      .includes('Free plans do not have access to this season');
    const claveRechazada = error.response?.data?.errors?.token ||
      error.response?.data?.token;
    res.status(error.response?.status || 502).json({
      error: temporadaNoDisponible
        ? "TEMPORADA_NO_DISPONIBLE"
        : claveRechazada
        ? "API_KEY_INVALIDA"
        : (proveedorIndicaLimite ? "LIMITE_PROVEEDOR" : "PROVEEDOR_NO_DISPONIBLE"),
      mensaje: claveRechazada
        ? "La API key de API-Football fue rechazada. Copia la clave activa desde My Access y reinicia el backend."
        : (temporadaNoDisponible
        ? "La clave gratuita no permite consultar la temporada 2026. Se necesita una clave con acceso a la temporada actual para esta competición."
        : (proveedorIndicaLimite
        ? "Se alcanzó el límite gratuito de consultas. Espera unos segundos y vuelve a intentar."
        : "No se pudieron obtener los partidos de esta competencia."))
    });
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

const frontendDist = path.join(__dirname, '..', 'Frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use('/edeargoal', express.static(frontendDist));
  app.get('/edeargoal/*', (_req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
  app.get('/', (_req, res) => res.redirect('/edeargoal/'));
}

const servidor = app.listen(PORT, () => {
  console.log(`Servidor de EdearGoal corriendo en puerto ${PORT}`);
});

servidor.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`El puerto ${PORT} ya está ocupado. El backend probablemente ya está ejecutándose.`);
    console.error(`Para liberarlo en PowerShell: Get-NetTCPConnection -LocalPort ${PORT} | Stop-Process -Id {$_.OwningProcess} -Force`);
    process.exit(1);
  }
  throw error;
});