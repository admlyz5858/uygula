package com.focus.pomodoro.domain.model

data class TimerConfig(
    val focusMinutes: Int = 25,
    val shortBreakMinutes: Int = 5,
    val longBreakMinutes: Int = 15,
) {
    val focusDurationMillis: Long = focusMinutes * 60_000L
    val shortBreakDurationMillis: Long = shortBreakMinutes * 60_000L
    val longBreakDurationMillis: Long = longBreakMinutes * 60_000L
}

data class TimerSnapshot(
    val phase: TimerPhase = TimerPhase.FOCUS,
    val isRunning: Boolean = false,
    val remainingMillis: Long = 25 * 60_000L,
    val totalMillis: Long = 25 * 60_000L,
    val completedFocusSessions: Int = 0,
    val cycleCount: Int = 0,
)

sealed interface TimerEvent {
    data class PhaseChanged(val phase: TimerPhase, val completedFocusSessions: Int) : TimerEvent
    data class SessionRecorded(val phase: TimerPhase, val startedAt: Long, val endedAt: Long) : TimerEvent
    data object TimerReset : TimerEvent
}
