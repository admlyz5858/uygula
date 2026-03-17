package com.focus.pomodoro.ui.ai

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.focus.pomodoro.ai.AIService
import com.focus.pomodoro.data.repository.TaskRepository
import com.focus.pomodoro.domain.model.AiPlanItem
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class AIPlannerViewModel(
    private val aiService: AIService,
    private val taskRepository: TaskRepository,
) : ViewModel() {
    private val _uiState = MutableStateFlow(AIPlannerUiState())
    val uiState: StateFlow<AIPlannerUiState> = _uiState.asStateFlow()

    fun updateInput(value: String) {
        _uiState.update { it.copy(input = value) }
    }

    fun updateItem(index: Int, title: String? = null, description: String? = null, sessions: Int? = null, priority: Int? = null) {
        _uiState.update { state ->
            val updated = state.items.toMutableList()
            val current = updated[index]
            updated[index] = current.copy(
                title = title ?: current.title,
                description = description ?: current.description,
                suggestedSessions = sessions ?: current.suggestedSessions,
                priority = priority ?: current.priority,
            )
            state.copy(items = updated)
        }
    }

    fun generatePlan() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val plan = aiService.generatePlan(_uiState.value.input)
            _uiState.update {
                it.copy(
                    isLoading = false,
                    title = plan.title,
                    summary = plan.summary,
                    items = plan.items,
                )
            }
        }
    }

    fun savePlanToTasks() {
        viewModelScope.launch {
            _uiState.value.items.forEach { item ->
                taskRepository.addTask(item.title, item.description, item.priority, item.suggestedSessions)
            }
            _uiState.update { it.copy(statusMessage = "Plan saved to Tasks") }
        }
    }
}

data class AIPlannerUiState(
    val input: String = "",
    val title: String = "AI Planner",
    val summary: String = "Describe your goals and generate a session-based plan.",
    val items: List<AiPlanItem> = emptyList(),
    val isLoading: Boolean = false,
    val statusMessage: String? = null,
)
