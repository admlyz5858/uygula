package com.focus.pomodoro.worker

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.focus.pomodoro.core.NotificationHelper
import kotlin.random.Random

class DailyInsightWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val insights = listOf(
            "Your focus sessions are strongest in the morning.",
            "Try a 5-minute reset break after every deep session.",
            "You gain more momentum with high-priority tasks first.",
            "Stack ambient audio + timer to boost consistency."
        )
        NotificationHelper(applicationContext).showGeneral(
            title = "Daily Focus Insight",
            text = insights[Random.nextInt(insights.size)]
        )
        return Result.success()
    }
}
