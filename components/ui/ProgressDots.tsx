import { View, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

interface ProgressDotsProps {
  total: number;
  current: number;
}

const ProgressDots = ({ total, current }: ProgressDotsProps) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { backgroundColor: i <= current ? colors.purple.DEFAULT : colors.border.DEFAULT },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 32,
  },
  dot: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
});

export default ProgressDots;
