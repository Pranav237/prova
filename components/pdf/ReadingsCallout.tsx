import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, radius } from '@/constants/theme';

interface Reading {
  title: string;
  author: string;
  reason: string;
}

interface ReadingsCalloutProps {
  readings: Reading[];
}

const ReadingsCallout = ({ readings }: ReadingsCalloutProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Recommended Readings</Text>
      {readings.map((reading, index) => (
        <View key={index} style={styles.reading}>
          <Text style={styles.bookTitle}>
            {reading.title}
            <Text style={styles.author}> — {reading.author}</Text>
          </Text>
          <Text style={styles.reason}>{reading.reason}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.purple.ghost,
    borderWidth: 1,
    borderColor: 'rgba(168,130,255,0.1)',
  },
  label: {
    fontFamily: 'DMSans-Regular',
    fontSize: 10,
    color: colors.purple.soft,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  reading: {
    marginBottom: 12,
  },
  bookTitle: {
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
    color: colors.text.tertiary,
  },
  author: {
    fontFamily: 'DMSans-Regular',
    color: colors.text.muted,
  },
  reason: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 4,
    lineHeight: 16,
  },
});

export default ReadingsCallout;
