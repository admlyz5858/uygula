package com.focus.pomodoro.app

import android.app.Application
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.focus.pomodoro.core.NotificationHelper
import com.focus.pomodoro.worker.DailyInsightWorker
import java.util.concurrent.TimeUnit

class FocusPomodoroApplication : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
        NotificationHelper(this).createChannels()
        scheduleDailyInsights()
    }

    private fun scheduleDailyInsights() {
        val request = PeriodicWorkRequestBuilder<DailyInsightWorker>(24, TimeUnit.HOURS).build()
        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "daily_insights",
            ExistingPeriodicWorkPolicy.UPDATE,
            request
        )
    }
}
