package com.focus.pomodoro

import android.app.Application
import com.focus.pomodoro.utils.AppWorkScheduler

class FocusPomodoroApp : Application() {
    val container: AppContainer by lazy { AppContainer(this) }

    override fun onCreate() {
        super.onCreate()
        container.notificationHelper.createChannels()
        AppWorkScheduler.scheduleRecurring(this)
    }
}
