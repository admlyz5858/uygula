package com.lockscreennotes.app.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Paint
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import org.json.JSONArray
import com.lockscreennotes.app.R

data class TodoData(val id: String, val text: String, val completed: Boolean)

class TodoWidgetProvider : AppWidgetProvider() {

    companion object {
        const val PREFS_NAME = "widget_prefs"
        const val KEY_TODOS = "widget_todos"

        fun loadTodos(context: Context): List<TodoData> {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val json = prefs.getString(KEY_TODOS, "[]") ?: "[]"
            val list = mutableListOf<TodoData>()
            try {
                val arr = JSONArray(json)
                for (i in 0 until arr.length()) {
                    val obj = arr.getJSONObject(i)
                    list.add(
                        TodoData(
                            id = obj.getString("id"),
                            text = obj.getString("text"),
                            completed = obj.getBoolean("completed")
                        )
                    )
                }
            } catch (_: Exception) {}
            return list
        }

        fun saveTodos(context: Context, todos: List<TodoData>) {
            val arr = JSONArray()
            for (todo in todos) {
                val obj = org.json.JSONObject()
                obj.put("id", todo.id)
                obj.put("text", todo.text)
                obj.put("completed", todo.completed)
                arr.put(obj)
            }
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().putString(KEY_TODOS, arr.toString()).apply()
        }

        fun refreshWidget(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val component = ComponentName(context, TodoWidgetProvider::class.java)
            val ids = manager.getAppWidgetIds(component)
            manager.notifyAppWidgetViewDataChanged(ids, R.id.widget_list_view)

            val intent = Intent(context, TodoWidgetProvider::class.java).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
            }
            context.sendBroadcast(intent)
        }
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (widgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, widgetId)
        }
    }

    private fun updateWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        widgetId: Int
    ) {
        val views = RemoteViews(context.packageName, R.layout.widget_todo_list)

        val serviceIntent = Intent(context, TodoWidgetService::class.java).apply {
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId)
        }
        views.setRemoteAdapter(R.id.widget_list_view, serviceIntent)
        views.setEmptyView(R.id.widget_list_view, R.id.widget_empty_view)

        val toggleIntent = Intent(context, TodoToggleReceiver::class.java).apply {
            action = "com.lockscreennotes.TOGGLE_TODO"
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context, 0, toggleIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
        )
        views.setPendingIntentTemplate(R.id.widget_list_view, pendingIntent)

        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        if (launchIntent != null) {
            val launchPending = PendingIntent.getActivity(
                context, 1, launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_header, launchPending)
        }

        appWidgetManager.updateAppWidget(widgetId, views)
        appWidgetManager.notifyAppWidgetViewDataChanged(widgetId, R.id.widget_list_view)
    }
}

class TodoWidgetService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory {
        return TodoWidgetFactory(applicationContext)
    }
}

class TodoWidgetFactory(private val context: Context) : RemoteViewsService.RemoteViewsFactory {

    private var todos: List<TodoData> = emptyList()

    override fun onCreate() {
        todos = TodoWidgetProvider.loadTodos(context)
    }

    override fun onDataSetChanged() {
        todos = TodoWidgetProvider.loadTodos(context)
    }

    override fun onDestroy() {}

    override fun getCount(): Int = todos.size

    override fun getViewAt(position: Int): RemoteViews {
        val todo = todos[position]
        val views = RemoteViews(context.packageName, R.layout.widget_todo_item)

        views.setTextViewText(R.id.todo_text, todo.text)

        if (todo.completed) {
            views.setInt(R.id.todo_text, "setPaintFlags",
                Paint.STRIKE_THRU_TEXT_FLAG or Paint.ANTI_ALIAS_FLAG)
            views.setTextColor(R.id.todo_text, 0xFF6B6B80.toInt())
            views.setImageViewResource(R.id.todo_checkbox, android.R.drawable.checkbox_on_background)
        } else {
            views.setInt(R.id.todo_text, "setPaintFlags", Paint.ANTI_ALIAS_FLAG)
            views.setTextColor(R.id.todo_text, 0xFFE8E8ED.toInt())
            views.setImageViewResource(R.id.todo_checkbox, android.R.drawable.checkbox_off_background)
        }

        val fillIntent = Intent().apply {
            putExtra("todo_id", todo.id)
        }
        views.setOnClickFillInIntent(R.id.todo_item_container, fillIntent)

        return views
    }

    override fun getLoadingView(): RemoteViews? = null
    override fun getViewTypeCount(): Int = 1
    override fun getItemId(position: Int): Long = todos[position].id.hashCode().toLong()
    override fun hasStableIds(): Boolean = true
}
