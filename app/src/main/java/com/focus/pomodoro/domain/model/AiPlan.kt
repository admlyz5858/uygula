package com.focus.pomodoro.domain.model

data class AiPlan(
    val title: String,
    val summary: String,
    val items: List<AiPlanItem>,
)

data class AiPlanItem(
    val title: String,
    val description: String,
    val suggestedSessions: Int,
    val priority: Int,
)
