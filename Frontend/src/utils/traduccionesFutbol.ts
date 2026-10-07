function normalizarTexto(valor: string) {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function traducirEstadoPartido(estado: string) {
  const clave = normalizarTexto(estado);
  if (/^(1h|2h|live|in_play|in play|in progress|first half|second half|en vivo)$/.test(clave)) return 'En vivo';
  if (/^(ht|halftime|half time|half-time|break|entretiempo)$/.test(clave)) return 'Entretiempo';
  if (/^(ft|finished|full time|match finished|finalizado|aet|after extra time|pen|penalties|penalty shootout)$/.test(clave)) return 'Finalizado';
  if (/^(ns|not started|scheduled|pre|tbd|time to be defined|por jugar)$/.test(clave)) return 'Por comenzar';
  if (/^(pst|postponed|match postponed)$/.test(clave)) return 'Aplazado';
  if (/^(canc|cancelled|canceled|match cancelled|match canceled)$/.test(clave)) return 'Cancelado';
  if (/^(abd|abandoned|suspended|match suspended|interrupted|int)$/.test(clave)) return 'Suspendido';
  return 'Estado no disponible';
}

export function traducirEventoPartido(evento: string) {
  const clave = normalizarTexto(evento);
  if (/own goal|autogol/.test(clave)) return 'Autogol';
  if (/missed penalty|penalty missed|penal fallado/.test(clave)) return 'Penal fallado';
  if (/penalty|penal/.test(clave)) return 'Penal';
  if (/goal|gol/.test(clave)) return 'Gol';
  if (/second yellow|yellow card|tarjeta amarilla/.test(clave)) return 'Tarjeta amarilla';
  if (/red card|tarjeta roja/.test(clave)) return 'Tarjeta roja';
  if (/substitution|sustitucion|cambio/.test(clave)) return 'Sustitución';
  if (/var|video assistant/.test(clave)) return 'Revisión del VAR';
  if (/shot|tiro/.test(clave)) return 'Tiro';
  return 'Evento del partido';
}

export function traducirEstadisticaPartido(estadistica: string) {
  const clave = normalizarTexto(estadistica).replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  const traducciones: Record<string, string> = {
    'shots on goal': 'Tiros al arco',
    'shots on target': 'Tiros al arco',
    'shots off goal': 'Tiros fuera del arco',
    'shots off target': 'Tiros fuera del arco',
    'total shots': 'Tiros totales',
    'blocked shots': 'Tiros bloqueados',
    'shots insidebox': 'Tiros dentro del área',
    'shots inside box': 'Tiros dentro del área',
    'shots outsidebox': 'Tiros fuera del área',
    'shots outside box': 'Tiros fuera del área',
    fouls: 'Faltas',
    'corner kicks': 'Tiros de esquina',
    offsides: 'Fueras de juego',
    'ball possession': 'Posesión del balón',
    'yellow cards': 'Tarjetas amarillas',
    'red cards': 'Tarjetas rojas',
    'goalkeeper saves': 'Atajadas',
    saves: 'Atajadas',
    'total passes': 'Pases totales',
    'passes accurate': 'Pases acertados',
    'passes %': 'Precisión de pases',
    'expected goals': 'Goles esperados',
    'goals prevented': 'Goles evitados',
    'big chances': 'Ocasiones claras',
    'big chances missed': 'Ocasiones claras falladas',
    'total tackles': 'Entradas totales',
    'tackles won': 'Entradas ganadas',
    'duels won': 'Duelos ganados',
    'aerial duels won': 'Duelos aéreos ganados',
    'dribbles completed': 'Regates completados',
    'throw ins': 'Saques de banda',
    'goal kicks': 'Saques de meta',
    'hit woodwork': 'Tiros al poste',
    'successful headers': 'Remates de cabeza acertados',
    'duels total': 'Duelos totales',
    'dribbles attempts': 'Regates intentados',
    'dribbles past': 'Regates superados',
    'passes': 'Pases',
    'accurate passes': 'Pases acertados',
    'shots': 'Tiros',
    'shots on target %': 'Precisión de tiros al arco',
    'total crosses': 'Centros totales',
    'accurate crosses': 'Centros acertados',
    'interceptions': 'Intercepciones',
    'clearances': 'Despejes',
    'errors leading to goal': 'Errores que terminaron en gol',
    'errors leading to shot': 'Errores que terminaron en tiro',
    'penalties': 'Penales',
    'penalties scored': 'Penales convertidos',
    'penalties missed': 'Penales fallados',
    'penalties saved': 'Penales atajados',
    'attacks': 'Ataques',
    'dangerous attacks': 'Ataques peligrosos',
    'big saves': 'Atajadas destacadas',
    'clean sheets': 'Vallas invictas'
  };
  return traducciones[clave] || (/^[\d.,%+\- ]+$/.test(estadistica) ? estadistica : 'Estadística del partido');
}

export function traducirPosicionJugador(posicion: string) {
  const clave = normalizarTexto(posicion);
  const traducciones: Record<string, string> = {
    goalkeeper: 'Portero',
    goalie: 'Portero',
    gk: 'Portero',
    defender: 'Defensa',
    d: 'Defensa',
    df: 'Defensa',
    'centre-back': 'Defensa central',
    'center-back': 'Defensa central',
    midfielder: 'Centrocampista',
    m: 'Centrocampista',
    mf: 'Centrocampista',
    forward: 'Delantero',
    f: 'Delantero',
    fw: 'Delantero',
    g: 'Portero',
    attacker: 'Delantero',
    striker: 'Delantero',
    'left winger': 'Extremo izquierdo',
    'right winger': 'Extremo derecho'
  };
  return traducciones[clave] || 'Posición no disponible';
}
