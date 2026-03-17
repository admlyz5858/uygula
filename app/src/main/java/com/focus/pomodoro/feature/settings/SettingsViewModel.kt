package com.focus.pomodoro.feature.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.focus.pomodoro.data.repo.SettingsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn

class SettingsViewModel(private val settingsRepository: SettingsRepository) : ViewModel() {
    val darkMode: StateFlow<Boolean> = settingsRepository.darkMode.stateIn(
        scope = viewModelScope,
        started = SharingStarted.Eagerly,
        initialValue = false
    )

    private val _apiKey = MutableStateFlow(settingsRepository.openAiApiKey)
    val apiKey: StateFlow<String> = _apiKey.asStateFlow()

    private val _focus = MutableStateFlow(settingsRepository.focusMinutes)
    val focus: StateFlow<Int> = _focus.asStateFlow()

    private val _break = MutableStateFlow(settingsRepository.breakMinutes)
    val breakMinutes: StateFlow<Int> = _break.asStateFlow()

    fun setDarkMode(enabled: Boolean) = settingsRepository.setDarkMode(enabled)

    fun setApiKey(key: String) {
        _apiKey.value = key
        settingsRepository.openAiApiKey = key
    }

    fun setFocusMinutes(value: Int) {
        _focus.value = value
        settingsRepository.focusMinutes = value
    }

    fun setBreakMinutes(value: Int) {
        _break.value = value
        settingsRepository.breakMinutes = value
    }
}
