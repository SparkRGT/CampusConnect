/**
 * Servicio de Avisos Académicos para CampusConnect
 * Asignatura: Aplicaciones Móviles Híbridas - Práctica 4.3
 *
 * Taxonomía de errores diferenciados:
 * 1. HttpError: Errores con respuesta del servidor (status codes 4xx, 5xx)
 * 2. NetworkConnectionError: Errores de red física, conectividad o timeout
 * 3. DataParsingError: Errores de formato o deserialización de datos
 */

import { API_CONFIG } from '../constants/api';
import {
  Announcement,
  AppErrorType,
  RawPost,
} from '../models/announcement.model';

/**
 * Categorías académicas para la presentación de los avisos
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
export function mapRawPostToAnnouncement(
  raw: RawPost,
  index: number
): Announcement {
  return {
    id: raw.id,
    title: raw.title,
    body: raw.body,
    category: CATEGORIES[index % CATEGORIES.length],
    formattedDate: getMockDateForIndex(index),
  };
}

/**
 * 1. Error HTTP: Ocurre cuando el servidor responde con un código de estado fuera de 200-299.
 */
export class HttpError extends Error {
  readonly errorType: AppErrorType = 'HTTP_ERROR';
  statusCode: number;
  statusText: string;
  endpoint: string;

  constructor(statusCode: number, statusText: string, endpoint: string) {
    super(`Respuesta HTTP ${statusCode}: ${statusText || 'Error en la petición'}`);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.statusText = statusText;
    this.endpoint = endpoint;
  }
}

/**
 * 2. Error de Conexión: Ocurre ante fallos de conectividad, caída de red, DNS o timeout.
 */
export class NetworkConnectionError extends Error {
  readonly errorType: AppErrorType;
  endpoint: string;

  constructor(
    message: string,
    endpoint: string,
    isTimeout: boolean = false
  ) {
    super(message);
    this.name = 'NetworkConnectionError';
    this.errorType = isTimeout ? 'TIMEOUT_ERROR' : 'NETWORK_ERROR';
    this.endpoint = endpoint;
  }
}

/**
 * 3. Error de Procesamiento de Datos: Ocurre cuando la respuesta no es un JSON válido o la estructura no coincide.
 */
export class DataParsingError extends Error {
  readonly errorType: AppErrorType = 'PARSING_ERROR';
  endpoint: string;

  constructor(message: string, endpoint: string) {
    super(message);
    this.name = 'DataParsingError';
    this.endpoint = endpoint;
  }
}

/**
 * Traduce cualquier tipo de error técnico a un mensaje empático y comprensible para el usuario,
 * garantizando que NUNCA se expongan excepciones crudas o volcados de memoria al usuario final.
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof HttpError) {
    switch (error.statusCode) {
      case 404:
        return 'El comunicado o aviso solicitado no fue encontrado en el servidor universitario (Error 404). Verifica el recurso o inténtalo más tarde.';
      case 401:
      case 403:
        return 'No tienes autorización para acceder a esta sección institucional. Inicia sesión nuevamente.';
      case 500:
      case 502:
      case 503:
        return 'El servidor universitario experimentó una falla temporal. Nuestro equipo técnico está trabajando en restablecerlo.';
      default:
        return `Ocurrió una eventualidad con el servidor institucional (Código ${error.statusCode}). Por favor reintenta en unos instantes.`;
    }
  }

  if (error instanceof NetworkConnectionError) {
    if (error.errorType === 'TIMEOUT_ERROR') {
      return 'El servidor tardó demasiado en responder (Tiempo de espera agotado). Verifica tu conexión o reintenta en breve.';
    }
    return 'No fue posible conectar con el servidor institucional. Verifica que tu dispositivo cuente con conexión a Internet activa.';
  }

  if (error instanceof DataParsingError) {
    return 'Hubo una dificultad al procesar la información de los avisos recibidos. La plataforma podría estar en mantenimiento.';
  }

  return 'Ocurrió un problema inesperado al cargar los avisos. Por favor presiona "Reintentar".';
}

/**
 * Consulta la lista de avisos académicos desde el endpoint especificado
 * aplicando validaciones estrictas y lanzando errores tipados.
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

    // Validación obligatoria de response.ok
    if (!response.ok) {
      throw new HttpError(
        response.status,
        response.statusText || 'Recurso no disponible',
        endpoint
      );
    }

    // Procesamiento de datos y detección de errores de parseo
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new DataParsingError(
        'La respuesta recibida no posee una sintaxis JSON válida.',
        endpoint
      );
    }

    if (!Array.isArray(data)) {
      throw new DataParsingError(
        'El formato de la respuesta no es una lista válida de avisos.',
        endpoint
      );
    }

    // Mapeo estructurado (id, title, body)
    const announcements: Announcement[] = data
      .slice(0, 20)
      .map((item, index) => {
        const raw = item as RawPost;
        return mapRawPostToAnnouncement(raw, index);
      });

    return announcements;
  } catch (error: unknown) {
    // Si la petición fue abortada por timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new NetworkConnectionError(
        `Tiempo de espera excedido (${API_CONFIG.TIMEOUT_MS / 1000}s) contactando el servidor.`,
        endpoint,
        true
      );
    }

    // Si ya es un error tipado de nuestra taxonomía, re-lanzar
    if (
      error instanceof HttpError ||
      error instanceof NetworkConnectionError ||
      error instanceof DataParsingError
    ) {
      throw error;
    }

    // Si es un TypeError de fetch nativo (típico de desconexión / offline en React Native)
    if (error instanceof TypeError) {
      throw new NetworkConnectionError(
        `Fallo de conexión de red nativo: ${error.message}`,
        endpoint,
        false
      );
    }

    // Errores genéricos
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
