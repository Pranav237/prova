import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Download, Check, ChevronDown } from 'lucide-react-native';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { ref as storageRef, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import ScreenWrapper from '@/components/layout/ScreenWrapper';
import InteractiveCard, {
  type InteractiveCardHandle,
} from '@/components/cards/InteractiveCard';
import PDFSection from '@/components/pdf/PDFSection';
import ReadingsCallout from '@/components/pdf/ReadingsCallout';
import { useAuthStore } from '@/stores/authStore';
import { getSession } from '@/lib/firestore';
import { colors, typography } from '@/constants/theme';
import type { Session } from '@/lib/types';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/** Strip characters that would break a filename and keep the result short. */
function sanitizeFileBase(name: string) {
  return (
    (name || 'prova-session')
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001f<>:"\\/|?*\u007f]+/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 60) || 'prova-session'
  );
}

/**
 * Shared card-detail screen. Used by both /(cards)/[sessionId] and
 * /(session)/[sessionId] so that the back arrow always returns the user to
 * the tab they came from.
 */
const CardDetailView = () => {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const firebaseUser = useAuthStore((s) => s.firebaseUser);

  const [session, setSession] = useState<Session | null>(null);
  const [artUrl, setArtUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [pdfOpen, setPdfOpen] = useState(false);
  /** Y position of the PDF section's top edge inside the ScrollView. */
  const [pdfTopY, setPdfTopY] = useState<number | null>(null);
  /** Current scrollOffset. Drives the "Save card" / "Save PDF" label. */
  const [scrollY, setScrollY] = useState(0);

  const cardRef = useRef<InteractiveCardHandle>(null);
  const scrollRef = useRef<ScrollView>(null);

  /* ----------------------- Load session + art URL ------------------- */

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      if (!firebaseUser || !sessionId) return;
      try {
        const s = await getSession(firebaseUser.uid, sessionId);
        if (!cancelled) setSession(s);

        if (s?.cardArtRef) {
          try {
            const url = await getDownloadURL(storageRef(storage, s.cardArtRef));
            if (!cancelled) setArtUrl(url);
          } catch {
            // soft fail — card still renders with gradient
          }
        }
      } catch (e) {
        console.error('Failed to load session:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadSession();
    return () => {
      cancelled = true;
    };
  }, [firebaseUser, sessionId]);

  /* ----------------------- Open / close PDF section ------------------ */

  const handleOpenPdf = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPdfOpen(true);

    // Wait for the layout to settle, then scroll the PDF header into view.
    setTimeout(() => {
      // pdfTopY may not be set yet on the first open; the onLayout will
      // populate it once the section renders. Fall back to scrolling by a
      // reasonable amount in the meantime.
      const target = (pdfTopY ?? 360) - 16;
      scrollRef.current?.scrollTo({ y: Math.max(0, target), animated: true });
    }, 180);
  }, [pdfTopY]);

  /* ----------------------- Save card image ------------------- */

  const saveCardImage = useCallback(async () => {
    const perm = await MediaLibrary.requestPermissionsAsync();
    if (perm.status !== 'granted') {
      throw new Error(
        'Photo library access was denied. Enable it in Settings to save cards.'
      );
    }

    const captureTarget = cardRef.current?.getCaptureRef();
    const view = captureTarget?.current;
    if (!view) throw new Error('Card view ref is not ready');

    cardRef.current?.resetToFront();
    await new Promise((r) => setTimeout(r, 350));

    const uri = await captureRef(view, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });

    await MediaLibrary.saveToLibraryAsync(uri);
  }, []);

  /* ----------------------- Build PDF HTML ------------------- */

  const buildPdfHtml = useCallback(() => {
    if (!session?.pdfOutput) return '';
    const { pdfOutput, cardTitle, completedAt, lastMessageAt } = session;
    const ts = completedAt || lastMessageAt;
    const dateStr = ts
      ? ts.toDate().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : '';

    const escape = (s: string) =>
      (s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br/>');

    const readings =
      (pdfOutput.recommendedReadings || [])
        .map(
          (r) =>
            `<li><span class="r-title">${escape(r.title)}</span>` +
            (r.author
              ? `<span class="r-author"> · ${escape(r.author)}</span>`
              : '') +
            (r.reason ? `<p class="r-note">${escape(r.reason)}</p>` : '') +
            `</li>`
        )
        .join('') || '';

    // Single flowing document: no page-break-before on sections, only
    // page-break-inside avoid for the readings callout so it isn't split.
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escape(cardTitle || 'Your thinking')}</title>
    <style>
      @page { size: A4; margin: 0.55in 0.6in 0.6in; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; }
      body { font: 10.5pt/1.55 Georgia, "Times New Roman", serif; color: #1a1a1a; }
      h1 { font-family: Georgia, serif; font-size: 21pt; font-weight: 400; letter-spacing: -0.4pt; margin: 0 0 3pt; }
      .date { font: 9pt/1 -apple-system, "Segoe UI", sans-serif; color: #888; margin: 0 0 20pt; }
      h2 { font: 600 8.5pt/1 -apple-system, "Segoe UI", sans-serif; color: #6f3fd6; text-transform: uppercase; letter-spacing: 1.1pt; margin: 16pt 0 5pt; page-break-after: avoid; }
      p { margin: 0 0 8pt; orphans: 3; widows: 3; }
      .readings { margin-top: 18pt; padding: 11pt 13pt; border: 1px solid #e3dcf6; border-radius: 4pt; background: #faf7ff; page-break-inside: avoid; }
      .readings h3 { font: 600 8.5pt/1 -apple-system, "Segoe UI", sans-serif; color: #6f3fd6; text-transform: uppercase; letter-spacing: 1.1pt; margin: 0 0 7pt; }
      .readings ul { padding-left: 13pt; margin: 0; }
      .readings li { font-size: 9.5pt; margin: 0 0 7pt; }
      .r-title { font-style: italic; }
      .r-author { color: #555; font-style: normal; }
      .r-note { font-size: 9pt; color: #444; margin: 3pt 0 0; }
      footer { margin-top: 28pt; padding-top: 10pt; border-top: 1px solid #eee; font: 8pt -apple-system, "Segoe UI", sans-serif; color: #aaa; text-align: center; }
    </style>
  </head>
  <body>
    <h1>${escape(cardTitle || 'Your thinking')}</h1>
    <div class="date">${dateStr}</div>

    <h2>What you said</h2>
    <p>${escape(pdfOutput.whatYouSaid)}</p>

    <h2>How you reasoned</h2>
    <p>${escape(pdfOutput.howYouReasoned)}</p>

    <h2>Where you got stuck</h2>
    <p>${escape(pdfOutput.whereYouGotStuck)}</p>

    <h2>What you might not be seeing</h2>
    <p>${escape(pdfOutput.whatYouMightNotBeSeeing)}</p>

    ${
      readings
        ? `<div class="readings"><h3>Suggested readings</h3><ul>${readings}</ul></div>`
        : ''
    }

    <footer>generated by prova · thinkprova.com</footer>
  </body>
</html>`;
  }, [session]);

  /* ----------------------- Save PDF ------------------- */

  const savePdf = useCallback(async () => {
    if (!session?.pdfOutput) {
      throw new Error('The reflection for this session is not available yet.');
    }

    const html = buildPdfHtml();

    const { uri: tempUri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Rename to "<Card Title>.pdf" so the share sheet shows a meaningful
    // default filename. Print writes into the cache directory with a random
    // GUID name; we copy it to a sibling file with the right name.
    let finalUri = tempUri;
    try {
      const niceName = `${sanitizeFileBase(session.cardTitle || 'prova-session')}.pdf`;
      const niceFile = new File(Paths.cache, niceName);
      if (niceFile.exists) niceFile.delete();
      const source = new File(tempUri);
      source.copy(niceFile);
      finalUri = niceFile.uri;
    } catch (renameErr) {
      // Renaming is a nice-to-have. Fall back to the random name if it fails.
      console.warn('PDF rename failed, sharing original:', renameErr);
    }

    const sharingAvailable = await Sharing.isAvailableAsync();
    if (!sharingAvailable) {
      throw new Error('Sharing is unavailable on this device.');
    }

    await Sharing.shareAsync(finalUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Save your reflection',
      UTI: 'com.adobe.pdf',
    });
  }, [session, buildPdfHtml]);

  /* ----------------------- Unified handler ------------------- */

  // The label is driven by scroll position once the PDF is open:
  // - PDF section's header is past the viewport top → "Save PDF"
  // - Otherwise → "Save card"
  const saveMode: 'card' | 'pdf' =
    pdfOpen && pdfTopY !== null && scrollY + 60 >= pdfTopY ? 'pdf' : 'card';

  const handleSave = useCallback(async () => {
    if (saveState === 'saving' || saveState === 'saved') return;
    setSaveState('saving');

    try {
      if (saveMode === 'pdf') {
        await savePdf();
      } else {
        await saveCardImage();
      }
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch (e) {
      console.error('Failed to save:', e);
      setSaveState('error');
      Alert.alert(
        'Save failed',
        e instanceof Error ? e.message : 'Something went wrong. Try again.'
      );
      setTimeout(() => setSaveState('idle'), 2500);
    }
  }, [saveState, saveMode, savePdf, saveCardImage]);

  /* ----------------------- Scroll tracking ------------------- */

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      setScrollY(e.nativeEvent.contentOffset.y);
    },
    []
  );

  /* ----------------------- Computed ------------------- */

  const formatDate = () => {
    const ts = session?.completedAt || session?.lastMessageAt;
    if (!ts) return '';
    return ts.toDate().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const pdfOutput = session?.pdfOutput;
  const hasPdf = !!pdfOutput;

  const saveLabel = (() => {
    const base = saveMode === 'pdf' ? 'PDF' : 'card';
    if (saveState === 'saving') return 'Saving';
    if (saveState === 'saved') return 'Saved';
    return `Save ${base}`;
  })();

  /* ----------------------- Render ------------------- */

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.purple.DEFAULT} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
          hitSlop={8}
        >
          <ChevronLeft size={18} color={colors.purple.soft} />
          <Text style={styles.headerButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          style={styles.headerButton}
          disabled={saveState === 'saving' || saveState === 'saved'}
          hitSlop={8}
        >
          {saveState === 'saved' ? (
            <Check size={16} color={colors.purple.DEFAULT} />
          ) : (
            <Download size={16} color={colors.purple.soft} />
          )}
          <Text style={styles.headerButtonText}>{saveLabel}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={32}
      >
        <View style={styles.cardArea}>
          <InteractiveCard
            ref={cardRef}
            title={session?.cardTitle || 'Untitled Session'}
            date={formatDate()}
            artUrl={artUrl}
            metallicColor={session?.cardMetallicColor || '#A882FF'}
          />
          <Text style={styles.gestureHint}>Tap to flip</Text>
        </View>

        {hasPdf && !pdfOpen && (
          <View style={styles.openPdfWrap}>
            <TouchableOpacity
              onPress={handleOpenPdf}
              activeOpacity={0.8}
              style={styles.openPdfButton}
            >
              <Text style={styles.openPdfText}>Open your thinking</Text>
              <ChevronDown size={16} color={colors.purple.soft} />
            </TouchableOpacity>
          </View>
        )}

        {hasPdf && pdfOpen && (
          <View
            onLayout={(e) => setPdfTopY(e.nativeEvent.layout.y)}
            style={styles.pdfWrap}
          >
            <View style={styles.divider} />
            <View style={styles.pdfArea}>
              <Text style={styles.pdfTitle}>Your thinking</Text>
              <Text style={styles.pdfDate}>{formatDate()}</Text>

              <View style={styles.pdfSections}>
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
              </View>
            </View>
          </View>
        )}

        {!hasPdf && (
          <View style={styles.noPdf}>
            <Text style={styles.noPdfText}>
              The written reflection for this session isn&apos;t available yet.
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  headerButtonText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: colors.purple.soft,
  },
  scroll: {
    paddingBottom: 48,
  },
  cardArea: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  gestureHint: {
    ...typography.label.tiny,
    color: colors.text.muted,
    marginTop: 18,
  },
  openPdfWrap: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  openPdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.purple.border,
    backgroundColor: colors.purple.faint,
  },
  openPdfText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 13,
    color: colors.purple.soft,
  },
  pdfWrap: {
    paddingTop: 0,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginHorizontal: 20,
  },
  pdfArea: {
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  pdfTitle: {
    fontFamily: 'InstrumentSerif-Regular',
    fontSize: 22,
    color: colors.white,
  },
  pdfDate: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: colors.text.faint,
    marginTop: 4,
  },
  pdfSections: {
    marginTop: 24,
  },
  noPdf: {
    paddingVertical: 40,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  noPdfText: {
    ...typography.body.default,
    color: colors.text.muted,
    textAlign: 'center',
  },
});

export default CardDetailView;
