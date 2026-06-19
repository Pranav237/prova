import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, ChevronRight, Trash2 } from 'lucide-react-native';
import ScreenWrapper from '@/components/layout/ScreenWrapper';
import { useAuthStore } from '@/stores/authStore';
import { useSessionStore } from '@/stores/sessionStore';
import {
  getActiveSession,
  getCompletedSessions,
  deleteSession,
} from '@/lib/firestore';
import { colors, typography, radius } from '@/constants/theme';
import type { Session } from '@/lib/types';

/**
 * Sessions dashboard. The single place from which the user starts new
 * sessions, continues an in-progress one, or jumps into a completed session's
 * card view. This screen never auto-navigates anywhere; the user is always in
 * control.
 */
const SessionsDashboard = () => {
  const router = useRouter();
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const setSessionId = useSessionStore((s) => s.setSessionId);
  const setIntent = useSessionStore((s) => s.setIntent);

  const [active, setActive] = useState<Session | null>(null);
  const [completed, setCompleted] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!firebaseUser) {
      setActive(null);
      setCompleted([]);
      return;
    }
    setLoading(true);
    try {
      const [a, c] = await Promise.all([
        getActiveSession(firebaseUser.uid),
        getCompletedSessions(firebaseUser.uid),
      ]);
      setActive(a);
      setCompleted(c);
    } catch (e) {
      console.error('Failed to load sessions:', e);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const continueActive = () => {
    if (!active) return;
    setSessionId(active.id);
    setIntent(active.intent);
    router.push('/(app)/(session)/conversation');
  };

  const discardActive = () => {
    if (!firebaseUser || !active) return;
    Alert.alert(
      'Discard current session?',
      'This permanently deletes the unfinished conversation.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSession(firebaseUser.uid, active.id);
              useSessionStore.getState().reset();
              setActive(null);
            } catch (e) {
              console.error('Failed to discard:', e);
            }
          },
        },
      ]
    );
  };

  const deleteCompleted = (session: Session) => {
    if (!firebaseUser) return;
    Alert.alert(
      'Delete session?',
      `Delete "${session.cardTitle || 'this session'}"? The card and PDF will be removed permanently.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSession(firebaseUser.uid, session.id);
              setCompleted((prev) => prev.filter((s) => s.id !== session.id));
            } catch (e) {
              console.error('Failed to delete:', e);
            }
          },
        },
      ]
    );
  };

  const formatRelative = (s: Session) => {
    const ts = s.lastMessageAt;
    if (!ts) return '';
    const date = ts.toDate();
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.round(diffMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderActiveBlock = () => {
    if (!active) {
      return (
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => router.push('/(app)/(session)/new')}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={colors.gradient.primaryButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.startButtonGradient}
          />
          <Plus size={16} color={colors.white} strokeWidth={2.5} />
          <Text style={styles.startButtonText}>Start a new session</Text>
        </TouchableOpacity>
      );
    }

    const exchanges = active.exchangeCount ?? 0;

    return (
      <View style={styles.activeCard}>
        <View style={styles.activeHeader}>
          <View style={styles.activeDot} />
          <Text style={styles.activeLabel}>In progress</Text>
        </View>
        <Text style={styles.activeMeta}>
          {exchanges} exchange{exchanges !== 1 ? 's' : ''} · {formatRelative(active)}
        </Text>
        <View style={styles.activeActions}>
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={continueActive}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryActionText}>Continue</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={discardActive}
            activeOpacity={0.6}
          >
            <Text style={styles.secondaryActionText}>Discard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Session }) => {
    const ts = item.completedAt || item.lastMessageAt;
    const dateText = ts
      ? ts.toDate().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : '';

    return (
      <View style={styles.sessionRow}>
        <TouchableOpacity
          style={styles.sessionInfo}
          onPress={() => router.push(`/(app)/(session)/${item.id}`)}
          activeOpacity={0.7}
        >
          <Text style={styles.sessionTitle} numberOfLines={1}>
            {item.cardTitle || 'Untitled Session'}
          </Text>
          <Text style={styles.sessionDate}>
            {dateText}
            {item.exchangeCount > 0
              ? ` · ${item.exchangeCount} exchanges`
              : ''}
          </Text>
        </TouchableOpacity>
        <View style={styles.sessionActions}>
          <TouchableOpacity
            onPress={() => deleteCompleted(item)}
            style={styles.iconButton}
            hitSlop={6}
          >
            <Trash2 size={15} color={colors.text.muted} />
          </TouchableOpacity>
          <ChevronRight size={14} color={colors.text.faint} />
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>Sessions</Text>
        <Text style={styles.subtitle}>
          {completed.length} completed{active ? ' · 1 in progress' : ''}
        </Text>
      </View>

      <FlatList
        data={completed}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={colors.purple.DEFAULT}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            {renderActiveBlock()}
            {completed.length > 0 && (
              <Text style={styles.sectionLabel}>Past sessions</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading && !active ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                Your finished sessions will appear here.
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    fontFamily: 'InstrumentSerif-Regular',
    fontSize: 22,
    color: colors.white,
  },
  subtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerBlock: {
    marginBottom: 8,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: 24,
  },
  startButtonGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  startButtonText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 14,
    color: colors.white,
  },
  activeCard: {
    backgroundColor: colors.purple.faint,
    borderWidth: 1,
    borderColor: colors.purple.border,
    borderRadius: radius['2xl'],
    padding: 18,
    marginBottom: 24,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.purple.DEFAULT,
  },
  activeLabel: {
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
    color: colors.purple.DEFAULT,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  activeMeta: {
    ...typography.body.small,
    color: colors.text.tertiary,
    marginTop: 6,
  },
  activeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  primaryAction: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.purple.DEFAULT,
    alignItems: 'center',
  },
  primaryActionText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 13,
    color: colors.white,
  },
  secondaryAction: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  secondaryActionText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
    color: colors.text.muted,
  },
  sectionLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 10,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 8,
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
  sessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 6,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 32,
  },
  emptyText: {
    ...typography.body.small,
    color: colors.text.muted,
    textAlign: 'center',
  },
});

export default SessionsDashboard;
