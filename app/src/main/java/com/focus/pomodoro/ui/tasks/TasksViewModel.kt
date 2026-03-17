package com.focus.pomodoro.ui.tasks

import androidx.lifecycle.ViewModel
import androidx.lifecycle.asLiveData
import androidx.lifecycle.viewModelScope
import com.focus.pomodoro.data.local.entity.TaskEntity
import com.focus.pomodoro.data.repository.TaskRepository
import kotlinx.coroutines.launch

class TasksViewModel(
    private val taskRepository: TaskRepository,
) : ViewModel() {
    val tasks = taskRepository.observeTodayTasks().asLiveData()

    fun addTask(title: String, description: String, priority: Int, sessions: Int) {
        viewModelScope.launch {
            taskRepository.addTask(title, description, priority, sessions)
        }
    }

    fun toggleTask(task: TaskEntity, isCompleted: Boolean) {
        viewModelScope.launch {
            taskRepository.toggleTask(task, isCompleted)
        }
    }

    fun deleteTask(task: TaskEntity) {
        viewModelScope.launch {
            taskRepository.deleteTask(task)
        }
    }

    fun reorder(tasks: List<TaskEntity>) {
        viewModelScope.launch {
            taskRepository.reorder(tasks)
        }
    }
}
