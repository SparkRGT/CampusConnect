import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AnnouncementCard,
  ErrorMessage,
  LoadingIndicator,
} from '../src/components';
import { API_CONFIG } from '../src/constants/api';
import {
  Announcement,
  ErrorLogEntry,
  RequestStatus,
} from '../src/models/announcement.model';
import {
  DataParsingError,
  HttpError,
  NetworkConnectionError,
  errorLogger,
  fetchAnnouncements,
  getUserFriendlyErrorMessage,
} from '../src/services';

export default function HomeScreen() {
  // Estados reactivos de la aplicación
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeEndpoint, setActiveEndpoint] = useState<string>(
    API_CONFIG.ENDPOINTS.ANNOUNCEMENTS
  );
  const [currentError, setCurrentError] = useState<ErrorLogEntry | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [logsList, setLogsList] = useState<ErrorLogEntry[]>([]);
  const [showLogsViewer, setShowLogsViewer] = useState<boolean>(false);

  /**
   * Operación de red con flujo estructurado obligatorio try / catch / finally:
   *
   * 1. Activar indicador de carga.
   * 2. Limpiar errores anteriores.
   * 3. Ejecutar la petición HTTP real con Fetch API.
   * 4. Validar response.ok (dentro de fetchAnnouncements).
   * 5. Procesar los datos y actualizar lista de avisos.
   * 6. Capturar los errores mediante catch.
   * 7. Registrar el error técnicamente mediante ErrorLoggerService (sin datos personales).
   * 8. Mostrar un mensaje comprensible al usuario en la interfaz.
   * 9. Desactivar el indicador de carga en bloque finally.
   */
  const executeFetch = useCallback(async (targetEndpoint: string) => {
    // PASO 1: Activar el indicador de carga y registrar endpoint objetivo
    setStatus('loading');
    setActiveEndpoint(targetEndpoint);

    // PASO 2: Limpiar errores anteriores
    setCurrentError(null);

    try {
      // PASOS 3, 4 y 5: Ejecutar petición HTTP, validar response.ok y procesar datos
      const data = await fetchAnnouncements(targetEndpoint);
      setAnnouncements(data);
      setStatus('success');
    } catch (error: unknown) {
      // PASO 6: Capturar los errores en catch
      const userMessage = getUserFriendlyErrorMessage(error);
      let loggedEntry: ErrorLogEntry;

      // PASO 7: Registrar el error técnicamente mediante ErrorLoggerService
      if (error instanceof HttpError) {
        loggedEntry = errorLogger.log({
          errorType: 'HTTP_ERROR',
          statusCode: error.statusCode,
          technicalMessage: `HTTP ${error.statusCode} (${error.statusText}) en ${error.endpoint}`,
          userFriendlyMessage: userMessage,
          context: 'Petición GET de avisos académicos institucionales',
          endpoint: error.endpoint,
        });
      } else if (error instanceof NetworkConnectionError) {
        loggedEntry = errorLogger.log({
          errorType: error.errorType,
          technicalMessage: error.message,
          userFriendlyMessage: userMessage,
          context: 'Comprobación de conectividad física y timeout de red',
          endpoint: error.endpoint,
        });
      } else if (error instanceof DataParsingError) {
        loggedEntry = errorLogger.log({
          errorType: 'PARSING_ERROR',
          technicalMessage: error.message,
          userFriendlyMessage: userMessage,
          context: 'Transformación y deserialización JSON de avisos',
          endpoint: error.endpoint,
        });
      } else {
        const genericErr = error as Error;
        loggedEntry = errorLogger.log({
          errorType: 'UNKNOWN_ERROR',
          technicalMessage: genericErr?.message || 'Error no clasificado',
          userFriendlyMessage: userMessage,
          context: 'Excepción imprevista en ciclo de vida de consulta',
          endpoint: targetEndpoint,
        });
      }

      // Actualizar estado del historial de logs locales
      setLogsList(errorLogger.getLogs());

      // PASO 8: Mostrar mensaje comprensible al usuario en la interfaz
      setAnnouncements([]);
      setCurrentError(loggedEntry);
      setStatus('error');
    } finally {
      // PASO 9: Desactivar el indicador de carga / pull-to-refresh en finally
      setRefreshing(false);
    }
  }, []);

  // Carga inicial al montar la aplicación (recuperación exitosa por defecto)
  useEffect(() => {
    executeFetch(API_CONFIG.ENDPOINTS.ANNOUNCEMENTS);
  }, [executeFetch]);

  // ESCENARIO B: Consulta válida y recuperación exitosa (HTTP 200)
  const handleLoadSuccess = () => {
    executeFetch(API_CONFIG.ENDPOINTS.ANNOUNCEMENTS);
  };

  // ESCENARIO A: Fallo controlado en endpoint inexistente (HTTP 404)
  const handleSimulateError = () => {
    executeFetch(API_CONFIG.ENDPOINTS.INVALID_TEST);
  };

  // Botón Reintentar: repite la última operación usando estrictamente su endpoint original
  const handleRetry = () => {
    executeFetch(activeEndpoint);
  };

  // Limpiar historial de auditoría de logs
  const handleClearLogs = () => {
    errorLogger.clearLogs();
    setLogsList([]);
  };

  // Pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    executeFetch(activeEndpoint);
  };

  // Indicador visual de estado
  const getStatusBadge = () => {
    switch (status) {
      case 'loading':
        return { label: 'Consultando...', color: '#D97706', bg: '#FEF3C7' };
      case 'error':
        return { label: 'Error detectado (404)', color: '#DC2626', bg: '#FEE2E2' };
      case 'success':
        return { label: 'En línea • Sincronizado (200 OK)', color: '#16A34A', bg: '#DCFCE7' };
      default:
        return { label: 'Inactivo', color: '#64748B', bg: '#F1F5F9' };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
      >
        {/* Encabezado Institucional */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.brandContainer}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoBadgeText}>CC</Text>
              </View>
              <View>
                <Text style={styles.appTitle}>CampusConnect</Text>
                <Text style={styles.appSubtitle}>
                  Portal Institucional de Avisos
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: statusBadge.bg },
              ]}
            >
              <Text
                style={[styles.statusIndicatorText, { color: statusBadge.color }]}
              >
                {statusBadge.label}
              </Text>
            </View>
          </View>

          {/* Tarjeta académica */}
          <View style={styles.academicCard}>
            <Text style={styles.academicSubject}>
              Aplicaciones Móviles Híbridas • Práctica 4.3
            </Text>
            <Text style={styles.academicTheme}>
              Manejo de Errores y Estrategias de Crash Reporting
            </Text>
          </View>
        </View>

        {/* Panel de Control de Escenarios Obligatorios */}
        <View style={styles.controlsSection}>
          <Text style={styles.sectionTitle}>Escenarios de Laboratorio 4.3</Text>
          <Text style={styles.sectionSubtitle}>
            Prueba el fallo controlado en endpoint inexistente o ejecuta la
            recuperación con el endpoint válido.
          </Text>

          <View style={styles.buttonRow}>
            {/* ESCENARIO B: Botón independiente para consulta válida */}
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                styles.successButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleLoadSuccess}
              accessibilityRole="button"
              accessibilityLabel="Escenario B: Consultar avisos válidos HTTP 200"
            >
              <Text style={styles.successButtonText}>
                📥 Escenario B: Recuperación (HTTP 200)
              </Text>
            </Pressable>

            {/* ESCENARIO A: Botón de simulación de fallo controlado */}
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                styles.errorButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleSimulateError}
              accessibilityRole="button"
              accessibilityLabel="Escenario A: Provocar fallo controlado HTTP 404"
            >
              <Text style={styles.errorButtonText}>
                🧪 Escenario A: Fallo Controlado (HTTP 404)
              </Text>
            </Pressable>
          </View>

          {/* Información del endpoint activo y auditoría de logs */}
          <View style={styles.metaRow}>
            <View style={styles.endpointInfoBox}>
              <Text style={styles.endpointLabel}>
                {activeEndpoint === API_CONFIG.ENDPOINTS.INVALID_TEST
                  ? '⚠️ Endpoint Activo (Escenario A - Fallo):'
                  : '✅ Endpoint Activo (Escenario B - Válido):'}
              </Text>
              <Text style={styles.endpointValue} numberOfLines={1}>
                {activeEndpoint}
              </Text>
            </View>

            <View style={styles.logsAuditRow}>
              <Pressable
                style={styles.logsToggleBtn}
                onPress={() => setShowLogsViewer(!showLogsViewer)}
              >
                <Text style={styles.logsToggleText}>
                  📋 {showLogsViewer ? 'Ocultar auditoría' : 'Ver auditoría de logs'}{' '}
                  ({logsList.length})
                </Text>
              </Pressable>

              {logsList.length > 0 && (
                <Pressable
                  style={styles.clearLogsBtn}
                  onPress={handleClearLogs}
                >
                  <Text style={styles.clearLogsText}>Limpiar logs</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Visor desplegable de auditoría de registros de error locales */}
          {showLogsViewer && (
            <View style={styles.logsViewerContainer}>
              <Text style={styles.logsViewerTitle}>
                Historial Local de Error Logging (Sin PII / Datos Personales):
              </Text>
              {logsList.length === 0 ? (
                <Text style={styles.logsViewerEmpty}>
                  No hay registros de error en esta sesión.
                </Text>
              ) : (
                logsList.map((log) => (
                  <View key={log.id} style={styles.logItem}>
                    <View style={styles.logItemHeader}>
                      <Text style={styles.logTypeBadge}>[{log.errorType}]</Text>
                      <Text style={styles.logStatusCode}>
                        HTTP {log.statusCode ?? 'N/A'}
                      </Text>
                      <Text style={styles.logTimestamp}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </Text>
                    </View>
                    <Text style={styles.logTechnicalMsg}>
                      {log.technicalMessage}
                    </Text>
                    <Text style={styles.logContext}>
                      Contexto: {log.context}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        {/* Sección Principal de Contenido (Avisos / Carga / Error) */}
        <View style={styles.contentSection}>
          <View style={styles.contentHeader}>
            <Text style={styles.sectionTitle}>Avisos Académicos</Text>
            {announcements.length > 0 && status !== 'loading' && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {announcements.length} comunicados
                </Text>
              </View>
            )}
          </View>

          {/* Renderizado condicional según estado */}
          {status === 'loading' && (
            <LoadingIndicator
              message="Consultando avisos en el servidor..."
              subMessage={`Conectando con: ${activeEndpoint}`}
            />
          )}

          {status === 'error' && currentError && (
            <ErrorMessage
              userMessage={currentError.userFriendlyMessage}
              statusCode={currentError.statusCode}
              technicalDetails={`[${currentError.errorType}] ${currentError.technicalMessage}\nContexto: ${currentError.context}\nTimestamp: ${currentError.timestamp}\nID de Registro: ${currentError.id}`}
              onRetry={handleRetry}
              isRetrying={false}
            />
          )}

          {status !== 'loading' &&
            status !== 'error' &&
            announcements.map((item) => (
              <AnnouncementCard key={item.id} announcement={item} />
            ))}

          {status !== 'loading' &&
            status !== 'error' &&
            announcements.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>📋</Text>
                <Text style={styles.emptyStateTitle}>Sin avisos disponibles</Text>
                <Text style={styles.emptyStateText}>
                  Presiona el botón de consulta superior para obtener los avisos
                  académicos más recientes.
                </Text>
              </View>
            )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoBadgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  appSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  statusIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
  },
  academicCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  academicSubject: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  academicTheme: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  controlsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'column',
    gap: 10,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  successButton: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  errorButton: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  errorButtonText: {
    color: '#BE123C',
    fontSize: 14,
    fontWeight: '700',
  },
  metaRow: {
    marginTop: 12,
    gap: 8,
  },
  endpointInfoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  endpointLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  endpointValue: {
    fontSize: 12,
    color: '#0284C7',
    fontFamily: 'monospace',
  },
  logsAuditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginTop: 4,
  },
  logsToggleBtn: {
    paddingVertical: 4,
  },
  logsToggleText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  clearLogsBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearLogsText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  logsViewerContainer: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logsViewerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  logsViewerEmpty: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  logItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  logTypeBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  logStatusCode: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  logTimestamp: {
    fontSize: 10,
    color: '#94A3B8',
    marginLeft: 'auto',
  },
  logTechnicalMsg: {
    fontSize: 11,
    color: '#1E293B',
    fontFamily: 'monospace',
  },
  logContext: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  contentSection: {
    marginTop: 16,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  countBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    fontSize: 48,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
