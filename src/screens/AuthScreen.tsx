import { useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { colors } from '../theme';

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    const mail = email.trim().toLowerCase();
    if (!mail || !password) return Alert.alert('Missing info', 'Enter your email and password.');
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: mail, password });
        if (error) throw error;
      } else {
        const name = username.trim().toLowerCase();
        if (!/^[a-z0-9_]{3,30}$/.test(name)) {
          throw new Error('Username must be 3–30 letters, numbers or underscores.');
        }
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');
        const { data: taken } = await supabase.rpc('username_taken', { name });
        if (taken) throw new Error('That username is already taken.');
        const { data, error } = await supabase.auth.signUp({
          email: mail,
          password,
          options: { data: { username: name, display_name: username.trim() } },
        });
        if (error) throw error;
        if (!data.session) {
          Alert.alert(
            'Check your email',
            'We sent you a confirmation link. Tap it, then come back and log in.',
          );
          setMode('login');
        }
      }
    } catch (e: any) {
      Alert.alert(mode === 'login' ? 'Login failed' : 'Sign up failed', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.wrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.logo}>jacksbook</Text>
      <Text style={styles.tag}>Share what's happening with your friends.</Text>

      <View style={styles.form}>
        {mode === 'signup' && (
          <TextInput
            style={styles.input}
            placeholder="Username"
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Pressable style={styles.button} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <Text style={styles.buttonText}>{mode === 'login' ? 'Log in' : 'Create account'}</Text>
          )}
        </Pressable>
        <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{ marginTop: 18 }}>
          <Text style={styles.switch}>
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 44, fontWeight: '800', color: colors.brand, textAlign: 'center', letterSpacing: -1 },
  tag: { fontSize: 16, color: colors.muted, textAlign: 'center', marginTop: 6, marginBottom: 28 },
  form: { backgroundColor: colors.card, borderRadius: 14, padding: 18 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14,
    fontSize: 16, marginBottom: 12, color: colors.text, backgroundColor: '#fafbfc',
  },
  button: { backgroundColor: colors.brand, borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  switch: { color: colors.brand, textAlign: 'center', fontWeight: '600' },
});
