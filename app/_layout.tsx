import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../hooks/useAuth';
import { QueryProvider } from '../providers/QueryProvider';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <AuthProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="notifications/index" options={{ headerShown: false }} />
            <Stack.Screen name="ride/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="ride/active" options={{ presentation: 'card' }} />
            <Stack.Screen name="ride/book" options={{ presentation: 'card' }} />
            <Stack.Screen name="ride/create" options={{ presentation: 'card' }} />
            <Stack.Screen name="ride/my-rides" options={{ presentation: 'card' }} />
            <Stack.Screen name="ride/tracking" options={{ presentation: 'card' }} />
            <Stack.Screen name="search/results" options={{ presentation: 'modal' }} />
          </Stack>
        </AuthProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}