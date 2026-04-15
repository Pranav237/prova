import { useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenWrapper from '@/components/layout/ScreenWrapper';
import CardThumbnail from '@/components/cards/CardThumbnail';
import EmptyCardSlot from '@/components/cards/EmptyCardSlot';
import { useAuthStore } from '@/stores/authStore';
import { useCardsStore } from '@/stores/cardsStore';
import { getArtUrl } from '@/lib/storage';
import { colors, typography } from '@/constants/theme';
import type { Session } from '@/lib/types';

const CardsScreen = () => {
  const router = useRouter();
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const { sessions, loading, fetchCards } = useCardsStore();

  useEffect(() => {
    if (firebaseUser) {
      fetchCards(firebaseUser.uid);
    }
  }, [firebaseUser, fetchCards]);

  const onRefresh = useCallback(() => {
    if (firebaseUser) {
      fetchCards(firebaseUser.uid);
    }
  }, [firebaseUser, fetchCards]);

  const formatDate = (session: Session) => {
    if (!session.completedAt) return '';
    const date = session.completedAt.toDate();
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderItem = useCallback(({ item }: { item: Session | 'empty' }) => {
    if (item === 'empty') {
      return (
        <View style={styles.gridItem}>
          <EmptyCardSlot onPress={() => router.push('/(app)/(session)')} />
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
  }, [router]);

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
        keyExtractor={(item, index) =>
          typeof item === 'string' ? 'empty-slot' : item.id
        }
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor={colors.purple.DEFAULT}
          />
        }
        ListEmptyComponent={
          sessions.length === 0 && !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Your collection awaits</Text>
              <Text style={styles.emptyText}>
                Each session produces a card — a snapshot of who you were in that conversation.
                Start your first session to begin.
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
});

export default CardsScreen;
