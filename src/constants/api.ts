/**
 * Constantes de configuración de la API para CampusConnect
 * Asignatura: Aplicaciones Móviles Híbridas - Práctica 4.3
 */

export const API_CONFIG = {
  BASE_URL: 'https://jsonplaceholder.typicode.com',
  ENDPOINTS: {
    /** Endpoint válido para obtener comunicados académicos (HTTP 200) */
    ANNOUNCEMENTS: 'https://jsonplaceholder.typicode.com/posts',
    /** Endpoint de prueba inexistente para simular fallo controlado (HTTP 404) */
    INVALID_TEST: 'https://jsonplaceholder.typicode.com/endpoint-inexistente',
  },
  TIMEOUT_MS: 10000,
  HEADERS: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
} as const;

export type ApiEndpoint = typeof API_CONFIG.ENDPOINTS[keyof typeof API_CONFIG.ENDPOINTS];
