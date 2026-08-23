import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../theme/tokens';

export function CompanionScreen() {
  const [text, setText] = useState('');
  return (
    <View style={styles.root}>
      <View style={styles.head}><Text style={styles.title}>Parler</Text><Text style={styles.sub}>Un espace de réflexion, pas un thérapeute.</Text></View>
      <View style={styles.bubble}><Text style={styles.ai}>Qu’est-ce qui te ferait le plus de bien à clarifier maintenant ?</Text></View>
      <View style={styles.compose}>
        <TextInput value={text} onChangeText={setText} placeholder="Écris comme tu parlerais…" placeholderTextColor={theme.muted} style={styles.input} />
        <Pressable style={styles.send} onPress={() => setText('')}><Text style={styles.sendText}>↑</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg, padding: 20, paddingTop: 60 },
  head: { gap: 5, marginBottom: 24 }, title: { fontSize: 32, fontWeight: '700', color: theme.text }, sub: { color: theme.muted, fontSize: 14 },
  bubble: { alignSelf: 'flex-start', maxWidth: '88%', backgroundColor: theme.surface, borderRadius: 22, borderTopLeftRadius: 8, padding: 16, borderWidth: 1, borderColor: theme.line },
  ai: { fontSize: 16, lineHeight: 23, color: theme.text },
  compose: { marginTop: 'auto', flexDirection: 'row', gap: 10, alignItems: 'center', paddingBottom: 12 },
  input: { flex: 1, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: theme.text },
  send: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.text, alignItems: 'center', justifyContent: 'center' },
  sendText: { fontSize: 24, color: '#fff' }
});
