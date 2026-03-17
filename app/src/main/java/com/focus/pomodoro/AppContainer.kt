package com.focus.pomodoro

import android.content.Context
import androidx.room.Room
import com.focus.pomodoro.ai.AIService
import com.focus.pomodoro.data.local.AppDatabase
import com.focus.pomodoro.data.repository.NatureRepository
import com.focus.pomodoro.data.repository.QuotesRepository
import com.focus.pomodoro.data.repository.SessionRepository
import com.focus.pomodoro.data.repository.SettingsRepository
import com.focus.pomodoro.data.repository.TaskRepository
import com.focus.pomodoro.service.TimerEngine
import com.focus.pomodoro.utils.NotificationHelper
import com.focus.pomodoro.utils.SoundManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

class AppContainer(private val context: Context) {
    val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    val database: AppDatabase by lazy {
        Room.databaseBuilder(context, AppDatabase::class.java, "focus_pomodoro.db")
            .fallbackToDestructiveMigration()
            .build()
    }

    val settingsRepository by lazy { SettingsRepository(context) }
    val taskRepository by lazy { TaskRepository(database.taskDao()) }
    val sessionRepository by lazy { SessionRepository(database.focusSessionDao()) }
    val natureRepository by lazy { NatureRepository() }
    val quotesRepository by lazy { QuotesRepository() }
    val soundManager by lazy { SoundManager(context) }
    val notificationHelper by lazy { NotificationHelper(context) }
    val aiService by lazy { AIService(context, settingsRepository) }
    val timerEngine by lazy { TimerEngine(applicationScope, sessionRepository) }
}

val Context.appContainer: AppContainer
    get() = (applicationContext as FocusPomodoroApp).container
