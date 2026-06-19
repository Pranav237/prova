import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput as RNTextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Compass, Target, RotateCcw } from 'lucide-react-native';
import ScreenWrapper from '@/components/layout/ScreenWrapper';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useSessionStore } from '@/stores/sessionStore';
import {
  getActiveSession,
  getCompletedSessions,
  createSession,
  deleteSession,
  addMessage,
} from '@/lib/firestore';
import { colors, typography, radius } from '@/constants/theme';

/**
 * Intent picker. Reached either from the sessions dashboard ("Start a new
 * session") or after onboarding completes for the first time.
 */
const NewSessionScreen = () => {
  const router = useRouter();
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const profile = useAuthStore((s) => s.profile);
  const setIntent = useSessionStore((s) => s.setIntent);
  const setSessionId = useSessionStore((s) => s.setSessionId);

  const [showDirectedInput, setShowDirectedInput] = useState(false);
  const [directedPrompt, setDirectedPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasPreviousSessions, setHasPreviousSessions] = useState(false);

  /** Load past sessions presence (to show/hide "Revisit a session"). */
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!firebaseUser) return;
      try {
        const completed = await getCompletedSessions(firebaseUser.uid);
        if (!cancelled) setHasPreviousSessions(completed.length > 0);
      } catch {
        /* soft fail */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [firebaseUser]);

  const needsOnboarding = profile && !profile.hasCompletedOnboarding;

  const startSession = async (intent: 'open' | 'directed', prompt?: string) => {
    if (!firebaseUser) return;
    setLoading(true);

    try {
      // If there's an existing active session, ask before replacing.
      const active = await getActiveSession(firebaseUser.uid);
      if (active) {
        setLoading(false);
        Alert.alert(
          'You have an active session',
          'Discard it and start fresh, or keep it and continue later?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Continue old one',
              onPress: () => {
                setIntent(active.intent);
                setSessionId(active.id);
                router.replace('/(app)/(session)/conversation');
              },
            },
            {
              text: 'Discard and start new',
              style: 'destructive',
              onPress: async () => {
                setLoading(true);
                try {
                  await deleteSession(firebaseUser.uid, active.id);
                  await createAndOpen(intent, prompt);
                } finally {
                  setLoading(false);
                }
              },
            },
          ]
        );
        return;
      }

      setIntent(intent);

      if (needsOnboarding) {
        // Replace so the back button from onboarding (or from conversation
        // after onboarding) bounces straight back to the dashboard.
        router.replace('/(app)/(session)/onboarding');
        return;
      }

      await createAndOpen(intent, prompt);
    } catch (e) {
      console.error('Failed to start session:', e);
      setLoading(false);
    }
  };

  const createAndOpen = async (
    intent: 'open' | 'directed',
    prompt?: string
  ) => {
    if (!firebaseUser) return;
    const sessionId = await createSession(firebaseUser.uid, intent, {
      directedPrompt: prompt,
    });

    // For directed sessions, the prompt the user typed IS the first thing they
    // said in the conversation. Persist it as the opening user message so the
    // chat screen shows it (rather than just feeding it silently to the AI).
    if (intent === 'directed' && prompt?.trim()) {
      try {
        await addMessage(firebaseUser.uid, sessionId, {
          role: 'user',
          content: prompt.trim(),
        });
      } catch (e) {
        console.error('Failed to seed directed prompt:', e);
      }
    }

    setSessionId(sessionId);
    router.replace('/(app)/(session)/conversation');
  };

  if (showDirectedInput) {
    return (
      <ScreenWrapper gradient>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setShowDirectedInput(false)}
            style={styles.backButton}
            hitSlop={8}
          >
            <ChevronLeft size={18} color={colors.purple.soft} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.container}>
          <Text style={styles.heading}>What&apos;s on your mind?</Text>
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
              title="Cancel"
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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={8}
        >
          <ChevronLeft size={18} color={colors.purple.soft} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <LinearGradient
        colors={['rgba(120,80,200,0.08)', 'transparent']}
        style={styles.gradient}
        start={{ x: 0.5, y: 0.15 }}
        end={{ x: 0.5, y: 0.6 }}
      />
      <View style={styles.container}>
        <Text style={styles.heading}>How do you want to start?</Text>
        <Text style={styles.subtext}>
          You can always change direction mid-session.
        </Text>

        <View style={styles.cards}>
          <TouchableOpacity
            style={[styles.intentCard, styles.intentCardRecommended]}
            onPress={() => startSession('open')}
            activeOpacity={0.7}
            disabled={loading}
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
                  Prova will find what&apos;s worth examining
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.intentCard}
            onPress={() => setShowDirectedInput(true)}
            activeOpacity={0.7}
            disabled={loading}
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
              onPress={() => router.push('/(app)/(session)/revisit')}
              activeOpacity={0.7}
              disabled={loading}
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: colors.purple.soft,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
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

export default NewSessionScreen;
