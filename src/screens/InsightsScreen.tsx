import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Card } from '../components/Card';
import { insights } from '../state/mock';
import { theme } from '../theme/tokens';

export function InsightsScreen() {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Ce que l’app commence à comprendre</Text>
      <Text style={styles.sub}>Les corrélations sont affichées avec leur niveau de confiance. Pas de pseudo-certitudes.</Text>
      {insights.map(x => <Card key={x.id}><Text style={styles.badge}>{x.confidence.toUpperCase()} · {x.evidenceCount} signaux</Text><Text style={styles.ctitle}>{x.title}</Text><Text style={styles.text}>{x.explanation}</Text></Card>)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 24, paddingTop: 64, gap: 16, paddingBottom: 40 },
  title: { fontSize: 32, lineHeight: 38, fontWeight: '700', color: theme.text },
  sub: { fontSize: 16, lineHeight: 23, color: theme.muted, marginBottom: 8 },
  badge: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: theme.accent },
  ctitle: { fontSize: 20, fontWeight: '600', color: theme.text },
  text: { fontSize: 15, lineHeight: 22, color: theme.muted }
});
