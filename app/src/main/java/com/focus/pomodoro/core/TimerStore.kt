package com.focus.pomodoro.core

import com.focus.pomodoro.domain.model.TimerState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

object TimerStore {
    private val _state = MutableStateFlow(TimerState())
    val state: StateFlow<TimerState> = _state

    fun update(state: TimerState) {
        _state.value = state
    }
}
