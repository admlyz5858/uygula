package com.focus.pomodoro.core

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.focus.pomodoro.app.AppContainer
import com.focus.pomodoro.feature.history.HistoryViewModel
import com.focus.pomodoro.feature.home.HomeViewModel
import com.focus.pomodoro.feature.media.MediaViewModel
import com.focus.pomodoro.feature.planner.PlannerViewModel
import com.focus.pomodoro.feature.settings.SettingsViewModel
import com.focus.pomodoro.feature.tasks.TasksViewModel

class AppViewModelFactory(private val container: AppContainer) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return when {
            modelClass.isAssignableFrom(HomeViewModel::class.java) -> HomeViewModel(container.statsRepository, container.settingsRepository) as T
            modelClass.isAssignableFrom(TasksViewModel::class.java) -> TasksViewModel(container.taskRepository) as T
            modelClass.isAssignableFrom(PlannerViewModel::class.java) -> PlannerViewModel(container.plannerRepository, container.taskRepository) as T
            modelClass.isAssignableFrom(MediaViewModel::class.java) -> MediaViewModel(container.mediaRepository) as T
            modelClass.isAssignableFrom(SettingsViewModel::class.java) -> SettingsViewModel(container.settingsRepository) as T
            modelClass.isAssignableFrom(HistoryViewModel::class.java) -> HistoryViewModel(container.statsRepository) as T
            else -> error("Unknown ViewModel class: ${modelClass.name}")
        }
    }
}
