import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import { fetchPosts } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { Post, Profile } from '../lib/types';
import { colors } from '../theme';

type Props = {
  profileId: string;
  userId: string;
  refreshKey?: number;
  onOpenComments: (postId: number) => void;
  onOpenProfile: (userId: string) => void;
  onEdit?: () => void;
};

export default function ProfileScreen({ profileId, userId, refreshKey, onOpenComments, onOpenProfile, onEdit }: Props) {
  const isMe = profileId === userId;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [iFollow, setIFollow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, ps, fr, fg, mine] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', profileId).single(),
        fetchPosts({ authorIds: [profileId] }),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profileId),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profileId),
        supabase.from('follows').select('follower_id').match({ follower_id: userId, following_id: profileId }),
      ]);
      if (p.error) throw p.error;
      setProfile(p.data as Profile);
      setPosts(ps);
      setFollowers(fr.count ?? 0);
      setFollowing(fg.count ?? 0);
      setIFollow((mine.data ?? []).length > 0);
    } catch (e: any) {
      Alert.alert('Could not load profile', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profileId, userId]);

  useEffect(() => { load(); }, [load, refreshKey]);

  async function toggleFollow() {
    if (busy) return;
    setBusy(true);
    const was = iFollow;
    setIFollow(!was);
    setFollowers((n) => n + (was ? -1 : 1));
    const { error } = was
      ? await supabase.from('follows').delete().match({ follower_id: userId, following_id: profileId })
      : await supabase.from('follows').insert({ follower_id: userId, following_id: profileId });
    if (error) {
      setIFollow(was);
      setFollowers((n) => n + (was ? 1 : -1));
      Alert.alert('Could not update', error.message);
    }
    setBusy(false);
  }

  function logout() {
    Alert.alert('Log out?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand} />;
  if (!profile) return <Text style={styles.empty}>Profile not found.</Text>;

  const name = profile.display_name || profile.username;

  const header = (
    <View style={styles.header}>
      <Avatar url={profile.avatar_url} name={name} size={96} />
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.username}>@{profile.username}</Text>
      {!!profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
      <View style={styles.stats}>
        <Stat n={posts.length} label="Posts" />
        <Stat n={followers} label="Followers" />
        <Stat n={following} label="Following" />
      </View>
      {isMe ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable style={[styles.btn, styles.btnGhost]} onPress={onEdit}>
            <Text style={styles.btnGhostText}>Edit profile</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.btnGhost]} onPress={logout}>
            <Text style={[styles.btnGhostText, { color: colors.danger }]}>Log out</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={[styles.btn, iFollow ? styles.btnGhost : styles.btnPrimary]} onPress={toggleFollow}>
          <Text style={iFollow ? styles.btnGhostText : styles.btnPrimaryText}>{iFollow ? 'Following ✓' : 'Follow'}</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <FlatList
      data={posts}
      keyExtractor={(p) => String(p.id)}
      ListHeaderComponent={header}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          userId={userId}
          onOpenComments={onOpenComments}
          onOpenProfile={(id) => id !== profileId && onOpenProfile(id)}
          onDeleted={(id) => setPosts((ps) => ps.filter((p) => p.id !== id))}
        />
      )}
      ListEmptyComponent={<Text style={styles.empty}>{isMe ? "You haven't posted yet." : 'No posts yet.'}</Text>}
    />
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <View style={{ alignItems: 'center', minWidth: 80 }}>
      <Text style={{ fontWeight: '800', fontSize: 18, color: colors.text }}>{n}</Text>
      <Text style={{ color: colors.muted, fontSize: 13 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.card, alignItems: 'center', padding: 20, marginBottom: 8 },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 10 },
  username: { color: colors.muted, fontSize: 15, marginTop: 2 },
  bio: { color: colors.text, fontSize: 15, textAlign: 'center', marginTop: 10, lineHeight: 21 },
  stats: { flexDirection: 'row', marginVertical: 16 },
  btn: { paddingVertical: 10, paddingHorizontal: 22, borderRadius: 10, minWidth: 130, alignItems: 'center' },
  btnPrimary: { backgroundColor: colors.brand },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnGhost: { backgroundColor: colors.bg },
  btnGhostText: { color: colors.text, fontWeight: '700', fontSize: 15 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 30 },
});
