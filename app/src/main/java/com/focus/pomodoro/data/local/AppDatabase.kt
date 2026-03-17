package com.focus.pomodoro.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.focus.pomodoro.data.local.dao.FocusSessionDao
import com.focus.pomodoro.data.local.dao.TaskDao
import com.focus.pomodoro.data.local.entity.FocusSessionEntity
import com.focus.pomodoro.data.local.entity.TaskEntity

@Database(
    entities = [TaskEntity::class, FocusSessionEntity::class],
    version = 1,
    exportSchema = false,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun taskDao(): TaskDao
    abstract fun focusSessionDao(): FocusSessionDao
}
