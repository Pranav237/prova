import { Stack, Redirect } from 'expo-router';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';

const AuthLayout = () => {
  const initialized = useAuthStore((s) => s.initialized);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);

  // Once auth resolves, a signed-in user should never sit on the auth stack.
  // This also performs post-sign-in/up navigation: when the store updates with
  // the new user, this redirect fires (instead of screens navigating manually
  // before the store has caught up, which bounced users back to sign-in).
  if (initialized && firebaseUser) {
    return <Redirect href="/(app)/(session)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.primary },
        animation: 'slide_from_right',
      }}
    />
  );
};

export default AuthLayout;
