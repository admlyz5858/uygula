package com.focus.pomodoro.utils

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.media.app.NotificationCompat.MediaStyle
import androidx.media.session.MediaButtonReceiver
import androidx.media.MediaBrowserServiceCompat
import androidx.media.session.MediaButtonReceiver.handleIntent
import androidx.core.net.toUri
import androidx.media.app.NotificationCompat as MediaNotificationCompat
import androidx.media.session.MediaButtonReceiver.buildMediaButtonPendingIntent
import android.support.v4.media.session.MediaSessionCompat
import com.focus.pomodoro.MainActivity
import com.focus.pomodoro.R
import com.focus.pomodoro.domain.model.TimerSnapshot
import com.focus.pomodoro.service.PomodoroService
import com.focus.pomodoro.ui.timer.LockScreenTimerActivity

class NotificationHelper(
    private val context: Context,
) {
    private val manager = NotificationManagerCompat.from(context)

    fun createChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val notificationManager = context.getSystemService(NotificationManager::class.java)
        val timerChannel = NotificationChannel(CHANNEL_TIMER, context.getString(R.string.timer_channel_name), NotificationManager.IMPORTANCE_LOW)
        timerChannel.lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        val alertsChannel = NotificationChannel(CHANNEL_ALERTS, context.getString(R.string.alerts_channel_name), NotificationManager.IMPORTANCE_HIGH)
        alertsChannel.lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        val renderChannel = NotificationChannel(CHANNEL_RENDER, context.getString(R.string.render_channel_name), NotificationManager.IMPORTANCE_LOW)
        notificationManager.createNotificationChannels(listOf(timerChannel, alertsChannel, renderChannel))
    }

    fun buildTimerNotification(
        snapshot: TimerSnapshot,
        mediaSession: MediaSessionCompat,
        showFullScreen: Boolean,
    ): Notification {
        val openAppIntent = PendingIntent.getActivity(
            context,
            200,
            Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val fullScreenIntent = PendingIntent.getActivity(
            context,
            201,
            Intent(context, LockScreenTimerActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val pauseOrResumeAction = if (snapshot.isRunning) PomodoroService.ACTION_PAUSE else PomodoroService.ACTION_RESUME
        val pauseOrResumeLabel = if (snapshot.isRunning) "Pause" else "Resume"

        return NotificationCompat.Builder(context, CHANNEL_TIMER)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("${snapshot.phase.label} • ${snapshot.remainingMillis.formatAsTimer()}")
            .setContentText("Completed sessions: ${snapshot.completedFocusSessions}")
            .setContentIntent(openAppIntent)
            .setDeleteIntent(servicePendingIntent(PomodoroService.ACTION_RESET, 204))
            .setOngoing(snapshot.isRunning)
            .setOnlyAlertOnce(true)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_PROGRESS)
            .addAction(0, pauseOrResumeLabel, servicePendingIntent(pauseOrResumeAction, 202))
            .addAction(0, "Skip", servicePendingIntent(PomodoroService.ACTION_SKIP, 203))
            .addAction(0, "Reset", servicePendingIntent(PomodoroService.ACTION_RESET, 204))
            .setStyle(
                MediaStyle()
                    .setMediaSession(mediaSession.sessionToken)
                    .setShowActionsInCompactView(0, 1, 2)
            )
            .setFullScreenIntent(fullScreenIntent, showFullScreen)
            .build()
    }

    fun showPhaseFinished(title: String, message: String) {
        manager.notify(
            ALERT_NOTIFICATION_ID,
            NotificationCompat.Builder(context, CHANNEL_ALERTS)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(message)
                .setAutoCancel(true)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .build()
        )
    }

    fun showDailySuggestion(message: String) {
        manager.notify(
            DAILY_NOTIFICATION_ID,
            NotificationCompat.Builder(context, CHANNEL_ALERTS)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("Today's focus suggestion")
                .setContentText(message)
                .setAutoCancel(true)
                .build()
        )
    }

    fun buildRenderNotification(contentText: String, isFinished: Boolean = false, contentIntent: PendingIntent? = null): Notification {
        return NotificationCompat.Builder(context, CHANNEL_RENDER)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(if (isFinished) "Video render complete" else "Rendering timer video")
            .setContentText(contentText)
            .setOngoing(!isFinished)
            .setAutoCancel(isFinished)
            .setContentIntent(contentIntent)
            .build()
    }

    private fun servicePendingIntent(action: String, requestCode: Int): PendingIntent {
        val intent = Intent(context, PomodoroService::class.java).setAction(action)
        return PendingIntent.getService(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    companion object {
        const val CHANNEL_TIMER = "timer"
        const val CHANNEL_ALERTS = "alerts"
        const val CHANNEL_RENDER = "render"
        const val TIMER_NOTIFICATION_ID = 1001
        const val ALERT_NOTIFICATION_ID = 1002
        const val RENDER_NOTIFICATION_ID = 1003
        const val DAILY_NOTIFICATION_ID = 1004
    }
}
