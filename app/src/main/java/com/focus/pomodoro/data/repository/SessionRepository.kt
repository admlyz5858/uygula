package com.focus.pomodoro.data.repository

import com.focus.pomodoro.data.local.dao.FocusSessionDao
import com.focus.pomodoro.data.local.entity.FocusSessionEntity
import com.focus.pomodoro.domain.model.TimerPhase
import kotlinx.coroutines.flow.Flow

class SessionRepository(
    private val focusSessionDao: FocusSessionDao,
) {
    fun observeAllSessions(): Flow<List<FocusSessionEntity>> = focusSessionDao.observeAll()

    fun observeSessionsForRange(start: Long, end: Long): Flow<List<FocusSessionEntity>> =
        focusSessionDao.observeBetween(start, end)

    suspend fun recordSession(
        phase: TimerPhase,
        startedAt: Long,
        endedAt: Long,
        completed: Boolean,
        note: String,
    ) {
        val durationMinutes = (((endedAt - startedAt).coerceAtLeast(0L)) / 60_000L).toInt()
        focusSessionDao.insert(
            FocusSessionEntity(
                phase = phase.name,
                startedAt = startedAt,
                endedAt = endedAt,
                durationMinutes = durationMinutes,
                completed = completed,
                note = note,
            )
        )
    }

    suspend fun getAllSessionsOnce(): List<FocusSessionEntity> = focusSessionDao.getAllOnce()
}
