const apiBaseConfigurada = import.meta.env.VITE_API_BASE_URL?.trim();
const apiBaseLocal = import.meta.env.DEV ? `http://${window.location.hostname}:3001` : window.location.origin;

export const API_BASE_URL = (apiBaseConfigurada || apiBaseLocal)
	.replace(/\/+$/, '');

export const apiUrl = (ruta: string) => `${API_BASE_URL}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
