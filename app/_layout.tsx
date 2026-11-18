import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * Layout principal de la aplicación CampusConnect
 * Configura la pila de navegación de Expo Router y el proveedor de área segura.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F8FAFC' },
          animation: 'fade',
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'CampusConnect',
            headerShown: false,
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
