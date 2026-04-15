import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Trash2 } from 'lucide-react-native';
import ScreenWrapper from '@/components/layout/ScreenWrapper';
import { useAuthStore } from '@/stores/authStore';
import { getPastSessions, deleteSession } from '@/lib/firestore';
import { colors, typography } from '@/constants/theme';
import type { Session } from '@/lib/types';

const PastSessionsScreen = () => {
  const router = useRouter();
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    if (!firebaseUser) return;
    try {
      const data = await getPastSessions(firebaseUser.uid);
      setSessions(data);
    } catch (e) {
      console.error('Failed to load sessions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [firebaseUser]);

  const handleDelete = (session: Session) => {
    Alert.alert(
      'Delete Session',
      `Delete "${session.cardTitle || 'this session'}"? This will remove the card and PDF permanently.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!firebaseUser) return;
            try {
              await deleteSession(firebaseUser.uid, session.id);
              setSessions((prev) => prev.filter((s) => s.id !== session.id));
            } catch (e) {
              console.error('Failed to delete session:', e);
            }
          },
        },
      ]
    );
  };

  const formatDate = (session: Session) => {
    const ts = session.completedAt || session.lastMessageAt;
    if (!ts) return '';
    const date = ts.toDate();
    return date.toLocaleDateString('en-US', {
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
        <Text style={styles.title}>Past Sessions</Text>
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.sessionRow}>
            <TouchableOpacity
              style={styles.sessionInfo}
              onPress={() => item.status === 'complete' ? router.push(`/(app)/(cards)/${item.id}`) : null}
              disabled={item.status !== 'complete'}
            >
              <View style={styles.sessionTitleRow}>
                <Text style={styles.sessionTitle}>
                  {item.cardTitle || 'Untitled Session'}
                </Text>
                {item.status === 'incomplete' && (
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Abandoned</Text>
                  </View>
                )}
              </View>
              <Text style={styles.sessionDate}>
                {formatDate(item)}
                {item.exchangeCount > 0 ? ` \u00B7 ${item.exchangeCount} exchanges` : ''}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteButton}>
              <Trash2 size={16} color={colors.danger} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No past sessions yet.</Text>
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
    paddingBottom: 16,
  },
  title: {
    fontFamily: 'InstrumentSerif-Regular',
    fontSize: 22,
    color: colors.white,
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
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionTitle: {
    fontFamily: 'DMSans-Medium',
    fontSize: 13,
    color: colors.text.secondary,
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 9,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sessionDate: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    ...typography.body.default,
    color: colors.text.muted,
  },
});

export default PastSessionsScreen;
