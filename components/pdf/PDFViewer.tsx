import { ScrollView, Text, StyleSheet, View } from 'react-native';
import PDFSection from './PDFSection';
import ReadingsCallout from './ReadingsCallout';
import { colors, typography } from '@/constants/theme';
import type { PDFOutput } from '@/lib/types';

interface PDFViewerProps {
  title: string;
  date: string;
  pdfOutput: PDFOutput;
}

const PDFViewer = ({ title, date, pdfOutput }: PDFViewerProps) => {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.date}>{date}</Text>

      <PDFSection
        label="What you said"
        content={pdfOutput.whatYouSaid}
      />
      <PDFSection
        label="How you reasoned"
        content={pdfOutput.howYouReasoned}
      />
      <PDFSection
        label="Where you got stuck"
        content={pdfOutput.whereYouGotStuck}
      />
      <PDFSection
        label="What you might not be seeing"
        content={pdfOutput.whatYouMightNotBeSeeing}
        showDivider={false}
      />

      {pdfOutput.recommendedReadings?.length > 0 && (
        <ReadingsCallout readings={pdfOutput.recommendedReadings} />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontFamily: 'InstrumentSerif-Regular',
    fontSize: 18,
    color: colors.white,
  },
  date: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: colors.text.faint,
    marginTop: 4,
    marginBottom: 24,
  },
});

export default PDFViewer;
