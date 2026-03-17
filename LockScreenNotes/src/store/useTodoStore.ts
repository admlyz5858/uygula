import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { TodoItem, TodoState } from '../types';
import { zustandMMKVStorage } from '../storage/mmkv';
import { syncWidgetData } from '../native/WidgetBridge';

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

export const useTodoStore = create<TodoState>()(
  persist(
    (set, get) => ({
      todos: [],

      addTodo: (text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        const now = Date.now();
        const newTodo: TodoItem = {
          id: generateId(),
          text: trimmed,
          completed: false,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => {
          const updated = [newTodo, ...state.todos];
          syncWidgetData(updated);
          return { todos: updated };
        });
      },

      toggleTodo: (id: string) => {
        set((state) => {
          const updated = state.todos.map((todo) =>
            todo.id === id
              ? { ...todo, completed: !todo.completed, updatedAt: Date.now() }
              : todo
          );
          syncWidgetData(updated);
          return { todos: updated };
        });
      },

      updateTodo: (id: string, text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        set((state) => {
          const updated = state.todos.map((todo) =>
            todo.id === id
              ? { ...todo, text: trimmed, updatedAt: Date.now() }
              : todo
          );
          syncWidgetData(updated);
          return { todos: updated };
        });
      },

      deleteTodo: (id: string) => {
        set((state) => {
          const updated = state.todos.filter((todo) => todo.id !== id);
          syncWidgetData(updated);
          return { todos: updated };
        });
      },

      reorderTodos: (todos: TodoItem[]) => {
        syncWidgetData(todos);
        set({ todos });
      },

      clearCompleted: () => {
        set((state) => {
          const updated = state.todos.filter((todo) => !todo.completed);
          syncWidgetData(updated);
          return { todos: updated };
        });
      },
    }),
    {
      name: 'todo-storage',
      storage: createJSONStorage(() => zustandMMKVStorage),
    }
  )
);
