package com.focus.pomodoro.feature.history

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.focus.pomodoro.data.local.entity.AchievementEntity
import com.focus.pomodoro.data.local.entity.FocusSessionEntity
import com.focus.pomodoro.data.repo.StatsRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn

class HistoryViewModel(statsRepository: StatsRepository) : ViewModel() {
    val sessions: StateFlow<List<FocusSessionEntity>> = statsRepository.observeSessions().stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = emptyList()
    )

    val achievements: StateFlow<List<AchievementEntity>> = statsRepository.observeAchievements().stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = emptyList()
    )
}
