// src/types/index.ts

export interface Stats {
  posesion: string;
  remates: string;
  tarjetasAmarillas: string;
}

export interface Partido {
  id: number;
  local: string;
  logoLocal: string;
  visitante: string;
  logoVisitante: string;
  marcador: string;
  fechaISO?: string;
  fechaUtc?: string;
  proveedor?: 'api-football' | 'football-data';
  fechaTexto: string;
  hora: string;
  estadoPartido: string;
  liga: string;
  logoLiga: string;
  pais: string;
  streamUrl: string;
  stats: Stats;
}

export interface LigaConfig {
  idLiga: number;
  nombreMostrar: string;
  paisBuscado: string;
  ligaBuscada: string;
  codigoPais: string;
  region: 'Sudamérica' | 'Internacional' | 'Europa' | 'Norteamérica' | 'Centroamérica' | 'Asia' | 'Selecciones';
}