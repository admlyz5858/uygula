package com.focus.pomodoro.domain.model

data class TimerState(
    val running: Boolean = false,
    val totalSeconds: Int = 25 * 60,
    val remainingSeconds: Int = 25 * 60,
    val sessionType: String = "FOCUS"
)
