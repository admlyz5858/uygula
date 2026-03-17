package com.focus.pomodoro.domain.model

data class PlannerSuggestion(
    val title: String,
    val priority: Int,
    val sessions: Int,
    val minutesPerSession: Int,
    val notes: String
)
