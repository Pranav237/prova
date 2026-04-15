import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenWrapper from '@/components/layout/ScreenWrapper';
import { useAuthStore } from '@/stores/authStore';
import { useSessionStore } from '@/stores/sessionStore';
import { endSession as endSessionApi } from '@/lib/api';
import { colors, typography } from '@/constants/theme';

const EndingScreen = () => {
  const router = useRouter();
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const sessionId = useSessionStore((s) => s.sessionId);

  const [progress, setProgress] = useState(0);
  const [resultData, setResultData] = useState<{
    cardTitle: string;
    cardArtUrl: string;
    cardMetallicColor: string;
    pdfUrl: string;
  } | null>(null);

  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1
    );
  }, [pulseScale]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 0.9) {
          clearInterval(interval);
          return prev;
        }
        return prev + 0.036;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const generateOutput = async () => {
      if (!firebaseUser || !sessionId) return;

      try {
        const result = await endSessionApi({
          userId: firebaseUser.uid,
          sessionId,
        });
        setResultData(result.data);
        setProgress(1);

        setTimeout(() => {
          router.replace({
            pathname: '/(app)/(session)/reveal',
            params: {
              cardTitle: result.data.cardTitle,
              cardArtUrl: result.data.cardArtUrl,
              cardMetallicColor: result.data.cardMetallicColor,
              pdfUrl: result.data.pdfUrl,
            },
          });
        }, 500);
      } catch (e) {
        console.error('Failed to end session:', e);
      }
    };

    generateOutput();
  }, [firebaseUser, sessionId, router]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <ScreenWrapper>
      <LinearGradient
        colors={['rgba(120,80,200,0.1)', colors.bg.primary]}
        style={styles.gradient}
        start={{ x: 0.5, y: 0.35 }}
        end={{ x: 0.5, y: 0.7 }}
      />
      <View style={styles.content}>
        <Animated.View style={[styles.pulseOuter, pulseStyle]}>
          <View style={styles.pulseInner} />
        </Animated.View>

        <Text style={styles.title}>Something real came through here.</Text>
        <Text style={styles.subtitle}>
          Prova is putting together what it found. This takes a moment.
        </Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={colors.gradient.primaryButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]}
            />
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  pulseOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.purple.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(168,130,255,0.3)',
  },
  title: {
    ...typography.display.small,
    color: colors.white,
    textAlign: 'center',
    marginTop: 28,
  },
  subtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 10,
  },
  progressContainer: {
    width: '60%',
    marginTop: 32,
  },
  progressTrack: {
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.border.light,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1,
  },
});

export default EndingScreen;
