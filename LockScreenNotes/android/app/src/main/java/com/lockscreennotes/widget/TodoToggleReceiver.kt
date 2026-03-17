package com.lockscreennotes.widget

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Receives toggle intents from the widget list items.
 * Toggles the todo completion state in SharedPreferences
 * and refreshes the widget.
 */
class TodoToggleReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val todoId = intent.getStringExtra("todo_id") ?: return

        val todos = TodoWidgetProvider.loadTodos(context).toMutableList()
        val index = todos.indexOfFirst { it.id == todoId }
        if (index >= 0) {
            val current = todos[index]
            todos[index] = current.copy(completed = !current.completed)
            TodoWidgetProvider.saveTodos(context, todos)
        }

        TodoWidgetProvider.refreshWidget(context)
    }
}
