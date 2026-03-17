import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../types';

interface Props {
  theme: Theme;
  todoCount: number;
  completedCount: number;
  onClearCompleted: () => void;
}

export const Header: React.FC<Props> = ({
  theme,
  todoCount,
  completedCount,
  onClearCompleted,
}) => {
  const styles = getStyles(theme);
  const pendingCount = todoCount - completedCount;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Ionicons
          name="checkbox-outline"
          size={28}
          color={theme.accent}
          style={styles.icon}
        />
        <Text style={styles.title}>Notlarım</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBadge}>
          <Text style={styles.statNumber}>{pendingCount}</Text>
          <Text style={styles.statLabel}>bekleyen</Text>
        </View>
        <View style={[styles.statBadge, styles.statBadgeCompleted]}>
          <Text style={[styles.statNumber, { color: theme.success }]}>
            {completedCount}
          </Text>
          <Text style={styles.statLabel}>tamamlanan</Text>
        </View>

        {completedCount > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={onClearCompleted}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={14} color={theme.danger} />
            <Text style={styles.clearText}>Temizle</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 14,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    icon: {
      marginRight: 10,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: -0.5,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surfaceElevated,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 20,
      gap: 4,
    },
    statBadgeCompleted: {},
    statNumber: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.accent,
    },
    statLabel: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    clearBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 'auto',
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 20,
      backgroundColor: theme.danger + '14',
      gap: 4,
    },
    clearText: {
      fontSize: 12,
      color: theme.danger,
      fontWeight: '500',
    },
  });

export default Header;
