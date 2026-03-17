package com.focus.pomodoro.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.focus.pomodoro.data.local.entity.StreakEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface StreakDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(streak: StreakEntity)

    @Query("SELECT * FROM streaks WHERE id = 1")
    fun observe(): Flow<StreakEntity?>
}
