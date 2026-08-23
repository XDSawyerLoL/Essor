import React, { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { theme } from '../theme/tokens';

export function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
    borderWidth: 1,
    borderColor: theme.line,
    gap: theme.space.sm
  }
});
