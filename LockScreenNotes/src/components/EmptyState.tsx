import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../types';

interface Props {
  theme: Theme;
}

export const EmptyState: React.FC<Props> = ({ theme }) => {
  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Ionicons name="document-text-outline" size={56} color={theme.textTertiary} />
      </View>
      <Text style={styles.title}>Henüz not yok</Text>
      <Text style={styles.subtitle}>
        Aşağıdaki alana yazarak{'\n'}ilk notunu veya görevini ekle
      </Text>
    </View>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
      paddingBottom: 80,
    },
    iconWrapper: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textTertiary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

export default EmptyState;
