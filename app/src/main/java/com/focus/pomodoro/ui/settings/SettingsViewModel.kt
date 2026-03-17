package com.focus.pomodoro.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.asLiveData
import androidx.lifecycle.viewModelScope
import com.focus.pomodoro.data.repository.SettingsRepository
import kotlinx.coroutines.launch

class SettingsViewModel(
    private val settingsRepository: SettingsRepository,
) : ViewModel() {
    val settings = settingsRepository.settingsFlow.asLiveData()

    fun update(key: String, value: Any?) {
        viewModelScope.launch {
            settingsRepository.updatePreference(key, value)
        }
    }
}
