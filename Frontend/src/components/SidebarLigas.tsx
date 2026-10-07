// src/components/SidebarLigas.tsx
import { useState } from 'react';
import type { LigaConfig } from '../types';
import { obtenerLogoLiga } from '../services/logosLigas';

interface Props {
  listaLigas: LigaConfig[];
  onSeleccionarLiga: (liga: LigaConfig) => void;
  temaActual?: 'oscuro' | 'claro' | 'neon';
}

export default function SidebarLigas({ listaLigas, onSeleccionarLiga, temaActual = 'oscuro' }: Props) {
  const [busquedaLiga, setBusquedaLiga] = useState<string>("");
  const [regionesAbiertas, setRegionesAbiertas] = useState<Record<string, boolean>>({
    "Sudamérica": true,
    "Internacional": false,
    "Europa": false,
    "Norteamérica": false,
    "Centroamérica": false,
    "Asia": false,
    "Selecciones": false
  });

  const [paisesAbiertos, setPaisesAbiertos] = useState<Record<string, boolean>>({
    "Argentina": true
  });

  const toggleRegion = (region: string) => {
    setRegionesAbiertas(prev => ({ ...prev, [region]: !prev[region] }));
  };

  const togglePais = (pais: string) => {
    setPaisesAbiertos(prev => ({ ...prev, [pais]: !prev[pais] }));
  };

  const regionesDisponibles: Array<LigaConfig['region']> = [
    'Internacional', 'Sudamérica', 'Europa', 'Norteamérica', 'Centroamérica', 'Asia', 'Selecciones'
  ];
  const marcasRegion: Record<LigaConfig['region'], { sello: string; icono: string }> = {
    Internacional: { sello: 'FIFA', icono: '🌐' },
    'Sudamérica': { sello: 'CONMEBOL', icono: '🏆' },
    Europa: { sello: 'UEFA', icono: '✦' },
    'Norteamérica': { sello: 'CONCACAF', icono: '🌎' },
    'Centroamérica': { sello: 'CONCACAF', icono: '🌎' },
    Asia: { sello: 'AFC', icono: '🌏' },
    Selecciones: { sello: 'FIFA', icono: '⚽' }
  };
  const esClaro = temaActual === 'claro';

  return (
    <>
      <div className={`competition-drawer${esClaro ? ' competition-drawer--light' : ''}`}>
        <div className="competition-drawer__heading">
          <span className="competition-drawer__mark" aria-hidden="true">EG</span>
          <span className="competition-drawer__title">
            <strong>El mapa del fútbol</strong>
            <small>Competiciones por región</small>
          </span>
          <span className="competition-drawer__count" aria-label={`${listaLigas.length} competiciones`}>{listaLigas.length}</span>
        </div>

      <input
        type="text"
        className="competition-drawer__search"
        placeholder="Buscar liga, país o torneo..."
        aria-label="Buscar liga, país o torneo"
        value={busquedaLiga}
        onChange={(e) => setBusquedaLiga(e.target.value)}
      />

      <div className="competition-drawer__list">
        {regionesDisponibles.map((region) => {
          const ligasEnRegion = listaLigas.filter(l => 
            l.region === region && 
            (l.nombreMostrar.toLowerCase().includes(busquedaLiga.toLowerCase()) ||
             l.paisBuscado.toLowerCase().includes(busquedaLiga.toLowerCase()) ||
             region.toLowerCase().includes(busquedaLiga.toLowerCase()))
          );

          if (busquedaLiga && ligasEnRegion.length === 0) return null;
          const regionAbierta = regionesAbiertas[region] || busquedaLiga.length > 0;
          const paisesEnRegion = Array.from(new Set(ligasEnRegion.map(l => l.paisBuscado)));

          return (
            <div key={region} style={{ marginBottom: '8px' }}>
              <button
                className={`competition-region${regionAbierta ? ' competition-region--open' : ''}`}
                type="button"
                onClick={() => toggleRegion(region)}
                aria-expanded={regionAbierta}
              >
                <span className="competition-region__identity">
                  <span className="competition-region__icon" aria-hidden="true">{marcasRegion[region].icono}</span>
                  <span className="competition-region__name">{region}</span>
                </span>
                <span className="competition-region__brand">{marcasRegion[region].sello}</span>
                <span className={`competition-region__chevron${regionAbierta ? ' competition-region__chevron--open' : ''}`} aria-hidden="true" />
              </button>

              {regionAbierta && paisesEnRegion.map((pais) => {
                const ligasDelPais = ligasEnRegion.filter(l => l.paisBuscado === pais);
                const codigoPais = ligasDelPais[0]?.codigoPais || 'un';
                const paisAbierto = paisesAbiertos[pais] || busquedaLiga.length > 0;

                return (
                  <div key={pais} style={{ marginLeft: '4px', marginBottom: '4px' }}>
                    <button
                      className="competition-country"
                      type="button"
                      onClick={() => togglePais(pais)}
                      aria-expanded={paisAbierto}
                    >
                      <span className="competition-country__identity">
                        <img src={`https://flagcdn.com/w40/${codigoPais}.png`} alt="" style={{ width: '18px', height: '13px', objectFit: 'cover', borderRadius: '3px', boxShadow: '0 0 0 1px rgba(255,255,255,0.1)' }} />
                        <span>{pais}</span>
                      </span>
                      <span className="competition-country__count">{ligasDelPais.length} torneos</span>
                      <span className={`competition-region__chevron${paisAbierto ? ' competition-region__chevron--open' : ''}`} aria-hidden="true" />
                    </button>

                    {paisAbierto && (
                      <div className="competition-list">
                        {ligasDelPais.map((item: LigaConfig) => (
                          <button
                            className="competition-item"
                            type="button"
                            key={item.idLiga}
                            onClick={() => onSeleccionarLiga({ ...item, logo: obtenerLogoLiga(item.idLiga) })}
                          >
                            <span className="competition-item__badge">
                              <span aria-hidden="true">{item.nombreMostrar.split(' ').map((palabra) => palabra[0]).join('').slice(0, 2)}</span>
                              <img
                                src={obtenerLogoLiga(item.idLiga)}
                                alt=""
                                loading="lazy"
                                onError={(event) => { event.currentTarget.style.display = 'none'; }}
                              />
                            </span>
                            <span className="competition-item__name">{item.nombreMostrar}</span>
                            <span className="competition-item__arrow" aria-hidden="true">↗</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
    </>
  );
}