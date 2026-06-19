import { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUp } from 'lucide-react-native';
import { colors } from '@/constants/theme';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput = ({
  onSend,
  disabled = false,
  placeholder = 'What comes to mind...',
}: ChatInputProps) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.separator} />
      <View style={styles.inputArea}>
        <TextInput
          style={[styles.input, disabled && styles.inputDisabled]}
          placeholder={placeholder}
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
          <TouchableOpacity
            onPress={handleSend}
            disabled={disabled}
            activeOpacity={0.8}
            style={styles.sendButtonWrapper}
          >
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
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: 16,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.primary,
    maxHeight: 200,
    minHeight: 24,
    paddingVertical: 0,
  },
  inputDisabled: {
    color: colors.text.muted,
  },
  sendButtonWrapper: {
    marginBottom: 2,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatInput;
