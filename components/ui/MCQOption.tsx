import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors, typography, radius } from '@/constants/theme';

interface MCQOptionProps {
  text: string;
  selected: boolean;
  onSelect: () => void;
}

const MCQOption = ({ text, selected, onSelect }: MCQOptionProps) => {
  return (
    <TouchableOpacity
      onPress={onSelect}
      style={[styles.container, selected && styles.containerSelected]}
      activeOpacity={0.7}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioFill} />}
      </View>
      <Text style={[styles.text, selected && styles.textSelected]}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: 12,
  },
  containerSelected: {
    backgroundColor: colors.purple.faint,
    borderColor: colors.purple.borderStrong,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.text.ghost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderWidth: 2,
    borderColor: colors.purple.DEFAULT,
  },
  radioFill: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.purple.DEFAULT,
  },
  text: {
    ...typography.body.default,
    color: colors.text.tertiary,
    flex: 1,
  },
  textSelected: {
    color: '#D4C0FF',
  },
});

export default MCQOption;
