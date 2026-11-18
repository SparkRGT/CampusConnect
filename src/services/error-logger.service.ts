/**
 * Servicio de Registro de Errores (Error Logging Local) para CampusConnect
 * Asignatura: Aplicaciones Móviles Híbridas - Práctica 4.3
 *
 * Responsabilidades:
 * - Registrar errores localmente en memoria y en la consola de desarrollo.
 * - Capturar marca de tiempo (timestamp ISO), tipo de error, mensaje técnico, contexto y código HTTP.
 * - Sanitizar entradas para garantizar que NUNCA se almacenen datos personales,
 *   contraseñas, tokens de autenticación ni información confidencial.
 * - Permitir la consulta y auditoría de los registros para pruebas y verificación académica.
 *
 * Nota académica:
 * Este servicio implementa "Local Error Logging" (diagnóstico local).
 * Se diferencia del "Remote Crash Reporting" (como Sentry o Firebase Crashlytics) en que
 * no envía telemetría a servidores de terceros ni requiere SDKs propietarios remotos.
 */

import { AppErrorType, ErrorLogEntry } from '../models/announcement.model';

class ErrorLoggerService {
  private logs: ErrorLogEntry[] = [];
  private readonly maxLogs: number = 50;

  /**
   * Sanitiza cualquier cadena para evitar que se guarden datos personales o sensibles.
   * Filtra patrones comunes como tokens Bearer, passwords, emails o tarjetas.
   */
  private sanitize(input: string): string {
    if (!input) return '';
    return input
      .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTADO]')
      .replace(/password\s*[:=]\s*[^\s,]+/gi, 'password=[REDACTADO]')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, '[EMAIL_REDACTADO]')
      .replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, '[TARJETA_REDACTADA]');
  }

  /**
   * Registra un error de forma estructurada y segura.
   *
   * @param params Parámetros técnicos del error detectado
   * @returns El registro de error generado con ID y timestamp
   */
  public log(params: {
    errorType: AppErrorType;
    technicalMessage: string;
    userFriendlyMessage: string;
    context: string;
    endpoint: string;
    statusCode?: number;
  }): ErrorLogEntry {
    const entry: ErrorLogEntry = {
      id: `err-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      errorType: params.errorType,
      technicalMessage: this.sanitize(params.technicalMessage),
      userFriendlyMessage: params.userFriendlyMessage,
      context: this.sanitize(params.context),
      endpoint: this.sanitize(params.endpoint),
      statusCode: params.statusCode,
    };

    // Almacenamiento circular en memoria local
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Emisión legible en la consola para depuración durante el desarrollo
    this.printToConsole(entry);

    return entry;
  }

  /**
   * Emite el registro en consola con formato visual estructurado
   */
  private printToConsole(entry: ErrorLogEntry): void {
    const divider = '─'.repeat(70);
    console.warn(
      `\n┌${divider}\n` +
      `│ [CAMPUSCONNECT : LOCAL ERROR LOG]\n` +
      `│ ID:         ${entry.id}\n` +
      `│ Timestamp:  ${entry.timestamp}\n` +
      `│ Tipo:       ${entry.errorType}\n` +
      `│ HTTP Code:  ${entry.statusCode ? entry.statusCode : 'N/A'}\n` +
      `│ Endpoint:   ${entry.endpoint}\n` +
      `│ Contexto:   ${entry.context}\n` +
      `│ Técnico:    ${entry.technicalMessage}\n` +
      `│ Al Usuario: ${entry.userFriendlyMessage}\n` +
      `└${divider}\n`
    );
  }

  /**
   * Retorna todos los registros de error almacenados en la sesión actual
   */
  public getLogs(): ErrorLogEntry[] {
    return [...this.logs];
  }

  /**
   * Retorna el registro de error más reciente
   */
  public getLatestLog(): ErrorLogEntry | null {
    return this.logs.length > 0 ? this.logs[0] : null;
  }

  /**
   * Limpia el historial de registros en memoria
   */
  public clearLogs(): void {
    this.logs = [];
    console.log('[CampusConnect:Logger] Historial de errores reiniciado.');
  }

  /**
   * Retorna el número total de errores registrados
   */
  public count(): number {
    return this.logs.length;
  }
}

// Exportamos una instancia única (Singleton) para toda la aplicación
export const errorLogger = new ErrorLoggerService();
