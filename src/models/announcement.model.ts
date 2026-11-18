/**
 * Modelos de datos y contratos TypeScript para CampusConnect
 * Asignatura: Aplicaciones Móviles Híbridas - Práctica 4.3
 */

/**
 * Estructura sin procesar recibida desde la API JSONPlaceholder (/posts)
 */
export interface RawPost {
  userId: number;
  id: number;
  title: string;
  body: string;
}

/**
 * Modelo formal de un aviso académico en CampusConnect
 */
export interface Announcement {
  id: number;
  title: string;
  body: string;
  category: 'Institucional' | 'Académico' | 'Evento' | 'Fechas Importantes';
  formattedDate: string;
}

/**
 * Clasificación de errores reconocidos por la aplicación
 */
export type AppErrorType =
  | 'HTTP_ERROR'
  | 'NETWORK_ERROR'
  | 'PARSING_ERROR'
  | 'TIMEOUT_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Modelo de registro técnico de error (Error Logging local)
 * IMPORTANTE: No almacena datos personales, tokens ni credenciales
 */
export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  errorType: AppErrorType;
  technicalMessage: string;
  userFriendlyMessage: string;
  context: string;
  endpoint: string;
  statusCode?: number;
}

/**
 * Estados posibles del ciclo de vida de una petición HTTP
 */
export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Tipo para el resultado de una operación de servicio
 */
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: ErrorLogEntry;
}
