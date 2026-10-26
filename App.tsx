import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './src/lib/supabase';
import type { Profile, Route } from './src/lib/types';
import { colors } from './src/theme';
import AuthScreen from './src/screens/AuthScreen';
import FeedScreen from './src/screens/FeedScreen';
import ComposeScreen from './src/screens/ComposeScreen';
import CommentsScreen from './src/screens/CommentsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';

type Tab = 'feed' | 'compose' | 'me';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Root />
    </SafeAreaProvider>
  );
}

function Root() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {session ? <Main userId={session.user.id} /> : <AuthScreen />}
    </SafeAreaView>
  );
}

function Main({ userId }: { userId: string }) {
  const [tab, setTab] = useState<Tab>('feed');
  const [stack, setStack] = useState<Route[]>([]);
  const [me, setMe] = useState<Profile | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadMe = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setMe(data as Profile);
  }, [userId]);

  useEffect(() => { loadMe(); }, [loadMe]);

  const push = (r: Route) => setStack((s) => [...s, r]);
  const pop = useCallback(() => setStack((s) => s.slice(0, -1)), []);

  // Android hardware back button
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length > 0) { pop(); return true; }
      if (tab !== 'feed') { setTab('feed'); return true; }
      return false;
    });
    return () => sub.remove();
  }, [stack.length, tab, pop]);

  const openComments = (postId: number) => push({ name: 'comments', postId });
  const openProfile = (id: string) => (id === userId ? (setStack([]), setTab('me')) : push({ name: 'profile', userId: id }));

  const top = stack[stack.length - 1];

  if (top) {
    const title =
      top.name === 'comments' ? 'Comments' : top.name === 'editProfile' ? 'Edit profile' : 'Profile';
    return (
      <View style={styles.flex}>
        <View style={styles.topbar}>
          <Pressable onPress={pop} hitSlop={12} style={{ paddingRight: 14 }}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.body}>
          {top.name === 'comments' && (
            <CommentsScreen postId={top.postId} userId={userId} onOpenProfile={openProfile} />
          )}
          {top.name === 'profile' && (
            <ProfileScreen
              key={top.userId}
              profileId={top.userId}
              userId={userId}
              onOpenComments={openComments}
              onOpenProfile={openProfile}
            />
          )}
          {top.name === 'editProfile' && me && (
            <EditProfileScreen
              me={me}
              onSaved={() => { loadMe(); setRefreshKey((k) => k + 1); pop(); }}
            />
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.topbar}>
        <Text style={styles.logo}>jacksbook</Text>
      </View>
      <View style={styles.body}>
        {tab === 'feed' && (
          <FeedScreen userId={userId} refreshKey={refreshKey} onOpenComments={openComments} onOpenProfile={openProfile} />
        )}
        {tab === 'compose' && (
          <ComposeScreen
            userId={userId}
            me={me}
            onPosted={() => { setRefreshKey((k) => k + 1); setTab('feed'); }}
          />
        )}
        {tab === 'me' && (
          <ProfileScreen
            profileId={userId}
            userId={userId}
            refreshKey={refreshKey}
            onOpenComments={openComments}
            onOpenProfile={openProfile}
            onEdit={() => push({ name: 'editProfile' })}
          />
        )}
      </View>
      <View style={styles.tabbar}>
        <TabButton label="Home" icon="⌂" active={tab === 'feed'} onPress={() => setTab('feed')} />
        <TabButton label="Post" icon="＋" active={tab === 'compose'} onPress={() => setTab('compose')} />
        <TabButton label="Profile" icon="☺" active={tab === 'me'} onPress={() => setTab('me')} />
      </View>
    </View>
  );
}

function TabButton({ label, icon, active, onPress }: { label: string; icon: string; active: boolean; onPress: () => void }) {
  const color = active ? colors.brand : colors.muted;
  return (
    <Pressable style={styles.tabBtn} onPress={onPress}>
      <Text style={{ fontSize: 22, color }}>{icon}</Text>
      <Text style={{ fontSize: 12, fontWeight: '600', color }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.card },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  body: { flex: 1, backgroundColor: colors.bg },
  topbar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 54,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  logo: { fontSize: 28, fontWeight: '800', color: colors.brand, letterSpacing: -0.8 },
  back: { fontSize: 34, color: colors.text, marginTop: -4 },
  title: { fontSize: 19, fontWeight: '700', color: colors.text },
  tabbar: { flexDirection: 'row', backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 8 },
});
