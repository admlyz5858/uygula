package com.focus.pomodoro.ui.timer

import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.lifecycle.lifecycleScope
import com.focus.pomodoro.appContainer
import com.focus.pomodoro.databinding.ActivityLockScreenBinding
import com.focus.pomodoro.service.PomodoroService
import com.focus.pomodoro.utils.formatAsTimer
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class LockScreenTimerActivity : AppCompatActivity() {
    private lateinit var binding: ActivityLockScreenBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLockScreenBinding.inflate(layoutInflater)
        setContentView(binding.root)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        setShowWhenLocked(true)
        setTurnScreenOn(true)

        binding.buttonLockPause.setOnClickListener {
            startService(android.content.Intent(this, PomodoroService::class.java).setAction(PomodoroService.ACTION_PAUSE))
        }
        binding.buttonLockReset.setOnClickListener {
            startService(android.content.Intent(this, PomodoroService::class.java).setAction(PomodoroService.ACTION_RESET))
            finish()
        }

        lifecycleScope.launch {
            applicationContext.appContainer.timerEngine.state.collectLatest { snapshot ->
                binding.textLockPhase.text = snapshot.phase.label
                binding.textLockTimer.text = snapshot.remainingMillis.formatAsTimer()
                binding.buttonLockPause.text = if (snapshot.isRunning) "Pause" else "Resume"
                binding.buttonLockPause.setOnClickListener {
                    val action = if (snapshot.isRunning) PomodoroService.ACTION_PAUSE else PomodoroService.ACTION_RESUME
                    startService(android.content.Intent(this@LockScreenTimerActivity, PomodoroService::class.java).setAction(action))
                }
            }
        }
    }
}
