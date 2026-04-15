import { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUp } from 'lucide-react-native';
import { colors, typography, radius } from '@/constants/theme';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSend, disabled = false }: ChatInputProps) => {
  const [text, setText] = useState('');
  const insets = useSafeAreaInsets();

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Reply..."
            placeholderTextColor={colors.text.faint}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={5000}
            editable={!disabled}
            selectionColor={colors.purple.DEFAULT}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          {text.trim().length > 0 && (
            <TouchableOpacity onPress={handleSend} disabled={disabled} activeOpacity={0.8}>
              <LinearGradient
                colors={colors.gradient.primaryButton}
                style={styles.sendButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <ArrowUp size={16} color={colors.white} strokeWidth={2.5} />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: colors.bg.primary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: colors.bg.input,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
  },
  input: {
    flex: 1,
    ...typography.body.default,
    color: colors.text.primary,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatInput;
