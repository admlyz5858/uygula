import React, { useCallback, useEffect, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTodoStore } from './src/store/useTodoStore';
import { useAppTheme } from './src/hooks/useColorScheme';
import { TodoItem } from './src/types';
import TodoItemComponent from './src/components/TodoItem';
import EmptyState from './src/components/EmptyState';
import Header from './src/components/Header';
import AddTodoInput from './src/components/AddTodoInput';
import { syncWidgetData } from './src/native/WidgetBridge';

function TodoApp() {
  const { scheme, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { todos, addTodo, toggleTodo, updateTodo, deleteTodo, clearCompleted } =
    useTodoStore();

  const completedCount = useMemo(
    () => todos.filter((t) => t.completed).length,
    [todos]
  );

  // Sync widget on mount
  useEffect(() => {
    syncWidgetData(todos);
  }, []);

  // Listen for toggle events from the native widget
  useEffect(() => {
    try {
      if (NativeModules.WidgetBridge) {
        const emitter = new NativeEventEmitter(NativeModules.WidgetBridge);
        const subscription = emitter.addListener('onWidgetToggle', (event) => {
          if (event?.todoId) {
            toggleTodo(event.todoId);
          }
        });
        return () => subscription.remove();
      }
    } catch {
      // Widget bridge not available in Expo Go
    }
  }, [toggleTodo]);

  const renderItem = useCallback(
    ({ item }: { item: TodoItem }) => (
      <TodoItemComponent
        item={item}
        theme={theme}
        onToggle={toggleTodo}
        onDelete={deleteTodo}
        onUpdate={updateTodo}
      />
    ),
    [theme, toggleTodo, deleteTodo, updateTodo]
  );

  const keyExtractor = useCallback((item: TodoItem) => item.id, []);

  const sortedTodos = useMemo(() => {
    const pending = todos.filter((t) => !t.completed);
    const completed = todos.filter((t) => t.completed);
    return [...pending, ...completed];
  }, [todos]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />

      <Header
        theme={theme}
        todoCount={todos.length}
        completedCount={completedCount}
        onClearCompleted={clearCompleted}
      />

      <FlatList
        data={sortedTodos}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          sortedTodos.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={<EmptyState theme={theme} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      <View style={{ paddingBottom: insets.bottom }}>
        <AddTodoInput theme={theme} onAdd={addTodo} />
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <TodoApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  emptyListContent: {
    flexGrow: 1,
  },
});
