package com.focus.pomodoro.app

import android.content.Context
import androidx.room.Room
import com.focus.pomodoro.data.local.FocusDatabase
import com.focus.pomodoro.data.repo.MediaRepository
import com.focus.pomodoro.data.repo.PlannerRepository
import com.focus.pomodoro.data.repo.SettingsRepository
import com.focus.pomodoro.data.repo.StatsRepository
import com.focus.pomodoro.data.repo.TaskRepository

class AppContainer(context: Context) {
    private val appContext = context.applicationContext

    private val database: FocusDatabase = Room.databaseBuilder(
        appContext,
        FocusDatabase::class.java,
        "focus_db"
    ).build()

    val settingsRepository = SettingsRepository(appContext)
    val taskRepository = TaskRepository(database.taskDao())
    val statsRepository = StatsRepository(
        focusSessionDao = database.focusSessionDao(),
        streakDao = database.streakDao(),
        achievementDao = database.achievementDao()
    )
    val plannerRepository = PlannerRepository(appContext, settingsRepository)
    val mediaRepository = MediaRepository(appContext)
}
