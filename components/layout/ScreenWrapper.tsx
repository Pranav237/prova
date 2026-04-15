import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/theme';

interface ScreenWrapperProps {
  children: React.ReactNode;
  gradient?: boolean;
  gradientCenter?: { x: number; y: number };
}

const ScreenWrapper = ({
  children,
  gradient = false,
  gradientCenter,
}: ScreenWrapperProps) => {
  return (
    <View style={styles.container}>
      {gradient && (
        <LinearGradient
          colors={['rgba(120,80,200,0.15)', 'transparent']}
          style={styles.gradient}
          start={{ x: gradientCenter?.x ?? 0.5, y: gradientCenter?.y ?? 0.3 }}
          end={{ x: 0.5, y: 0.8 }}
        />
      )}
      <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
});

export default ScreenWrapper;
