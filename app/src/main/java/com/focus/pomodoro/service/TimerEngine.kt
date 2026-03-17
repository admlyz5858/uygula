package com.focus.pomodoro.service

import android.os.SystemClock
import com.focus.pomodoro.data.repository.SessionRepository
import com.focus.pomodoro.domain.model.TimerConfig
import com.focus.pomodoro.domain.model.TimerEvent
import com.focus.pomodoro.domain.model.TimerPhase
import com.focus.pomodoro.domain.model.TimerSnapshot
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class TimerEngine(
    private val scope: CoroutineScope,
    private val sessionRepository: SessionRepository,
) {
    private val mutex = Mutex()
    private val _state = MutableStateFlow(TimerSnapshot())
    val state = _state.asStateFlow()

    private val _events = MutableSharedFlow<TimerEvent>(extraBufferCapacity = 16)
    val events = _events.asSharedFlow()

    private var tickerJob: Job? = null
    private var timerConfig = TimerConfig()
    private var phaseStartedRealtime = 0L
    private var phaseStartedWallClock = 0L
    private var pausedRemainingMillis = _state.value.remainingMillis

    fun start(config: TimerConfig = timerConfig) {
        scope.launch {
            mutex.withLock {
                timerConfig = config
                beginPhase(TimerPhase.FOCUS, config.focusDurationMillis, resetCycle = false)
            }
        }
    }

    fun pause() {
        scope.launch {
            mutex.withLock {
                if (!_state.value.isRunning) return@withLock
                pausedRemainingMillis = currentRemainingMillis().coerceAtLeast(0L)
                tickerJob?.cancel()
                _state.update { it.copy(isRunning = false, remainingMillis = pausedRemainingMillis) }
            }
        }
    }

    fun resume() {
        scope.launch {
            mutex.withLock {
                if (_state.value.isRunning) return@withLock
                beginTicker(pausedRemainingMillis)
            }
        }
    }

    fun reset() {
        scope.launch {
            mutex.withLock {
                tickerJob?.cancel()
                pausedRemainingMillis = timerConfig.focusDurationMillis
                _state.value = TimerSnapshot(remainingMillis = pausedRemainingMillis, totalMillis = pausedRemainingMillis)
                _events.emit(TimerEvent.TimerReset)
            }
        }
    }

    fun skip() {
        scope.launch {
            mutex.withLock { onPhaseCompleted(completed = false) }
        }
    }

    private fun beginPhase(phase: TimerPhase, durationMillis: Long, resetCycle: Boolean) {
        if (resetCycle) {
            _state.update { it.copy(completedFocusSessions = 0, cycleCount = 0) }
        }
        pausedRemainingMillis = durationMillis
        phaseStartedWallClock = System.currentTimeMillis()
        _state.update {
            it.copy(
                phase = phase,
                totalMillis = durationMillis,
                remainingMillis = durationMillis,
                isRunning = true,
            )
        }
        _events.tryEmit(TimerEvent.PhaseChanged(phase, _state.value.completedFocusSessions))
        beginTicker(durationMillis)
    }

    private fun beginTicker(durationMillis: Long) {
        tickerJob?.cancel()
        phaseStartedRealtime = SystemClock.elapsedRealtime()
        _state.update { it.copy(isRunning = true, remainingMillis = durationMillis) }
        tickerJob = scope.launch {
            while (true) {
                val remaining = currentRemainingMillis().coerceAtLeast(0L)
                _state.update { it.copy(remainingMillis = remaining) }
                if (remaining <= 0L) {
                    mutex.withLock { onPhaseCompleted(completed = true) }
                    break
                }
                delay(100L)
            }
        }
    }

    private fun currentRemainingMillis(): Long =
        pausedRemainingMillis - (SystemClock.elapsedRealtime() - phaseStartedRealtime)

    private suspend fun onPhaseCompleted(completed: Boolean) {
        tickerJob?.cancel()
        val snapshot = _state.value
        val endedAt = System.currentTimeMillis()
        sessionRepository.recordSession(
            phase = snapshot.phase,
            startedAt = phaseStartedWallClock,
            endedAt = endedAt,
            completed = completed,
            note = snapshot.phase.label,
        )
        _events.emit(TimerEvent.SessionRecorded(snapshot.phase, phaseStartedWallClock, endedAt))

        val completedFocusSessions = if (snapshot.phase == TimerPhase.FOCUS && completed) {
            snapshot.completedFocusSessions + 1
        } else {
            snapshot.completedFocusSessions
        }
        val nextPhase = when (snapshot.phase) {
            TimerPhase.FOCUS -> if (completedFocusSessions > 0 && completedFocusSessions % 4 == 0) TimerPhase.LONG_BREAK else TimerPhase.SHORT_BREAK
            TimerPhase.SHORT_BREAK, TimerPhase.LONG_BREAK -> TimerPhase.FOCUS
        }
        val nextDuration = when (nextPhase) {
            TimerPhase.FOCUS -> timerConfig.focusDurationMillis
            TimerPhase.SHORT_BREAK -> timerConfig.shortBreakDurationMillis
            TimerPhase.LONG_BREAK -> timerConfig.longBreakDurationMillis
        }
        _state.update {
            it.copy(
                completedFocusSessions = completedFocusSessions,
                cycleCount = completedFocusSessions / 4,
            )
        }
        beginPhase(nextPhase, nextDuration, resetCycle = false)
    }
}
