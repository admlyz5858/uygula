package com.focus.pomodoro.domain.model

data class FocusStats(
    val todayMinutes: Int,
    val streak: Int,
    val bestStreak: Int,
    val level: Int,
    val xp: Int
)
