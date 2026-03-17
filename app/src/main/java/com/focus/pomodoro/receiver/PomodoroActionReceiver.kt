package com.focus.pomodoro.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat
import com.focus.pomodoro.service.PomodoroForegroundService

class PomodoroActionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        val serviceIntent = Intent(context, PomodoroForegroundService::class.java).setAction(action)
        ContextCompat.startForegroundService(context, serviceIntent)
    }
}
