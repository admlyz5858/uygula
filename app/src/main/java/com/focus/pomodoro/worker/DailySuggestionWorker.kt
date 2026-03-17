package com.focus.pomodoro.worker

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.focus.pomodoro.appContainer
import kotlinx.coroutines.flow.first

class DailySuggestionWorker(
    appContext: Context,
    params: WorkerParameters,
) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        val container = applicationContext.appContainer
        val tasks = container.taskRepository.observeTodayTasks().first()
        val topTask = tasks.firstOrNull { !it.isCompleted }
        topTask?.let {
            container.notificationHelper.showDailySuggestion("Start with ${it.title} for ${it.estimatedSessions} Pomodoro sessions.")
        }
        return Result.success()
    }
}
