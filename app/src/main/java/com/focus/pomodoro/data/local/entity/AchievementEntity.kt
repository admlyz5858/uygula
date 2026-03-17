package com.focus.pomodoro.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "achievements")
data class AchievementEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val key: String,
    val title: String,
    val unlocked: Boolean,
    val unlockedAt: Long?
)
