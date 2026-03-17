package com.focus.pomodoro.ui.timer

import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.focus.pomodoro.R
import com.focus.pomodoro.ai.AIService
import com.focus.pomodoro.data.repository.NatureRepository
import com.focus.pomodoro.data.repository.QuotesRepository
import com.focus.pomodoro.data.repository.SettingsRepository
import com.focus.pomodoro.domain.model.TimerSnapshot
import com.focus.pomodoro.domain.model.UserSettings
import com.focus.pomodoro.service.PomodoroService
import com.focus.pomodoro.service.TimerEngine
import com.focus.pomodoro.service.VideoRenderService
import java.io.File
import java.time.LocalDate
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class HomeTimerViewModel(
    private val timerEngine: TimerEngine,
    private val settingsRepository: SettingsRepository,
    private val natureRepository: NatureRepository,
    private val quotesRepository: QuotesRepository,
) : ViewModel() {
    private val confettiBursts = MutableStateFlow(0)
    private val uiTicker = MutableStateFlow(System.currentTimeMillis())

    val uiState: StateFlow<HomeTimerUiState> = combine(
        timerEngine.state,
        settingsRepository.settingsFlow,
        confettiBursts,
        uiTicker,
    ) { snapshot, settings, confetti, now ->
        HomeTimerUiState(
            timer = snapshot,
            settings = settings,
            quote = quotesRepository.quoteForDay(LocalDate.now().dayOfYear),
            backgroundRes = natureRepository.backgroundForTimestamp(now),
            confettiBursts = confetti,
        )
    }.stateIn(viewModelScope, kotlinx.coroutines.flow.SharingStarted.WhileSubscribed(5_000), HomeTimerUiState())

    init {
        viewModelScope.launch {
            while (true) {
                uiTicker.value = System.currentTimeMillis()
                delay(5_000L)
            }
        }
        viewModelScope.launch {
            timerEngine.events.collect { event ->
                if (event is com.focus.pomodoro.domain.model.TimerEvent.SessionRecorded && event.phase == com.focus.pomodoro.domain.model.TimerPhase.FOCUS) {
                    confettiBursts.update { it + 1 }
                }
            }
        }
    }

    fun startTimer(context: Context, settings: UserSettings) {
        val intent = Intent(context, PomodoroService::class.java)
            .setAction(PomodoroService.ACTION_START)
            .putExtra(PomodoroService.EXTRA_FOCUS_MINUTES, settings.focusMinutes)
            .putExtra(PomodoroService.EXTRA_SHORT_BREAK_MINUTES, settings.shortBreakMinutes)
            .putExtra(PomodoroService.EXTRA_LONG_BREAK_MINUTES, settings.longBreakMinutes)
        ContextCompat.startForegroundService(context, intent)
    }

    fun pause(context: Context) = context.startService(Intent(context, PomodoroService::class.java).setAction(PomodoroService.ACTION_PAUSE))
    fun resume(context: Context) = context.startService(Intent(context, PomodoroService::class.java).setAction(PomodoroService.ACTION_RESUME))
    fun reset(context: Context) = context.startService(Intent(context, PomodoroService::class.java).setAction(PomodoroService.ACTION_RESET))
    fun skip(context: Context) = context.startService(Intent(context, PomodoroService::class.java).setAction(PomodoroService.ACTION_SKIP))

    fun renderVideo(context: Context, settings: UserSettings) {
        val intent = Intent(context, VideoRenderService::class.java)
            .putExtra(VideoRenderService.EXTRA_DURATION_SECONDS, settings.focusMinutes * 60)
        ContextCompat.startForegroundService(context, intent)
    }

    fun shareLastVideo(context: Context, path: String?) {
        val file = path?.let(::File)?.takeIf { it.exists() } ?: return
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
        val intent = Intent(Intent.ACTION_SEND)
            .setType("video/mp4")
            .putExtra(Intent.EXTRA_STREAM, uri)
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        context.startActivity(Intent.createChooser(intent, "Share focus video"))
    }
}

data class HomeTimerUiState(
    val timer: TimerSnapshot = TimerSnapshot(),
    val settings: UserSettings = UserSettings(),
    val quote: String = "Protect your attention.",
    val backgroundRes: Int = R.drawable.nature_morning,
    val confettiBursts: Int = 0,
)
