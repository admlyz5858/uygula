package com.focus.pomodoro.ai

import android.content.Context
import com.focus.pomodoro.BuildConfig
import com.focus.pomodoro.data.repository.SettingsRepository
import com.focus.pomodoro.domain.model.AiPlan
import com.focus.pomodoro.domain.model.AiPlanItem
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject

class AIService(
    private val context: Context,
    private val settingsRepository: SettingsRepository,
) {
    private val client = OkHttpClient()

    suspend fun generatePlan(input: String): AiPlan {
        val sanitized = input.trim()
        if (sanitized.isBlank()) {
            return AiPlan(
                title = "Today plan",
                summary = "Add a goal to generate a focused schedule.",
                items = emptyList(),
            )
        }
        val settings = settingsRepository.settingsFlow.first()
        if (settings.aiEnabled && BuildConfig.OPENAI_API_KEY.isNotBlank()) {
            runCatching { return requestOpenAiPlan(sanitized) }
        }
        return offlinePlan(sanitized)
    }

    private suspend fun requestOpenAiPlan(input: String): AiPlan = withContext(Dispatchers.IO) {
        val messages = JSONArray()
            .put(JSONObject().put("role", "system").put("content", "You are an expert productivity coach. Return plain text lines in the format Task | Description | Sessions | Priority. Include 4 to 8 lines and a final summary line starting with Summary: ."))
            .put(JSONObject().put("role", "user").put("content", input))

        val payload = JSONObject()
            .put("model", "gpt-4o-mini")
            .put("temperature", 0.3)
            .put("messages", messages)

        val request = Request.Builder()
            .url("https://api.openai.com/v1/chat/completions")
            .header("Authorization", "Bearer ${BuildConfig.OPENAI_API_KEY}")
            .post(payload.toString().toRequestBody("application/json".toMediaType()))
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) error("OpenAI request failed with ${response.code}")
            val body = response.body?.string().orEmpty()
            val content = JSONObject(body)
                .getJSONArray("choices")
                .getJSONObject(0)
                .getJSONObject("message")
                .getString("content")
            parseStructuredPlan(content)
        }
    }

    private fun parseStructuredPlan(raw: String): AiPlan {
        val lines = raw.lines().map { it.trim() }.filter { it.isNotBlank() }
        val items = mutableListOf<AiPlanItem>()
        var summary = "Actionable plan generated for today."
        for (line in lines) {
            if (line.startsWith("Summary:", ignoreCase = true)) {
                summary = line.substringAfter(':').trim()
                continue
            }
            val parts = line.split('|').map { it.trim() }
            if (parts.size >= 4) {
                items += AiPlanItem(
                    title = parts[0],
                    description = parts[1],
                    suggestedSessions = parts[2].toIntOrNull()?.coerceAtLeast(1) ?: 1,
                    priority = parts[3].toIntOrNull()?.coerceIn(1, 5) ?: 3,
                )
            }
        }
        return AiPlan(title = "AI daily plan", summary = summary, items = items)
    }

    private fun offlinePlan(input: String): AiPlan {
        val chunks = input.split(',', ';', '\n').flatMap { piece -> piece.split(" and ") }
            .map { it.trim() }
            .filter { it.isNotBlank() }
            .ifEmpty { listOf(input) }

        val items = chunks.mapIndexed { index, chunk ->
            val normalized = chunk.lowercase()
            val sessions = when {
                normalized.contains("study") || normalized.contains("learn") || normalized.contains("read") -> 3
                normalized.contains("build") || normalized.contains("code") || normalized.contains("project") -> 2
                normalized.contains("write") || normalized.contains("plan") -> 2
                normalized.contains("exercise") || normalized.contains("workout") -> 1
                else -> 2
            }
            val priority = when {
                normalized.contains("urgent") || normalized.contains("exam") || normalized.contains("deadline") -> 5
                index == 0 -> 4
                else -> 3
            }
            AiPlanItem(
                title = chunk.replaceFirstChar { it.uppercase() },
                description = "Complete $sessions focused Pomodoro sessions for ${chunk.lowercase()} and take mindful breaks between them.",
                suggestedSessions = sessions,
                priority = priority,
            )
        }

        return AiPlan(
            title = "Offline smart plan",
            summary = "Balanced study, build, and recovery blocks arranged by urgency and estimated effort.",
            items = items,
        )
    }
}
