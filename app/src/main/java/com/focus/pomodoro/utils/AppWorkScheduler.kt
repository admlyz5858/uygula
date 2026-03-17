package com.focus.pomodoro.utils

import android.content.Context
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.focus.pomodoro.worker.DailySuggestionWorker
import com.focus.pomodoro.worker.NatureRefreshWorker
import java.util.concurrent.TimeUnit

object AppWorkScheduler {
    fun scheduleRecurring(context: Context) {
        val workManager = WorkManager.getInstance(context)
        val refreshWork = PeriodicWorkRequestBuilder<NatureRefreshWorker>(6, TimeUnit.HOURS)
            .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.NOT_REQUIRED).build())
            .build()
        val aiSuggestionWork = PeriodicWorkRequestBuilder<DailySuggestionWorker>(12, TimeUnit.HOURS)
            .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.NOT_REQUIRED).build())
            .build()
        workManager.enqueueUniquePeriodicWork("nature-refresh", ExistingPeriodicWorkPolicy.UPDATE, refreshWork)
        workManager.enqueueUniquePeriodicWork("daily-suggestion", ExistingPeriodicWorkPolicy.UPDATE, aiSuggestionWork)
    }
}
