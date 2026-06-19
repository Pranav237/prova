import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import ScreenWrapper from '@/components/layout/ScreenWrapper';
import CardThumbnail from '@/components/cards/CardThumbnail';
import EmptyCardSlot from '@/components/cards/EmptyCardSlot';
import { useAuthStore } from '@/stores/authStore';
import { getCompletedSessions } from '@/lib/firestore';
import { colors, typography } from '@/constants/theme';
import type { Session } from '@/lib/types';

const CardsScreen = () => {
  const router = useRouter();
  const firebaseUser = useAuthStore((s) => s.firebaseUser);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    if (!firebaseUser) {
      setSessions([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getCompletedSessions(firebaseUser.uid);
      setSessions(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load cards');
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  // Refresh every time the tab is focused so newly completed sessions show up
  // without requiring a manual pull-to-refresh.
  useFocusEffect(
    useCallback(() => {
      void fetchCards();
    }, [fetchCards])
  );

  const formatDate = (session: Session) => {
    if (!session.completedAt) return '';
    const date = session.completedAt.toDate();
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderItem = useCallback(
    ({ item }: { item: Session | 'empty' }) => {
      if (item === 'empty') {
        return (
          <View style={styles.gridItem}>
            <EmptyCardSlot onPress={() => router.push('/(app)/(session)/new')} />
          </View>
        );
      }

      return (
        <View style={styles.gridItem}>
          <CardThumbnail
            title={item.cardTitle || 'Untitled'}
            date={formatDate(item)}
            metallicColor={item.cardMetallicColor || '#A882FF'}
            onPress={() => router.push(`/(app)/(cards)/${item.id}`)}
          />
        </View>
      );
    },
    [router]
  );

  const data = [...sessions, 'empty' as const];

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>Your cards</Text>
        <Text style={styles.subtitle}>
          {sessions.length} session{sessions.length !== 1 ? 's' : ''} completed
        </Text>
      </View>

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) =>
          typeof item === 'string' ? 'empty-slot' : item.id
        }
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchCards}
            tintColor={colors.purple.DEFAULT}
          />
        }
        ListEmptyComponent={
          sessions.length === 0 && !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Your collection awaits</Text>
              <Text style={styles.emptyText}>
                Each session produces a card, a snapshot of who you were in
                that conversation. Start your first session to begin.
              </Text>
              {error && <Text style={styles.errorText}>{error}</Text>}
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
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },
  gridItem: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyTitle: {
    fontFamily: 'InstrumentSerif-Regular',
    fontSize: 18,
    color: colors.white,
    marginBottom: 12,
  },
  emptyText: {
    ...typography.body.small,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    ...typography.body.small,
    color: colors.danger,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default CardsScreen;
