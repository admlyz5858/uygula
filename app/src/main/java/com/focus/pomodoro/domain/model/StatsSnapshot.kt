package com.focus.pomodoro.domain.model

data class StatsSnapshot(
    val totalFocusMinutes: Int,
    val completedSessions: Int,
    val currentStreakDays: Int,
    val dailyMinutes: List<Int>,
    val dailyLabels: List<String>,
    val weeklyMinutes: List<Int>,
    val weeklyLabels: List<String>,
)
