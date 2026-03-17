package com.focus.pomodoro.core.util

fun Int.toClock(): String {
    val safe = coerceAtLeast(0)
    val minutes = safe / 60
    val seconds = safe % 60
    return "%02d:%02d".format(minutes, seconds)
}
