package com.focus.pomodoro.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import com.focus.pomodoro.data.local.entity.FocusSessionEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface FocusSessionDao {
    @Insert
    suspend fun insert(session: FocusSessionEntity)

    @Query("SELECT * FROM focus_sessions ORDER BY startTime DESC")
    fun observeSessions(): Flow<List<FocusSessionEntity>>

    @Query("SELECT IFNULL(SUM(durationMinutes), 0) FROM focus_sessions WHERE date(startTime / 1000, 'unixepoch', 'localtime') = date('now', 'localtime')")
    fun observeTodayMinutes(): Flow<Int>
}
