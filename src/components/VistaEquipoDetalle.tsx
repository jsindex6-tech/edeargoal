import { useEffect, useState } from 'react';

interface Props {
  equipo: { id: number; nombre: string; logo?: string; proveedor?: string };
  ligaId: number;
  nombreLiga: string;
  onRegresar: () => void;
}

export default function VistaEquipoDetalle({ equipo, ligaId, nombreLiga, onRegresar }: Props) {
  const [datos, setDatos] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tabClub, setTabClub] = useState<'principal' | 'estadio'>('principal');
  const [liderActivo, setLiderActivo] = useState<'goleadores' | 'asistencias' | 'amarillas' | 'rojas'>('goleadores');

  useEffect(() => {
    const cargarEquipo = async () => {
      try {
        setCargando(true);
        setError('');
        const proveedor = equipo.proveedor || 'api-football';
        const respuesta = await fetch(`http://localhost:3001/api/equipos/${equipo.id}?liga=${ligaId}&nombre=${encodeURIComponent(equipo.nombre)}&proveedor=${proveedor}`);
        const resultado = await respuesta.json();
        if (!respuesta.ok) throw new Error(resultado?.mensaje || 'No se pudo cargar el club');
        setDatos(resultado);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar el club');
      } finally {
        setCargando(false);
      }
    };
    cargarEquipo();
  }, [equipo.id, equipo.nombre, equipo.proveedor, ligaId]);

  const club = datos?.equipo || equipo;
  const estadisticas = datos?.estadisticas;
  const partidos = (lista: any[]) => lista?.slice().sort((a, b) => String(a.fechaUtc || '').localeCompare(String(b.fechaUtc || ''))) || [];
  const nombrePartido = (partido: any, local: boolean) => local ? partido.local : partido.visitante;
  const logoPartido = (partido: any, local: boolean) => local ? partido.logoLocal : partido.logoVisitante;

  const tarjetaPartido = (partido: any, resultado: boolean) => {
    const esLocal = String(partido.idLocal) === String(club.id) || partido.local?.toLowerCase() === club.nombre?.toLowerCase();
    const rival = nombrePartido(partido, !esLocal);
    const logoRival = logoPartido(partido, !esLocal);
    return (
      <div key={partido.id} style={{ display: 'grid', gridTemplateColumns: '56px 28px 1fr auto', alignItems: 'center', gap: '10px', padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ color: '#A7ADBA', fontSize: '0.72rem' }}>{partido.fechaTexto || partido.fechaISO || ''}</span>
        <strong style={{ color: esLocal ? '#D8F95B' : '#FF91A4', fontSize: '0.76rem' }}>{esLocal ? 'L' : 'V'}</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFF', fontWeight: 800, minWidth: 0 }}>
          {logoRival && <img src={logoRival} alt="" style={{ width: '25px', height: '25px', objectFit: 'contain' }} />}
          <span>{rival}</span>
        </div>
        <strong style={{ color: resultado ? '#D8F95B' : '#62E6FF', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{resultado ? partido.marcador : partido.hora || 'A confirmar'}</strong>
      </div>
    );
  };

  return (
    <div style={{ width: '100%', color: '#FFF', background: '#080A0D', minHeight: '100%', padding: '20px 24px 40px', boxSizing: 'border-box' }}>
      <div style={{ color: '#A7ADBA', fontSize: '0.78rem', marginBottom: '25px' }}>
        <button onClick={onRegresar} style={{ border: 0, background: 'transparent', color: '#FFF', cursor: 'pointer', padding: 0, fontWeight: 800 }}>← INICIO</button>
        <span> / {nombreLiga} / {club.nombre}</span>
      </div>

      <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.14)', paddingBottom: '16px', marginBottom: '18px' }}>
        {club.logo && <img src={club.logo} alt={club.nombre} style={{ width: '58px', height: '58px', objectFit: 'contain', display: 'block', margin: '0 auto 8px' }} />}
        <h1 style={{ margin: 0, fontSize: 'clamp(1.45rem, 3vw, 2.1rem)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{club.nombre}</h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '28px', marginTop: '16px', fontSize: '0.76rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          <button onClick={() => setTabClub('principal')} style={{ border: 0, borderBottom: tabClub === 'principal' ? '2px solid #D8F95B' : '2px solid transparent', background: 'transparent', color: tabClub === 'principal' ? '#D8F95B' : '#7F8796', padding: '0 10px 10px', cursor: 'pointer', fontWeight: 900 }}>PRINCIPAL</button>
          <button onClick={() => setTabClub('estadio')} style={{ border: 0, borderBottom: tabClub === 'estadio' ? '2px solid #62E6FF' : '2px solid transparent', background: 'transparent', color: tabClub === 'estadio' ? '#62E6FF' : '#7F8796', padding: '0 10px 10px', cursor: 'pointer', fontWeight: 900 }}>ESTADIO</button>
        </div>
      </div>

      {cargando && <div style={{ color: '#62E6FF', padding: '20px 0' }}>Cargando información real del club...</div>}
      {error && <div style={{ color: '#FF91A4', padding: '20px 0' }}>{error}</div>}

      {!cargando && !error && (
        <>
        <div style={{ display: tabClub === 'principal' ? 'grid' : 'none', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(230px, 0.9fr)', gap: '16px' }}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <section style={{ background: '#0D1117', border: '1px solid rgba(98,230,255,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
              <h2 style={{ margin: 0, padding: '12px', textAlign: 'center', fontSize: '0.78rem', letterSpacing: '0.1em', color: '#62E6FF' }}>PRÓXIMOS PARTIDOS</h2>
              {partidos(datos?.proximos).map((partido) => tarjetaPartido(partido, false))}
              {(!datos?.proximos || datos.proximos.length === 0) && <p style={{ padding: '12px', color: '#A7ADBA' }}>No hay próximos partidos registrados.</p>}
            </section>
            <section style={{ background: '#0D1117', border: '1px solid rgba(216,249,91,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
              <h2 style={{ margin: 0, padding: '12px', textAlign: 'center', fontSize: '0.78rem', letterSpacing: '0.1em', color: '#D8F95B' }}>RESULTADOS</h2>
              {partidos(datos?.resultados).reverse().slice(0, 10).map((partido) => tarjetaPartido(partido, true))}
              {(!datos?.resultados || datos.resultados.length === 0) && <p style={{ padding: '12px', color: '#A7ADBA' }}>No hay resultados registrados.</p>}
            </section>
          </div>
          <aside style={{ display: 'grid', alignContent: 'start', gap: '16px' }}>
            <section style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '16px' }}>
              <h2 style={{ margin: '0 0 14px', fontSize: '0.78rem', letterSpacing: '0.1em', color: '#62E6FF' }}>INFO DEL CLUB</h2>
              <p>Estadio: <strong>{club.estadio || 'No disponible'}</strong></p>
              <p>Ciudad: <strong>{club.ciudad || 'No disponible'}</strong></p>
              <p>Fundación: <strong>{club.fundacion || 'No disponible'}</strong></p>
            </section>
            <section style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '16px' }}>
              <h2 style={{ margin: '0 0 14px', fontSize: '0.78rem', letterSpacing: '0.1em', color: '#D8F95B' }}>TEMPORADA</h2>
              <p>Partidos jugados: <strong>{estadisticas?.partidosJugados ?? datos?.tabla?.j ?? '-'}</strong></p>
              <p>Ganados: <strong>{estadisticas?.ganados ?? '-'}</strong></p>
              <p>Empatados: <strong>{estadisticas?.empatados ?? '-'}</strong></p>
              <p>Perdidos: <strong>{estadisticas?.perdidos ?? '-'}</strong></p>
              <p>Goles a favor: <strong>{estadisticas?.golesFavor ?? '-'}</strong></p>
            </section>
          </aside>
          <section style={{ gridColumn: '1 / -1', background: '#0D1117', border: '1px solid rgba(255,145,164,0.25)', borderRadius: '8px', overflow: 'hidden' }}>
            <h2 style={{ margin: 0, padding: '12px', textAlign: 'center', fontSize: '0.78rem', letterSpacing: '0.1em', color: '#FF91A4' }}>PLANTEL</h2>
            {datos?.plantel?.length > 0 ? (
              <div style={{ padding: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                {datos.plantel.map((jugador: any, index: number) => (
                  <div key={jugador.id || index} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '9px', background: index % 2 === 0 ? '#111823' : '#0D131C', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px' }}>
                    {jugador.foto && <img src={jugador.foto} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />}
                    <div style={{ minWidth: 0 }}><strong style={{ display: 'block', color: '#FFF', fontSize: '0.76rem' }}>{jugador.nombre}</strong><span style={{ color: '#A7ADBA', fontSize: '0.65rem' }}>{jugador.posicion} {jugador.numero ? `#${jugador.numero}` : ''} {jugador.edad ? `· ${jugador.edad} años` : ''}</span></div>
                  </div>
                ))}
              </div>
            ) : <p style={{ padding: '12px', color: '#A7ADBA' }}>El proveedor no devolvió el plantel de esta temporada.</p>}
          </section>
          <section style={{ gridColumn: '1 / -1', background: '#0D1117', border: '1px solid rgba(216,249,91,0.18)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '8px' }}>
              {(['goleadores', 'asistencias', 'amarillas', 'rojas'] as const).map((tipo) => (
                <button key={tipo} onClick={() => setLiderActivo(tipo)} style={{ padding: '11px 6px', border: `1px solid ${liderActivo === tipo ? '#D8F95B' : 'rgba(216,249,91,0.18)'}`, borderRadius: '7px', background: liderActivo === tipo ? 'rgba(216,249,91,0.12)' : '#0D131C', color: liderActivo === tipo ? '#D8F95B' : '#A7ADBA', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer' }}>
                  {tipo === 'goleadores' ? 'Goleadores' : tipo === 'amarillas' ? 'Amarillas' : tipo === 'rojas' ? 'Rojas' : 'Asistencias'}
                </button>
              ))}
            </div>
            <div style={{ padding: '4px 10px 12px' }}>
              {(datos?.lideres?.[liderActivo] || []).length > 0 ? (datos.lideres[liderActivo] || []).map((jugador: any, index: number) => {
                const campo = liderActivo === 'goleadores' ? 'goles' : liderActivo === 'asistencias' ? 'asistencias' : liderActivo;
                return <div key={jugador.id || index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', color: '#FFF', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>{jugador.foto ? <img src={jugador.foto} alt="" style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} /> : <span style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#283A75', display: 'grid', placeItems: 'center' }}>{jugador.nombre.slice(0, 2).toUpperCase()}</span>}<strong>{index + 1}. {jugador.nombre}</strong></div>
                  <strong style={{ color: '#D8F95B', fontSize: '0.9rem' }}>{jugador[campo] ?? 0}</strong>
                </div>;
              }) : <div style={{ padding: '16px 10px', color: '#A7ADBA' }}>No hay datos registrados para esta categoría.</div>}
            </div>
          </section>
          <section style={{ gridColumn: '1 / -1', background: '#0D1117', border: '1px solid rgba(98,230,255,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
            <h2 style={{ margin: 0, padding: '12px', textAlign: 'center', fontSize: '0.78rem', letterSpacing: '0.1em', color: '#62E6FF' }}>HISTORIA DEL CLUB</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', padding: '10px' }}>
              <div style={{ padding: '12px', background: '#111823', borderRadius: '6px' }}><span style={{ display: 'block', color: '#A7ADBA', fontSize: '0.68rem' }}>CLUB</span><strong>{club.nombre}</strong></div>
              <div style={{ padding: '12px', background: '#111823', borderRadius: '6px' }}><span style={{ display: 'block', color: '#A7ADBA', fontSize: '0.68rem' }}>FUNDACIÓN</span><strong>{club.fundacion || 'No disponible'}</strong></div>
              <div style={{ padding: '12px', background: '#111823', borderRadius: '6px' }}><span style={{ display: 'block', color: '#A7ADBA', fontSize: '0.68rem' }}>ESTADIO</span><strong>{club.estadio || 'No disponible'}</strong></div>
              <div style={{ padding: '12px', background: '#111823', borderRadius: '6px' }}><span style={{ display: 'block', color: '#A7ADBA', fontSize: '0.68rem' }}>CIUDAD</span><strong>{club.ciudad || 'No disponible'}</strong></div>
            </div>
            <div style={{ padding: '0 10px 12px' }}>
              <h3 style={{ margin: '8px 0', color: '#D8F95B', fontSize: '0.72rem', letterSpacing: '0.08em' }}>TROFEOS REGISTRADOS</h3>
              {datos?.historial?.length > 0 ? datos.historial.map((trofeo: any, index: number) => (
                <div key={`${trofeo.competencia}-${trofeo.temporada}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px', background: index % 2 === 0 ? '#111823' : '#0D131C', borderRadius: '6px', color: '#FFF', fontSize: '0.74rem' }}><strong>{trofeo.competencia}</strong><span style={{ color: '#D8F95B' }}>{trofeo.temporada}</span></div>
              )) : <div style={{ padding: '10px', color: '#A7ADBA', background: '#0D131C', borderRadius: '6px' }}>El proveedor todavía no entregó el palmarés histórico de este club.</div>}
            </div>
          </section>
        </div>
        <section style={{ display: tabClub === 'estadio' ? 'block' : 'none', background: '#0D1117', border: '1px solid rgba(98,230,255,0.25)', borderRadius: '8px', padding: '22px', minHeight: '240px' }}>
          <h2 style={{ margin: '0 0 20px', color: '#62E6FF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>ESTADIO</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div><span style={{ color: '#A7ADBA', display: 'block', fontSize: '0.75rem' }}>Nombre</span><strong style={{ color: '#FFF', fontSize: '1.1rem' }}>{club.estadio || 'No disponible'}</strong></div>
            <div><span style={{ color: '#A7ADBA', display: 'block', fontSize: '0.75rem' }}>Ciudad</span><strong style={{ color: '#FFF', fontSize: '1.1rem' }}>{club.ciudad || 'No disponible'}</strong></div>
            <div><span style={{ color: '#A7ADBA', display: 'block', fontSize: '0.75rem' }}>Dirección</span><strong style={{ color: '#FFF', fontSize: '1.1rem' }}>{club.direccion || 'No disponible'}</strong></div>
            <div><span style={{ color: '#A7ADBA', display: 'block', fontSize: '0.75rem' }}>Capacidad</span><strong style={{ color: '#FFF', fontSize: '1.1rem' }}>{club.capacidad ? club.capacidad.toLocaleString('es-ES') : 'No disponible'}</strong></div>
            <div><span style={{ color: '#A7ADBA', display: 'block', fontSize: '0.75rem' }}>Superficie</span><strong style={{ color: '#FFF', fontSize: '1.1rem' }}>{club.superficie || 'No disponible'}</strong></div>
          </div>
          <div style={{ marginTop: '24px', padding: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', color: '#A7ADBA', lineHeight: 1.6 }}>
            La información del estadio se muestra con los datos oficiales que devuelve el proveedor para este club.
          </div>
        </section>
        </>
      )}
    </div>
  );
}
