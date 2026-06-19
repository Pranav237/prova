import { Tabs, Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Circle, Square, Settings } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';

const AppLayout = () => {
  const insets = useSafeAreaInsets();
  const initialized = useAuthStore((s) => s.initialized);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const tabBarHeight = 52 + Math.max(insets.bottom, 8);

  // Wait for auth to initialize before deciding what to render to avoid
  // briefly mounting protected screens while we still don't know who the
  // user is. Once initialized, if there's no user, bounce to sign-in.
  if (!initialized) {
    return null;
  }

  if (!firebaseUser) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg.primary,
          borderTopWidth: 1,
          borderTopColor: colors.border.subtle,
          height: tabBarHeight,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 4,
        },
        tabBarActiveTintColor: colors.purple.DEFAULT,
        tabBarInactiveTintColor: colors.text.faint,
        tabBarLabelStyle: {
          fontFamily: 'DMSans-Regular',
          fontSize: 10,
          letterSpacing: 0.72,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="(session)"
        options={{
          title: 'Session',
          tabBarIcon: ({ color, size }) => <Circle size={size - 4} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(cards)"
        options={{
          title: 'Cards',
          tabBarIcon: ({ color, size }) => <Square size={size - 4} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(settings)"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size - 4} color={color} />,
        }}
      />
    </Tabs>
  );
};

export default AppLayout;
