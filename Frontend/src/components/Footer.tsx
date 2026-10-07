import { useState } from 'react';

type DocumentoLegal = 'condiciones' | 'privacidad' | 'aviso';

interface FooterProps {
	temaActual: 'oscuro' | 'claro' | 'neon';
}

const documentos: Record<DocumentoLegal, { titulo: string; contenido: string[] }> = {
	condiciones: {
		titulo: 'Condiciones de uso',
		contenido: [
			'EdearGoal ofrece información deportiva con fines informativos y de entretenimiento. Los horarios, resultados, estadísticas y alineaciones pueden cambiar o contener errores; confirma los datos importantes con sus fuentes.',
			'Al usar el sitio, acepta no interferir con su funcionamiento ni utilizarlo para actividades ilícitas. El acceso puede interrumpirse o cambiar sin previo aviso.',
			'Los nombres, escudos, fotografías y demás materiales pertenecen a sus respectivos titulares. EdearGoal no implica afiliación oficial con clubes, ligas ni proveedores de datos.'
		]
	},
	privacidad: {
		titulo: 'Política de privacidad',
		contenido: [
			'Las cuentas se almacenan en el servidor con la contraseña protegida mediante un hash; la contraseña original no se guarda. El correo se utiliza para verificar la cuenta y la sesión se mantiene en una cookie HttpOnly.',
			'El envío de mensajes de verificación y bienvenida se procesa mediante el proveedor SMTP configurado por EdearGoal. El sitio también consulta servicios externos de datos deportivos, que pueden recibir datos técnicos de conexión conforme a sus propias políticas.',
			'El responsable debe configurar plazos de conservación, canal de contacto y las medidas exigidas por la legislación aplicable antes del lanzamiento público.'
		]
	},
	aviso: {
		titulo: 'Aviso legal',
		contenido: [
			'EdearGoal es un sitio independiente de información deportiva y no representa a FIFA, confederaciones, ligas, clubes ni proveedores de datos.',
			'La información se presenta tal como la proporcionan sus fuentes y no constituye asesoramiento oficial. Los derechos sobre marcas, imágenes y datos corresponden a sus titulares.',
			'La identificación del titular del sitio y sus datos de contacto deben añadirse aquí antes de publicar esta sección como aviso legal definitivo.'
		]
	}
};

export default function Footer({ temaActual }: FooterProps) {
	const [documentoActivo, setDocumentoActivo] = useState<DocumentoLegal | null>(null);
	const [sobreAbierto, setSobreAbierto] = useState(false);
	const esClaro = temaActual === 'claro';
	const documento = documentoActivo ? documentos[documentoActivo] : null;

	return (
		<>
			<footer className={`site-footer${esClaro ? ' site-footer--light' : ''}`}>
				<div className="site-footer__main">
					<button className="site-footer__about" type="button" onClick={() => setSobreAbierto(true)}>
						<img src="./edeargoal.jpg" alt="" />
						<span>
							<strong>Sobre EdearGoal</strong>
							<small>Fútbol, resultados y seguimiento</small>
						</span>
						<span className="site-footer__about-arrow" aria-hidden="true">↗</span>
					</button>
					<nav className="site-footer__legal" aria-label="Información legal">
						<span className="site-footer__heading">Información legal</span>
						<button type="button" onClick={() => setDocumentoActivo('condiciones')}>Condiciones de uso</button>
						<button type="button" onClick={() => setDocumentoActivo('privacidad')}>Privacidad</button>
						<button type="button" onClick={() => setDocumentoActivo('aviso')}>Aviso legal</button>
					</nav>
				</div>
				<div className="site-footer__bottom">
					<span>© {new Date().getFullYear()} EdearGoal</span>
					<span>Información deportiva en un solo lugar</span>
				</div>
			</footer>

			{sobreAbierto && (
				<div className="about-dialog-backdrop" onMouseDown={(event) => {
					if (event.target === event.currentTarget) setSobreAbierto(false);
				}}>
					<section className="about-dialog" role="dialog" aria-modal="true" aria-labelledby="about-dialog-title">
						<header className="about-dialog__header">
							<span>CONOCE LA PLATAFORMA</span>
							<button type="button" aria-label="Cerrar" onClick={() => setSobreAbierto(false)}>×</button>
						</header>
						<div className="about-dialog__layout">
							<div className="about-dialog__visual">
								<img className="about-dialog__stadium" src="./estadio-azul.jpeg" alt="Estadio de fútbol iluminado durante un partido" />
								<div className="about-dialog__brand">
									<img src="./edeargoal.jpg" alt="EdearGoal" />
									<span>Fútbol en seguimiento</span>
								</div>
							</div>
							<div className="about-dialog__copy">
								<h2 id="about-dialog-title">EdearGoal, partido a partido</h2>
								<p>Consulta la actividad del fútbol y explora los datos de tus competiciones y equipos desde un mismo lugar.</p>
								<ul>
									<li><strong>Agenda</strong><span>Partidos del día y encuentros en vivo.</span></li>
									<li><strong>Competiciones</strong><span>Calendarios, tablas, clubes e historial disponible.</span></li>
									<li><strong>Detalle del partido</strong><span>Marcador, eventos y alineaciones cuando el proveedor las publica.</span></li>
									<li><strong>Cara a cara</strong><span>Compara los enfrentamientos registrados entre equipos.</span></li>
								</ul>
								<p className="about-dialog__note">Los datos pueden variar según la cobertura de cada proveedor deportivo.</p>
							</div>
						</div>
					</section>
				</div>
			)}

			{documento && (
				<div className="legal-dialog-backdrop" onMouseDown={(event) => {
					if (event.target === event.currentTarget) setDocumentoActivo(null);
				}}>
					<section className="legal-dialog" role="dialog" aria-modal="true" aria-labelledby="legal-dialog-title">
						<div className="legal-dialog__header">
							<h2 id="legal-dialog-title">{documento.titulo}</h2>
							<button type="button" aria-label="Cerrar" onClick={() => setDocumentoActivo(null)}>×</button>
						</div>
						<div className="legal-dialog__content">
							{documento.contenido.map((parrafo) => <p key={parrafo}>{parrafo}</p>)}
						</div>
					</section>
				</div>
			)}
		</>
	);
}
