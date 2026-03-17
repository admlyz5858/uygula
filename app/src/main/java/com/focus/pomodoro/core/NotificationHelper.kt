package com.focus.pomodoro.core

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.focus.pomodoro.MainActivity
import com.focus.pomodoro.R
import com.focus.pomodoro.core.util.toClock
import com.focus.pomodoro.receiver.PomodoroActionReceiver
import com.focus.pomodoro.service.PomodoroForegroundService

class NotificationHelper(private val context: Context) {
    private val manager = NotificationManagerCompat.from(context)

    fun createChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val systemManager = context.getSystemService(NotificationManager::class.java)
        val timerChannel = NotificationChannel(
            TIMER_CHANNEL,
            context.getString(R.string.channel_timer),
            NotificationManager.IMPORTANCE_LOW
        )
        val generalChannel = NotificationChannel(
            GENERAL_CHANNEL,
            context.getString(R.string.channel_general),
            NotificationManager.IMPORTANCE_DEFAULT
        )
        systemManager.createNotificationChannels(listOf(timerChannel, generalChannel))
    }

    fun timerNotification(remainingSeconds: Int, running: Boolean): Notification {
        val launchIntent = PendingIntent.getActivity(
            context,
            100,
            Intent(context, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val toggleAction = NotificationCompat.Action.Builder(
            android.R.drawable.ic_media_play,
            if (running) "Pause" else "Resume",
            actionPendingIntent(if (running) PomodoroForegroundService.ACTION_PAUSE else PomodoroForegroundService.ACTION_RESUME)
        ).build()

        val stopAction = NotificationCompat.Action.Builder(
            android.R.drawable.ic_menu_close_clear_cancel,
            "Stop",
            actionPendingIntent(PomodoroForegroundService.ACTION_STOP)
        ).build()

        return NotificationCompat.Builder(context, TIMER_CHANNEL)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle(context.getString(R.string.timer_notification_title))
            .setContentText("Remaining ${remainingSeconds.toClock()}")
            .setOnlyAlertOnce(true)
            .setOngoing(running)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(launchIntent)
            .addAction(toggleAction)
            .addAction(stopAction)
            .setStyle(androidx.media.app.NotificationCompat.MediaStyle().setShowActionsInCompactView(0, 1))
            .build()
    }

    fun showGeneral(title: String, text: String) {
        val notification = NotificationCompat.Builder(context, GENERAL_CHANNEL)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle(title)
            .setContentText(text)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()
        manager.notify((System.currentTimeMillis() % Int.MAX_VALUE).toInt(), notification)
    }

    private fun actionPendingIntent(action: String): PendingIntent {
        val intent = Intent(context, PomodoroActionReceiver::class.java).setAction(action)
        return PendingIntent.getBroadcast(
            context,
            action.hashCode(),
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
    }

    companion object {
        const val TIMER_CHANNEL = "timer_channel"
        const val GENERAL_CHANNEL = "general_channel"
        const val TIMER_NOTIFICATION_ID = 7
    }
}
