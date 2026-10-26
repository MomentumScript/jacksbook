import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import Avatar from '../components/Avatar';
import { timeAgo } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { Comment } from '../lib/types';
import { colors } from '../theme';

type Props = { postId: number; userId: string; onOpenProfile: (id: string) => void };

export default function CommentsScreen({ postId, userId, onOpenProfile }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('id, post_id, author_id, content, created_at, author:profiles!comments_author_id_fkey(id, username, display_name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (error) Alert.alert('Could not load comments', error.message);
    else setComments((data ?? []) as unknown as Comment[]);
    setLoading(false);
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  async function send() {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    const { error } = await supabase.from('comments').insert({ post_id: postId, author_id: userId, content });
    setSending(false);
    if (error) return Alert.alert('Could not comment', error.message);
    setText('');
    load();
  }

  function remove(c: Comment) {
    if (c.author_id !== userId) return;
    Alert.alert('Delete comment?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const { error } = await supabase.from('comments').delete().eq('id', c.id);
          if (error) Alert.alert('Could not delete', error.message);
          else setComments((cs) => cs.filter((x) => x.id !== c.id));
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand} />
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={{ padding: 12 }}
          ListEmptyComponent={<Text style={styles.empty}>No comments yet. Say something!</Text>}
          renderItem={({ item }) => {
            const name = item.author?.display_name || item.author?.username || 'Unknown';
            return (
              <View style={styles.row}>
                <Pressable onPress={() => item.author && onOpenProfile(item.author.id)}>
                  <Avatar url={item.author?.avatar_url} name={name} size={34} />
                </Pressable>
                <Pressable style={{ flex: 1, marginLeft: 8 }} onLongPress={() => remove(item)}>
                  <View style={styles.bubble}>
                    <Text style={styles.name}>{name}</Text>
                    <Text style={styles.text}>{item.content}</Text>
                  </View>
                  <Text style={styles.meta}>
                    {timeAgo(item.created_at)}{item.author_id === userId ? ' · hold to delete' : ''}
                  </Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Write a comment…"
          value={text}
          onChangeText={setText}
          maxLength={1000}
          multiline
        />
        <Pressable onPress={send} disabled={!text.trim() || sending} style={{ opacity: text.trim() ? 1 : 0.4 }}>
          <Text style={styles.send}>{sending ? '…' : 'Send'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: 12 },
  bubble: { backgroundColor: colors.card, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start' },
  name: { fontWeight: '700', color: colors.text, marginBottom: 2 },
  text: { color: colors.text, fontSize: 15 },
  meta: { color: colors.muted, fontSize: 12, marginLeft: 12, marginTop: 3 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
  composer: {
    flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: colors.card,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  input: { flex: 1, backgroundColor: colors.bg, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 15, maxHeight: 100 },
  send: { color: colors.brand, fontWeight: '700', fontSize: 16, marginLeft: 12 },
});
