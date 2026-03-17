export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TodoState {
  todos: TodoItem[];
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  updateTodo: (id: string, text: string) => void;
  deleteTodo: (id: string) => void;
  reorderTodos: (todos: TodoItem[]) => void;
  clearCompleted: () => void;
}

export type ColorScheme = 'light' | 'dark';

export interface Theme {
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentLight: string;
  border: string;
  danger: string;
  success: string;
  completedText: string;
  completedBg: string;
  inputBg: string;
  shadow: string;
}
