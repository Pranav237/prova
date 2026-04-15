import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import ScreenWrapper from '@/components/layout/ScreenWrapper';
import { useAuthStore } from '@/stores/authStore';
import { signOut } from '@/lib/auth';
import { colors, typography } from '@/constants/theme';

interface SettingsRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

const SettingsRow = ({ label, value, onPress, danger }: SettingsRowProps) => (
  <TouchableOpacity
    style={styles.row}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.rowLabel, danger && styles.dangerText]}>{label}</Text>
    {value && (
      <View style={styles.rowRight}>
        <Text style={styles.rowValue}>{value}</Text>
        <ChevronRight size={14} color={colors.text.faint} />
      </View>
    )}
    {!value && onPress && <ChevronRight size={14} color={colors.text.faint} />}
  </TouchableOpacity>
);

const SettingsScreen = () => {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/sign-in');
    } catch (e) {
      console.error('Sign out failed:', e);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data including sessions, cards, and PDFs. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('Coming Soon', 'Account deletion will be available in a future update.');
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <SettingsRow
            label="Display name"
            value={profile?.displayName || firebaseUser?.displayName || '—'}
          />
          <SettingsRow
            label="Email"
            value={profile?.email || firebaseUser?.email || '—'}
          />
          <SettingsRow
            label="Two-factor auth"
            value="Not enabled"
          />
        </View>

        <View style={styles.spacer} />

        <View style={styles.section}>
          <SettingsRow
            label="Past sessions"
            onPress={() => router.push('/(app)/(settings)/sessions')}
          />
          <SettingsRow label="Privacy policy" onPress={() => {}} />
          <SettingsRow label="Terms of service" onPress={() => {}} />
        </View>

        <View style={styles.spacerLarge} />

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />

        <SettingsRow label="Delete account" onPress={handleDeleteAccount} danger />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  title: {
    fontFamily: 'InstrumentSerif-Regular',
    fontSize: 22,
    color: colors.white,
  },
  content: {
    paddingHorizontal: 20,
  },
  section: {},
  spacer: {
    height: 24,
  },
  spacerLarge: {
    height: 32,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  rowLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: colors.text.tertiary,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowValue: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: colors.text.muted,
  },
  dangerText: {
    color: colors.danger,
  },
  signOutButton: {
    paddingVertical: 14,
  },
  signOutText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 13,
    color: colors.purple.DEFAULT,
  },
});

export default SettingsScreen;
