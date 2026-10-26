import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { ImagePickerAsset } from 'expo-image-picker';
import Avatar from '../components/Avatar';
import { pickImage, uploadImage } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/types';
import { colors } from '../theme';

type Props = { userId: string; me: Profile | null; onPosted: () => void };

export default function ComposeScreen({ userId, me, onPosted }: Props) {
  const [text, setText] = useState('');
  const [image, setImage] = useState<ImagePickerAsset | null>(null);
  const [posting, setPosting] = useState(false);
  const canPost = (text.trim().length > 0 || !!image) && !posting;

  async function choose() {
    try {
      const a = await pickImage(false);
      if (a) setImage(a);
    } catch (e: any) {
      Alert.alert('Photo', e.message);
    }
  }

  async function post() {
    if (!canPost) return;
    setPosting(true);
    try {
      const image_url = image ? await uploadImage(userId, image) : null;
      const { error } = await supabase.from('posts').insert({
        author_id: userId,
        content: text.trim() || null,
        image_url,
      });
      if (error) throw error;
      setText('');
      setImage(null);
      onPosted();
    } catch (e: any) {
      Alert.alert('Could not post', e.message);
    } finally {
      setPosting(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14 }} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <Avatar url={me?.avatar_url} name={me?.display_name || me?.username} size={42} />
          <Text style={styles.name}>{me?.display_name || me?.username || 'You'}</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="What's on your mind?"
          multiline
          maxLength={2000}
          value={text}
          onChangeText={setText}
        />
        {image && (
          <View>
            <Image source={{ uri: image.uri }} style={styles.preview} />
            <Pressable style={styles.remove} onPress={() => setImage(null)}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>✕</Text>
            </Pressable>
          </View>
        )}
        <View style={styles.row}>
          <Pressable style={styles.photoBtn} onPress={choose}>
            <Text style={styles.photoText}>🖼  Photo</Text>
          </Pressable>
          <Pressable style={[styles.postBtn, !canPost && { opacity: 0.4 }]} onPress={post} disabled={!canPost}>
            {posting ? <ActivityIndicator color="#fff" /> : <Text style={styles.postText}>Post</Text>}
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 14 },
  name: { marginLeft: 10, fontWeight: '700', fontSize: 16, color: colors.text },
  input: { minHeight: 120, fontSize: 18, textAlignVertical: 'top', color: colors.text },
  preview: { width: '100%', aspectRatio: 1, borderRadius: 10, marginTop: 8, backgroundColor: colors.border },
  remove: {
    position: 'absolute', top: 16, right: 8, backgroundColor: 'rgba(0,0,0,0.6)',
    width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  photoBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: colors.bg },
  photoText: { fontWeight: '600', color: colors.text },
  postBtn: { backgroundColor: colors.brand, paddingVertical: 10, paddingHorizontal: 28, borderRadius: 10 },
  postText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
