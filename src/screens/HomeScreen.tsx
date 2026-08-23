import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { theme } from '../theme/tokens';

export function HomeScreen({ navigation }: any) {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>AUJOURD’HUI</Text>
      <Text style={styles.title}>Comment tu vas, vraiment ?</Text>
      <Text style={styles.subtitle}>Pas besoin d’un long questionnaire. Donne-moi juste le niveau réel.</Text>
      <Pressable style={styles.primary} onPress={() => navigation.navigate('Check-in')}>
        <Text style={styles.primaryText}>Faire un check-in · 30 sec</Text>
      </Pressable>
      <Card>
        <Text style={styles.cardLabel}>MIROIR DU JOUR</Text>
        <Text style={styles.cardTitle}>Tu sembles plus chargé le soir cette semaine.</Text>
        <Text style={styles.cardText}>Ce n’est pas encore un pattern fiable. Je continue d’observer avant de te proposer une explication.</Text>
      </Card>
      <View style={styles.row}>
        <Pressable style={styles.smallCard} onPress={() => navigation.navigate('Journal')}>
          <Text style={styles.smallTitle}>Déposer ce que tu as en tête</Text>
          <Text style={styles.smallText}>Journal libre</Text>
        </Pressable>
        <Pressable style={styles.smallCard} onPress={() => navigation.navigate('Parler')}>
          <Text style={styles.smallTitle}>Parler 3 minutes</Text>
          <Text style={styles.smallText}>Compagnon IA</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  content: { padding: theme.space.lg, gap: theme.space.lg, paddingBottom: 48 },
  eyebrow: { color: theme.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginTop: 16 },
  title: { color: theme.text, fontSize: 38, lineHeight: 43, fontWeight: '700' },
  subtitle: { color: theme.muted, fontSize: 17, lineHeight: 24 },
  primary: { backgroundColor: theme.text, padding: 18, borderRadius: 22, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cardLabel: { color: theme.accent, fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  cardTitle: { color: theme.text, fontSize: 22, lineHeight: 28, fontWeight: '600' },
  cardText: { color: theme.muted, fontSize: 15, lineHeight: 22 },
  row: { flexDirection: 'row', gap: 12 },
  smallCard: { flex: 1, minHeight: 150, backgroundColor: theme.surface, padding: 18, borderRadius: 24, borderWidth: 1, borderColor: theme.line, justifyContent: 'space-between' },
  smallTitle: { fontSize: 18, lineHeight: 23, fontWeight: '600', color: theme.text },
  smallText: { color: theme.muted }
});
