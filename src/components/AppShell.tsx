import React from 'react';
import { View, StyleSheet } from 'react-native';

export function AppShell({ children }: { children: React.ReactNode }) {
  return <View style={styles.shell}>{children}</View>;
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
});
