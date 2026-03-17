package com.focus.pomodoro.feature.tasks

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.focus.pomodoro.data.local.entity.TaskEntity
import com.focus.pomodoro.data.repo.TaskRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class TasksViewModel(private val repository: TaskRepository) : ViewModel() {
    val tasks: StateFlow<List<TaskEntity>> = repository.observeTasks().stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = emptyList()
    )

    fun addTask(title: String, description: String, priority: Int, minutes: Int) {
        if (title.isBlank()) return
        viewModelScope.launch {
            repository.addTask(title, description, priority, minutes)
        }
    }

    fun toggle(task: TaskEntity) {
        viewModelScope.launch {
            repository.setCompleted(task.id, !task.completed)
        }
    }

    fun delete(taskId: Long) {
        viewModelScope.launch { repository.delete(taskId) }
    }
}
