import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenWrapper from '@/components/layout/ScreenWrapper';
import CardRevealAnimation from '@/components/cards/CardRevealAnimation';
import Button from '@/components/ui/Button';
import { useSessionStore } from '@/stores/sessionStore';
import { colors, typography } from '@/constants/theme';

const RevealScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    cardTitle: string;
    cardArtUrl: string;
    cardMetallicColor: string;
    pdfUrl: string;
  }>();

  const sessionId = useSessionStore((s) => s.sessionId);
  const reset = useSessionStore((s) => s.reset);

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleViewPDF = () => {
    if (sessionId) {
      router.push(`/(app)/(cards)/${sessionId}`);
    }
  };

  const handleSaveCard = () => {
    // TODO: Implement card capture and save to camera roll
  };

  const handleDone = () => {
    reset();
    router.replace('/(app)/(cards)');
  };

  return (
    <ScreenWrapper>
      <LinearGradient
        colors={['rgba(120,80,200,0.12)', colors.bg.primary]}
        style={styles.gradient}
        start={{ x: 0.5, y: 0.3 }}
        end={{ x: 0.5, y: 0.65 }}
      />
      <View style={styles.content}>
        <View style={styles.cardContainer}>
          <CardRevealAnimation
            title={params.cardTitle || 'Your Card'}
            date={formatDate()}
            artUrl={params.cardArtUrl}
            metallicColor={params.cardMetallicColor || '#A882FF'}
          />
        </View>

        <Animated.View entering={FadeIn.delay(600).duration(400)}>
          <Text style={styles.readyText}>Your card is ready</Text>
          <Text style={styles.interactionHint}>Tap to flip · Pinch to zoom</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(800).duration(300)}
          style={styles.buttons}
        >
          <View style={styles.buttonRow}>
            <View style={{ flex: 1 }}>
              <Button title="View PDF" variant="secondary" onPress={handleViewPDF} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Save Card" onPress={handleSaveCard} />
            </View>
          </View>

          <Button title="Done" variant="ghost" onPress={handleDone} />
        </Animated.View>
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
    paddingHorizontal: 32,
  },
  cardContainer: {
    marginBottom: 24,
  },
  readyText: {
    fontFamily: 'InstrumentSerif-Regular',
    fontSize: 16,
    color: colors.white,
    textAlign: 'center',
  },
  interactionHint: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: 6,
  },
  buttons: {
    width: '100%',
    marginTop: 28,
    gap: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
});

export default RevealScreen;
