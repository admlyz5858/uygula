package com.focus.pomodoro.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "focus_sessions")
data class FocusSessionEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val taskId: Long?,
    val startTime: Long,
    val endTime: Long,
    val durationMinutes: Int,
    val completed: Boolean
)
