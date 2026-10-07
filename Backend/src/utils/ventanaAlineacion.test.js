const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluarVentanaAlineacion } = require('./ventanaAlineacion');

test('espera hasta exactamente una hora antes del inicio', () => {
  const inicio = Date.parse('2026-09-28T18:00:00Z');
  const partido = { fixture: { date: new Date(inicio).toISOString(), status: { short: 'NS' } } };

  assert.equal(evaluarVentanaAlineacion(partido, null, null, inicio - 60 * 60 * 1000 - 1).puedeConsultar, false);
  assert.equal(evaluarVentanaAlineacion(partido, null, null, inicio - 60 * 60 * 1000).puedeConsultar, true);
});

test('permite consultar alineaciones de partidos en juego o finalizados', () => {
  const fechaFutura = '2026-09-28T18:00:00Z';
  const partidoEnJuego = { fixture: { date: fechaFutura, status: { short: '1H' } } };
  const partidoFinalizado = { fixture: { date: fechaFutura, status: { short: 'FT' } } };

  assert.equal(evaluarVentanaAlineacion(partidoEnJuego, null, null, 0).puedeConsultar, true);
  assert.equal(evaluarVentanaAlineacion(partidoFinalizado, null, null, 0).puedeConsultar, true);
});

test('mantiene alineaciones ya guardadas para partidos finalizados', () => {
  const partido = { fixture: { date: '2026-09-28T18:00:00Z', status: { short: 'FT' } } };
  const cache = { alineacionEstado: 'disponible', alineaciones: [{ team: { name: 'Real Madrid' } }] };

  assert.equal(require('./ventanaAlineacion').debeMantenerAlineacionesGuardadas(partido, cache, 0), true);
  assert.equal(require('./ventanaAlineacion').debeMantenerAlineacionesGuardadas({ fixture: { date: '2026-09-28T18:00:00Z', status: { short: 'NS' } } }, cache, 0), false);
});