package com.focus.pomodoro.domain.model

data class UserSettings(
    val focusMinutes: Int = 25,
    val shortBreakMinutes: Int = 5,
    val longBreakMinutes: Int = 15,
    val aiEnabled: Boolean = true,
    val soundEnabled: Boolean = true,
    val ambientEnabled: Boolean = false,
    val notificationsEnabled: Boolean = true,
    val lockScreenOverlay: Boolean = false,
    val themeMode: ThemeMode = ThemeMode.SYSTEM,
    val lastRenderedVideoPath: String? = null,
)

enum class ThemeMode {
    SYSTEM,
    LIGHT,
    DARK,
}
