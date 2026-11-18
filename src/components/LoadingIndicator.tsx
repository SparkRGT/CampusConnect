import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface LoadingIndicatorProps {
  message?: string;
  subMessage?: string;
}

/**
 * Componente visual reutilizable para estados de carga en CampusConnect
 */
export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = 'Consultando avisos académicos...',
  subMessage = 'Conectando con el servidor institucional',
}) => {
  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={message}
    >
      <View style={styles.spinnerWrapper}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
      <Text style={styles.message}>{message}</Text>
      {subMessage ? <Text style={styles.subMessage}>{subMessage}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 6,
  },
  subMessage: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});
