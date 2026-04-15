import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Circle, Square, Settings } from 'lucide-react-native';
import { colors, typography } from '@/constants/theme';

interface TabBarProps {
  state: { index: number; routes: Array<{ key: string; name: string }> };
  navigation: {
    emit: (event: { type: string; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
}

const TAB_CONFIG: Record<string, { label: string; Icon: typeof Circle }> = {
  '(session)': { label: 'Session', Icon: Circle },
  '(cards)': { label: 'Cards', Icon: Square },
  '(settings)': { label: 'Settings', Icon: Settings },
};

const TabBar = ({ state, navigation }: TabBarProps) => {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const config = TAB_CONFIG[route.name] || { label: route.name, Icon: Circle };
        const { label, Icon } = config;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const iconColor = isFocused ? colors.purple.DEFAULT : colors.text.faint;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tab}
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
          >
            <Icon size={20} color={iconColor} />
            <Text style={[styles.label, { color: iconColor }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 56,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.bg.primary,
    paddingBottom: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    ...typography.label.micro,
    fontSize: 10,
  },
});

export default TabBar;
