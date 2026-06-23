import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ProvaMonogram from '@/components/cards/ProvaMonogram';
import { colors, radius } from '@/constants/theme';

interface CardThumbnailProps {
  title: string;
  date: string;
  metallicColor: string;
  /** Reserved for future card artwork. Currently unused (editorial design). */
  artUrl?: string;
  onPress: () => void;
}

const CardThumbnail = ({ title, date, metallicColor, onPress }: CardThumbnailProps) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={[`${metallicColor}1F`, colors.bg.card, '#0D0B14']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <View style={styles.content}>
        <ProvaMonogram color={metallicColor} size={22} />
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <View
            style={[styles.titleRule, { backgroundColor: `${metallicColor}66` }]}
          />
          <Text style={[styles.date, { color: `${metallicColor}CC` }]}>{date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 160,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.bg.card,
  },
  content: {
    flex: 1,
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'InstrumentSerif-Regular',
    fontSize: 17,
    lineHeight: 21,
    color: colors.text.primary,
    textAlign: 'center',
  },
  titleRule: {
    width: 22,
    height: 1,
    marginTop: 10,
    marginBottom: 8,
  },
  date: {
    fontFamily: 'DMSans-Regular',
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
});

export default CardThumbnail;
