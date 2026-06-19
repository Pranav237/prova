import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import ScreenWrapper from '@/components/layout/ScreenWrapper';
import { useAuthStore } from '@/stores/authStore';
import { useSessionStore } from '@/stores/sessionStore';
import { getCompletedSessions, createSession } from '@/lib/firestore';
import { colors, typography } from '@/constants/theme';
import type { Session } from '@/lib/types';

const RevisitPickerScreen = () => {
  const router = useRouter();
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const setSessionId = useSessionStore((s) => s.setSessionId);
  const setIntent = useSessionStore((s) => s.setIntent);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!firebaseUser) return;
      try {
        const data = await getCompletedSessions(firebaseUser.uid);
        if (!cancelled) setSessions(data);
      } catch (e) {
        console.error('Failed to load past sessions:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [firebaseUser]);

  const handlePick = async (session: Session) => {
    if (!firebaseUser || starting) return;
    setStarting(session.id);
    try {
      setIntent('revisiting');
      const newSessionId = await createSession(firebaseUser.uid, 'revisiting', {
        revisitingSessionId: session.id,
      });
      setSessionId(newSessionId);
      router.replace('/(app)/(session)/conversation');
    } catch (e) {
      console.error('Failed to start revisit session:', e);
      setStarting(null);
    }
  };

  const formatDate = (session: Session) => {
    const ts = session.completedAt || session.lastMessageAt;
    if (!ts) return '';
    return ts.toDate().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={18} color={colors.purple.soft} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>Which session do you want to revisit?</Text>
        <Text style={styles.subtitle}>
          Prova will pick up from where you left off, with context from the original conversation.
        </Text>
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.sessionRow}
            onPress={() => handlePick(item)}
            disabled={!!starting}
            activeOpacity={0.7}
          >
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionTitle} numberOfLines={1}>
                {item.cardTitle || 'Untitled Session'}
              </Text>
              <Text style={styles.sessionDate}>
                {formatDate(item)}
                {item.exchangeCount > 0
                  ? ` · ${item.exchangeCount} exchanges`
                  : ''}
              </Text>
            </View>
            {starting === item.id ? (
              <Text style={styles.starting}>Starting...</Text>
            ) : (
              <ChevronRight size={14} color={colors.text.faint} />
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No completed sessions yet.</Text>
              <Text style={styles.emptyHint}>
                Finish one session first, then come back to revisit it.
              </Text>
            </View>
          ) : null
        }
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
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
  titleContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontFamily: 'InstrumentSerif-Regular',
    fontSize: 22,
    color: colors.white,
  },
  subtitle: {
    ...typography.body.small,
    color: colors.text.muted,
    marginTop: 8,
    lineHeight: 18,
  },
  list: {
    paddingHorizontal: 20,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  sessionInfo: {
    flex: 1,
    marginRight: 12,
  },
  sessionTitle: {
    fontFamily: 'DMSans-Medium',
    fontSize: 13,
    color: colors.text.secondary,
  },
  sessionDate: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 2,
  },
  starting: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: colors.purple.DEFAULT,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    ...typography.body.default,
    color: colors.text.secondary,
    marginBottom: 6,
  },
  emptyHint: {
    ...typography.body.small,
    color: colors.text.muted,
    textAlign: 'center',
  },
});

export default RevisitPickerScreen;
