package com.focus.pomodoro.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val description: String,
    val priority: Int,
    val estimatedSessions: Int,
    val isCompleted: Boolean,
    val orderIndex: Int,
    val scheduledDateEpochDay: Long,
    val createdAt: Long,
)
