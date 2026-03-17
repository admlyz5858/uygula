package com.focus.pomodoro.data.repository

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.focus.pomodoro.domain.model.ThemeMode
import com.focus.pomodoro.domain.model.UserSettings
import java.io.IOException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "focus_settings")

class SettingsRepository(
    private val context: Context,
) {
    val settingsFlow: Flow<UserSettings> = context.dataStore.data
        .catch { exception ->
            if (exception is IOException) emit(emptyPreferences()) else throw exception
        }
        .map { prefs ->
            UserSettings(
                focusMinutes = prefs[Keys.FocusMinutes] ?: 25,
                shortBreakMinutes = prefs[Keys.ShortBreakMinutes] ?: 5,
                longBreakMinutes = prefs[Keys.LongBreakMinutes] ?: 15,
                aiEnabled = prefs[Keys.AiEnabled] ?: true,
                soundEnabled = prefs[Keys.SoundEnabled] ?: true,
                ambientEnabled = prefs[Keys.AmbientEnabled] ?: false,
                notificationsEnabled = prefs[Keys.NotificationsEnabled] ?: true,
                lockScreenOverlay = prefs[Keys.LockScreenOverlay] ?: false,
                themeMode = (prefs[Keys.ThemeMode] ?: ThemeMode.SYSTEM.name).let { ThemeMode.valueOf(it.uppercase()) },
                lastRenderedVideoPath = prefs[Keys.LastVideoPath],
            )
        }

    suspend fun updatePreference(key: String, value: Any?) {
        context.dataStore.edit { prefs ->
            when (key) {
                "focus_minutes" -> prefs[Keys.FocusMinutes] = value.toString().toIntOrNull()?.coerceIn(1, 180) ?: 25
                "short_break_minutes" -> prefs[Keys.ShortBreakMinutes] = value.toString().toIntOrNull()?.coerceIn(1, 60) ?: 5
                "long_break_minutes" -> prefs[Keys.LongBreakMinutes] = value.toString().toIntOrNull()?.coerceIn(5, 90) ?: 15
                "ai_enabled" -> prefs[Keys.AiEnabled] = value as? Boolean ?: true
                "sound_enabled" -> prefs[Keys.SoundEnabled] = value as? Boolean ?: true
                "ambient_enabled" -> prefs[Keys.AmbientEnabled] = value as? Boolean ?: false
                "notifications_enabled" -> prefs[Keys.NotificationsEnabled] = value as? Boolean ?: true
                "lock_screen_overlay" -> prefs[Keys.LockScreenOverlay] = value as? Boolean ?: false
                "theme_mode" -> prefs[Keys.ThemeMode] = value.toString().uppercase()
            }
        }
    }

    suspend fun persistLastRenderedVideo(path: String?) {
        context.dataStore.edit { prefs ->
            if (path.isNullOrBlank()) prefs.remove(Keys.LastVideoPath) else prefs[Keys.LastVideoPath] = path
        }
    }

    object Keys {
        val FocusMinutes = intPreferencesKey("focus_minutes")
        val ShortBreakMinutes = intPreferencesKey("short_break_minutes")
        val LongBreakMinutes = intPreferencesKey("long_break_minutes")
        val AiEnabled = booleanPreferencesKey("ai_enabled")
        val SoundEnabled = booleanPreferencesKey("sound_enabled")
        val AmbientEnabled = booleanPreferencesKey("ambient_enabled")
        val NotificationsEnabled = booleanPreferencesKey("notifications_enabled")
        val LockScreenOverlay = booleanPreferencesKey("lock_screen_overlay")
        val ThemeMode = stringPreferencesKey("theme_mode")
        val LastVideoPath = stringPreferencesKey("last_video_path")
    }
}
