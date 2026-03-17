package com.focus.pomodoro.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val DarkColors = darkColorScheme(
    primary = GreenSecondary,
    secondary = GreenPrimary
)

private val LightColors = lightColorScheme(
    primary = GreenPrimary,
    secondary = GreenSecondary
)

@Composable
fun FocusPomodoroTheme(
    forceDark: Boolean? = null,
    content: @Composable () -> Unit
) {
    val isDark = forceDark ?: isSystemInDarkTheme()
    MaterialTheme(
        colorScheme = if (isDark) DarkColors else LightColors,
        typography = AppTypography,
        content = content
    )
}
