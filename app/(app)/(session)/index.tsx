import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Compass, Target, RotateCcw } from 'lucide-react-native';
import ScreenWrapper from '@/components/layout/ScreenWrapper';
import Button from '@/components/ui/Button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/stores/authStore';
import { useSessionStore } from '@/stores/sessionStore';
import { getActiveSession, getCompletedSessions, updateUserProfile, deleteAllSessions } from '@/lib/firestore';
import { createSession } from '@/lib/firestore';
import { colors, typography, radius, spacing } from '@/constants/theme';

const SessionIntentScreen = () => {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const setIntent = useSessionStore((s) => s.setIntent);
  const setSessionId = useSessionStore((s) => s.setSessionId);
  const [showDirectedInput, setShowDirectedInput] = useState(false);
  const [directedPrompt, setDirectedPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasPreviousSessions, setHasPreviousSessions] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!firebaseUser) return;

      // TODO: Remove after testing — one-time wipe of stale test data
      const resetKey = 'dev_reset_v3';
      const hasReset = await AsyncStorage.getItem(resetKey);
      if (!hasReset) {
        await deleteAllSessions(firebaseUser.uid);
        await updateUserProfile(firebaseUser.uid, { hasCompletedOnboarding: false, sessionCount: 0 });
        await AsyncStorage.setItem(resetKey, 'done');
        await refreshProfile();
      }

      const active = await getActiveSession(firebaseUser.uid);
      if (active) {
        setSessionId(active.id);
        setIntent(active.intent);
        router.replace('/(app)/(session)/conversation');
        return;
      }
      const completed = await getCompletedSessions(firebaseUser.uid);
      setHasPreviousSessions(completed.length > 0);
    };
    init();
  }, [firebaseUser, router, setSessionId, setIntent, refreshProfile]);

  const needsOnboarding = profile && !profile.hasCompletedOnboarding;

  const startSession = async (intent: 'open' | 'directed' | 'revisiting', prompt?: string) => {
    if (!firebaseUser) return;
    setLoading(true);
    try {
      setIntent(intent);

      if (needsOnboarding) {
        router.push('/(app)/(session)/onboarding');
        return;
      }

      const sessionId = await createSession(firebaseUser.uid, intent, {
        directedPrompt: prompt,
      });
      setSessionId(sessionId);
      router.push('/(app)/(session)/conversation');
    } catch (e) {
      console.error('Failed to start session:', e);
    } finally {
      setLoading(false);
    }
  };

  if (showDirectedInput) {
    return (
      <ScreenWrapper gradient>
        <View style={styles.container}>
          <Text style={styles.heading}>What's on your mind?</Text>
          <Text style={styles.subtext}>
            Briefly describe the belief, decision, or pattern you want to examine.
          </Text>

          <RNTextInput
            style={styles.textArea}
            placeholder="I've been thinking about..."
            placeholderTextColor={colors.text.faint}
            value={directedPrompt}
            onChangeText={setDirectedPrompt}
            multiline
            maxLength={500}
            autoFocus
            selectionColor={colors.purple.DEFAULT}
          />

          <View style={styles.directedButtons}>
            <Button
              title="Back"
              variant="ghost"
              onPress={() => setShowDirectedInput(false)}
            />
            <View style={{ flex: 1 }}>
              <Button
                title="Begin Session"
                onPress={() => startSession('directed', directedPrompt)}
                disabled={!directedPrompt.trim()}
                loading={loading}
              />
            </View>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <LinearGradient
        colors={['rgba(120,80,200,0.08)', 'transparent']}
        style={styles.gradient}
        start={{ x: 0.5, y: 0.15 }}
        end={{ x: 0.5, y: 0.6 }}
      />
      <View style={styles.container}>
        <Text style={styles.heading}>How do you want to start?</Text>
        <Text style={styles.subtext}>You can always change direction mid-session.</Text>

        <View style={styles.cards}>
          <TouchableOpacity
            style={[styles.intentCard, styles.intentCardRecommended]}
            onPress={() => startSession('open')}
            activeOpacity={0.7}
          >
            <View style={styles.intentRow}>
              <View style={styles.iconContainer}>
                <Compass size={18} color={colors.purple.DEFAULT} />
              </View>
              <View style={styles.intentTextContainer}>
                <View style={styles.titleRow}>
                  <Text style={styles.intentTitle}>Let Prova lead</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Recommended</Text>
                  </View>
                </View>
                <Text style={styles.intentDesc}>
                  Prova will find what's worth examining
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.intentCard}
            onPress={() => setShowDirectedInput(true)}
            activeOpacity={0.7}
          >
            <View style={styles.intentRow}>
              <View style={styles.iconContainer}>
                <Target size={18} color={colors.text.muted} />
              </View>
              <View style={styles.intentTextContainer}>
                <Text style={styles.intentTitle}>I have something</Text>
                <Text style={styles.intentDesc}>
                  Examine a specific belief, decision, or pattern
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {hasPreviousSessions && (
            <TouchableOpacity
              style={styles.intentCard}
              onPress={() => startSession('revisiting')}
              activeOpacity={0.7}
            >
              <View style={styles.intentRow}>
                <View style={styles.iconContainer}>
                  <RotateCcw size={18} color={colors.text.muted} />
                </View>
                <View style={styles.intentTextContainer}>
                  <Text style={styles.intentTitle}>Revisit a session</Text>
                  <Text style={styles.intentDesc}>
                    Go deeper on something from a previous session
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  heading: {
    fontFamily: 'InstrumentSerif-Regular',
    fontSize: 22,
    color: colors.white,
  },
  subtext: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 6,
    marginBottom: 32,
  },
  cards: {
    gap: 12,
  },
  intentCard: {
    padding: 18,
    paddingHorizontal: 16,
    borderRadius: radius['2xl'],
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  intentCardRecommended: {
    backgroundColor: colors.purple.faint,
    borderColor: colors.purple.border,
  },
  intentRow: {
    flexDirection: 'row',
    gap: 14,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  intentTextContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  intentTitle: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 14,
    color: colors.white,
  },
  badge: {
    backgroundColor: 'rgba(168,130,255,0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 9,
    textTransform: 'uppercase',
    color: '#C4ABFF',
  },
  intentDesc: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: colors.text.muted,
    lineHeight: 17,
    marginTop: 4,
  },
  textArea: {
    backgroundColor: colors.bg.input,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radius.lg,
    padding: 16,
    minHeight: 120,
    ...typography.body.default,
    color: colors.text.primary,
    textAlignVertical: 'top',
    marginTop: 24,
  },
  directedButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
});

export default SessionIntentScreen;
