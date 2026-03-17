package com.focus.pomodoro.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.focus.pomodoro.R
import com.focus.pomodoro.appContainer
import com.focus.pomodoro.service.PomodoroService
import com.focus.pomodoro.utils.formatAsTimer

class FocusWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        appWidgetIds.forEach { appWidgetId ->
            appWidgetManager.updateAppWidget(appWidgetId, buildViews(context))
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == PomodoroService.ACTION_WIDGET_REFRESH) {
            val manager = AppWidgetManager.getInstance(context)
            val component = ComponentName(context, FocusWidgetProvider::class.java)
            manager.updateAppWidget(component, buildViews(context))
        }
    }

    private fun buildViews(context: Context): RemoteViews {
        val snapshot = context.appContainer.timerEngine.state.value
        return RemoteViews(context.packageName, R.layout.widget_focus_timer).apply {
            setTextViewText(R.id.widget_timer, snapshot.remainingMillis.formatAsTimer())
            setOnClickPendingIntent(R.id.widget_start, serviceIntent(context, PomodoroService.ACTION_START, 100))
            setOnClickPendingIntent(R.id.widget_pause, serviceIntent(context, if (snapshot.isRunning) PomodoroService.ACTION_PAUSE else PomodoroService.ACTION_RESUME, 101))
        }
    }

    private fun serviceIntent(context: Context, action: String, requestCode: Int): PendingIntent {
        val intent = Intent(context, PomodoroService::class.java).setAction(action)
        return PendingIntent.getService(context, requestCode, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }
}
