package com.focus.pomodoro.service

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationManagerCompat
import com.focus.pomodoro.app.FocusPomodoroApplication
import com.focus.pomodoro.core.NotificationHelper
import com.focus.pomodoro.core.TimerStore
import com.focus.pomodoro.domain.model.TimerState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class PomodoroForegroundService : Service() {
    private val scope = CoroutineScope(Dispatchers.Default + Job())
    private lateinit var notificationHelper: NotificationHelper
    private var tickerJob: Job? = null

    private var state = TimerState()
    private var wakeLock: PowerManager.WakeLock? = null

    override fun onCreate() {
        super.onCreate()
        notificationHelper = NotificationHelper(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val minutes = intent.getIntExtra(EXTRA_MINUTES, 25)
                val seconds = minutes * 60
                state = TimerState(running = true, totalSeconds = seconds, remainingSeconds = seconds)
                ensureWakeLock()
                startForeground(NotificationHelper.TIMER_NOTIFICATION_ID, notificationHelper.timerNotification(state.remainingSeconds, true))
                startTicker()
            }
            ACTION_PAUSE -> {
                state = state.copy(running = false)
                tickerJob?.cancel()
                releaseWakeLock()
                updateNotification()
            }
            ACTION_RESUME -> {
                state = state.copy(running = true)
                ensureWakeLock()
                if (tickerJob?.isActive != true) startTicker()
                updateNotification()
            }
            ACTION_STOP -> {
                stopTimer(reset = true)
            }
        }
        TimerStore.update(state)
        return START_STICKY
    }

    private fun startTicker() {
        tickerJob?.cancel()
        tickerJob = scope.launch {
            while (isActive && state.running && state.remainingSeconds > 0) {
                delay(1_000)
                state = state.copy(remainingSeconds = state.remainingSeconds - 1)
                TimerStore.update(state)
                updateNotification()
                if (state.remainingSeconds <= 0) {
                    onSessionCompleted()
                }
            }
        }
    }

    private fun onSessionCompleted() {
        scope.launch {
            val app = application as FocusPomodoroApplication
            app.container.statsRepository.recordSession(
                taskId = null,
                durationMinutes = (state.totalSeconds / 60).coerceAtLeast(1),
                completed = true
            )
            notificationHelper.showGeneral("Pomodoro completed", "Great work. Take a short break.")
            stopTimer(reset = true)
        }
    }

    private fun updateNotification() {
        NotificationManagerCompat.from(this).notify(
            NotificationHelper.TIMER_NOTIFICATION_ID,
            notificationHelper.timerNotification(state.remainingSeconds, state.running)
        )
    }

    private fun stopTimer(reset: Boolean) {
        tickerJob?.cancel()
        releaseWakeLock()
        state = if (reset) TimerState() else state.copy(running = false)
        TimerStore.update(state)
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun ensureWakeLock() {
        if (wakeLock?.isHeld == true) return
        val powerManager = getSystemService(POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "focus:pomodoro_wakelock").apply {
            acquire(35 * 60_000L)
        }
    }

    private fun releaseWakeLock() {
        wakeLock?.takeIf { it.isHeld }?.release()
        wakeLock = null
    }

    override fun onDestroy() {
        tickerJob?.cancel()
        releaseWakeLock()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        const val ACTION_START = "com.focus.pomodoro.action.START"
        const val ACTION_PAUSE = "com.focus.pomodoro.action.PAUSE"
        const val ACTION_RESUME = "com.focus.pomodoro.action.RESUME"
        const val ACTION_STOP = "com.focus.pomodoro.action.STOP"
        const val EXTRA_MINUTES = "extra_minutes"
    }
}
