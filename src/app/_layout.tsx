import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View, StyleSheet, Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from '../providers/AuthProvider';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

try {
  SplashScreen.preventAutoHideAsync();
} catch (e) {
  // Игнорируем ошибку при hot-reload
}

function RootLayoutNav() {
  const { session, isLoading, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    
    try {
      SplashScreen.hideAsync();
    } catch (e) {
      // Игнорируем ошибку при hot-reload
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Redirect to the login page.
      router.replace('/(auth)/login');
    } else if (session) {
      if (profile && !profile.is_approved && segments[0] !== '(pending)') {
        // Redirect to pending approval page if not approved
        router.replace('/(pending)/index');
      } else if (profile && profile.is_approved && inAuthGroup) {
        // Redirect away from login if authenticated and approved
        router.replace('/(tabs)/');
      }
    }
  }, [session, isLoading, segments, profile]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(pending)" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <View style={styles.webContainer}>
          <RootLayoutNav />
        </View>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    ...(Platform.OS === 'web' ? {
      maxWidth: 800,
      width: '100%',
      marginHorizontal: 'auto',
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.05)',
    } : {})
  }
});
