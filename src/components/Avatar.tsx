import { Image, Text, View } from 'react-native';
import { colors } from '../theme';

type Props = { url?: string | null; name?: string | null; size?: number };

export default function Avatar({ url, name, size = 40 }: Props) {
  const style = { width: size, height: size, borderRadius: size / 2 };
  if (url) return <Image source={{ uri: url }} style={[style, { backgroundColor: colors.border }]} />;
  const letter = (name ?? '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <View style={[style, { backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.42 }}>{letter}</Text>
    </View>
  );
}
