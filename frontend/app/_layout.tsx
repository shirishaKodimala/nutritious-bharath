import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../src/lib/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="recipe/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="recipe/[id]/cook" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="scanner" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="voice-search" options={{ animation: 'fade', presentation: 'transparentModal' }} />
        <Stack.Screen name="dosha-quiz" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="herbs" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
