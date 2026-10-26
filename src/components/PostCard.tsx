import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Avatar from './Avatar';
import { colors } from '../theme';
import { timeAgo, toggleLike } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { Post } from '../lib/types';

type Props = {
  post: Post;
  userId: string;
  onOpenComments: (postId: number) => void;
  onOpenProfile: (userId: string) => void;
  onDeleted?: (postId: number) => void;
};

export default function PostCard({ post, userId, onOpenComments, onOpenProfile, onDeleted }: Props) {
  const { width } = useWindowDimensions();
  const [liked, setLiked] = useState(post.likes.some((l) => l.user_id === userId));
  const [likeCount, setLikeCount] = useState(post.likes.length);
  const [busy, setBusy] = useState(false);
  const commentCount = post.comments?.[0]?.count ?? 0;
  const name = post.author?.display_name || post.author?.username || 'Unknown';

  async function onLike() {
    if (busy) return;
    setBusy(true);
    const was = liked;
    setLiked(!was);
    setLikeCount((c) => c + (was ? -1 : 1));
    try {
      await toggleLike(post.id, userId, was);
    } catch (e: any) {
      setLiked(was);
      setLikeCount((c) => c + (was ? 1 : -1));
      Alert.alert('Could not update like', e.message);
    } finally {
      setBusy(false);
    }
  }

  function onMore() {
    Alert.alert('Delete post?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('posts').delete().eq('id', post.id);
          if (error) Alert.alert('Could not delete', error.message);
          else onDeleted?.(post.id);
        },
      },
    ]);
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable style={styles.author} onPress={() => post.author && onOpenProfile(post.author.id)}>
          <Avatar url={post.author?.avatar_url} name={name} size={40} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            <Text style={styles.meta}>@{post.author?.username} · {timeAgo(post.created_at)}</Text>
          </View>
        </Pressable>
        {post.author_id === userId && (
          <Pressable onPress={onMore} hitSlop={12}>
            <Text style={styles.more}>•••</Text>
          </Pressable>
        )}
      </View>

      {!!post.content && <Text style={styles.content}>{post.content}</Text>}
      {!!post.image_url && (
        <Image source={{ uri: post.image_url }} style={{ width, height: width, backgroundColor: colors.border }} resizeMode="cover" />
      )}

      <View style={styles.counts}>
        <Text style={styles.meta}>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</Text>
        <Text style={styles.meta}>{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={onLike}>
          <Text style={[styles.actionText, liked && { color: colors.like }]}>{liked ? '♥ Liked' : '♡ Like'}</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={() => onOpenComments(post.id)}>
          <Text style={styles.actionText}>💬 Comment</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  author: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  name: { fontWeight: '700', fontSize: 15, color: colors.text },
  meta: { color: colors.muted, fontSize: 13 },
  more: { color: colors.muted, fontSize: 16, paddingHorizontal: 4 },
  content: { fontSize: 16, color: colors.text, paddingHorizontal: 12, paddingBottom: 10, lineHeight: 22 },
  counts: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border },
  action: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  actionText: { color: colors.muted, fontWeight: '600', fontSize: 15 },
});
