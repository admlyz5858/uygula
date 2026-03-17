package com.focus.pomodoro.data.repo

import android.content.Context
import com.focus.pomodoro.domain.model.PlannerSuggestion
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class PlannerRepository(
    private val context: Context,
    private val settingsRepository: SettingsRepository
) {
    private val client = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(40, TimeUnit.SECONDS)
        .build()

    suspend fun buildPlan(userInput: String): List<PlannerSuggestion> = withContext(Dispatchers.IO) {
        val apiKey = settingsRepository.openAiApiKey
        if (apiKey.isNotBlank()) {
            runCatching { fetchFromOpenAi(userInput, apiKey) }
                .getOrNull()
                ?.takeIf { it.isNotEmpty() }
                ?.let { return@withContext it }
        }
        return@withContext buildFallback(userInput)
    }

    private fun fetchFromOpenAi(userInput: String, apiKey: String): List<PlannerSuggestion> {
        val payload = JSONObject()
            .put("model", "gpt-4o-mini")
            .put(
                "messages",
                JSONArray()
                    .put(
                        JSONObject()
                            .put("role", "system")
                            .put("content", "You are a productivity planner. Return strict JSON array with title, priority (1-5), sessions, minutesPerSession, notes.")
                    )
                    .put(
                        JSONObject()
                            .put("role", "user")
                            .put("content", userInput)
                    )
            )
            .put("temperature", 0.3)

        val request = Request.Builder()
            .url("https://api.openai.com/v1/chat/completions")
            .addHeader("Authorization", "Bearer $apiKey")
            .addHeader("Content-Type", "application/json")
            .post(payload.toString().toRequestBody("application/json".toMediaType()))
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) return emptyList()
            val body = response.body?.string().orEmpty()
            val content = JSONObject(body)
                .getJSONArray("choices")
                .getJSONObject(0)
                .getJSONObject("message")
                .getString("content")

            val jsonArrayText = content.substringAfter("[").substringBeforeLast("]", "")
            if (jsonArrayText.isBlank()) return emptyList()
            val parsed = JSONArray("[$jsonArrayText]")
            return parseSuggestions(parsed)
        }
    }

    private fun buildFallback(userInput: String): List<PlannerSuggestion> {
        val templates = context.assets.open("templates/planner_templates.json")
            .bufferedReader()
            .use { JSONArray(it.readText()) }

        val keywords = userInput.lowercase().split(" ").filter { it.length > 3 }
        val matched = mutableListOf<PlannerSuggestion>()
        for (index in 0 until templates.length()) {
            val item = templates.getJSONObject(index)
            val tags = item.getJSONArray("tags")
            var score = 0
            for (t in 0 until tags.length()) {
                if (keywords.any { it.contains(tags.getString(t), ignoreCase = true) }) score++
            }
            if (score > 0 || matched.size < 3) {
                matched += PlannerSuggestion(
                    title = item.getString("title"),
                    priority = item.getInt("priority"),
                    sessions = item.getInt("sessions"),
                    minutesPerSession = item.getInt("minutesPerSession"),
                    notes = item.getString("notes")
                )
            }
        }

        return matched.sortedByDescending { it.priority }.take(5)
    }

    private fun parseSuggestions(array: JSONArray): List<PlannerSuggestion> {
        val out = mutableListOf<PlannerSuggestion>()
        for (index in 0 until array.length()) {
            val item = array.getJSONObject(index)
            out += PlannerSuggestion(
                title = item.optString("title", "Task ${index + 1}"),
                priority = item.optInt("priority", 3).coerceIn(1, 5),
                sessions = item.optInt("sessions", 2).coerceIn(1, 10),
                minutesPerSession = item.optInt("minutesPerSession", 25).coerceIn(10, 60),
                notes = item.optString("notes", "Focus in deep-work blocks.")
            )
        }
        return out
    }
}
