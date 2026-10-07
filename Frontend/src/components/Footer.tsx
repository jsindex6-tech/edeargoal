import { useState } from 'react';

type DocumentoLegal = 'condiciones' | 'privacidad' | 'aviso';

interface FooterProps {
	temaActual: 'oscuro' | 'claro' | 'neon';
}

const documentos: Record<DocumentoLegal, { titulo: string; contenido: string[] }> = {
	condiciones: {
		titulo: 'Condiciones de uso',
		contenido: [
			'Última actualización: 7 de octubre de 2026. EdearGoal es un proyecto independiente para consultar información de fútbol. No es un organismo oficial ni representa a ligas, clubes, federaciones o proveedores de datos.',
			'Los calendarios, marcadores, tablas y estadísticas dependen de fuentes externas y pueden tener retrasos, errores o cobertura limitada. Comprueba la información importante con el organizador o la fuente oficial.',
			'Usa el sitio de forma lícita y respeta la seguridad del servicio y los derechos de terceros. Los nombres, escudos, marcas e imágenes pertenecen a sus respectivos titulares y se muestran para identificar equipos y competiciones.',
			'Si tienes consultas sobre estas condiciones, escríbenos a edeargoal@gmail.com.'
		]
	},
	privacidad: {
		titulo: 'Política de privacidad',
		contenido: [
		'Última actualización: 7 de octubre de 2026. Para crear una cuenta se solicita nombre, apodo, equipo favorito, correo y contraseña. También se guarda la fecha de registro y la fecha y versión de las condiciones aceptadas. La contraseña se almacena como hash; el correo se usa para gestionar el inicio de sesión.',
			'El sitio utiliza una cookie de sesión y aplica límites técnicos para proteger el servicio. Los proveedores de alojamiento y de datos deportivos pueden procesar información técnica necesaria para responder a las solicitudes, de acuerdo con sus propias políticas.',
		'El registro no verifica que controles el correo que escribes. Puedes solicitar acceso, corrección o eliminación de los datos de tu cuenta escribiendo a edeargoal@gmail.com desde el correo asociado. No envíes tu contraseña por correo.'
		]
	},
	aviso: {
		titulo: 'Aviso legal',
		contenido: [
			'Última actualización: 7 de octubre de 2026. EdearGoal es independiente y no está afiliado a FIFA, confederaciones, federaciones, ligas, clubes ni proveedores de datos.',
			'Los resultados, escudos, nombres y demás datos deportivos pueden ser suministrados por terceros. Sus marcas y contenidos pertenecen a sus respectivos titulares; la cobertura y actualización pueden variar.',
			'EdearGoal no transmite partidos. Los enlaces externos llevan a sitios de terceros, cuyo contenido y políticas son responsabilidad de quienes los gestionan.',
			'Para consultas sobre el sitio o sus contenidos, escribe a edeargoal@gmail.com.'
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
						<span className="site-footer__about-mark" aria-hidden="true">EG</span>
						<span>
							<strong>Sobre EdearGoal</strong>
							<small>Qué es y cómo consultar los datos</small>
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
						<div className="about-dialog__copy">
							<span className="about-dialog__eyebrow">FÚTBOL, DATOS Y COMPETICIONES</span>
							<h2 id="about-dialog-title">EdearGoal reúne el fútbol que sigues</h2>
							<p>EdearGoal es un sitio independiente creado para explorar calendarios y resultados de fútbol con una navegación sencilla. Selecciona una competición para consultar sus partidos y abre un equipo o encuentro para ver más información disponible.</p>
							<div className="about-dialog__sections">
								<section><h3>Qué puedes consultar</h3><p>Agenda del día, partidos y fechas de cada competición, marcadores, resultados, tablas cuando el formato las admite, equipos, fichas de clubes y enfrentamientos directos.</p></section>
								<section><h3>Partidos en vivo</h3><p>El estado y marcador en vivo aparecen cuando el proveedor publica actualizaciones. Puede existir demora, y no todas las ligas tienen la misma cobertura. EdearGoal no aloja ni transmite partidos.</p></section>
								<section><h3>Cómo leer los datos</h3><p>Las fechas y horas se muestran para Perú. Las tablas se presentan solo cuando hay datos de clasificación fiables; en torneos por grupos o eliminación se avisa si no existe una tabla general comparable.</p></section>
								<section><h3>Transparencia y contacto</h3><p>EdearGoal no está afiliado oficialmente con equipos, ligas o federaciones. Los datos y marcas pertenecen a sus titulares. Escríbenos a <a href="mailto:edeargoal@gmail.com">edeargoal@gmail.com</a> para consultas o correcciones.</p></section>
							</div>
							<p className="about-dialog__note">La cobertura depende de las fuentes deportivas conectadas y puede cambiar por temporada, competición o disponibilidad del proveedor.</p>
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
							<a className="legal-dialog__contact" href="mailto:edeargoal@gmail.com">Contactar: edeargoal@gmail.com</a>
						</div>
					</section>
				</div>
			)}
		</>
	);
}
