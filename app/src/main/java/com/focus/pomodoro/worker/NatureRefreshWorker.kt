package com.focus.pomodoro.worker

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.focus.pomodoro.appContainer

class NatureRefreshWorker(
    appContext: Context,
    params: WorkerParameters,
) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        applicationContext.appContainer.natureRepository.ensureCachedBackgrounds(applicationContext)
        return Result.success()
    }
}
