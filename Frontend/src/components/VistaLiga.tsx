// src/components/VistaLiga.tsx
import { useState } from 'react';
import type { LigaConfig } from '../types';

interface Props {
  ligaSeleccionada: LigaConfig;
}

export default function VistaLiga({ ligaSeleccionada }: Props) {
  const [pestanaActiva, setPestanaActiva] = useState<'tablas' | 'equipos' | 'campeones'>('tablas');
  const [subPestanaTabla, setSubPestanaTabla] = useState<'apertura' | 'clausura' | 'anual' | 'promedios'>('clausura');
  const [grupoTabla, setGrupoTabla] = useState<'grupoA' | 'grupoB'>('grupoA');

  return (
    <div>
      {/* Pestañas Principales Superiores */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', borderBottom: '1px solid #1E2338', paddingBottom: '12px', marginBottom: '15px', fontSize: '0.95rem', fontWeight: 'bold' }}>
        <span 
          onClick={() => setPestanaActiva('tablas')} 
          style={{ cursor: 'pointer', color: pestanaActiva === 'tablas' ? '#FFD700' : '#A0A5B5', borderBottom: pestanaActiva === 'tablas' ? '2px solid #FFD700' : 'none', paddingBottom: '10px' }}
        >
          TABLAS
        </span>
        <span 
          onClick={() => setPestanaActiva('equipos')} 
          style={{ cursor: 'pointer', color: pestanaActiva === 'equipos' ? '#FFD700' : '#A0A5B5', borderBottom: pestanaActiva === 'equipos' ? '2px solid #FFD700' : 'none', paddingBottom: '10px' }}
        >
          EQUIPOS
        </span>
        <span 
          onClick={() => setPestanaActiva('campeones')} 
          style={{ cursor: 'pointer', color: pestanaActiva === 'campeones' ? '#FFD700' : '#A0A5B5', borderBottom: pestanaActiva === 'campeones' ? '2px solid #FFD700' : 'none', paddingBottom: '10px' }}
        >
          CAMPEONES
        </span>
      </div>

      {pestanaActiva === 'tablas' && (
        <div>
          <div style={{ display: 'flex', gap: '25px', marginBottom: '15px', fontSize: '0.85rem', color: '#A0A5B5' }}>
            <span onClick={() => setSubPestanaTabla('apertura')} style={{ cursor: 'pointer', color: subPestanaTabla === 'apertura' ? '#FFF' : '#A0A5B5' }}>APERTURA</span>
            <span onClick={() => setSubPestanaTabla('clausura')} style={{ cursor: 'pointer', color: subPestanaTabla === 'clausura' ? '#FFD700' : '#A0A5B5', borderBottom: subPestanaTabla === 'clausura' ? '2px solid #FFD700' : 'none' }}>CLAUSURA •</span>
            <span onClick={() => setSubPestanaTabla('anual')} style={{ cursor: 'pointer', color: subPestanaTabla === 'anual' ? '#FFF' : '#A0A5B5' }}>TABLA ANUAL •</span>
            <span onClick={() => setSubPestanaTabla('promedios')} style={{ cursor: 'pointer', color: subPestanaTabla === 'promedios' ? '#FFF' : '#A0A5B5' }}>PROMEDIOS</span>
          </div>

          <div style={{ display: 'flex', backgroundColor: '#0B0D17', borderRadius: '6px', padding: '4px', marginBottom: '15px', textAlign: 'center' }}>
            <div onClick={() => setGrupoTabla('grupoA')} style={{ flex: 1, padding: '8px', cursor: 'pointer', backgroundColor: grupoTabla === 'grupoA' ? '#1E2338' : 'transparent', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold', color: grupoTabla === 'grupoA' ? '#FFD700' : '#A0A5B5' }}>GRUPO A</div>
            <div onClick={() => setGrupoTabla('grupoB')} style={{ flex: 1, padding: '8px', cursor: 'pointer', backgroundColor: grupoTabla === 'grupoB' ? '#1E2338' : 'transparent', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold', color: grupoTabla === 'grupoB' ? '#FFD700' : '#A0A5B5' }}>GRUPO B •</div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: '#A0A5B5', borderBottom: '1px solid #1E2338', fontSize: '0.75rem' }}>
                  <th style={{ padding: '8px' }}>#</th>
                  <th style={{ padding: '8px' }}>EQUIPOS</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>PTS</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>J</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>GOL</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>+/-</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { pos: 1, equipo: 'Vélez', pts: 17, j: 9, gol: '12:7', dif: '+5', color: '#2196F3' },
                  { pos: 2, equipo: 'Defensa y Jus.', pts: 17, j: 9, gol: '11:9', dif: '+2', color: '#4CAF50' },
                  { pos: 3, equipo: 'Gimnasia (M)', pts: 16, j: 9, gol: '14:9', dif: '+5', color: '#9C27B0' },
                  { pos: 4, equipo: 'Boca Juniors', pts: 14, j: 9, gol: '12:11', dif: '+1', color: '#FFC107' },
                  { pos: 5, equipo: 'Independiente', pts: 13, j: 8, gol: '7:6', dif: '+1', color: 'transparent' }
                ].map((row) => (
                  <tr key={row.pos} style={{ borderBottom: '1px solid #1E2338' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 'bold', backgroundColor: row.color !== 'transparent' ? row.color : 'transparent', color: row.color !== 'transparent' ? '#FFF' : '#A0A5B5', textAlign: 'center', width: '25px', borderRadius: '4px' }}>{row.pos}</td>
                    <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>{row.equipo}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold' }}>{row.pts}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', color: '#A0A5B5' }}>{row.j}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', color: '#A0A5B5' }}>{row.gol}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', color: '#4CAF50', fontWeight: 'bold' }}>{row.dif}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pestanaActiva === 'equipos' && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#A0A5B5' }}>
          <h3>Listado de Equipos de {ligaSeleccionada.nombreMostrar}</h3>
          <p>Aquí se mostrarán los planteles y escudos de todos los clubes participantes.</p>
        </div>
      )}

      {pestanaActiva === 'campeones' && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#A0A5B5' }}>
          <h3>Historial de Campeones</h3>
          <p>Palmarés histórico y últimos ganadores de la competencia.</p>
        </div>
      )}
    </div>
  );
}