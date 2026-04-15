import { TouchableOpacity, Text, View, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, radius } from '@/constants/theme';

interface CardThumbnailProps {
  title: string;
  date: string;
  metallicColor: string;
  artUrl?: string;
  onPress: () => void;
}

const CardThumbnail = ({ title, date, metallicColor, artUrl, onPress }: CardThumbnailProps) => {
  const content = (
    <>
      <LinearGradient
        colors={[`${metallicColor}26`, colors.bg.primary]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.9 }}
      />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.date}>{date}</Text>
      </View>
    </>
  );

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      {artUrl ? (
        <ImageBackground source={{ uri: artUrl }} style={styles.imageContainer} imageStyle={styles.image}>
          {content}
        </ImageBackground>
      ) : (
        content
      )}
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
  imageContainer: {
    flex: 1,
  },
  image: {
    opacity: 0.3,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 14,
  },
  title: {
    ...typography.display.card,
    color: colors.text.primary,
  },
  date: {
    fontFamily: 'DMSans-Regular',
    fontSize: 10,
    color: colors.text.muted,
    marginTop: 4,
  },
});

export default CardThumbnail;
