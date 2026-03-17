package com.focus.pomodoro.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import com.focus.pomodoro.data.local.entity.TaskEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface TaskDao {
    @Query("SELECT * FROM tasks WHERE scheduledDateEpochDay = :epochDay ORDER BY orderIndex ASC, createdAt DESC")
    fun observeTasksForDay(epochDay: Long): Flow<List<TaskEntity>>

    @Insert
    suspend fun insert(task: TaskEntity): Long

    @Update
    suspend fun update(task: TaskEntity)

    @Delete
    suspend fun delete(task: TaskEntity)

    @Query("SELECT COALESCE(MAX(orderIndex), 0) FROM tasks WHERE scheduledDateEpochDay = :epochDay")
    suspend fun maxOrderForDay(epochDay: Long): Int
}
