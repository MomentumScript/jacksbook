import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import PostCard from '../components/PostCard';
import { fetchFollowingIds, fetchPosts } from '../lib/api';
import type { Post } from '../lib/types';
import { colors } from '../theme';

type Props = {
  userId: string;
  refreshKey: number;
  onOpenComments: (postId: number) => void;
  onOpenProfile: (userId: string) => void;
};

export default function FeedScreen({ userId, refreshKey, onOpenComments, onOpenProfile }: Props) {
  const [tab, setTab] = useState<'everyone' | 'following'>('everyone');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      if (tab === 'following') {
        const ids = await fetchFollowingIds(userId);
        setPosts(await fetchPosts({ authorIds: [...ids, userId] }));
      } else {
        setPosts(await fetchPosts());
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab, userId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load, refreshKey]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.tabs}>
        {(['everyone', 'following'] as const).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'everyone' ? 'Everyone' : 'Following'}
            </Text>
          </Pressable>
        ))}
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => String(p.id)}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              userId={userId}
              onOpenComments={onOpenComments}
              onOpenProfile={onOpenProfile}
              onDeleted={(id) => setPosts((ps) => ps.filter((p) => p.id !== id))}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              {error
                ? `Couldn't load posts: ${error}`
                : tab === 'following'
                  ? 'No posts yet. Follow people from their profile to see them here.'
                  : 'No posts yet. Be the first to post!'}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.brand },
  tabText: { color: colors.muted, fontWeight: '600', fontSize: 15 },
  tabTextActive: { color: colors.brand },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 50, paddingHorizontal: 30, fontSize: 15 },
});
