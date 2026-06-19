import { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/stores/authStore';
import { colors, typography } from '@/constants/theme';

const MIN_SPLASH_MS = 1200;

const SplashScreen = () => {
  const router = useRouter();
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const initialized = useAuthStore((s) => s.initialized);
  const hasNavigated = useRef(false);
  const mountedAt = useRef(Date.now());

  useEffect(() => {
    if (!initialized || hasNavigated.current) return;

    // Make sure the splash is on screen for at least MIN_SPLASH_MS so the
    // tagline reveal animation finishes before we navigate away.
    const elapsed = Date.now() - mountedAt.current;
    const wait = Math.max(MIN_SPLASH_MS - elapsed, 0);

    const timer = setTimeout(() => {
      if (hasNavigated.current) return;
      hasNavigated.current = true;
      if (firebaseUser) {
        router.replace('/(app)/(session)');
      } else {
        router.replace('/(auth)/sign-in');
      }
    }, wait);

    return () => clearTimeout(timer);
  }, [initialized, firebaseUser, router]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(120,80,200,0.15)', 'transparent']}
        style={styles.gradient}
        start={{ x: 0.5, y: 0.3 }}
        end={{ x: 0.5, y: 0.8 }}
      />
      <View style={styles.content}>
        <Animated.Text entering={FadeInUp.duration(600).delay(200)} style={styles.title}>
          prova
        </Animated.Text>
        <Animated.Text entering={FadeIn.duration(400).delay(500)} style={styles.tagline}>
          know what you think
        </Animated.Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.display.large,
    color: colors.white,
  },
  tagline: {
    ...typography.label.micro,
    color: colors.purple.soft,
    letterSpacing: 1.35,
    marginTop: 8,
  },
});

export default SplashScreen;
