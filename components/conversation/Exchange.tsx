import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import { colors, typography } from '@/constants/theme';

interface ExchangeProps {
  provaContent: string;
  userContent: string | null;
  isFocused: boolean;
}

const Exchange = ({ provaContent, userContent, isFocused }: ExchangeProps) => {
  const opacity = useSharedValue(isFocused ? 0 : 0.35);

  useEffect(() => {
    opacity.value = withTiming(isFocused ? 1 : 0.35, { duration: 600 });
  }, [isFocused, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.exchange,
        isFocused ? styles.exchangeFocused : styles.exchangeReceded,
        animatedStyle,
      ]}
    >
      <View style={styles.provaMessage}>
        <View style={styles.provaAccent} />
        <Text style={isFocused ? styles.provaTextFocused : styles.provaTextReceded}>
          {provaContent}
        </Text>
      </View>

      {userContent !== null && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={isFocused ? styles.userMessageFocused : styles.userMessageReceded}
        >
          <Text style={isFocused ? styles.userTextFocused : styles.userTextReceded}>
            {userContent}
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  exchange: {},
  exchangeFocused: {
    marginBottom: 8,
  },
  exchangeReceded: {
    marginBottom: 16,
  },
  provaMessage: {
    flexDirection: 'row',
  },
  provaAccent: {
    width: 2,
    backgroundColor: 'rgba(168,130,255,0.3)',
    borderRadius: 1,
    marginRight: 16,
  },
  provaTextFocused: {
    ...typography.conversation.provaVoice,
    color: colors.text.secondary,
    flex: 1,
  },
  provaTextReceded: {
    ...typography.conversation.provaVoiceReceded,
    color: colors.text.secondary,
    flex: 1,
  },
  userMessageFocused: {
    marginTop: 20,
    paddingLeft: 18,
  },
  userMessageReceded: {
    marginTop: 12,
    paddingLeft: 18,
  },
  userTextFocused: {
    ...typography.conversation.userVoice,
    color: colors.text.primary,
  },
  userTextReceded: {
    ...typography.conversation.userVoiceReceded,
    color: colors.text.primary,
  },
});

export default Exchange;
