import { View, Text, StyleSheet } from 'react-native';

interface ProvaMonogramProps {
  /** Per-card accent color; tints both the ring and the letter. */
  color: string;
  size?: number;
}

/**
 * Small circled "p" prova mark shown on the front of every card. Purely
 * typographic so it scales cleanly without any image assets.
 */
const ProvaMonogram = ({ color, size = 30 }: ProvaMonogramProps) => {
  return (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: `${color}59`,
        },
      ]}
    >
      <Text
        style={[
          styles.letter,
          { fontSize: size * 0.5, lineHeight: size * 0.5, color },
        ]}
      >
        p
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  letter: {
    fontFamily: 'InstrumentSerif-Regular',
    includeFontPadding: false,
    textAlign: 'center',
    marginTop: -1,
  },
});

export default ProvaMonogram;
