import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface ErrorMessageProps {
  userMessage: string;
  technicalDetails?: string;
  statusCode?: number;
  onRetry?: () => void;
  isRetrying?: boolean;
}

/**
 * Componente visual para mostrar errores comprensibles al usuario
 * Cumple con el requisito de no exponer mensajes técnicos directamente,
 * permitiendo inspección controlada para propósitos académicos.
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  userMessage,
  technicalDetails,
  statusCode,
  onRetry,
  isRetrying = false,
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={`Error: ${userMessage}`}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>⚠️</Text>
      </View>

      <View style={styles.badgeContainer}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {statusCode ? `Error HTTP ${statusCode}` : 'Fallo de Operación'}
          </Text>
        </View>
      </View>

      <Text style={styles.userTitle}>No se pudieron cargar los avisos</Text>
      <Text style={styles.userMessage}>{userMessage}</Text>

      {onRetry && (
        <Pressable
          style={({ pressed }) => [
            styles.retryButton,
            pressed && styles.retryButtonPressed,
            isRetrying && styles.retryButtonDisabled,
          ]}
          onPress={onRetry}
          disabled={isRetrying}
          accessibilityRole="button"
          accessibilityLabel="Reintentar consulta de avisos"
        >
          <Text style={styles.retryButtonText}>
            {isRetrying ? 'Reintentando...' : '🔄 Reintentar'}
          </Text>
        </Pressable>
      )}

      {technicalDetails && (
        <View style={styles.academicSection}>
          <Pressable
            style={styles.toggleDetailsButton}
            onPress={() => setShowTechnicalDetails(!showTechnicalDetails)}
          >
            <Text style={styles.toggleDetailsText}>
              {showTechnicalDetails
                ? '▲ Ocultar trazabilidad técnica'
                : '▼ Ver trazabilidad técnica (Laboratorio)'}
            </Text>
          </Pressable>

          {showTechnicalDetails && (
            <View style={styles.technicalBox}>
              <Text style={styles.technicalTitle}>Diagnóstico Técnico:</Text>
              <Text style={styles.technicalContent}>{technicalDetails}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 20,
    marginVertical: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    alignItems: 'center',
    shadowColor: '#991B1B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconText: {
    fontSize: 24,
  },
  badgeContainer: {
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: '#991B1B',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  userTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991B1B',
    textAlign: 'center',
    marginBottom: 6,
  },
  userMessage: {
    fontSize: 14,
    color: '#7F1D1D',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  retryButtonPressed: {
    backgroundColor: '#B91C1C',
    opacity: 0.9,
  },
  retryButtonDisabled: {
    backgroundColor: '#F87171',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  academicSection: {
    width: '100%',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#FECACA',
    paddingTop: 12,
  },
  toggleDetailsButton: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  toggleDetailsText: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
  },
  technicalBox: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    width: '100%',
  },
  technicalTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7F1D1D',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  technicalContent: {
    fontSize: 12,
    color: '#334155',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});
