import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, typography, radius } from '@/constants/theme';
import type { MessageRole } from '@/lib/types';

interface MessageBubbleProps {
  content: string;
  role: MessageRole;
  isStreaming?: boolean;
}

const MessageBubble = ({ content, role, isStreaming = false }: MessageBubbleProps) => {
  const isProva = role === 'prova';

  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      style={[styles.wrapper, isProva ? styles.provaWrapper : styles.userWrapper]}
    >
      {isProva && <Text style={styles.provaLabel}>prova</Text>}
      <View style={[styles.bubble, isProva ? styles.provaBubble : styles.userBubble]}>
        <Text style={[styles.text, isProva ? styles.provaText : styles.userText]}>
          {content}
          {isStreaming && <Text style={styles.cursor}>|</Text>}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18,
  },
  provaWrapper: {
    alignItems: 'flex-start',
  },
  userWrapper: {
    alignItems: 'flex-end',
  },
  provaLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 10,
    color: colors.purple.soft,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  bubble: {
    padding: 12,
    paddingHorizontal: 14,
    maxWidth: '85%',
  },
  provaBubble: {
    backgroundColor: colors.purple.faint,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  userBubble: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.sm,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  text: {
    ...typography.body.default,
    lineHeight: 20,
  },
  provaText: {
    color: colors.text.secondary,
  },
  userText: {
    color: colors.text.tertiary,
  },
  cursor: {
    color: colors.purple.DEFAULT,
    fontWeight: '300',
  },
});

export default MessageBubble;
