package com.focus.pomodoro.data.repo

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class SettingsRepository(context: Context) {
    private val prefs = context.getSharedPreferences("focus_settings", Context.MODE_PRIVATE)

    private val _darkMode = MutableStateFlow(prefs.getBoolean(KEY_DARK_MODE, false))
    val darkMode: StateFlow<Boolean> = _darkMode

    fun setDarkMode(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_DARK_MODE, enabled).apply()
        _darkMode.value = enabled
    }

    var focusMinutes: Int
        get() = prefs.getInt(KEY_FOCUS_MIN, 25)
        set(value) = prefs.edit().putInt(KEY_FOCUS_MIN, value.coerceIn(10, 90)).apply()

    var breakMinutes: Int
        get() = prefs.getInt(KEY_BREAK_MIN, 5)
        set(value) = prefs.edit().putInt(KEY_BREAK_MIN, value.coerceIn(3, 30)).apply()

    var openAiApiKey: String
        get() = prefs.getString(KEY_OPENAI_KEY, "") ?: ""
        set(value) = prefs.edit().putString(KEY_OPENAI_KEY, value.trim()).apply()

    companion object {
        private const val KEY_DARK_MODE = "dark_mode"
        private const val KEY_FOCUS_MIN = "focus_minutes"
        private const val KEY_BREAK_MIN = "break_minutes"
        private const val KEY_OPENAI_KEY = "openai_api_key"
    }
}
