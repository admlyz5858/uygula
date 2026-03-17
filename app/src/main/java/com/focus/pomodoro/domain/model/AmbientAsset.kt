package com.focus.pomodoro.domain.model

data class AmbientAsset(
    val path: String,
    val category: String,
    val title: String,
    val sizeBytes: Long
)
