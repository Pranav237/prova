import {
  TextInput as RNTextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps as RNTextInputProps,
} from 'react-native';
import { colors, typography, radius } from '@/constants/theme';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
}

const TextInput = ({ label, error, style, ...props }: TextInputProps) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <RNTextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={colors.text.faint}
        selectionColor={colors.purple.DEFAULT}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    ...typography.label.small,
    color: colors.text.muted,
  },
  input: {
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.input,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    paddingHorizontal: 16,
    ...typography.body.default,
    color: colors.text.primary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    ...typography.body.small,
    color: colors.danger,
  },
});

export default TextInput;
