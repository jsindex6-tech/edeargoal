function evaluarVentanaAlineacion(partido, fechaFallback, estadoFallback, ahora = Date.now()) {
  const estado = String(
    partido?.fixture?.status?.short || partido?.status?.short || partido?.status || estadoFallback || ''
  ).toUpperCase();
  const fechaInicio = Date.parse(partido?.fixture?.date || partido?.utcDate || fechaFallback || '');
  const finalizado = ['FT', 'AET', 'PEN', 'FINISHED', 'AWD', 'WO'].includes(estado);
  const enJuego = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'IN_PLAY'].includes(estado);
  const disponibleDesdeMs = Number.isNaN(fechaInicio) ? null : fechaInicio - 60 * 60 * 1000;
  const puedeConsultar = finalizado || enJuego || (disponibleDesdeMs !== null && ahora >= disponibleDesdeMs);

  return {
    puedeConsultar,
    fechaDisponible: disponibleDesdeMs === null ? null : new Date(disponibleDesdeMs).toISOString(),
    estado: finalizado || enJuego ? 'finalizado_o_en_juego' : puedeConsultar ? 'ventana_abierta' : 'esperando'
  };
}

function debeMantenerAlineacionesGuardadas(partido, datosGuardados, ahora = Date.now()) {
  if (!partido || !datosGuardados) return false;
  const estado = String(
    partido?.fixture?.status?.short || partido?.status?.short || partido?.status || ''
  ).toUpperCase();
  const finalizado = ['FT', 'AET', 'PEN', 'FINISHED', 'AWD', 'WO'].includes(estado);
  const tieneAlineacionesGuardadas = Array.isArray(datosGuardados?.alineaciones) && datosGuardados.alineaciones.length > 0;
  return finalizado && tieneAlineacionesGuardadas;
}

module.exports = { evaluarVentanaAlineacion, debeMantenerAlineacionesGuardadas };