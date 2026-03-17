package com.focus.pomodoro.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.focus.pomodoro.data.local.dao.AchievementDao
import com.focus.pomodoro.data.local.dao.FocusSessionDao
import com.focus.pomodoro.data.local.dao.StreakDao
import com.focus.pomodoro.data.local.dao.TaskDao
import com.focus.pomodoro.data.local.entity.AchievementEntity
import com.focus.pomodoro.data.local.entity.FocusSessionEntity
import com.focus.pomodoro.data.local.entity.StreakEntity
import com.focus.pomodoro.data.local.entity.TaskEntity

@Database(
    entities = [TaskEntity::class, FocusSessionEntity::class, StreakEntity::class, AchievementEntity::class],
    version = 1,
    exportSchema = true
)
abstract class FocusDatabase : RoomDatabase() {
    abstract fun taskDao(): TaskDao
    abstract fun focusSessionDao(): FocusSessionDao
    abstract fun streakDao(): StreakDao
    abstract fun achievementDao(): AchievementDao
}
