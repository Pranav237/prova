import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, typography, radius } from '@/constants/theme';

interface ProvaReactionProps {
  text: string;
}

const ProvaReaction = ({ text }: ProvaReactionProps) => {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: radius.xl,
    backgroundColor: colors.purple.ghost,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(168,130,255,0.3)',
  },
  text: {
    ...typography.body.small,
    color: 'rgba(168,130,255,0.7)',
  },
});

export default ProvaReaction;
