import { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import ScreenWrapper from '@/components/layout/ScreenWrapper';
import ProgressDots from '@/components/ui/ProgressDots';
import MCQOption from '@/components/ui/MCQOption';
import ProvaReaction from '@/components/ui/ProvaReaction';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useSessionStore } from '@/stores/sessionStore';
import { generateOnboarding } from '@/lib/api';
import { createSession, updateUserProfile, updateSession } from '@/lib/firestore';
import { colors, typography, radius } from '@/constants/theme';
import type { OnboardingPrompt } from '@/lib/types';

const CUSTOM_OPTION_INDEX = 999;

const OnboardingScreen = () => {
  const router = useRouter();
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const setSessionId = useSessionStore((s) => s.setSessionId);
  const setIntent = useSessionStore((s) => s.setIntent);

  const [prompts, setPrompts] = useState<OnboardingPrompt[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [customTexts, setCustomTexts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadPrompts = async () => {
      if (!firebaseUser) return;
      try {
        const result = await generateOnboarding({
          userId: firebaseUser.uid,
          isFirstSession: true,
        });
        setPrompts(result.data.prompts);
      } catch (e) {
        console.error('Failed to generate onboarding:', e);
        setPrompts([
          {
            question: "When someone disagrees with you about something you care about, what do you notice first?",
            options: [
              "I start building my counter-argument before they finish",
              "I feel a flash of something. Not anger, but a need to be understood",
              "I get curious about why they see it differently"
            ],
            provaReactions: {
              0: "The instinct to prepare your defense mid-conversation. There's something worth examining there.",
              1: "That need to be understood, not just heard. That distinction says something about what's at stake for you.",
              2: "Genuine curiosity under disagreement is rarer than people think. Let's see what that looks like in practice."
            }
          },
          {
            question: "Think of a decision you made recently that surprised you. What was more surprising: the choice itself, or your reasons for it?",
            options: [
              "The choice. It didn't match who I think I am",
              "The reasons. I couldn't explain them even to myself"
            ],
            provaReactions: {
              0: "When our actions don't match our self-image, it's usually the self-image that's incomplete.",
              1: "The reasons you can't explain are often the most honest ones."
            }
          },
          {
            question: "When you read something that challenges a belief you hold, what do you do with that feeling?",
            options: [
              "I look for weaknesses in the argument",
              "I sit with it and notice how it lands",
              "I file it away and move on"
            ],
            provaReactions: {
              0: "Looking for weaknesses isn't the same as finding them. The distinction matters.",
              1: "That willingness to sit with discomfort. It's where most of the real thinking happens.",
              2: "Filing things away is a strategy too. Worth asking what's in the archive."
            }
          },
          {
            question: "For this session, would you like Prova to lead the conversation, or do you have something specific in mind?",
            options: [
              "Let Prova lead, find what's worth examining",
              "I have something specific I want to explore"
            ],
            provaReactions: {
              0: "Good. Let's see what surfaces.",
              1: "That clarity of purpose is a good starting point."
            }
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadPrompts();
  }, [firebaseUser]);

  const currentPrompt = prompts[currentIndex];
  const selectedOption = selectedOptions[currentIndex];
  const isCustomSelected = selectedOption === CUSTOM_OPTION_INDEX;
  const customText = customTexts[currentIndex] || '';
  const isLastPrompt = currentIndex === prompts.length - 1;

  const hasValidSelection = selectedOption !== undefined &&
    (!isCustomSelected || customText.trim().length > 0);

  const handleContinue = async () => {
    if (isLastPrompt) {
      if (!firebaseUser) return;
      setSubmitting(true);
      try {
        const intent = selectedOption === 1 ? 'directed' : 'open';
        setIntent(intent as 'open' | 'directed');

        const onboardingAnswers = prompts.slice(0, -1).map((p, i) => {
          const sel = selectedOptions[i];
          const isCustom = sel === CUSTOM_OPTION_INDEX;
          return {
            question: p.question,
            answer: isCustom ? customTexts[i] || '' : p.options[sel],
            reaction: isCustom ? 'User provided their own answer.' : p.provaReactions[sel],
          };
        });

        const sessionId = await createSession(firebaseUser.uid, intent as 'open' | 'directed');
        setSessionId(sessionId);

        await updateSession(firebaseUser.uid, sessionId, { onboardingAnswers } as any);
        await updateUserProfile(firebaseUser.uid, { hasCompletedOnboarding: true });
        await refreshProfile();

        router.replace('/(app)/(session)/conversation');
      } catch (e) {
        console.error('Failed to start session after onboarding:', e);
      } finally {
        setSubmitting(false);
      }
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (loading || !currentPrompt) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Preparing your first session...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ProgressDots total={prompts.length} current={currentIndex} />

        <Animated.View
          key={currentIndex}
          entering={SlideInRight.duration(250)}
          exiting={SlideOutLeft.duration(250)}
        >
          <Text style={styles.question}>{currentPrompt.question}</Text>
          <Text style={styles.hint}>What's your first instinct?</Text>

          <View style={styles.options}>
            {currentPrompt.options.map((option, index) => (
              <MCQOption
                key={index}
                text={option}
                selected={selectedOption === index}
                onSelect={() => {
                  Keyboard.dismiss();
                  setSelectedOptions((prev) => ({ ...prev, [currentIndex]: index }));
                }}
              />
            ))}
            {!isLastPrompt && (
              <MCQOption
                text="Something else"
                selected={isCustomSelected}
                onSelect={() =>
                  setSelectedOptions((prev) => ({ ...prev, [currentIndex]: CUSTOM_OPTION_INDEX }))
                }
              />
            )}
          </View>

          {isCustomSelected && !isLastPrompt && (
            <TextInput
              style={styles.customInput}
              placeholder="Type your answer..."
              placeholderTextColor={colors.text.faint}
              value={customText}
              onChangeText={(t) =>
                setCustomTexts((prev) => ({ ...prev, [currentIndex]: t }))
              }
              multiline
              maxLength={300}
              autoFocus
              selectionColor={colors.purple.DEFAULT}
            />
          )}

          {selectedOption !== undefined && !isCustomSelected && currentPrompt.provaReactions[selectedOption] && (
            <ProvaReaction text={currentPrompt.provaReactions[selectedOption]} />
          )}
        </Animated.View>

        <View style={styles.bottomArea}>
          {hasValidSelection && (
            <Button
              title={isLastPrompt ? 'Begin Session' : 'Continue'}
              onPress={handleContinue}
              loading={submitting}
            />
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  question: {
    ...typography.display.small,
    color: colors.white,
  },
  hint: {
    ...typography.body.small,
    color: colors.text.muted,
    marginTop: 8,
    marginBottom: 28,
  },
  options: {
    gap: 10,
  },
  customInput: {
    marginTop: 12,
    backgroundColor: colors.bg.input,
    borderWidth: 1,
    borderColor: colors.purple.border,
    borderRadius: radius.lg,
    padding: 14,
    minHeight: 80,
    ...typography.body.default,
    color: colors.text.primary,
    textAlignVertical: 'top',
  },
  bottomArea: {
    marginTop: 'auto',
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body.default,
    color: colors.text.muted,
  },
});

export default OnboardingScreen;
