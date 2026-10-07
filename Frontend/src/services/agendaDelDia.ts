import type { CanalPartido } from '../types';

export interface EventoAgenda {
  id: string;
  hora: string;
  liga: string;
  logoLiga: string;
  local: string;
  visitante: string;
}

export interface AgendaDelDia {
  fechaTexto: string;
  fechaISO: string;
  eventos: EventoAgenda[];
  actualizadaEn: string;
}

export const paisesVisitante = [
  { code: 'AR', nombre: 'Argentina' }, { code: 'AU', nombre: 'Australia' },
  { code: 'BO', nombre: 'Bolivia' }, { code: 'BR', nombre: 'Brasil' },
  { code: 'CA', nombre: 'Canadá' }, { code: 'CH', nombre: 'Suiza' },
  { code: 'CL', nombre: 'Chile' }, { code: 'CN', nombre: 'China' },
  { code: 'CO', nombre: 'Colombia' }, { code: 'DE', nombre: 'Alemania' },
  { code: 'EC', nombre: 'Ecuador' }, { code: 'EG', nombre: 'Egipto' },
  { code: 'ES', nombre: 'España' }, { code: 'FR', nombre: 'Francia' },
  { code: 'GB', nombre: 'Reino Unido' }, { code: 'IE', nombre: 'Irlanda' },
  { code: 'IN', nombre: 'India' }, { code: 'IT', nombre: 'Italia' },
  { code: 'JP', nombre: 'Japón' }, { code: 'KR', nombre: 'Corea del Sur' },
  { code: 'MX', nombre: 'México' }, { code: 'NG', nombre: 'Nigeria' },
  { code: 'NL', nombre: 'Países Bajos' }, { code: 'NZ', nombre: 'Nueva Zelanda' },
  { code: 'PE', nombre: 'Perú' }, { code: 'PY', nombre: 'Paraguay' },
  { code: 'PT', nombre: 'Portugal' }, { code: 'SE', nombre: 'Suecia' },
  { code: 'TR', nombre: 'Turquía' }, { code: 'US', nombre: 'Estados Unidos' },
  { code: 'UY', nombre: 'Uruguay' }, { code: 'ZA', nombre: 'Sudáfrica' },
];

export const detectarPaisVisitante = async (signal: AbortSignal) => {
  const respuesta = await fetch('https://ipapi.co/json/', { signal });
  if (!respuesta.ok) throw new Error('No se pudo detectar el país por IP.');
  const datos: { country_code?: string } = await respuesta.json();
  const codigo = String(datos.country_code || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(codigo)) throw new Error('El servicio no devolvió un código de país.');
  return codigo;
};

const fuente = (id: string, nombre: string, url: string, tipo: CanalPartido['tipo'], nota: string): CanalPartido => ({
  id,
  nombre,
  url,
  tipo,
  nota,
});

const normalizar = (texto: string) => texto
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

export const obtenerFuentesOficiales = (evento: EventoAgenda, pais: string): CanalPartido[] => {
  const liga = normalizar(evento.liga);
  const fuentes: CanalPartido[] = [];
  const disneyPais = pais === 'AR' ? 'https://www.disneyplus.com/es-ar' : 'https://www.disneyplus.com/es-pe';
  const tieneDisneyESPN = ['PE', 'AR'].includes(pais);

  if (/uefa|nations league/.test(liga)) {
    if (tieneDisneyESPN) {
      fuentes.push(fuente('espn-disney', 'ESPN en Disney+', disneyPais, 'canal', 'La programación oficial de ESPN en Disney+ está disponible en este país; requiere el plan correspondiente.'));
    }
    fuentes.push(fuente('uefa-fixtures', 'UEFA · calendario oficial', 'https://www.uefa.com/uefanationsleague/fixtures-results/', 'informacion', 'Calendario oficial de la competición. La señal depende de los derechos vigentes en tu país.'));
  } else if (/african|africa|caf/.test(liga)) {
    fuentes.push(fuente('caf-agenda', 'CAF · competición oficial', 'https://www.cafonline.com/afcon2025/', 'informacion', 'Calendario oficial CAF. No se encontró una señal territorial verificable para este evento.'));
  } else if (/concacaf/.test(liga)) {
    fuentes.push(fuente('concacaf-youtube', 'Concacaf en YouTube', 'https://www.youtube.com/@Concacaf', 'canal', 'Canal oficial. Algunos directos pueden estar restringidos por territorio.'));
    fuentes.push(fuente('concacaf-fixtures', 'Concacaf · calendario oficial', 'https://www.concacaf.com/competitions/nations-league/', 'informacion', 'Calendario oficial de la competición.'));
  } else if (/laliga|segunda division|hypermotion/.test(liga)) {
    if (pais === 'PE') {
      fuentes.push(fuente('espn-disney', 'ESPN en Disney+', disneyPais, 'canal', 'La ficha oficial de LaLiga identifica ESPN para Perú; requiere el plan correspondiente.'));
    }
    fuentes.push(fuente('laliga-tv', 'LaLiga · dónde ver', 'https://www.laliga.com/donde-ver-laliga-hypermotion', 'informacion', 'Consulta el operador oficial correspondiente al país seleccionado.'));
  } else if (/nfl/.test(liga)) {
    if (pais === 'US') {
      fuentes.push(fuente('nfl-watch', 'NFL · opciones para ver', 'https://www.nfl.com/watch/', 'informacion', 'La NFL publica las opciones oficiales por partido y zona.'));
    } else {
      fuentes.push(fuente('nfl-dazn', 'NFL Game Pass en DAZN', 'https://www.dazn.com/', 'canal', 'Servicio oficial de NFL Game Pass en territorios disponibles; confirma la oferta local.'));
    }
    fuentes.push(fuente('nfl-official', 'NFL · guía oficial', 'https://www.nfl.com/watch/ways-to-watch/', 'informacion', 'Guía oficial para consultar disponibilidad por país.'));
  } else if (/liga mx femenil/.test(liga)) {
    if (pais === 'MX') {
      fuentes.push(fuente('tubi-mx', 'Tubi', 'https://www.tubitv.com/', 'canal', 'La Liga MX Femenil identifica Tubi entre sus opciones; la disponibilidad depende del partido.'));
    }
    fuentes.push(fuente('liga-femenil', 'Liga MX Femenil · partidos', 'https://www.ligafemenil.mx/cancha/partidos', 'informacion', 'Consulta la ficha oficial del partido y las señales asignadas.'));
  } else if (/primera division|segunda division/.test(liga)) {
    const esParaguay = /paraguay|libertad|olimpia|recoleta|san lorenzo/i.test(`${evento.local} ${evento.visitante}`);
    if (esParaguay) {
      fuentes.push(fuente('apf', 'APF · fútbol paraguayo', 'https://www.apf.org.py/', 'informacion', 'Fuente oficial para fixture y anuncios de transmisión de la APF.'));
    } else if (/uruguay|albion|wanderers|tacuarembo|tacuaremb|paysandu/i.test(`${evento.local} ${evento.visitante}`)) {
      if (pais === 'UY') fuentes.push(fuente('auf-tv', 'AUF TV', 'https://auf.tv/', 'canal', 'Canal oficial de AUF; confirma si este partido está disponible en tu territorio.'));
      fuentes.push(fuente('auf-fixtures', 'AUF · competición oficial', 'https://www.auf.org.uy/segunda-division-profesional/', 'informacion', 'Fixture e información oficial de la AUF.'));
    } else {
      fuentes.push(fuente('liga-oficial', 'Competición · fuente oficial', 'https://www.laliga.com/', 'informacion', 'Consulta la programación y los operadores autorizados en la web oficial de la competición.'));
    }
  }

  return fuentes;
};