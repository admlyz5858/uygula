package com.focus.pomodoro.feature.planner

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.focus.pomodoro.data.repo.PlannerRepository
import com.focus.pomodoro.data.repo.TaskRepository
import com.focus.pomodoro.domain.model.PlannerSuggestion
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class PlannerViewModel(
    private val plannerRepository: PlannerRepository,
    private val taskRepository: TaskRepository
) : ViewModel() {
    private val _state = MutableStateFlow(PlannerUiState())
    val state: StateFlow<PlannerUiState> = _state.asStateFlow()

    fun updateInput(value: String) {
        _state.value = _state.value.copy(input = value)
    }

    fun generate() {
        val input = _state.value.input
        if (input.isBlank()) return
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, error = null)
            runCatching { plannerRepository.buildPlan(input) }
                .onSuccess { _state.value = _state.value.copy(loading = false, suggestions = it) }
                .onFailure { _state.value = _state.value.copy(loading = false, error = it.message ?: "Planning failed") }
        }
    }

    fun saveSuggestion(suggestion: PlannerSuggestion) {
        viewModelScope.launch {
            taskRepository.addTask(
                title = suggestion.title,
                description = suggestion.notes,
                priority = suggestion.priority,
                minutes = suggestion.sessions * suggestion.minutesPerSession
            )
        }
    }
}

data class PlannerUiState(
    val input: String = "",
    val loading: Boolean = false,
    val suggestions: List<PlannerSuggestion> = emptyList(),
    val error: String? = null
)
