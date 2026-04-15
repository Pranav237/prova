import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors, radius } from '@/constants/theme';

interface EmptyCardSlotProps {
  onPress: () => void;
}

const EmptyCardSlot = ({ onPress }: EmptyCardSlotProps) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.circle}>
        <Text style={styles.plus}>+</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 160,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.purple.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: {
    fontSize: 18,
    color: 'rgba(168,130,255,0.3)',
    marginTop: -1,
  },
});

export default EmptyCardSlot;
