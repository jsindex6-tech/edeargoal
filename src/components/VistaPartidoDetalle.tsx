import { useEffect, useState } from 'react';

interface Props { partido: any; onRegresar: () => void }

export default function VistaPartidoDetalle({ partido, onRegresar }: Props) {
  const [datos, setDatos] = useState<any>(null);
  const [pestana, setPestana] = useState<'resumen' | 'alineacion' | 'charla'>('resumen');
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    const cargarDetalle = async () => {
      try {
        const respuesta = await fetch(`http://localhost:3001/api/partidos/${partido.id}/detalle?proveedor=${encodeURIComponent(partido.proveedor || 'api-football')}&refresh=1`);
        const contenido = await respuesta.text();
        let data: any = {};
        try { data = contenido ? JSON.parse(contenido) : {}; } catch { throw new Error('El backend no devolvió JSON. Reinicia el servidor Backend.'); }
        if (!respuesta.ok) throw new Error(data.mensaje || 'No se pudo cargar el detalle del partido');
        if (activo) { setDatos(data); setError(''); }
      } catch (err) {
        if (activo) setError(err instanceof Error ? err.message : 'No se pudo cargar el partido');
      }
    };
    cargarDetalle();
    const intervalo = window.setInterval(cargarDetalle, 15000);
    return () => { activo = false; window.clearInterval(intervalo); };
  }, [partido.id, partido.proveedor]);

  const partidoApi = datos?.partido;
  const local = partidoApi?.teams?.home?.name || partido.local;
  const visitante = partidoApi?.teams?.away?.name || partido.visitante;
  const logoLocal = partidoApi?.teams?.home?.logo || partido.logoLocal;
  const logoVisitante = partidoApi?.teams?.away?.logo || partido.logoVisitante;
  const golesLocal = partidoApi?.goals?.home ?? (partido.marcador?.split(' - ')[0] || '-');
  const golesVisitante = partidoApi?.goals?.away ?? (partido.marcador?.split(' - ')[1] || '-');
  const estadoProveedor = String(partidoApi?.fixture?.status?.long || partidoApi?.fixture?.status?.short || partido.estadoPartido || 'PARTIDO');
  const estadoActual = /half|ht|entretiempo|live|in play|en vivo/i.test(estadoProveedor) ? (/(half|ht|entretiempo)/i.test(estadoProveedor) ? 'Entretiempo' : 'En vivo') : /finished|finalizado|ft/i.test(estadoProveedor) ? 'Finalizado' : estadoProveedor;
  const minutoActual = partidoApi?.fixture?.status?.elapsed;
  const eventos = datos?.eventos || [];
  const alineaciones = datos?.alineaciones || [];
  const estadisticas = datos?.estadisticas || [];
  const colorCamiseta = (equipo: any, index: number) => equipo.team?.colors?.player?.primary || (index === 0 ? '#2563EB' : '#F8FAFC');
  const posicionesCancha = [
    { x: 8, y: 50 },
    { x: 23, y: 18 }, { x: 23, y: 39 }, { x: 23, y: 61 }, { x: 23, y: 82 },
    { x: 43, y: 25 }, { x: 43, y: 50 }, { x: 43, y: 75 },
    { x: 68, y: 22 }, { x: 68, y: 50 }, { x: 68, y: 78 }
  ];

  return (
    <div style={{ minHeight: '100%', background: '#080A0D', color: '#FFF', padding: '22px 28px 40px' }}>
      <button onClick={onRegresar} style={{ border: 0, background: 'transparent', color: '#FFF', cursor: 'pointer', fontWeight: 900, marginBottom: '22px' }}>← INICIO / PARTIDO</button>
      <div style={{ border: '1px solid rgba(255,255,255,0.12)', background: '#111', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ padding: '9px 14px', color: '#A7ADBA', fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between' }}><span>{partido.liga || 'Competición'} / Fecha {partido.jornada || '-'}</span><strong style={{ color: String(estadoActual).toLowerCase().includes('live') || String(estadoActual).toLowerCase().includes('entre') ? '#D8F95B' : '#FF91A4' }}>{estadoActual}</strong></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '25px 20px', textAlign: 'center' }}>
          <div><img src={logoLocal} alt="" style={{ width: '64px', height: '64px', objectFit: 'contain' }} /><h2 style={{ fontSize: '1rem', margin: '8px 0 0' }}>{local}</h2></div>
          <div><strong style={{ fontSize: '2.5rem', color: '#D8F95B' }}>{golesLocal} - {golesVisitante}</strong><div style={{ color: '#D8F95B', fontSize: '0.72rem', fontWeight: 900, marginTop: '5px' }}>{minutoActual ? `${minutoActual}' · ` : ''}{estadoActual}</div></div>
          <div><img src={logoVisitante} alt="" style={{ width: '64px', height: '64px', objectFit: 'contain' }} /><h2 style={{ fontSize: '1rem', margin: '8px 0 0' }}>{visitante}</h2></div>
        </div>
      </div>
      <div style={{ maxWidth: '1100px', margin: '18px auto 0', display: 'flex', gap: '28px', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
        {(['resumen', 'alineacion', 'charla'] as const).map((item) => <button key={item} onClick={() => setPestana(item)} style={{ border: 0, borderBottom: pestana === item ? '2px solid #D8F95B' : '2px solid transparent', background: 'transparent', color: pestana === item ? '#D8F95B' : '#A7ADBA', padding: '12px 4px', fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer' }}>{item === 'resumen' ? 'Resumen' : item === 'alineacion' ? 'Alineación' : 'Charla'}</button>)}
      </div>
      {error && <div style={{ maxWidth: '1100px', margin: '18px auto', color: '#FF91A4' }}>{error}</div>}
      {pestana === 'resumen' && <div style={{ maxWidth: '1100px', margin: '18px auto', display: 'grid', gap: '14px' }}>
        <section style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.1)' }}><h3 style={{ textAlign: 'center', color: '#A7ADBA', letterSpacing: '0.1em' }}>MINUTO A MINUTO</h3>{eventos.length ? eventos.map((evento: any, index: number) => <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 1fr', padding: '12px', borderTop: '1px solid rgba(255,255,255,0.07)' }}><span>{evento.detail || evento.type || 'Evento'}<small style={{ display: 'block', color: '#A7ADBA' }}>{evento.player?.name || ''}</small></span><strong style={{ textAlign: 'center', color: '#D8F95B' }}>{evento.time?.elapsed ? `${evento.time.elapsed}'` : ''}</strong><span style={{ textAlign: 'right' }}>{evento.team?.name || ''}</span></div>) : <p style={{ padding: '12px', color: '#A7ADBA' }}>No hay eventos registrados todavía.</p>}</section>
        <section style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.1)', padding: '14px' }}><h3 style={{ textAlign: 'center', color: '#A7ADBA', letterSpacing: '0.1em' }}>ESTADÍSTICAS</h3>{estadisticas.map((equipo: any, index: number) => <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '12px' }}><strong>{equipo.team?.name}</strong>{(equipo.statistics || []).map((item: any, itemIndex: number) => <div key={itemIndex} style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '7px', color: '#A7ADBA' }}><span>{item.type}</span><strong style={{ color: '#FFF' }}>{item.value ?? '-'}</strong></div>)}</div>)}</section>
      </div>}
      {pestana === 'alineacion' && (
        <div style={{ maxWidth: '1100px', margin: '18px auto', background: '#0D1117', padding: '18px', border: '1px solid rgba(98,230,255,0.18)' }}>
          <h3 style={{ color: '#62E6FF', textAlign: 'center', letterSpacing: '0.1em' }}>ALINEACIONES Y FORMACIÓN</h3>
          {alineaciones.length ? (
            <>
              {alineaciones.some((equipo: any) => equipo.provisional) && <div style={{ marginBottom: '10px', padding: '8px 10px', border: '1px solid rgba(255,207,74,0.35)', borderRadius: '6px', color: '#FFCF4A', fontSize: '0.72rem' }}>Plantilla real del club. El XI oficial todavía no fue publicado.</div>}
              <div style={{ position: 'relative', overflow: 'hidden', padding: '18px', border: '2px solid rgba(178,255,194,0.7)', borderRadius: '12px', background: 'radial-gradient(circle at 50% 50%, rgba(80,184,93,0.24), transparent 32%), repeating-linear-gradient(90deg, rgba(255,255,255,0.045) 0 9%, rgba(0,48,19,0.08) 9% 18%), linear-gradient(135deg, #17652e, #07351b 52%, #145b2a)', boxShadow: '0 12px 32px rgba(0,0,0,0.42), inset 0 0 45px rgba(0,0,0,0.25)' }}>
                <div style={{ position: 'absolute', inset: '12px', border: '2px solid rgba(229,255,231,0.48)', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '25%', bottom: '25%', left: '12px', width: '15%', border: '2px solid rgba(229,255,231,0.42)', borderLeft: 0, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '25%', bottom: '25%', right: '12px', width: '15%', border: '2px solid rgba(229,255,231,0.42)', borderRight: 0, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '38%', bottom: '38%', left: '12px', width: '5%', border: '2px solid rgba(229,255,231,0.36)', borderLeft: 0, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '38%', bottom: '38%', right: '12px', width: '5%', border: '2px solid rgba(229,255,231,0.36)', borderRight: 0, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '12px', bottom: '12px', left: '50%', borderLeft: '2px solid rgba(220,255,222,0.35)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', width: '110px', height: '110px', border: '2px solid rgba(220,255,222,0.42)', borderRadius: '50%', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', boxShadow: '0 0 24px rgba(180,255,194,0.08)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', width: '8px', height: '8px', borderRadius: '50%', background: '#D9FFDE', boxShadow: '0 0 12px #D9FFDE', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative', zIndex: 1, aspectRatio: '16 / 9', minHeight: '390px' }}>
                  {alineaciones.map((equipo: any, index: number) => {
                    const color = colorCamiseta(equipo, index);
                    const textoColor = color.toLowerCase() === '#f8fafc' || color.toLowerCase() === '#ffffff' ? '#152018' : '#FFF';
                    const jugadoresTitulares = (equipo.startXI || []).slice(0, 11);
                    return <div key={index}>
                      <div style={{ position: 'absolute', top: '10px', left: index === 0 ? '3%' : '73%', width: '24%', display: 'flex', justifyContent: 'space-between', color: '#FFF', fontSize: '0.7rem', fontWeight: 900, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}><strong>{equipo.team?.name || 'Equipo'}</strong><span style={{ color: '#E1FF73' }}>{equipo.formation || 'XI pendiente'}</span></div>
                      {jugadoresTitulares.map((jugador: any, playerIndex: number) => {
                        const base = posicionesCancha[playerIndex] || { x: 50, y: 50 };
                        const x = index === 0 ? base.x : 100 - base.x;
                        const nombre = jugador.player?.name || 'Jugador';
                        return <div key={playerIndex} title={nombre} style={{ position: 'absolute', left: `${x}%`, top: `${base.y}%`, transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '92px', color: '#FFF', fontSize: '0.58rem', fontWeight: 900, textAlign: 'center', filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.55))' }}>
                          {jugador.player?.photo ? <img src={jugador.player.photo} alt="" style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${color}`, boxShadow: `0 0 12px ${color}88` }} /> : <span style={{ width: '31px', height: '31px', display: 'grid', placeItems: 'center', borderRadius: '8px 8px 12px 12px', background: `linear-gradient(145deg, ${color}, ${color}bb)`, color: textoColor, border: '2px solid rgba(255,255,255,0.9)', boxShadow: `0 0 12px ${color}66`, fontSize: '0.58rem' }}>{jugador.player?.number || nombre.slice(0, 2).toUpperCase()}</span>}
                          <span style={{ padding: '3px 6px', borderRadius: '5px', background: 'rgba(0,0,0,0.72)', border: '1px solid rgba(255,255,255,0.12)', maxWidth: '92px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nombre}</span>
                        </div>;
                      })}
                    </div>;
                  })}
                </div>
                {alineaciones.map((equipo: any, index: number) => <div key={`subs-${index}`} style={{ marginTop: '8px', color: '#C4D2C6', fontSize: '0.65rem' }}>{equipo.team?.name}: suplentes {(equipo.substitutes || []).map((jugador: any) => jugador.player?.name).filter(Boolean).join(', ') || 'No disponibles'}</div>)}
              </div>
            </>
          ) : (
            <div style={{ padding: '26px 12px', textAlign: 'center', color: '#A7ADBA', border: '1px dashed rgba(98,230,255,0.25)', borderRadius: '8px' }}>
              <strong style={{ display: 'block', color: '#FFF', marginBottom: '8px' }}>Alineación pendiente</strong>
              Las alineaciones oficiales todavía no fueron publicadas por el proveedor para este partido. Cuando estén disponibles aparecerán aquí con sus fotos.
            </div>
          )}
        </div>
      )}
      {pestana === 'charla' && <div style={{ maxWidth: '1100px', margin: '18px auto', background: '#0D1117', padding: '24px', color: '#A7ADBA' }}>La charla del partido estará disponible para los usuarios registrados.</div>}
    </div>
  );
}
