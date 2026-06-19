import { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, ImageBackground, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, radius, shadows } from '@/constants/theme';

interface InteractiveCardProps {
  title: string;
  date: string;
  artUrl?: string;
  metallicColor: string;
  /** Optional content rendered on the back face when the card is flipped. */
  backContent?: React.ReactNode;
}

export interface InteractiveCardHandle {
  /** Returns the inner view ref (for view-shot capture). */
  getCaptureRef: () => React.MutableRefObject<View | null>;
  resetToFront: () => void;
}

const CARD_WIDTH = 240;
const CARD_HEIGHT = 330;

/**
 * A 3D-flip card. A single tap toggles between front (art + title) and
 * back (the prova mark). The flip runs on the UI thread via reanimated
 * worklets so it stays smooth even on a packed screen.
 */
const InteractiveCard = forwardRef<InteractiveCardHandle, InteractiveCardProps>(
  ({ title, date, artUrl, metallicColor, backContent }, ref) => {
    const captureRef = useRef<View | null>(null);
    const rotateY = useSharedValue(0); // 0 = front, 180 = back

    useImperativeHandle(ref, () => ({
      getCaptureRef: () => captureRef,
      resetToFront: () => {
        rotateY.value = withSpring(0, { damping: 18, stiffness: 100 });
      },
    }));

    const tap = Gesture.Tap()
      .maxDuration(260)
      .onEnd(() => {
        'worklet';
        rotateY.value = withSpring(rotateY.value < 90 ? 180 : 0, {
          damping: 18,
          stiffness: 100,
        });
      });

    const frontStyle = useAnimatedStyle(() => {
      const visibility = interpolate(
        rotateY.value,
        [0, 89, 90, 180],
        [1, 1, 0, 0],
        Extrapolation.CLAMP
      );
      return {
        transform: [{ perspective: 1000 }, { rotateY: `${rotateY.value}deg` }],
        opacity: visibility,
      };
    });

    const backStyle = useAnimatedStyle(() => {
      const visibility = interpolate(
        rotateY.value,
        [0, 90, 91, 180],
        [0, 0, 1, 1],
        Extrapolation.CLAMP
      );
      return {
        transform: [
          { perspective: 1000 },
          { rotateY: `${rotateY.value - 180}deg` },
        ],
        opacity: visibility,
      };
    });

    return (
      <GestureDetector gesture={tap}>
        <Animated.View style={[styles.outer, shadows.cardReveal]} collapsable={false}>
          <View ref={captureRef} collapsable={false} style={styles.captureRoot}>
            <Animated.View style={[styles.face, frontStyle]}>
              {artUrl ? (
                <ImageBackground
                  source={{ uri: artUrl }}
                  style={styles.artArea}
                  imageStyle={styles.artImage}
                >
                  <LinearGradient
                    colors={[`${metallicColor}40`, colors.bg.card]}
                    style={StyleSheet.absoluteFillObject}
                  />
                </ImageBackground>
              ) : (
                <LinearGradient
                  colors={colors.gradient.cardSurface}
                  style={styles.artArea}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}
              <View style={styles.contentArea}>
                <Text style={styles.cardTitle} numberOfLines={3}>
                  {title}
                </Text>
                <Text style={styles.cardDate}>{date}</Text>
                <Text style={styles.watermark}>thinkprova.com</Text>
              </View>
            </Animated.View>

            <Animated.View
              style={[styles.face, styles.backFace, backStyle]}
              pointerEvents="none"
            >
              <LinearGradient
                colors={[`${metallicColor}30`, colors.bg.card, '#0D0B14']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.backInner}>
                {backContent ?? (
                  <>
                    <Text style={styles.backTitle}>prova</Text>
                    <Text style={styles.backSub}>know what you think</Text>
                  </>
                )}
              </View>
            </Animated.View>
          </View>
        </Animated.View>
      </GestureDetector>
    );
  }
);

InteractiveCard.displayName = 'InteractiveCard';

const styles = StyleSheet.create({
  outer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  captureRoot: {
    width: '100%',
    height: '100%',
  },
  face: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.purple.border,
    backgroundColor: colors.bg.card,
    backfaceVisibility: 'hidden',
  },
  backFace: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  artArea: {
    height: CARD_HEIGHT * 0.58,
  },
  artImage: {
    resizeMode: 'cover',
  },
  contentArea: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontFamily: 'InstrumentSerif-Regular',
    fontSize: 17,
    lineHeight: 22,
    color: colors.text.primary,
  },
  cardDate: {
    fontFamily: 'DMSans-Regular',
    fontSize: 10,
    color: colors.purple.soft,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 6,
  },
  watermark: {
    fontFamily: 'DMSans-Regular',
    fontSize: 9,
    color: colors.text.ghost,
    textAlign: 'center',
  },
  backInner: {
    alignItems: 'center',
    gap: 6,
  },
  backTitle: {
    fontFamily: 'InstrumentSerif-Regular',
    fontSize: 32,
    color: colors.white,
    letterSpacing: -0.5,
  },
  backSub: {
    ...typography.label.tiny,
    color: colors.purple.soft,
  },
});

export default InteractiveCard;
