// src/services/ligas.ts

import type { LigaConfig } from '../types';

export const listaLigas: LigaConfig[] = [
  // --- INTERNACIONAL ---
  { idLiga: 1, nombreMostrar: "UEFA Champions League", paisBuscado: "Internacional", ligaBuscada: "Champions League", codigoPais: "eu", region: "Internacional" },
  { idLiga: 2, nombreMostrar: "CONMEBOL Libertadores", paisBuscado: "Internacional", ligaBuscada: "Libertadores", codigoPais: "un", region: "Internacional" },
  { idLiga: 3, nombreMostrar: "Mundial de Clubes", paisBuscado: "Internacional", ligaBuscada: "Mundial de Clubes", codigoPais: "un", region: "Internacional" },
  { idLiga: 4, nombreMostrar: "UEFA Europa League", paisBuscado: "Internacional", ligaBuscada: "Europa League", codigoPais: "eu", region: "Internacional" },
  { idLiga: 5, nombreMostrar: "CONMEBOL Sudamericana", paisBuscado: "Internacional", ligaBuscada: "Sudamericana", codigoPais: "un", region: "Internacional" },
  { idLiga: 6, nombreMostrar: "Copa Intercontinental", paisBuscado: "Internacional", ligaBuscada: "Intercontinental", codigoPais: "un", region: "Internacional" },
  { idLiga: 7, nombreMostrar: "UEFA Conference League", paisBuscado: "Internacional", ligaBuscada: "Conference", codigoPais: "eu", region: "Internacional" },
  { idLiga: 8, nombreMostrar: "CONCACAF Champions Cup", paisBuscado: "Internacional", ligaBuscada: "CONCACAF", codigoPais: "un", region: "Internacional" },
  { idLiga: 9, nombreMostrar: "UEFA Super Cup", paisBuscado: "Internacional", ligaBuscada: "Super Cup", codigoPais: "eu", region: "Internacional" },

  // --- SUDAMÉRICA ---
  { idLiga: 10, nombreMostrar: "Liga Profesional", paisBuscado: "Argentina", ligaBuscada: "Profesional", codigoPais: "ar", region: "Sudamérica" },
  { idLiga: 11, nombreMostrar: "Copa Argentina", paisBuscado: "Argentina", ligaBuscada: "Copa Argentina", codigoPais: "ar", region: "Sudamérica" },
  { idLiga: 12, nombreMostrar: "Primera Nacional", paisBuscado: "Argentina", ligaBuscada: "Primera Nacional", codigoPais: "ar", region: "Sudamérica" },

  { idLiga: 20, nombreMostrar: "Brasileirão Série A", paisBuscado: "Brasil", ligaBuscada: "Serie A", codigoPais: "br", region: "Sudamérica" },
  { idLiga: 21, nombreMostrar: "Brasileirão Série B", paisBuscado: "Brasil", ligaBuscada: "Serie B", codigoPais: "br", region: "Sudamérica" },
  { idLiga: 22, nombreMostrar: "Copa do Brasil", paisBuscado: "Brasil", ligaBuscada: "Copa do Brasil", codigoPais: "br", region: "Sudamérica" },
  { idLiga: 23, nombreMostrar: "Campeonato Paulista", paisBuscado: "Brasil", ligaBuscada: "Paulista", codigoPais: "br", region: "Sudamérica" },
  { idLiga: 24, nombreMostrar: "Campeonato Carioca", paisBuscado: "Brasil", ligaBuscada: "Carioca", codigoPais: "br", region: "Sudamérica" },

  { idLiga: 30, nombreMostrar: "Primera A", paisBuscado: "Colombia", ligaBuscada: "Primera A", codigoPais: "co", region: "Sudamérica" },
  { idLiga: 31, nombreMostrar: "Primera B", paisBuscado: "Colombia", ligaBuscada: "Primera B", codigoPais: "co", region: "Sudamérica" },
  { idLiga: 32, nombreMostrar: "Copa Colombia", paisBuscado: "Colombia", ligaBuscada: "Copa Colombia", codigoPais: "co", region: "Sudamérica" },

  { idLiga: 40, nombreMostrar: "Primera División", paisBuscado: "Chile", ligaBuscada: "Primera División", codigoPais: "cl", region: "Sudamérica" },
  { idLiga: 41, nombreMostrar: "Primera B", paisBuscado: "Chile", ligaBuscada: "Primera B", codigoPais: "cl", region: "Sudamérica" },
  { idLiga: 42, nombreMostrar: "Copa Chile", paisBuscado: "Chile", ligaBuscada: "Copa Chile", codigoPais: "cl", region: "Sudamérica" },

  { idLiga: 50, nombreMostrar: "Primera División", paisBuscado: "Uruguay", ligaBuscada: "Primera División", codigoPais: "uy", region: "Sudamérica" },
  { idLiga: 51, nombreMostrar: "Segunda División", paisBuscado: "Uruguay", ligaBuscada: "Segunda División", codigoPais: "uy", region: "Sudamérica" },

  { idLiga: 60, nombreMostrar: "Primera División", paisBuscado: "Paraguay", ligaBuscada: "Primera División", codigoPais: "py", region: "Sudamérica" },

  { idLiga: 70, nombreMostrar: "LigaPro Serie A", paisBuscado: "Ecuador", ligaBuscada: "LigaPro", codigoPais: "ec", region: "Sudamérica" },
  { idLiga: 71, nombreMostrar: "LigaPro Serie B", paisBuscado: "Ecuador", ligaBuscada: "Serie B", codigoPais: "ec", region: "Sudamérica" },

  { idLiga: 80, nombreMostrar: "Liga 1", paisBuscado: "Perú", ligaBuscada: "Liga 1", codigoPais: "pe", region: "Sudamérica" },
  { idLiga: 81, nombreMostrar: "Liga 2", paisBuscado: "Perú", ligaBuscada: "Liga 2", codigoPais: "pe", region: "Sudamérica" },

  // --- EUROPA ---
  { idLiga: 100, nombreMostrar: "LaLiga", paisBuscado: "España", ligaBuscada: "La Liga", codigoPais: "es", region: "Europa" },
  { idLiga: 101, nombreMostrar: "LaLiga Hypermotion (Segunda)", paisBuscado: "España", ligaBuscada: "Hypermotion", codigoPais: "es", region: "Europa" },
  { idLiga: 102, nombreMostrar: "Copa del Rey", paisBuscado: "España", ligaBuscada: "Copa del Rey", codigoPais: "es", region: "Europa" },
  { idLiga: 103, nombreMostrar: "Supercopa de España", paisBuscado: "España", ligaBuscada: "Supercopa", codigoPais: "es", region: "Europa" },

  { idLiga: 110, nombreMostrar: "Premier League", paisBuscado: "Inglaterra", ligaBuscada: "Premier League", codigoPais: "gb-eng", region: "Europa" },
  { idLiga: 111, nombreMostrar: "Championship", paisBuscado: "Inglaterra", ligaBuscada: "Championship", codigoPais: "gb-eng", region: "Europa" },
  { idLiga: 112, nombreMostrar: "FA Cup", paisBuscado: "Inglaterra", ligaBuscada: "FA Cup", codigoPais: "gb-eng", region: "Europa" },
  { idLiga: 113, nombreMostrar: "EFL Cup (Carabao Cup)", paisBuscado: "Inglaterra", ligaBuscada: "EFL Cup", codigoPais: "gb-eng", region: "Europa" },
  { idLiga: 114, nombreMostrar: "Community Shield", paisBuscado: "Inglaterra", ligaBuscada: "Community Shield", codigoPais: "gb-eng", region: "Europa" },

  { idLiga: 120, nombreMostrar: "Serie A", paisBuscado: "Italia", ligaBuscada: "Serie A", codigoPais: "it", region: "Europa" },
  { idLiga: 121, nombreMostrar: "Serie B", paisBuscado: "Italia", ligaBuscada: "Serie B", codigoPais: "it", region: "Europa" },
  { idLiga: 122, nombreMostrar: "Coppa Italia", paisBuscado: "Italia", ligaBuscada: "Coppa Italia", codigoPais: "it", region: "Europa" },

  { idLiga: 130, nombreMostrar: "Bundesliga", paisBuscado: "Alemania", ligaBuscada: "Bundesliga", codigoPais: "de", region: "Europa" },
  { idLiga: 131, nombreMostrar: "2. Bundesliga", paisBuscado: "Alemania", ligaBuscada: "2. Bundesliga", codigoPais: "de", region: "Europa" },
  { idLiga: 132, nombreMostrar: "DFB-Pokal", paisBuscado: "Alemania", ligaBuscada: "DFB-Pokal", codigoPais: "de", region: "Europa" },

  { idLiga: 140, nombreMostrar: "Ligue 1", paisBuscado: "Francia", ligaBuscada: "Ligue 1", codigoPais: "fr", region: "Europa" },
  { idLiga: 141, nombreMostrar: "Ligue 2", paisBuscado: "Francia", ligaBuscada: "Ligue 2", codigoPais: "fr", region: "Europa" },
  { idLiga: 142, nombreMostrar: "Coupe de France", paisBuscado: "Francia", ligaBuscada: "Coupe de France", codigoPais: "fr", region: "Europa" },

  { idLiga: 150, nombreMostrar: "Primeira Liga", paisBuscado: "Portugal", ligaBuscada: "Primeira Liga", codigoPais: "pt", region: "Europa" },
  { idLiga: 151, nombreMostrar: "Taça de Portugal", paisBuscado: "Portugal", ligaBuscada: "Taça de Portugal", codigoPais: "pt", region: "Europa" },

  { idLiga: 160, nombreMostrar: "Eredivisie", paisBuscado: "Países Bajos", ligaBuscada: "Eredivisie", codigoPais: "nl", region: "Europa" },
  { idLiga: 170, nombreMostrar: "Süper Lig", paisBuscado: "Turquía", ligaBuscada: "Süper Lig", codigoPais: "tr", region: "Europa" },

  // --- NORTEAMÉRICA ---
  { idLiga: 200, nombreMostrar: "MLS", paisBuscado: "Estados Unidos", ligaBuscada: "MLS", codigoPais: "us", region: "Norteamérica" },
  { idLiga: 201, nombreMostrar: "US Open Cup", paisBuscado: "Estados Unidos", ligaBuscada: "US Open Cup", codigoPais: "us", region: "Norteamérica" },
  { idLiga: 205, nombreMostrar: "Liga MX", paisBuscado: "México", ligaBuscada: "Liga MX", codigoPais: "mx", region: "Norteamérica" },
  { idLiga: 206, nombreMostrar: "Liga MX Expansión", paisBuscado: "México", ligaBuscada: "Expansion", codigoPais: "mx", region: "Norteamérica" },

  // --- CENTROAMÉRICA ---
  { idLiga: 220, nombreMostrar: "Primera División", paisBuscado: "Costa Rica", ligaBuscada: "Costa Rica", codigoPais: "cr", region: "Centroamérica" },

  // --- ASIA ---
  { idLiga: 240, nombreMostrar: "Saudi Pro League", paisBuscado: "Arabia Saudita", ligaBuscada: "Saudi", codigoPais: "sa", region: "Asia" },
  { idLiga: 241, nombreMostrar: "J1 League", paisBuscado: "Japón", ligaBuscada: "J1 League", codigoPais: "jp", region: "Asia" },
  { idLiga: 242, nombreMostrar: "K League 1", paisBuscado: "Corea del Sur", ligaBuscada: "K League", codigoPais: "kr", region: "Asia" },

  // --- SELECCIONES (Cada una con su propio identificador para separarlas correctamente) ---
  { idLiga: 300, nombreMostrar: "FIFA Mundial", paisBuscado: "Mundial FIFA", ligaBuscada: "Mundial", codigoPais: "un", region: "Selecciones" },
  { idLiga: 301, nombreMostrar: "CONMEBOL Eliminatorias", paisBuscado: "Eliminatorias Sudamérica", ligaBuscada: "Eliminatorias", codigoPais: "un", region: "Selecciones" },
  { idLiga: 302, nombreMostrar: "UEFA Eliminatorias", paisBuscado: "Eliminatorias Europa", ligaBuscada: "Eliminatorias UEFA", codigoPais: "eu", region: "Selecciones" },
  { idLiga: 303, nombreMostrar: "UEFA Nations League", paisBuscado: "Nations League", ligaBuscada: "Nations League", codigoPais: "eu", region: "Selecciones" },
  { idLiga: 304, nombreMostrar: "CONMEBOL Copa America", paisBuscado: "Copa América", ligaBuscada: "Copa America", codigoPais: "ar", region: "Selecciones" },
  { idLiga: 305, nombreMostrar: "UEFA European Championship", paisBuscado: "Eurocopa", ligaBuscada: "Eurocopa", codigoPais: "eu", region: "Selecciones" }
];