import PartidosEnVivo from './PartidosEnVivo';

interface Props {
  cantidadCompeticiones: number;
  esNeon: boolean;
  colCardInner: string;
  colBorder: string;
  colText: string;
  colTextMuted: string;
}

export default function VistaPrincipalHome({ cantidadCompeticiones, colBorder, colText, colTextMuted }: Props) {
  return (
    <div className="home-page">
      <section className="home-welcome" aria-labelledby="home-title">
        <div className="home-welcome__main">
          <div className="home-welcome__copy">
            <span className="home-welcome__eyebrow"><i aria-hidden="true" /> EL FÚTBOL SE VIVE AQUÍ</span>
            <h1 id="home-title">El mundo del fútbol, <span>cancha por cancha.</span></h1>
            <p>
              De tu liga local a las grandes citas internacionales: entra, explora competiciones
              y sigue cada partido desde un solo lugar.
            </p>
            <div className="home-welcome__actions">
              <span className="home-welcome__live-mark"><i aria-hidden="true" /> Marcadores y calendario</span>
              <span className="home-welcome__timezone">Horarios de Perú · PET</span>
            </div>
          </div>
          <div className="home-welcome__visual" aria-label="EdearGoal, el fútbol de todo el mundo">
            <div className="home-welcome__orbit home-welcome__orbit--outer" />
            <div className="home-welcome__orbit home-welcome__orbit--inner" />
            <img src={`${import.meta.env.BASE_URL}edeargoal.jpg`} alt="Logo de EdearGoal" />
            <span className="home-welcome__visual-label">PASIÓN SIN FRONTERAS</span>
          </div>
        </div>
        <div className="home-welcome__guide" aria-label="Qué puedes hacer en EdearGoal">
          <article><span className="home-welcome__guide-icon" aria-hidden="true">◉</span><span className="home-welcome__guide-copy"><strong>{cantidadCompeticiones} competiciones</strong><small>Explora torneos por región, país y selecciones.</small></span><span className="home-welcome__guide-arrow" aria-hidden="true">↗</span></article>
          <article><span className="home-welcome__guide-icon home-welcome__guide-icon--live" aria-hidden="true">●</span><span className="home-welcome__guide-copy"><strong>Fútbol en seguimiento</strong><small>Consulta agenda y marcadores disponibles.</small></span><span className="home-welcome__guide-arrow" aria-hidden="true">↗</span></article>
          <article><span className="home-welcome__guide-icon home-welcome__guide-icon--compare" aria-hidden="true">VS</span><span className="home-welcome__guide-copy"><strong>Rivales frente a frente</strong><small>Compara equipos y consulta su temporada.</small></span><span className="home-welcome__guide-arrow" aria-hidden="true">↗</span></article>
        </div>
        <p className="home-welcome__note">
          Los horarios se muestran en hora de Perú. La cobertura y actualización dependen de cada proveedor deportivo.
        </p>
      </section>

      <PartidosEnVivo
        colBorder={colBorder}
        colText={colText}
        colTextMuted={colTextMuted}
      />
    </div>
  );
}
