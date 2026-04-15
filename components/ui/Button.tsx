import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, radius } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) => {
  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[{ opacity: isDisabled ? 0.5 : 1 }, style]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={colors.gradient.primaryButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.primaryButton}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={[styles.primaryText, textStyle]}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        variant === 'secondary' ? styles.secondaryButton : styles.ghostButton,
        { opacity: isDisabled ? 0.5 : 1 },
        style,
      ]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'secondary' ? colors.text.tertiary : colors.purple.DEFAULT}
          size="small"
        />
      ) : (
        <Text
          style={[
            variant === 'secondary' ? styles.secondaryText : styles.ghostText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  primaryButton: {
    height: 48,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    ...typography.button.primary,
    color: colors.white,
  },
  secondaryButton: {
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  secondaryText: {
    ...typography.button.secondary,
    color: colors.text.tertiary,
  },
  ghostButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: {
    ...typography.button.secondary,
    color: colors.purple.DEFAULT,
  },
});

export default Button;
