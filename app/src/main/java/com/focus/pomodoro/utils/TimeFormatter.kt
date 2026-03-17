package com.focus.pomodoro.utils

import java.util.Locale
import kotlin.math.max

fun Long.formatAsTimer(): String {
    val totalSeconds = max(this / 1000L, 0L)
    val minutes = totalSeconds / 60
    val seconds = totalSeconds % 60
    return String.format(Locale.getDefault(), "%02d:%02d", minutes, seconds)
}
