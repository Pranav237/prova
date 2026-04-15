import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

const SessionLayout = () => {
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

export default SessionLayout;
