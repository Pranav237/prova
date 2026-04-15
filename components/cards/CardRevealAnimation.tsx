import { useEffect } from 'react';
import { StyleSheet, ImageBackground, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, radius, shadows } from '@/constants/theme';

interface CardRevealAnimationProps {
  title: string;
  date: string;
  artUrl?: string;
  metallicColor: string;
}

const CardRevealAnimation = ({
  title,
  date,
  artUrl,
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
      {artUrl && (
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
      )}
      {!artUrl && (
        <LinearGradient
          colors={colors.gradient.cardSurface}
          style={styles.artArea}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDate}>{date}</Text>
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
  artArea: {
    height: 150,
  },
  artImage: {
    resizeMode: 'cover',
  },
  cardContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  cardTitle: {
    ...typography.display.card,
    color: colors.text.primary,
  },
  cardDate: {
    fontFamily: 'DMSans-Regular',
    fontSize: 9,
    color: colors.purple.soft,
    textTransform: 'uppercase',
  },
  watermark: {
    fontFamily: 'DMSans-Regular',
    fontSize: 8,
    color: colors.text.ghost,
    textAlign: 'center',
  },
});

export default CardRevealAnimation;
