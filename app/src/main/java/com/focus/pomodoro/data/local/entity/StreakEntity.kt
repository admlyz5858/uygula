package com.focus.pomodoro.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "streaks")
data class StreakEntity(
    @PrimaryKey val id: Int = 1,
    val currentStreak: Int,
    val bestStreak: Int,
    val totalFocusMinutes: Int,
    val level: Int,
    val xp: Int,
    val lastSessionDay: String
)
