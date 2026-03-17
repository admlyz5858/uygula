package com.focus.pomodoro.ui.stats

import androidx.lifecycle.LiveData
import androidx.lifecycle.Transformations
import androidx.lifecycle.ViewModel
import androidx.lifecycle.asLiveData
import com.focus.pomodoro.data.local.entity.FocusSessionEntity
import com.focus.pomodoro.data.repository.SessionRepository
import com.focus.pomodoro.domain.model.StatsSnapshot
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

class StatsViewModel(
    sessionRepository: SessionRepository,
) : ViewModel() {
    val sessions: LiveData<List<FocusSessionEntity>> = sessionRepository.observeAllSessions().asLiveData()
    val stats: LiveData<StatsSnapshot> = Transformations.map(sessions) { sessions ->
        buildStats(sessions)
    }

    private fun buildStats(sessions: List<FocusSessionEntity>): StatsSnapshot {
        val focusSessions = sessions.filter { it.phase == "FOCUS" && it.completed }
        val today = LocalDate.now()
        val byDay = focusSessions.groupBy {
            Instant.ofEpochMilli(it.startedAt).atZone(ZoneId.systemDefault()).toLocalDate()
        }
        val dailyLabels = (6 downTo 0).map { today.minusDays(it.toLong()) }
        val dailyMinutes = dailyLabels.map { date -> byDay[date].orEmpty().sumOf { it.durationMinutes } }
        val weeklyLabels = (7 downTo 0).map { today.minusWeeks(it.toLong()) }
        val weeklyMinutes = weeklyLabels.map { start ->
            (0L..6L).sumOf { delta -> byDay[start.plusDays(delta)].orEmpty().sumOf { it.durationMinutes } }
        }
        var streak = 0
        var cursor = today
        while (byDay[cursor].orEmpty().isNotEmpty()) {
            streak++
            cursor = cursor.minusDays(1)
        }
        return StatsSnapshot(
            totalFocusMinutes = focusSessions.sumOf { it.durationMinutes },
            completedSessions = focusSessions.size,
            currentStreakDays = streak,
            dailyMinutes = dailyMinutes,
            dailyLabels = dailyLabels.map { it.dayOfWeek.name.take(3) },
            weeklyMinutes = weeklyMinutes,
            weeklyLabels = weeklyLabels.map { "W${it.get(java.time.temporal.IsoFields.WEEK_OF_WEEK_BASED_YEAR)}" },
        )
    }
}
