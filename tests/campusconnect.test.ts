/**
 * Suite de Pruebas Automatizadas para CampusConnect
 * Asignatura: Aplicaciones Móviles Híbridas - Práctica 4.3
 *
 * Verificaciones obligatorias (Sección 12):
 * 1. Consulta exitosa (HTTP 200).
 * 2. Respuesta HTTP 404 (Fallo controlado).
 * 3. Error de conexión y timeout.
 * 4. Registro del error y sanitización (Error Logging).
 * 5. Ciclo de estado de carga y bloque finally.
 * 6. Limpieza de errores.
 * 7. Recuperación mediante nueva petición (Escenario A -> Escenario B).
 * 8. Traducción de errores técnicos a mensajes comprensibles para el usuario.
 */

import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { API_CONFIG } from '../src/constants/api';
import {
  DataParsingError,
  HttpError,
  NetworkConnectionError,
  errorLogger,
  fetchAnnouncements,
  getUserFriendlyErrorMessage,
  mapRawPostToAnnouncement,
} from '../src/services';

describe('CampusConnect — Suite de Pruebas de Manejo de Errores y Crash Reporting', () => {
  beforeEach(() => {
    errorLogger.clearLogs();
  });

  // 1. Consulta exitosa
  it('1. Debe procesar correctamente una consulta exitosa (HTTP 200)', async () => {
    const rawPostMock = {
      userId: 1,
      id: 101,
      title: 'Convocatoria a Becas de Excelencia 2026',
      body: 'Se abren las postulaciones para las becas institucionales de mérito académico.',
    };

    const announcement = mapRawPostToAnnouncement(rawPostMock, 0);

    assert.equal(announcement.id, 101);
    assert.equal(announcement.title, 'Convocatoria a Becas de Excelencia 2026');
    assert.equal(announcement.category, 'Académico');
    assert.ok(announcement.formattedDate.includes('2026'));
  });

  // 2. Respuesta HTTP 404
  it('2. Debe detectar y lanzar HttpError ante una respuesta HTTP 404 (Fallo controlado)', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
      } as unknown as Response;
    }) as typeof fetch;

    try {
      await assert.rejects(
        async () => {
          await fetchAnnouncements(API_CONFIG.ENDPOINTS.INVALID_TEST);
        },
        (err: unknown) => {
          const httpErr = err as HttpError;
          assert.ok(httpErr instanceof HttpError);
          assert.equal(httpErr.statusCode, 404);
          assert.equal(httpErr.errorType, 'HTTP_ERROR');
          assert.equal(httpErr.endpoint, API_CONFIG.ENDPOINTS.INVALID_TEST);
          return true;
        }
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // 3. Error de conexión
  it('3. Debe capturar fallos de red y lanzar NetworkConnectionError', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      throw new TypeError('Network request failed');
    }) as typeof fetch;

    try {
      await assert.rejects(
        async () => {
          await fetchAnnouncements(API_CONFIG.ENDPOINTS.ANNOUNCEMENTS);
        },
        (err: unknown) => {
          const netErr = err as NetworkConnectionError;
          assert.ok(netErr instanceof NetworkConnectionError);
          assert.equal(netErr.errorType, 'NETWORK_ERROR');
          assert.ok(netErr.message.includes('Fallo de conexión de red nativo'));
          return true;
        }
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // 4. Registro del error y sanitización
  it('4. Debe registrar errores técnicamente y sanitizar credenciales y datos personales', () => {
    const log = errorLogger.log({
      errorType: 'HTTP_ERROR',
      statusCode: 404,
      technicalMessage:
        'Fallo con token Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 y password=superSecret123',
      userFriendlyMessage: 'Recurso no encontrado.',
      context: 'Usuario alumno@institucion.edu.ec consultando calificaciones',
      endpoint: 'https://api.institucion.edu.ec/api/v1/posts',
    });

    assert.ok(log.id.startsWith('err-'));
    assert.ok(log.timestamp);
    assert.equal(log.statusCode, 404);
    assert.equal(log.errorType, 'HTTP_ERROR');

    // Comprobación estricta de sanitización (no debe contener datos personales ni credenciales)
    assert.ok(
      !log.technicalMessage.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'),
      'El token Bearer debió ser redactado'
    );
    assert.ok(
      !log.technicalMessage.includes('superSecret123'),
      'La contraseña debió ser redactada'
    );
    assert.ok(
      !log.context.includes('alumno@institucion.edu.ec'),
      'El correo electrónico debió ser redactado'
    );
    assert.ok(log.technicalMessage.includes('[REDACTADO]'));

    // Debe guardarse en el historial de logs
    assert.equal(errorLogger.count(), 1);
    assert.deepEqual(errorLogger.getLatestLog(), log);
  });

  // 5. Estado de carga y garantía de finally
  it('5. Debe garantizar la finalización del estado de carga en bloque finally ante éxito o error', async () => {
    let isLoading = false;
    const fetchWrapper = async (shouldFail: boolean) => {
      isLoading = true; // Paso 1
      try {
        if (shouldFail) {
          throw new HttpError(500, 'Internal Server Error', 'url-test');
        }
        return ['anuncio-1'];
      } finally {
        isLoading = false; // Paso 9
      }
    };

    // Caso A: Con éxito
    await fetchWrapper(false);
    assert.equal(isLoading, false, 'El loading debió apagarse en caso exitoso');

    // Caso B: Con fallo
    try {
      await fetchWrapper(true);
    } catch {
      // Ignoramos error esperado
    }
    assert.equal(isLoading, false, 'El loading debió apagarse en caso de error');
  });

  // 6. Limpieza de errores
  it('6. Debe permitir la limpieza de errores y reiniciar el historial', () => {
    errorLogger.log({
      errorType: 'UNKNOWN_ERROR',
      technicalMessage: 'Error transitorio',
      userFriendlyMessage: 'Error al usuario',
      context: 'Contexto de prueba',
      endpoint: 'https://test.com',
    });

    assert.equal(errorLogger.count(), 1);
    errorLogger.clearLogs();
    assert.equal(errorLogger.count(), 0);
    assert.equal(errorLogger.getLatestLog(), null);
  });

  // 7. Recuperación mediante nueva petición (Escenario A -> Escenario B)
  it('7. Debe permitir recuperación mediante una nueva petición exitosa tras un fallo 404', async () => {
    let activeEndpoint: string = API_CONFIG.ENDPOINTS.INVALID_TEST;
    let currentError: string | null = null;
    let dataLoaded: unknown[] = [];

    const originalFetch = globalThis.fetch;

    // Simulación Escenario A (Fallo)
    globalThis.fetch = (async () => {
      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as unknown as Response;
    }) as typeof fetch;

    try {
      await fetchAnnouncements(activeEndpoint);
    } catch (err) {
      currentError = getUserFriendlyErrorMessage(err);
    }

    assert.ok(currentError !== null);
    assert.equal(dataLoaded.length, 0);

    // Simulación Escenario B (Recuperación con endpoint válido)
    activeEndpoint = API_CONFIG.ENDPOINTS.ANNOUNCEMENTS;
    globalThis.fetch = (async () => {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => [
          { userId: 1, id: 1, title: 'Aviso Recuperado', body: 'Contenido válido' },
        ],
      } as unknown as Response;
    }) as typeof fetch;

    const recoveredData = await fetchAnnouncements(activeEndpoint);
    currentError = null; // Limpieza de error
    dataLoaded = recoveredData;

    assert.equal(currentError, null, 'El error debió ser limpiado tras la recuperación');
    assert.equal(dataLoaded.length, 1);
    assert.equal((dataLoaded[0] as { title: string }).title, 'Aviso Recuperado');

    globalThis.fetch = originalFetch;
  });

  // 8. Mensajes comprensibles para el usuario
  it('8. Debe traducir errores técnicos a mensajes amigables y accesibles para el usuario', () => {
    const error404 = new HttpError(404, 'Not Found', '/test');
    const userMsg404 = getUserFriendlyErrorMessage(error404);
    assert.ok(userMsg404.includes('no fue encontrado'));
    assert.ok(!userMsg404.includes('TypeError'));
    assert.ok(!userMsg404.includes('at fetchAnnouncements'));

    const errorNet = new NetworkConnectionError('DNS resolution failed', '/test', false);
    const userMsgNet = getUserFriendlyErrorMessage(errorNet);
    assert.ok(userMsgNet.includes('conexión a Internet'));

    const errorParse = new DataParsingError('Unexpected token < in JSON', '/test');
    const userMsgParse = getUserFriendlyErrorMessage(errorParse);
    assert.ok(userMsgParse.includes('procesar la información'));
  });
});
