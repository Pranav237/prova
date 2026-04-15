import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
  const initialize = useAuthStore((s) => s.initialize);

  const [fontsLoaded] = useFonts({
    'DMSans-Regular': require('@/assets/fonts/DMSans-Regular.ttf'),
    'DMSans-Medium': require('@/assets/fonts/DMSans-Medium.ttf'),
    'DMSans-SemiBold': require('@/assets/fonts/DMSans-SemiBold.ttf'),
    'DMSans-Bold': require('@/assets/fonts/DMSans-Bold.ttf'),
    'InstrumentSerif-Regular': require('@/assets/fonts/InstrumentSerif-Regular.ttf'),
  });

  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg.primary },
          animation: 'fade',
        }}
      />
    </GestureHandlerRootView>
  );
};

export default RootLayout;
