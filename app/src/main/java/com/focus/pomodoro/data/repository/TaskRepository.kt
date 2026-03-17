package com.focus.pomodoro.data.repository

import com.focus.pomodoro.data.local.dao.TaskDao
import com.focus.pomodoro.data.local.entity.TaskEntity
import java.time.LocalDate
import kotlinx.coroutines.flow.Flow

class TaskRepository(
    private val taskDao: TaskDao,
) {
    fun observeTodayTasks(): Flow<List<TaskEntity>> = taskDao.observeTasksForDay(LocalDate.now().toEpochDay())

    suspend fun addTask(
        title: String,
        description: String,
        priority: Int,
        estimatedSessions: Int,
        scheduledDateEpochDay: Long = LocalDate.now().toEpochDay(),
    ) {
        val maxOrder = taskDao.maxOrderForDay(scheduledDateEpochDay)
        taskDao.insert(
            TaskEntity(
                title = title.trim(),
                description = description.trim(),
                priority = priority.coerceIn(1, 5),
                estimatedSessions = estimatedSessions.coerceAtLeast(1),
                isCompleted = false,
                orderIndex = maxOrder + 1,
                scheduledDateEpochDay = scheduledDateEpochDay,
                createdAt = System.currentTimeMillis(),
            )
        )
    }

    suspend fun toggleTask(task: TaskEntity, isCompleted: Boolean) {
        taskDao.update(task.copy(isCompleted = isCompleted))
    }

    suspend fun deleteTask(task: TaskEntity) {
        taskDao.delete(task)
    }

    suspend fun reorder(tasks: List<TaskEntity>) {
        tasks.forEachIndexed { index, task ->
            taskDao.update(task.copy(orderIndex = index))
        }
    }
}
