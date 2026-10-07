const test = require('node:test');
const assert = require('node:assert/strict');
const {
  obtenerConfiguracionESPN,
  obtenerTemporadaESPN,
  normalizarPartidoESPN,
  crearTablaESPN,
  normalizarDetallePartidoESPN
} = require('./espnSoccer');

function crearEvento({ id, date, local, visitante, golesLocal, golesVisitante, state = 'post', completed = true }) {
  return {
    id,
    date,
    competitions: [{
      status: { type: { state, completed, description: completed ? 'Full Time' : 'Scheduled' } },
      competitors: [
        { homeAway: 'home', score: golesLocal, team: { id: local, displayName: `Equipo ${local}`, logos: [{ href: `https://logos.test/${local}.png` }] } },
        { homeAway: 'away', score: golesVisitante, team: { id: visitante, displayName: `Equipo ${visitante}` } }
      ]
    }]
  };
}

test('solo habilita slugs comprobados y temporada actual según el calendario de la liga', () => {
  assert.equal(obtenerConfiguracionESPN(20).slug, 'bra.1');
  assert.equal(obtenerConfiguracionESPN(304), null);
  assert.equal(obtenerTemporadaESPN(110, new Date('2026-10-06T00:00:00Z')), 2026);
  assert.equal(obtenerTemporadaESPN(110, new Date('2026-03-06T00:00:00Z')), 2025);
  assert.equal(obtenerTemporadaESPN(20, new Date('2026-03-06T00:00:00Z')), 2026);
});

test('normaliza calendario, marcador y estado del partido sin perder los ids ESPN', () => {
  const evento = crearEvento({
    id: 'match-1',
    date: '2026-10-06T20:00:00Z',
    local: '100',
    visitante: '200',
    golesLocal: '2',
    golesVisitante: '1'
  });
  const partido = normalizarPartidoESPN(evento, { name: 'Liga de prueba' }, new Map([
    ['2026-10-05', { jornada: 1, texto: 'Semana del 5 de octubre' }]
  ]));
  assert.equal(partido.id, 'match-1');
  assert.equal(partido.idLocal, '100');
  assert.equal(partido.marcador, '2 - 1');
  assert.equal(partido.finalizado, true);
  assert.equal(partido.proveedor, 'espn');
  assert.match(partido.jornadaTexto, /^Semana del /);
});

test('calcula la tabla desde partidos concluidos e ignora encuentros sin marcador', () => {
  const partidos = [
    crearEvento({ id: 1, date: '2026-01-10T15:00:00Z', local: 'a', visitante: 'b', golesLocal: '2', golesVisitante: '0' }),
    crearEvento({ id: 2, date: '2026-01-17T15:00:00Z', local: 'b', visitante: 'a', golesLocal: '1', golesVisitante: '1' }),
    crearEvento({ id: 3, date: '2026-01-24T15:00:00Z', local: 'a', visitante: 'c', golesLocal: null, golesVisitante: null, state: 'pre', completed: false }),
    crearEvento({ id: 4, date: '2026-01-25T15:00:00Z', local: 'c', visitante: 'b', golesLocal: null, golesVisitante: null, state: 'post', completed: true })
  ];
  const tabla = crearTablaESPN(partidos);
  assert.deepEqual(tabla.map((fila) => [fila.id, fila.pts, fila.j, fila.gol]), [
    ['a', 4, 2, '3:1'],
    ['b', 1, 2, '1:3']
  ]);
});

test('normaliza el resumen ESPN a eventos, estadísticas y alineaciones del detalle', () => {
  const detalle = normalizarDetallePartidoESPN({
    header: {
      competitions: [{
        date: '2026-10-06T20:00:00Z',
        status: { displayClock: "72'", type: { state: 'in', description: 'Second Half', shortDetail: '2H' } },
        competitors: [
          { homeAway: 'home', score: '1', team: { id: 'a', displayName: 'Local' } },
          { homeAway: 'away', score: '0', team: { id: 'b', displayName: 'Visitante' } }
        ]
      }]
    },
    keyEvents: [{
      text: 'Gol de Local',
      type: { text: 'Gol' },
      clock: { displayValue: "42'" },
      participants: [{ athlete: { displayName: 'Jugador' } }],
      team: { displayName: 'Local' }
    }],
    boxscore: {
      teams: [{
        team: { displayName: 'Local' },
        statistics: [{ label: 'Posesión', displayValue: '60%' }]
      }]
    },
    rosters: [{
      team: { id: 'a', displayName: 'Local' },
      formation: '4-3-3',
      roster: [
        { starter: true, jersey: '9', athlete: { id: 'p1', displayName: 'Titular' }, position: { displayName: 'Delantero' } },
        { starter: false, jersey: '10', athlete: { id: 'p2', displayName: 'Suplente' } }
      ]
    }]
  });

  assert.equal(detalle.partido.goals.home, 1);
  assert.equal(detalle.partido.fixture.status.long, 'En Vivo');
  assert.equal(detalle.eventos[0].time.elapsed, 42);
  assert.equal(detalle.estadisticas[0].statistics[0].value, '60%');
  assert.equal(detalle.alineaciones[0].startXI[0].player.name, 'Titular');
  assert.equal(detalle.alineaciones[0].substitutes[0].player.name, 'Suplente');
});
