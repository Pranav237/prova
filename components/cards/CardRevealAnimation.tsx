import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import ProvaMonogram from '@/components/cards/ProvaMonogram';
import { colors, radius, shadows } from '@/constants/theme';

interface CardRevealAnimationProps {
  title: string;
  date: string;
  /** Reserved for future card artwork. Currently unused (editorial design). */
  artUrl?: string;
  metallicColor: string;
}

const CardRevealAnimation = ({
  title,
  date,
  metallicColor,
}: CardRevealAnimationProps) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });
    opacity.value = withTiming(1, { duration: 600 });
    translateY.value = withSpring(0, { damping: 12, stiffness: 100 });
  }, [scale, opacity, translateY]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.card, cardStyle, shadows.cardReveal]}>
      <LinearGradient
        colors={[`${metallicColor}1F`, colors.bg.card, '#0D0B14']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <View style={styles.cardContent}>
        <ProvaMonogram color={metallicColor} size={26} />
        <View style={styles.titleBlock}>
          <Text style={styles.cardTitle} numberOfLines={4}>
            {title}
          </Text>
          <View
            style={[styles.titleRule, { backgroundColor: `${metallicColor}66` }]}
          />
          <Text style={[styles.cardDate, { color: `${metallicColor}CC` }]}>
            {date}
          </Text>
        </View>
        <Text style={styles.watermark}>thinkprova.com</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 190,
    height: 260,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.purple.border,
    backgroundColor: colors.bg.card,
  },
  cardContent: {
    flex: 1,
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: 'InstrumentSerif-Regular',
    fontSize: 22,
    lineHeight: 26,
    color: colors.text.primary,
    textAlign: 'center',
  },
  titleRule: {
    width: 24,
    height: 1,
    marginTop: 12,
    marginBottom: 10,
  },
  cardDate: {
    fontFamily: 'DMSans-Regular',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    textAlign: 'center',
  },
  watermark: {
    fontFamily: 'DMSans-Regular',
    fontSize: 8,
    color: colors.text.ghost,
    textAlign: 'center',
  },
});

export default CardRevealAnimation;
