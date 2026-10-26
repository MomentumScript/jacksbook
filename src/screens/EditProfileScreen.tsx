import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import Avatar from '../components/Avatar';
import { pickImage, uploadImage } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/types';
import { colors } from '../theme';

type Props = { me: Profile; onSaved: () => void };

export default function EditProfileScreen({ me, onSaved }: Props) {
  const [displayName, setDisplayName] = useState(me.display_name ?? '');
  const [bio, setBio] = useState(me.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(me.avatar_url);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function changePhoto() {
    try {
      const a = await pickImage(true);
      if (!a) return;
      setUploading(true);
      setAvatarUrl(await uploadImage(me.id, a));
    } catch (e: any) {
      Alert.alert('Photo', e.message);
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() || null, bio: bio.trim() || null, avatar_url: avatarUrl })
      .eq('id', me.id);
    setSaving(false);
    if (error) Alert.alert('Could not save', error.message);
    else onSaved();
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <Pressable onPress={changePhoto} style={{ alignItems: 'center' }}>
        <Avatar url={avatarUrl} name={displayName || me.username} size={110} />
        <Text style={styles.link}>{uploading ? 'Uploading…' : 'Change photo'}</Text>
      </Pressable>

      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} maxLength={50} placeholder="Your name" />

      <Text style={styles.label}>Bio</Text>
      <TextInput
        style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]}
        value={bio}
        onChangeText={setBio}
        maxLength={300}
        multiline
        placeholder="Tell people about yourself"
      />
      <Text style={styles.count}>{bio.length}/300</Text>

      <Pressable style={[styles.button, (saving || uploading) && { opacity: 0.5 }]} onPress={save} disabled={saving || uploading}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20 },
  link: { color: colors.brand, fontWeight: '700', marginTop: 10, marginBottom: 10 },
  label: { fontWeight: '700', color: colors.text, marginTop: 14, marginBottom: 6 },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    padding: 12, fontSize: 16, color: colors.text,
  },
  count: { color: colors.muted, fontSize: 12, textAlign: 'right', marginTop: 4 },
  button: { backgroundColor: colors.brand, borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 17 },
});
