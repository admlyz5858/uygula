import { NativeModules, Platform } from 'react-native';
import { TodoItem } from '../types';

const { WidgetBridge: NativeWidgetBridge } = NativeModules;

/**
 * Serializes todo data and pushes it to the native widget layer.
 *
 * - iOS: writes to App Group UserDefaults so WidgetKit can read it,
 *   then calls WidgetCenter.shared.reloadAllTimelines().
 * - Android: writes to SharedPreferences and sends a broadcast
 *   to trigger AppWidgetManager.notifyAppWidgetViewDataChanged().
 */
export function syncWidgetData(todos: TodoItem[]): void {
  try {
    const payload = JSON.stringify(
      todos.map((t) => ({
        id: t.id,
        text: t.text,
        completed: t.completed,
      }))
    );

    if (NativeWidgetBridge?.setWidgetData) {
      NativeWidgetBridge.setWidgetData(payload);
    }
  } catch {
    // Widget bridge not available (web, Expo Go, etc.)
  }
}

/**
 * Called from the native side when a user toggles a todo item
 * from the lock screen widget. The native module invokes this
 * via an event emitter or direct JS call.
 */
export function onWidgetToggle(todoId: string): void {
  // This is handled by the native event listener set up in App.tsx
}

/**
 * Request the native side to reload/refresh the widget UI.
 */
export function reloadWidget(): void {
  try {
    if (NativeWidgetBridge?.reloadWidget) {
      NativeWidgetBridge.reloadWidget();
    }
  } catch {
    // Widget bridge not available
  }
}
