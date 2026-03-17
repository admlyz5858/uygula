import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  TextInput,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TodoItem as TodoItemType, Theme } from '../types';

interface Props {
  item: TodoItemType;
  theme: Theme;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
}

export const TodoItemComponent: React.FC<Props> = ({
  item,
  theme,
  onToggle,
  onDelete,
  onUpdate,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(item.text);

  const handleToggle = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
    onToggle(item.id);
  }, [item.id, onToggle, scaleAnim]);

  const handleSaveEdit = useCallback(() => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== item.text) {
      onUpdate(item.id, trimmed);
    } else {
      setEditText(item.text);
    }
    setIsEditing(false);
  }, [editText, item.id, item.text, onUpdate]);

  const handleStartEdit = useCallback(() => {
    if (!item.completed) {
      setEditText(item.text);
      setIsEditing(true);
    }
  }, [item.completed, item.text]);

  const styles = getStyles(theme, item.completed);

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={handleToggle}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <View style={styles.checkboxInner}>
          {item.completed && (
            <Ionicons name="checkmark" size={14} color={theme.success} />
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.content}>
        {isEditing ? (
          <TextInput
            style={styles.editInput}
            value={editText}
            onChangeText={setEditText}
            onBlur={handleSaveEdit}
            onSubmitEditing={handleSaveEdit}
            autoFocus
            returnKeyType="done"
            selectionColor={theme.accent}
            placeholderTextColor={theme.textTertiary}
          />
        ) : (
          <Pressable onLongPress={handleStartEdit} delayLongPress={300}>
            <Text
              style={[styles.text, item.completed && styles.completedText]}
              numberOfLines={3}
            >
              {item.text}
            </Text>
          </Pressable>
        )}
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => onDelete(item.id)}
        activeOpacity={0.6}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={18} color={theme.danger} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const getStyles = (theme: Theme, completed: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: completed ? theme.completedBg : theme.surface,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginHorizontal: 16,
      marginVertical: 4,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    checkbox: {
      marginRight: 14,
    },
    checkboxInner: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: completed ? theme.success : theme.textTertiary,
      backgroundColor: completed ? theme.success + '18' : 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      flex: 1,
      marginRight: 10,
    },
    text: {
      fontSize: 16,
      lineHeight: 22,
      color: theme.text,
      fontWeight: '400',
      letterSpacing: 0.2,
    },
    completedText: {
      color: theme.completedText,
      textDecorationLine: 'line-through',
      textDecorationColor: theme.completedText,
    },
    editInput: {
      fontSize: 16,
      lineHeight: 22,
      color: theme.text,
      fontWeight: '400',
      letterSpacing: 0.2,
      borderBottomWidth: 1,
      borderBottomColor: theme.accent,
      paddingVertical: 2,
      paddingHorizontal: 0,
    },
    deleteBtn: {
      padding: 6,
      opacity: 0.7,
    },
  });

export default React.memo(TodoItemComponent);
