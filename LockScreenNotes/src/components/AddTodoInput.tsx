import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../types';

interface Props {
  theme: Theme;
  onAdd: (text: string) => void;
}

export const AddTodoInput: React.FC<Props> = ({ theme, onAdd }) => {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setText('');
  }, [text, onAdd]);

  const styles = getStyles(theme);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.container}>
        <View style={styles.inputWrapper}>
          <Ionicons
            name="add-circle-outline"
            size={22}
            color={theme.textTertiary}
            style={styles.inputIcon}
          />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Yeni not veya görev ekle..."
            placeholderTextColor={theme.textTertiary}
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleSubmit}
            returnKeyType="done"
            selectionColor={theme.accent}
            blurOnSubmit={false}
            multiline={false}
          />
          {text.trim().length > 0 && (
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={handleSubmit}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-up-circle" size={32} color={theme.accent} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      backgroundColor: theme.background,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.inputBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 12,
      minHeight: 48,
    },
    inputIcon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
      paddingVertical: Platform.OS === 'ios' ? 12 : 10,
      letterSpacing: 0.2,
    },
    sendBtn: {
      marginLeft: 6,
    },
  });

export default AddTodoInput;
