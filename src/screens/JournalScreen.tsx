import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../theme/tokens';

export function JournalScreen() {
  const [text, setText] = useState('');
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Qu’est-ce qui prend de la place ?</Text>
      <Text style={styles.sub}>Écris librement. L’analyse n’est jamais présentée comme un diagnostic.</Text>
      <TextInput multiline value={text} onChangeText={setText} placeholder="Tu peux commencer n’importe où…" placeholderTextColor={theme.muted} style={styles.input} />
      <Text style={styles.count}>{text.length} caractères</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg, padding: 24, paddingTop: 64, gap: 16 },
  title: { fontSize: 32, fontWeight: '700', color: theme.text },
  sub: { fontSize: 16, lineHeight: 23, color: theme.muted },
  input: { minHeight: 260, backgroundColor: theme.surface, borderRadius: 24, padding: 18, fontSize: 17, lineHeight: 25, color: theme.text, textAlignVertical: 'top', borderWidth: 1, borderColor: theme.line },
  count: { color: theme.muted, textAlign: 'right' }
});
