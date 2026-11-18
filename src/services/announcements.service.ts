/**
 * Servicio de Avisos Académicos para CampusConnect
 * Asignatura: Aplicaciones Móviles Híbridas - Práctica 4.3
 *
 * Responsabilidades:
 * - Consultar la API mediante Fetch API.
 * - Validar códigos de respuesta HTTP y response.ok.
 * - Procesar y formatear la información recibida (id, title, body).
 * - Distinguir errores de red, HTTP y de parseo.
 */

import { API_CONFIG } from '../constants/api';
import { Announcement, RawPost } from '../models/announcement.model';

/**
 * Categorías académicas para enriquecer la presentación de los avisos
 */
const CATEGORIES: Announcement['category'][] = [
  'Académico',
  'Institucional',
  'Evento',
  'Fechas Importantes',
];

/**
 * Formatea una fecha representativa para el aviso
 */
function getMockDateForIndex(index: number): string {
  const day = (index % 28) + 1;
  const month = 'Nov';
  const year = '2026';
  return `${day.toString().padStart(2, '0')} ${month} ${year}`;
}

/**
 * Transforma un post crudo de JSONPlaceholder en un anuncio académico formal
 */
export function mapRawPostToAnnouncement(raw: RawPost, index: number): Announcement {
  return {
    id: raw.id,
    title: raw.title,
    body: raw.body,
    category: CATEGORIES[index % CATEGORIES.length],
    formattedDate: getMockDateForIndex(index),
  };
}

/**
 * Clase de error personalizada para fallos de respuesta HTTP
 */
export class HttpError extends Error {
  statusCode: number;
  statusText: string;
  endpoint: string;

  constructor(statusCode: number, statusText: string, endpoint: string) {
    super(`Error HTTP ${statusCode}: ${statusText || 'Error en la petición'}`);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.statusText = statusText;
    this.endpoint = endpoint;
  }
}

/**
 * Clase de error personalizada para fallos de conexión o timeout
 */
export class NetworkConnectionError extends Error {
  endpoint: string;

  constructor(message: string, endpoint: string) {
    super(message);
    this.name = 'NetworkConnectionError';
    this.endpoint = endpoint;
  }
}

/**
 * Consulta la lista de avisos académicos desde el endpoint especificado
 *
 * @param endpoint URL a consultar (por defecto el endpoint válido /posts)
 * @returns Lista de anuncios mapeados
 * @throws HttpError si response.ok es false (ej: 404, 500)
 * @throws NetworkConnectionError si falla la conectividad o expira el timeout
 */
export async function fetchAnnouncements(
  endpoint: string = API_CONFIG.ENDPOINTS.ANNOUNCEMENTS
): Promise<Announcement[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, API_CONFIG.TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        ...API_CONFIG.HEADERS,
      },
      signal: controller.signal,
    });

    // 1. Validación de código de estado HTTP (response.ok)
    if (!response.ok) {
      throw new HttpError(
        response.status,
        response.statusText || 'Recurso no encontrado o no disponible',
        endpoint
      );
    }

    // 2. Procesamiento y deserialización de datos
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new Error(
        `Error de procesamiento: La respuesta del servidor no tiene formato JSON válido.`
      );
    }

    // 3. Validación de estructura de array
    if (!Array.isArray(data)) {
      throw new Error(
        'Estructura de datos inválida: Se esperaba una lista de avisos.'
      );
    }

    // 4. Mapeo estricto de campos (id, title, body)
    const announcements: Announcement[] = data
      .slice(0, 20) // Limitamos a 20 avisos para una experiencia móvil ágil
      .map((item, index) => {
        const raw = item as RawPost;
        return mapRawPostToAnnouncement(raw, index);
      });

    return announcements;
  } catch (error: unknown) {
    // Si fue abortado por timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new NetworkConnectionError(
        `Tiempo de espera agotado (${API_CONFIG.TIMEOUT_MS / 1000}s) al conectar con el servidor institucional.`,
        endpoint
      );
    }

    // Si ya es HttpError o Error conocido, re-lanzar
    if (error instanceof HttpError) {
      throw error;
    }

    // Si es un fallo de red nativo de fetch (TypeError: Network request failed)
    if (error instanceof TypeError) {
      throw new NetworkConnectionError(
        `Error de conexión: No se pudo establecer comunicación con el servidor. Revisa tu conexión a internet.`,
        endpoint
      );
    }

    // Cualquier otro error
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
