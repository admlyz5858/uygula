package com.focus.pomodoro.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColors = lightColorScheme(
    primary = Color(0xFF5066FF),
    secondary = Color(0xFF73D9BA),
    surface = Color(0xFFF6F7FB),
    background = Color(0xFFF6F7FB),
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF8C9BFF),
    secondary = Color(0xFF73D9BA),
    surface = Color(0xFF0F1724),
    background = Color(0xFF09111D),
)

@Composable
fun FocusPomodoroTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        content = content,
    )
}
