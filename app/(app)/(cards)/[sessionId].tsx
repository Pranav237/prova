import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Download } from 'lucide-react-native';
import ScreenWrapper from '@/components/layout/ScreenWrapper';
import PDFSection from '@/components/pdf/PDFSection';
import ReadingsCallout from '@/components/pdf/ReadingsCallout';
import { useAuthStore } from '@/stores/authStore';
import { getSession } from '@/lib/firestore';
import { colors, typography } from '@/constants/theme';
import type { Session, PDFOutput } from '@/lib/types';

const PDFViewScreen = () => {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      if (!firebaseUser || !sessionId) return;
      try {
        const s = await getSession(firebaseUser.uid, sessionId);
        setSession(s);
      } catch (e) {
        console.error('Failed to load session:', e);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, [firebaseUser, sessionId]);

  const pdfOutput = session?.pdfOutput;

  const formatDate = () => {
    if (!session?.completedAt) return '';
    const date = session.completedAt.toDate();
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={18} color={colors.purple.soft} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton}>
          <Download size={18} color={colors.purple.soft} />
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{session?.cardTitle || 'Session'}</Text>
        <Text style={styles.date}>{formatDate()}</Text>

        {pdfOutput ? (
          <>
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
          </>
        ) : (
          <View style={styles.noPdf}>
            <Text style={styles.noPdfText}>
              PDF content is being generated or is not yet available.
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: colors.purple.soft,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  saveText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: colors.purple.soft,
  },
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
  noPdf: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noPdfText: {
    ...typography.body.default,
    color: colors.text.muted,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body.default,
    color: colors.text.muted,
  },
});

export default PDFViewScreen;
