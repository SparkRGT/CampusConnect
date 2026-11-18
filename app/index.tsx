import React, { useState } from 'react';
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

/**
 * Datos iniciales de demostración para visualización de la interfaz en FASE 4
 */
const MOCK_PREVIEW_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 1,
    title: 'Inicio del Periodo Académico y Registro de Asignaturas',
    body: 'Se informa a todos los estudiantes que el proceso de matriculación ordinaria para el nuevo ciclo académico se encuentra habilitado en el portal institucional.',
    category: 'Académico',
    formattedDate: '18 Nov 2026',
  },
  {
    id: 2,
    title: 'Feria Universitaria de Innovación y Proyectos Tecnológicos',
    body: 'Invitamos a la comunidad universitaria a inscribir sus proyectos tecnológicos y de desarrollo móvil en la feria anual de la facultad.',
    category: 'Evento',
    formattedDate: '19 Nov 2026',
  },
  {
    id: 3,
    title: 'Mantenimiento Programado de la Plataforma Virtual',
    body: 'Los servidores institucionales entrarán en mantenimiento preventivo este fin de semana de 00:00 a 04:00 horas. Tome las debidas precauciones.',
    category: 'Institucional',
    formattedDate: '20 Nov 2026',
  },
];

export default function HomeScreen() {
  // Estados de interfaz y ciclo de vida de peticiones
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [announcements, setAnnouncements] = useState<Announcement[]>(
    MOCK_PREVIEW_ANNOUNCEMENTS
  );
  const [activeEndpoint, setActiveEndpoint] = useState<string>(
    API_CONFIG.ENDPOINTS.ANNOUNCEMENTS
  );
  const [currentError, setCurrentError] = useState<ErrorLogEntry | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Manejador temporal de UI para cargar datos de prueba
  const handleLoadSuccessDemo = () => {
    setStatus('loading');
    setCurrentError(null);
    setActiveEndpoint(API_CONFIG.ENDPOINTS.ANNOUNCEMENTS);

    setTimeout(() => {
      setAnnouncements(MOCK_PREVIEW_ANNOUNCEMENTS);
      setStatus('success');
    }, 800);
  };

  // Manejador temporal de UI para simular visualmente error 404
  const handleSimulateErrorDemo = () => {
    setStatus('loading');
    setActiveEndpoint(API_CONFIG.ENDPOINTS.INVALID_TEST);

    setTimeout(() => {
      setAnnouncements([]);
      setCurrentError({
        id: 'err-preview-404',
        timestamp: new Date().toISOString(),
        errorType: 'HTTP_ERROR',
        statusCode: 404,
        technicalMessage: 'HTTP 404 Not Found at /endpoint-inexistente',
        userFriendlyMessage:
          'No pudimos encontrar el recurso solicitado en el servidor universitario (HTTP 404). Verifica la dirección o inténtalo más tarde.',
        context: 'Simulación controlada de laboratorio (FASE 4)',
        endpoint: API_CONFIG.ENDPOINTS.INVALID_TEST,
      });
      setStatus('error');
    }, 800);
  };

  // Manejador de reintento: vuelve a ejecutar la última operación con su endpoint
  const handleRetry = () => {
    if (activeEndpoint === API_CONFIG.ENDPOINTS.INVALID_TEST) {
      handleSimulateErrorDemo();
    } else {
      handleLoadSuccessDemo();
    }
  };

  // Pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    handleRetry();
    setTimeout(() => setRefreshing(false), 800);
  };

  // Helper para el badge de estado
  const getStatusBadge = () => {
    switch (status) {
      case 'loading':
        return { label: 'Consultando...', color: '#D97706', bg: '#FEF3C7' };
      case 'error':
        return { label: 'Error detectado', color: '#DC2626', bg: '#FEE2E2' };
      case 'success':
        return { label: 'En línea • Sincronizado', color: '#16A34A', bg: '#DCFCE7' };
      default:
        return { label: 'Listo para consultar', color: '#2563EB', bg: '#DBEAFE' };
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

          {/* Tarjeta de información académica */}
          <View style={styles.academicCard}>
            <Text style={styles.academicSubject}>
              Aplicaciones Móviles Híbridas • Práctica 4.3
            </Text>
            <Text style={styles.academicTheme}>
              Manejo de Errores y Estrategias de Crash Reporting
            </Text>
          </View>
        </View>

        {/* Panel de Control de Pruebas y Acciones */}
        <View style={styles.controlsSection}>
          <Text style={styles.sectionTitle}>Panel de Consultas y Pruebas</Text>
          <Text style={styles.sectionSubtitle}>
            Ejecuta consultas válidas o simula fallos controlados para verificar
            la trazabilidad de errores.
          </Text>

          <View style={styles.buttonRow}>
            {/* Botón de Consulta Válida */}
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                styles.successButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleLoadSuccessDemo}
              accessibilityRole="button"
              accessibilityLabel="Consultar avisos académicos válidos"
            >
              <Text style={styles.successButtonText}>
                📥 Consultar Avisos (200 OK)
              </Text>
            </Pressable>

            {/* Botón de Simulación de Error */}
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                styles.errorButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleSimulateErrorDemo}
              accessibilityRole="button"
              accessibilityLabel="Simular error HTTP 404 en endpoint no existente"
            >
              <Text style={styles.errorButtonText}>
                🧪 Simular Error (HTTP 404)
              </Text>
            </Pressable>
          </View>

          {/* Información del endpoint activo */}
          <View style={styles.endpointInfoBox}>
            <Text style={styles.endpointLabel}>Endpoint Activo:</Text>
            <Text style={styles.endpointValue} numberOfLines={1}>
              {activeEndpoint}
            </Text>
          </View>
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
              subMessage={`Endpoint: ${activeEndpoint}`}
            />
          )}

          {status === 'error' && currentError && (
            <ErrorMessage
              userMessage={currentError.userFriendlyMessage}
              statusCode={currentError.statusCode}
              technicalDetails={`[${currentError.errorType}] ${currentError.technicalMessage}\nContexto: ${currentError.context}\nTimestamp: ${currentError.timestamp}`}
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
  endpointInfoBox: {
    marginTop: 12,
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
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
