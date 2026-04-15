import { Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

const ProvaLabel = () => <Text style={styles.label}>prova</Text>;

const styles = StyleSheet.create({
  label: {
    fontFamily: 'DMSans-Regular',
    fontSize: 10,
    color: colors.purple.soft,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
});

export default ProvaLabel;
