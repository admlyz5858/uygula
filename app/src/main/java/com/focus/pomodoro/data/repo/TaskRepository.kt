package com.focus.pomodoro.data.repo

import com.focus.pomodoro.data.local.dao.TaskDao
import com.focus.pomodoro.data.local.entity.TaskEntity
import kotlinx.coroutines.flow.Flow

class TaskRepository(private val taskDao: TaskDao) {
    fun observeTasks(): Flow<List<TaskEntity>> = taskDao.observeTasks()

    suspend fun addTask(title: String, description: String, priority: Int, estimatedMinutes: Int) {
        taskDao.insert(
            TaskEntity(
                title = title,
                description = description,
                priority = priority.coerceIn(1, 5),
                estimatedMinutes = estimatedMinutes.coerceIn(5, 240)
            )
        )
    }

    suspend fun setCompleted(taskId: Long, completed: Boolean) = taskDao.setCompleted(taskId, completed)

    suspend fun delete(taskId: Long) = taskDao.delete(taskId)
}
