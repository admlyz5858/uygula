package com.focus.pomodoro.service

import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.support.v4.media.session.MediaSessionCompat
import androidx.core.app.NotificationManagerCompat
import com.focus.pomodoro.appContainer
import com.focus.pomodoro.domain.model.TimerConfig
import com.focus.pomodoro.domain.model.TimerEvent
import com.focus.pomodoro.domain.model.UserSettings
import com.focus.pomodoro.utils.NotificationHelper
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class PomodoroService : Service() {
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private val timerEngine by lazy { applicationContext.appContainer.timerEngine }
    private val settingsRepository by lazy { applicationContext.appContainer.settingsRepository }
    private val notificationHelper by lazy { applicationContext.appContainer.notificationHelper }
    private val soundManager by lazy { applicationContext.appContainer.soundManager }
    private lateinit var mediaSession: MediaSessionCompat
    private var wakeLock: PowerManager.WakeLock? = null
    private var latestSettings = UserSettings()
    private var foregroundStarted = false

    override fun onCreate() {
        super.onCreate()
        mediaSession = MediaSessionCompat(this, "FocusPomodoroMedia")
        serviceScope.launch {
            settingsRepository.settingsFlow.collectLatest { settings ->
                latestSettings = settings
            }
        }
        serviceScope.launch {
            timerEngine.state.collectLatest { snapshot ->
                if (snapshot.isRunning && !foregroundStarted) {
                    startForeground(
                        NotificationHelper.TIMER_NOTIFICATION_ID,
                        notificationHelper.buildTimerNotification(snapshot, mediaSession, latestSettings.lockScreenOverlay),
                    )
                    foregroundStarted = true
                } else if (foregroundStarted) {
                    NotificationManagerCompat.from(this@PomodoroService).notify(
                        NotificationHelper.TIMER_NOTIFICATION_ID,
                        notificationHelper.buildTimerNotification(snapshot, mediaSession, latestSettings.lockScreenOverlay),
                    )
                }
                handleWakeLock(snapshot.isRunning)
                if (latestSettings.ambientEnabled && snapshot.isRunning && snapshot.phase.name == "FOCUS") {
                    soundManager.startAmbientLoop()
                } else {
                    soundManager.stopAmbientLoop()
                }
                sendBroadcast(Intent(ACTION_WIDGET_REFRESH))
            }
        }
        serviceScope.launch {
            timerEngine.events.collectLatest { event ->
                if (event is TimerEvent.SessionRecorded) {
                    vibrateAndAlert(event.phase.label)
                }
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val config = TimerConfig(
                    focusMinutes = intent.getIntExtra(EXTRA_FOCUS_MINUTES, latestSettings.focusMinutes),
                    shortBreakMinutes = intent.getIntExtra(EXTRA_SHORT_BREAK_MINUTES, latestSettings.shortBreakMinutes),
                    longBreakMinutes = intent.getIntExtra(EXTRA_LONG_BREAK_MINUTES, latestSettings.longBreakMinutes),
                )
                startForeground(
                    NotificationHelper.TIMER_NOTIFICATION_ID,
                    notificationHelper.buildTimerNotification(timerEngine.state.value, mediaSession, latestSettings.lockScreenOverlay),
                )
                foregroundStarted = true
                timerEngine.start(config)
            }
            ACTION_PAUSE -> timerEngine.pause()
            ACTION_RESUME -> timerEngine.resume()
            ACTION_RESET -> {
                timerEngine.reset()
                foregroundStarted = false
                stopForeground(STOP_FOREGROUND_REMOVE)
                soundManager.stopAmbientLoop()
                stopSelf()
            }
            ACTION_SKIP -> timerEngine.skip()
        }
        return START_STICKY
    }

    private fun vibrateAndAlert(phaseLabel: String) {
        if (latestSettings.soundEnabled) {
            soundManager.playBell()
        }
        val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (getSystemService(VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(VIBRATOR_SERVICE) as Vibrator
        }
        vibrator.vibrate(VibrationEffect.createOneShot(500L, VibrationEffect.DEFAULT_AMPLITUDE))
        notificationHelper.showPhaseFinished("$phaseLabel finished", "Take a breath and move into the next interval.")
    }

    private fun handleWakeLock(shouldHold: Boolean) {
        if (shouldHold && wakeLock?.isHeld != true) {
            val manager = getSystemService(POWER_SERVICE) as PowerManager
            wakeLock = manager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "focus:pomodoro").apply { acquire(30 * 60 * 1000L) }
        } else if (!shouldHold) {
            wakeLock?.takeIf { it.isHeld }?.release()
        }
    }

    override fun onDestroy() {
        soundManager.stopAmbientLoop()
        mediaSession.release()
        wakeLock?.takeIf { it.isHeld }?.release()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        const val ACTION_START = "com.focus.pomodoro.action.START"
        const val ACTION_PAUSE = "com.focus.pomodoro.action.PAUSE"
        const val ACTION_RESUME = "com.focus.pomodoro.action.RESUME"
        const val ACTION_RESET = "com.focus.pomodoro.action.RESET"
        const val ACTION_SKIP = "com.focus.pomodoro.action.SKIP"
        const val ACTION_WIDGET_REFRESH = "com.focus.pomodoro.ACTION_WIDGET_REFRESH"
        const val EXTRA_FOCUS_MINUTES = "focus_minutes"
        const val EXTRA_SHORT_BREAK_MINUTES = "short_break_minutes"
        const val EXTRA_LONG_BREAK_MINUTES = "long_break_minutes"
    }
}
