import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { colors, typography } from '@/constants/theme';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
}

const Header = ({ title, showBack = false, rightElement }: HeaderProps) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {showBack ? (
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={20} color={colors.purple.soft} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}

      <Text style={styles.title}>{title}</Text>

      {rightElement ? rightElement : <View style={styles.placeholder} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    ...typography.button.secondary,
    color: colors.purple.soft,
  },
  title: {
    ...typography.display.small,
    color: colors.text.primary,
  },
  placeholder: {
    width: 60,
  },
});

export default Header;
