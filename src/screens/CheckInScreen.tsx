import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme/tokens';

const moods = [['😞', 'Très bas'], ['😕', 'Bas'], ['😐', 'Neutre'], ['🙂', 'Bien'], ['😌', 'Très bien']];

export function CheckInScreen({ navigation }: any) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Là, tout de suite ?</Text>
      <Text style={styles.subtitle}>Une réponse suffit. Les détails peuvent venir après.</Text>
      <View style={styles.moods}>
        {moods.map(([emoji, label], i) => (
          <Pressable key={label} onPress={() => setSelected(i)} style={[styles.mood, selected === i && styles.selected]}>
            <Text style={styles.emoji}>{emoji}</Text><Text style={styles.label}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable disabled={selected === null} style={[styles.cta, selected === null && styles.disabled]} onPress={() => navigation.goBack()}>
        <Text style={styles.ctaText}>Enregistrer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg, padding: 24, gap: 18, paddingTop: 72 },
  title: { fontSize: 34, fontWeight: '700', color: theme.text },
  subtitle: { fontSize: 17, color: theme.muted, lineHeight: 24 },
  moods: { gap: 10, marginTop: 14 },
  mood: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: theme.surface, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: theme.line },
  selected: { borderColor: theme.accent, backgroundColor: theme.accentSoft },
  emoji: { fontSize: 28 },
  label: { fontSize: 17, fontWeight: '600', color: theme.text },
  cta: { marginTop: 'auto', backgroundColor: theme.text, padding: 18, borderRadius: 22, alignItems: 'center' },
  disabled: { opacity: 0.3 },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 16 }
});
