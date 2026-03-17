package com.focus.pomodoro.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.focus.pomodoro.data.local.entity.AchievementEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface AchievementDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(achievements: List<AchievementEntity>)

    @Query("SELECT * FROM achievements ORDER BY unlocked DESC, title ASC")
    fun observeAchievements(): Flow<List<AchievementEntity>>
}
