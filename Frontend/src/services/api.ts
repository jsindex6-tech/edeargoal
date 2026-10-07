const apiBaseConfigurada = import.meta.env.VITE_API_BASE_URL?.trim();
const host = window.location.hostname;
const esLocal = host === 'localhost' || host === '127.0.0.1';
const apiBaseLocal = esLocal
	? `http://${host}:3001`
	: host.endsWith('.github.io')
		? 'https://edeargoal.onrender.com'
		: window.location.origin;

export const API_BASE_URL = (apiBaseConfigurada || apiBaseLocal)
	.replace(/\/+$/, '');

export const apiUrl = (ruta: string) => `${API_BASE_URL}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;

export async function fetchApi(ruta: string, opciones: RequestInit = {}): Promise<Response> {
	const metodo = (opciones.method || 'GET').toUpperCase();
	const maxIntentos = metodo === 'GET' ? 4 : 1;
	const pausasMs = [1500, 3000, 6000];

	for (let intento = 0; intento < maxIntentos; intento += 1) {
		try {
			const respuesta = await fetch(apiUrl(ruta), opciones);
			const servidorDespertando = [502, 503, 504].includes(respuesta.status);
			if (!servidorDespertando || intento === maxIntentos - 1) return respuesta;
		} catch (error) {
			if (!(error instanceof TypeError) || opciones.signal?.aborted || intento === maxIntentos - 1) {
				throw error;
			}
		}

		await new Promise((resolve) => window.setTimeout(resolve, pausasMs[intento]));
	}

	throw new Error('No se pudo conectar con el servidor de EdearGoal.');
}

export async function leerRespuestaJson<T>(respuesta: Response): Promise<T> {
	try {
		return await respuesta.json() as T;
	} catch {
		throw new Error('El servidor de EdearGoal no respondió con datos JSON. Comprueba que el backend esté activo.');
	}
}
