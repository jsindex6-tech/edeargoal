// src/types/index.ts

export interface Stats {
  posesion: string;
  remates: string;
  tarjetasAmarillas: string;
}

export interface CanalPartido {
  id: string;
  nombre: string;
  url: string;
  tipo?: 'canal' | 'informacion';
  nota?: string;
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
  canales?: CanalPartido[];
  stats: Stats;
}

export interface LigaConfig {
  idLiga: number;
  logo?: string;
  nombreMostrar: string;
  paisBuscado: string;
  ligaBuscada: string;
  codigoPais: string;
  region: 'Sudamérica' | 'Internacional' | 'Europa' | 'Norteamérica' | 'Centroamérica' | 'Asia' | 'Selecciones';
}

export interface UsuarioCuenta {
  nombre: string;
  apodo: string;
  correo: string;
  equipoFavorito: string;
  fechaUnion: string;
  condicionesAceptadasEn: string | null;
  versionCondiciones: string | null;
}
