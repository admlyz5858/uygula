package com.focus.pomodoro.feature.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.focus.pomodoro.core.TimerStore
import com.focus.pomodoro.data.repo.SettingsRepository
import com.focus.pomodoro.data.repo.StatsRepository
import com.focus.pomodoro.domain.model.TimerState
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn

class HomeViewModel(
    statsRepository: StatsRepository,
    private val settingsRepository: SettingsRepository
) : ViewModel() {
    val timer: StateFlow<TimerState> = TimerStore.state

    val stats = statsRepository.observeStats().stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = com.focus.pomodoro.domain.model.FocusStats(0, 0, 0, 1, 0)
    )

    val focusMinutes: Int
        get() = settingsRepository.focusMinutes

    val breakMinutes: Int
        get() = settingsRepository.breakMinutes
}
