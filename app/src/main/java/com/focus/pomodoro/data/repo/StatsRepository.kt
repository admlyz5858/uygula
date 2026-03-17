package com.focus.pomodoro.data.repo

import com.focus.pomodoro.data.local.dao.AchievementDao
import com.focus.pomodoro.data.local.dao.FocusSessionDao
import com.focus.pomodoro.data.local.dao.StreakDao
import com.focus.pomodoro.data.local.entity.AchievementEntity
import com.focus.pomodoro.data.local.entity.FocusSessionEntity
import com.focus.pomodoro.data.local.entity.StreakEntity
import com.focus.pomodoro.domain.model.FocusStats
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.first
import java.time.LocalDate

class StatsRepository(
    private val focusSessionDao: FocusSessionDao,
    private val streakDao: StreakDao,
    private val achievementDao: AchievementDao
) {
    fun observeSessions(): Flow<List<FocusSessionEntity>> = focusSessionDao.observeSessions()

    fun observeStats(): Flow<FocusStats> = combine(
        focusSessionDao.observeTodayMinutes(),
        streakDao.observe()
    ) { todayMinutes, streak ->
        val state = streak ?: StreakEntity(
            currentStreak = 0,
            bestStreak = 0,
            totalFocusMinutes = 0,
            level = 1,
            xp = 0,
            lastSessionDay = ""
        )
        FocusStats(
            todayMinutes = todayMinutes,
            streak = state.currentStreak,
            bestStreak = state.bestStreak,
            level = state.level,
            xp = state.xp
        )
    }

    fun observeAchievements(): Flow<List<AchievementEntity>> = achievementDao.observeAchievements()

    suspend fun recordSession(taskId: Long?, durationMinutes: Int, completed: Boolean) {
        val now = System.currentTimeMillis()
        focusSessionDao.insert(
            FocusSessionEntity(
                taskId = taskId,
                startTime = now - (durationMinutes * 60_000L),
                endTime = now,
                durationMinutes = durationMinutes,
                completed = completed
            )
        )

        val today = LocalDate.now().toString()
        val existing = streakDao.observe().first()

        val streakEntity = if (existing == null) {
            StreakEntity(
                currentStreak = 1,
                bestStreak = 1,
                totalFocusMinutes = durationMinutes,
                level = 1,
                xp = durationMinutes,
                lastSessionDay = today
            )
        } else {
            val isSameDay = existing.lastSessionDay == today
            val updatedStreak = if (isSameDay) existing.currentStreak else existing.currentStreak + 1
            val totalMinutes = existing.totalFocusMinutes + durationMinutes
            val xp = existing.xp + durationMinutes
            val level = (xp / 250) + 1
            existing.copy(
                currentStreak = updatedStreak,
                bestStreak = maxOf(existing.bestStreak, updatedStreak),
                totalFocusMinutes = totalMinutes,
                xp = xp,
                level = level,
                lastSessionDay = today
            )
        }

        streakDao.upsert(streakEntity)
        refreshAchievements(streakEntity)
    }

    private suspend fun refreshAchievements(streak: StreakEntity) {
        val now = System.currentTimeMillis()
        val rows = listOf(
            AchievementEntity(key = "first_focus", title = "First Focus Session", unlocked = streak.totalFocusMinutes >= 25, unlockedAt = if (streak.totalFocusMinutes >= 25) now else null),
            AchievementEntity(key = "streak_7", title = "7-day Streak", unlocked = streak.currentStreak >= 7, unlockedAt = if (streak.currentStreak >= 7) now else null),
            AchievementEntity(key = "level_5", title = "Reached Level 5", unlocked = streak.level >= 5, unlockedAt = if (streak.level >= 5) now else null)
        )
        achievementDao.upsertAll(rows)
    }
}
