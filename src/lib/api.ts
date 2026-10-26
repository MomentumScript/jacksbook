import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';
import type { Post } from './types';

export const POST_SELECT =
  'id, author_id, content, image_url, created_at, ' +
  'author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url), ' +
  'likes(user_id), comments(count)';

export async function fetchPosts(opts: { authorIds?: string[]; limit?: number } = {}) {
  let q = supabase
    .from('posts')
    .select(POST_SELECT)
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? 50);
  if (opts.authorIds) {
    if (opts.authorIds.length === 0) return [] as Post[];
    q = q.in('author_id', opts.authorIds);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as Post[];
}

export async function fetchFollowingIds(userId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.following_id as string);
}

export async function toggleLike(postId: number, userId: string, liked: boolean) {
  if (liked) {
    const { error } = await supabase.from('likes').delete().match({ post_id: postId, user_id: userId });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: userId });
    if (error) throw error;
  }
}

/** Opens the photo library and returns the picked image (with base64), or null. */
export async function pickImage(square = false) {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error('Photo permission was denied.');
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: square,
    aspect: square ? [1, 1] : undefined,
    quality: 0.7,
    base64: true,
  });
  if (result.canceled || !result.assets?.[0]?.base64) return null;
  return result.assets[0];
}

/** Uploads an image to the user's own folder in the "media" bucket and returns its public URL. */
export async function uploadImage(userId: string, asset: ImagePicker.ImagePickerAsset) {
  const mime = asset.mimeType ?? 'image/jpeg';
  const ext = mime.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('media')
    .upload(path, decode(asset.base64!), { contentType: mime, upsert: false });
  if (error) throw error;
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
}

export function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}
