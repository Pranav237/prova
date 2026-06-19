import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { ChevronLeft, RotateCcw, Sparkles } from 'lucide-react-native';
import Exchange from '@/components/conversation/Exchange';
import TypingIndicator from '@/components/conversation/TypingIndicator';
import ChatInput from '@/components/conversation/ChatInput';
import { useAuthStore } from '@/stores/authStore';
import { useSessionStore } from '@/stores/sessionStore';
import {
  processMessage as processMessageApi,
  NotSignedInError,
  ApiError,
} from '@/lib/api';
import {
  addMessage,
  subscribeToMessages,
  subscribeToSession,
} from '@/lib/firestore';
import { finalizeSession } from '@/lib/finalizeSession';
import { colors, typography } from '@/constants/theme';
import type { Message, SessionQuality, Session } from '@/lib/types';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface ExchangeGroup {
  provaMessage: Message;
  userMessage: Message | null;
}

/**
 * `ready`     - input enabled, waiting for user to type
 * `sending`   - user message in flight to processMessage
 * `bootstrapping` - generating the very first AI opening message
 * `closing`   - AI sent a closing message; transitioning to ending screen
 */
type Phase = 'ready' | 'sending' | 'bootstrapping' | 'closing';

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function groupIntoExchanges(messages: Message[]): ExchangeGroup[] {
  const exchanges: ExchangeGroup[] = [];
  let i = 0;
  while (i < messages.length) {
    if (messages[i].role === 'prova') {
      const exchange: ExchangeGroup = {
        provaMessage: messages[i],
        userMessage: null,
      };
      if (i + 1 < messages.length && messages[i + 1].role === 'user') {
        exchange.userMessage = messages[i + 1];
        i += 2;
      } else {
        i += 1;
      }
      exchanges.push(exchange);
    } else {
      i += 1;
    }
  }
  return exchanges;
}

const QUALITY_OPACITY: Record<SessionQuality, number> = {
  building: 0.08,
  peaking: 0.18,
  winding_down: 0.12,
  complete: 0.1,
};

function describeError(e: unknown): string {
  if (e instanceof NotSignedInError) {
    return 'You need to be signed in.';
  }
  if (e instanceof ApiError) {
    if (e.isAuthError) {
      return 'Your sign in expired. Tap retry to refresh and continue.';
    }
    if (e.status >= 500) {
      return 'Something went wrong on our side. Tap retry.';
    }
    return e.message;
  }
  return 'Something interrupted the response. Tap retry.';
}

/* ------------------------------------------------------------------ */
/* Screen                                                             */
/* ------------------------------------------------------------------ */

const ConversationScreen = () => {
  const router = useRouter();
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const sessionId = useSessionStore((s) => s.sessionId);

  const scrollViewRef = useRef<ScrollView>(null);
  /** Prevents the bootstrap effect from re-firing across HMR / re-renders. */
  const bootstrapInFlight = useRef(false);
  /** Prevents the resume effect from re-firing while a resume is mid-flight. */
  const resumeInFlight = useRef(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [phase, setPhase] = useState<Phase>('ready');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [finalizationError, setFinalizationError] = useState<string | null>(null);
  /** Tracks whether the conversation has triggered finalizeSession for the
   *  current closing-message turn, so the effect doesn't fire it twice. */
  const finalizeStarted = useRef(false);

  const exchanges = useMemo(() => groupIntoExchanges(messages), [messages]);

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const isDangling = lastMessage?.role === 'user' && phase === 'ready';

  const latestQuality = useMemo<SessionQuality>(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].meta?.sessionQuality) {
        return messages[i].meta!.sessionQuality;
      }
    }
    return 'building';
  }, [messages]);

  /* ------------------------- Ambient gradient ----------------------- */

  const ambientOpacity = useSharedValue(QUALITY_OPACITY.building);

  useEffect(() => {
    ambientOpacity.value = withTiming(QUALITY_OPACITY[latestQuality], {
      duration: 2000,
    });
  }, [latestQuality, ambientOpacity]);

  const ambientStyle = useAnimatedStyle(() => ({
    opacity: ambientOpacity.value,
  }));

  /* ------------------------- Firestore subscriptions ---------------- */

  useEffect(() => {
    if (!firebaseUser || !sessionId) return;
    setMessagesLoaded(false);
    const unsub = subscribeToMessages(firebaseUser.uid, sessionId, (msgs) => {
      setMessages(msgs);
      setMessagesLoaded(true);
    });
    return unsub;
  }, [firebaseUser, sessionId]);

  useEffect(() => {
    if (!firebaseUser || !sessionId) return;
    setSessionLoaded(false);
    const unsub = subscribeToSession(firebaseUser.uid, sessionId, (s) => {
      setSession(s);
      setSessionLoaded(true);
    });
    return unsub;
  }, [firebaseUser, sessionId]);

  /* ------------------------- Reset on unmount ----------------------- */

  useEffect(() => {
    return () => {
      bootstrapInFlight.current = false;
      resumeInFlight.current = false;
    };
  }, []);

  /* ------------------------- Bootstrap opening ---------------------- */

  useEffect(() => {
    if (!firebaseUser || !sessionId) return;
    // Wait for the first Firestore snapshot before deciding whether to
    // greet. Otherwise resuming a session synchronously sees `[]` and
    // generates a brand-new opening, overwriting the actual history.
    if (!messagesLoaded) return;
    if (messages.length > 0) return;
    if (bootstrapInFlight.current) return;
    if (phase === 'closing') return;

    bootstrapInFlight.current = true;

    void (async () => {
      setPhase('bootstrapping');
      setErrorText(null);
      try {
        const result = await processMessageApi({
          sessionId,
          isSessionStart: true,
        });
        await addMessage(firebaseUser.uid, sessionId, {
          role: 'prova',
          content: result.data.response,
          meta: result.data.meta,
        });
      } catch (e) {
        console.error('Failed to generate opening:', e);
        setErrorText(describeError(e));
      } finally {
        bootstrapInFlight.current = false;
        setPhase('ready');
      }
    })();
  }, [firebaseUser, sessionId, messages.length, messagesLoaded, phase]);

  /* ------------------------- Auto resume dangling user msg ----------- */

  useEffect(() => {
    if (!firebaseUser || !sessionId) return;
    if (!messagesLoaded) return;
    if (!isDangling) return;
    if (resumeInFlight.current) return;
    if (phase !== 'ready') return;
    if (errorText) return; // user must retry manually after an error

    resumeInFlight.current = true;

    void (async () => {
      setPhase('sending');
      setErrorText(null);
      try {
        const result = await processMessageApi({ sessionId, isResume: true });
        const { response, meta } = result.data;
        await addMessage(firebaseUser.uid, sessionId, {
          role: 'prova',
          content: response,
          meta,
        });
        if (meta.isClosingMessage) {
          setPhase('closing');
          return;
        }
      } catch (e) {
        console.error('Failed to resume conversation:', e);
        setErrorText(describeError(e));
      } finally {
        resumeInFlight.current = false;
        setPhase((p) => (p === 'closing' ? p : 'ready'));
      }
    })();
  }, [
    firebaseUser,
    sessionId,
    messagesLoaded,
    isDangling,
    phase,
    errorText,
    router,
  ]);

  /* ------------------------- React to remote status changes --------- */

  useEffect(() => {
    if (!sessionLoaded) return;
    if (!session) {
      // Session was deleted (e.g. abandoned from another tab/device). Bounce.
      useSessionStore.getState().reset();
      router.replace('/(app)/(session)');
      return;
    }
    if (session.status === 'incomplete') {
      useSessionStore.getState().reset();
      router.replace('/(app)/(session)');
      return;
    }
    if (session.status === 'complete') {
      // The active finalize flow handles the celebratory /reveal navigation.
      // We only bounce to the card view here when this is a *stale* session
      // (already completed before we landed) — meaning no in-flight finalize.
      if (phase === 'closing' || finalizeStarted.current) return;
      const completedId = sessionId;
      useSessionStore.getState().reset();
      if (completedId) {
        router.replace(`/(app)/(session)/${completedId}`);
      } else {
        router.replace('/(app)/(session)');
      }
    }
  }, [session, sessionLoaded, router, sessionId, phase]);

  /* ------------------------- Auto-scroll ---------------------------- */

  useEffect(() => {
    if (exchanges.length > 0 || phase === 'sending' || phase === 'bootstrapping') {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [exchanges.length, phase]);

  /* ------------------------- Finalize session in background ----------- */

  // If the conversation is reopened (or hot-reloaded) and the last AI message
  // is a closing message, jump straight into the closing phase so the user
  // sees the "putting your card together" banner and we re-trigger
  // finalization (which is module-level deduped — safe to call again).
  useEffect(() => {
    if (!messagesLoaded) return;
    if (phase !== 'ready') return;
    const lastProva = [...messages].reverse().find((m) => m.role === 'prova');
    if (lastProva?.meta?.isClosingMessage) {
      setPhase('closing');
    }
  }, [messagesLoaded, messages, phase]);

  // When the AI sends a closing message, we transition to phase === 'closing'
  // and start generating the card+pdf in the background. The user stays on
  // this screen to read the final message; we show a small banner with a
  // "Watch" affordance, and auto-navigate to /reveal when the card is ready.
  const triggerFinalize = useCallback(() => {
    if (!firebaseUser || !sessionId) return;
    if (finalizeStarted.current) return;
    finalizeStarted.current = true;
    setFinalizationError(null);

    finalizeSession(firebaseUser.uid, sessionId)
      .then((result) => {
        router.replace({
          pathname: '/(app)/(session)/reveal',
          params: {
            cardTitle: result.data.cardTitle,
            cardArtUrl: result.data.cardArtUrl,
            cardMetallicColor: result.data.cardMetallicColor,
            pdfUrl: result.data.pdfUrl,
          },
        });
      })
      .catch((e) => {
        console.error('Finalization failed:', e);
        finalizeStarted.current = false;
        if (e instanceof NotSignedInError) {
          setFinalizationError('Sign in expired. Tap retry.');
        } else if (e instanceof ApiError && e.isAuthError) {
          setFinalizationError('Sign in expired. Tap retry.');
        } else {
          setFinalizationError(
            'Something went wrong putting your card together. Tap retry.'
          );
        }
      });
  }, [firebaseUser, sessionId, router]);

  useEffect(() => {
    if (phase !== 'closing') return;
    triggerFinalize();
  }, [phase, triggerFinalize]);

  const handleWatchFinalization = useCallback(() => {
    router.replace('/(app)/(session)/ending');
  }, [router]);

  /* ------------------------- Handlers ------------------------------- */

  const handleLeave = useCallback(() => {
    // Session stays active. User can resume from the dashboard later, or
    // explicitly discard it from there.
    router.back();
  }, [router]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!firebaseUser || !sessionId) return;
      if (phase !== 'ready') return;

      setPhase('sending');
      setErrorText(null);
      let isClosingNow = false;

      try {
        await addMessage(firebaseUser.uid, sessionId, {
          role: 'user',
          content: text,
        });

        const result = await processMessageApi({
          sessionId,
          userMessage: text,
        });

        const { response, meta } = result.data;

        await addMessage(firebaseUser.uid, sessionId, {
          role: 'prova',
          content: response,
          meta,
        });

        if (meta.isClosingMessage) {
          isClosingNow = true;
          setPhase('closing');
        }
      } catch (e) {
        console.error('Failed to process message:', e);
        setErrorText(describeError(e));
      } finally {
        if (!isClosingNow) setPhase('ready');
      }
    },
    [firebaseUser, sessionId, phase, router]
  );

  const handleRetry = useCallback(async () => {
    if (!firebaseUser || !sessionId) return;
    setErrorText(null);

    // What we retry depends on what was last attempted:
    //   - No messages yet → bootstrap
    //   - Last message is from user → resume (server already has the user turn)
    //   - Otherwise → nothing to retry; just unblock the input
    if (messages.length === 0) {
      bootstrapInFlight.current = false; // allow re-fire
      // The bootstrap effect will pick this up automatically.
      return;
    }

    if (lastMessage?.role === 'user') {
      resumeInFlight.current = false;
      // The resume effect will pick this up automatically.
      return;
    }
  }, [firebaseUser, sessionId, messages.length, lastMessage]);

  /* ------------------------- Render --------------------------------- */

  const showTyping =
    phase === 'sending' || phase === 'bootstrapping' || phase === 'closing';
  const inputDisabled = phase !== 'ready' || !!errorText;
  const inputPlaceholder =
    phase === 'bootstrapping'
      ? 'Prova is opening the session...'
      : phase === 'sending'
        ? 'Prova is thinking...'
        : phase === 'closing'
          ? 'Wrapping up...'
          : errorText
            ? 'Tap retry below'
            : 'What comes to mind...';

  return (
    <View style={styles.screen}>
      <Animated.View style={[StyleSheet.absoluteFillObject, ambientStyle]}>
        <LinearGradient
          colors={['rgba(120,80,200,1)', 'transparent']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 0.15 }}
          end={{ x: 0.5, y: 0.7 }}
        />
      </Animated.View>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.kavContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleLeave}
              hitSlop={8}
              style={styles.headerBack}
            >
              <ChevronLeft size={18} color={colors.text.muted} />
            </TouchableOpacity>
            <Text style={styles.headerWordmark}>prova</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
          >
            <View style={styles.spacer} />

            {exchanges.map((exchange, i) => (
              <Exchange
                key={exchange.provaMessage.id}
                provaContent={exchange.provaMessage.content}
                userContent={exchange.userMessage?.content ?? null}
                isFocused={i === exchanges.length - 1}
              />
            ))}

            {showTyping && <TypingIndicator />}
          </ScrollView>

          {errorText && (
            <View style={styles.errorBar}>
              <Text style={styles.errorText}>{errorText}</Text>
              <TouchableOpacity
                onPress={handleRetry}
                style={styles.retryButton}
                activeOpacity={0.7}
              >
                <RotateCcw size={12} color={colors.purple.DEFAULT} />
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {phase === 'closing' && !finalizationError && (
            <View style={styles.closingBar}>
              <View style={styles.closingTextWrap}>
                <Sparkles size={13} color={colors.purple.DEFAULT} />
                <Text style={styles.closingText}>
                  Putting your card together...
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleWatchFinalization}
                style={styles.closingButton}
                activeOpacity={0.7}
              >
                <Text style={styles.closingButtonText}>Watch</Text>
              </TouchableOpacity>
            </View>
          )}

          {phase === 'closing' && finalizationError && (
            <View style={styles.errorBar}>
              <Text style={styles.errorText}>{finalizationError}</Text>
              <TouchableOpacity
                onPress={triggerFinalize}
                style={styles.retryButton}
                activeOpacity={0.7}
              >
                <RotateCcw size={12} color={colors.purple.DEFAULT} />
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {phase !== 'closing' && (
            <ChatInput
              onSend={handleSend}
              disabled={inputDisabled}
              placeholder={inputPlaceholder}
            />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  safeArea: {
    flex: 1,
  },
  kavContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  headerBack: {
    width: 28,
    height: 28,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 28,
  },
  headerWordmark: {
    fontFamily: 'InstrumentSerif-Regular',
    fontSize: 17,
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  spacer: {
    flex: 1,
    minHeight: 40,
  },
  errorBar: {
    marginHorizontal: 24,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(168,130,255,0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.purple.border,
  },
  errorText: {
    ...typography.body.small,
    color: colors.text.secondary,
    flex: 1,
    marginRight: 12,
  },
  closingBar: {
    marginHorizontal: 24,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: colors.purple.faint,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.purple.border,
  },
  closingTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  closingText: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  closingButton: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.purple.DEFAULT,
  },
  closingButtonText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 11,
    color: colors.white,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: colors.purple.faint,
  },
  retryText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 11,
    color: colors.purple.DEFAULT,
  },
});

export default ConversationScreen;
