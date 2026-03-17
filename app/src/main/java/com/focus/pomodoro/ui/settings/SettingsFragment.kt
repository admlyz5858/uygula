package com.focus.pomodoro.ui.settings

import android.os.Bundle
import androidx.preference.EditTextPreference
import androidx.preference.ListPreference
import androidx.preference.PreferenceFragmentCompat
import androidx.preference.SwitchPreferenceCompat
import androidx.lifecycle.ViewModelProvider
import com.focus.pomodoro.R
import com.focus.pomodoro.SimpleViewModelFactory
import com.focus.pomodoro.appContainer

class SettingsFragment : PreferenceFragmentCompat() {
    private val viewModel by lazy {
        ViewModelProvider(this, SimpleViewModelFactory {
            SettingsViewModel(requireContext().applicationContext.appContainer.settingsRepository)
        })[SettingsViewModel::class.java]
    }

    override fun onCreatePreferences(savedInstanceState: Bundle?, rootKey: String?) {
        setPreferencesFromResource(R.xml.preferences, rootKey)
    }

    override fun onViewCreated(view: android.view.View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        listOf(
            "focus_minutes",
            "short_break_minutes",
            "long_break_minutes",
            "theme_mode",
        ).forEach { key ->
            findPreference<androidx.preference.Preference>(key)?.setOnPreferenceChangeListener { _, newValue ->
                viewModel.update(key, newValue)
                true
            }
        }
        listOf(
            "ai_enabled",
            "sound_enabled",
            "ambient_enabled",
            "notifications_enabled",
            "lock_screen_overlay",
        ).forEach { key ->
            findPreference<androidx.preference.Preference>(key)?.setOnPreferenceChangeListener { _, newValue ->
                viewModel.update(key, newValue)
                true
            }
        }

        viewModel.settings.observe(viewLifecycleOwner) { settings ->
            findPreference<EditTextPreference>("focus_minutes")?.text = settings.focusMinutes.toString()
            findPreference<EditTextPreference>("short_break_minutes")?.text = settings.shortBreakMinutes.toString()
            findPreference<EditTextPreference>("long_break_minutes")?.text = settings.longBreakMinutes.toString()
            findPreference<SwitchPreferenceCompat>("ai_enabled")?.isChecked = settings.aiEnabled
            findPreference<SwitchPreferenceCompat>("sound_enabled")?.isChecked = settings.soundEnabled
            findPreference<SwitchPreferenceCompat>("ambient_enabled")?.isChecked = settings.ambientEnabled
            findPreference<SwitchPreferenceCompat>("notifications_enabled")?.isChecked = settings.notificationsEnabled
            findPreference<SwitchPreferenceCompat>("lock_screen_overlay")?.isChecked = settings.lockScreenOverlay
            findPreference<ListPreference>("theme_mode")?.value = settings.themeMode.name.lowercase()
        }
    }
}
