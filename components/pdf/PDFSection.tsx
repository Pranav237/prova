import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '@/constants/theme';

interface PDFSectionProps {
  label: string;
  content: string;
  showDivider?: boolean;
}

const PDFSection = ({ label, content, showDivider = true }: PDFSectionProps) => {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.content}>{content}</Text>
      {showDivider && <View style={styles.divider} />}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontFamily: 'DMSans-Regular',
    fontSize: 10,
    color: colors.purple.DEFAULT,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  content: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: colors.text.tertiary,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginTop: 18,
    marginBottom: 20,
  },
});

export default PDFSection;
