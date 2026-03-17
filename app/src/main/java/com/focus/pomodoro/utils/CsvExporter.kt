package com.focus.pomodoro.utils

import android.content.Context
import com.focus.pomodoro.data.local.entity.FocusSessionEntity
import java.io.File
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class CsvExporter {
    suspend fun export(context: Context, sessions: List<FocusSessionEntity>): File = withContext(Dispatchers.IO) {
        val outDir = File(context.cacheDir, "exports").apply { mkdirs() }
        val file = File(outDir, "focus-stats.csv")
        val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm").withZone(ZoneId.systemDefault())
        file.writeText(buildString {
            appendLine("phase,start,end,duration_minutes,completed,note")
            sessions.forEach { session ->
                appendLine(
                    listOf(
                        session.phase,
                        formatter.format(Instant.ofEpochMilli(session.startedAt)),
                        formatter.format(Instant.ofEpochMilli(session.endedAt)),
                        session.durationMinutes,
                        session.completed,
                        session.note.replace(',', ';'),
                    ).joinToString(",")
                )
            }
        })
        file
    }
}
