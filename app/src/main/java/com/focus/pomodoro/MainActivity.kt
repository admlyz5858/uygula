package com.focus.pomodoro

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AppCompatDelegate
import androidx.fragment.app.commit
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.asLiveData
import androidx.lifecycle.map
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.focus.pomodoro.databinding.ActivityMainBinding
import com.focus.pomodoro.domain.model.ThemeMode
import com.focus.pomodoro.ui.ai.AIPlannerFragment
import com.focus.pomodoro.ui.history.HistoryFragment
import com.focus.pomodoro.ui.settings.SettingsFragment
import com.focus.pomodoro.ui.stats.StatsFragment
import com.focus.pomodoro.ui.tasks.TasksFragment
import com.focus.pomodoro.ui.timer.HomeTimerFragment

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private val viewModel by lazy {
        ViewModelProvider(this, SimpleViewModelFactory {
            MainViewModel(applicationContext.appContainer.settingsRepository)
        })[MainViewModel::class.java]
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        setSupportActionBar(binding.toolbar)

        viewModel.themeMode.observe(this) { mode ->
            val delegateMode = when (mode) {
                ThemeMode.LIGHT -> AppCompatDelegate.MODE_NIGHT_NO
                ThemeMode.DARK -> AppCompatDelegate.MODE_NIGHT_YES
                ThemeMode.SYSTEM -> AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
                null -> AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
            }
            AppCompatDelegate.setDefaultNightMode(delegateMode)
        }

        binding.bottomNav.setOnItemSelectedListener { item ->
            openDestination(item.itemId)
            true
        }

        if (savedInstanceState == null) {
            binding.bottomNav.selectedItemId = R.id.nav_home
        }
    }

    private fun openDestination(itemId: Int) {
        val fragment = when (itemId) {
            R.id.nav_home -> HomeTimerFragment()
            R.id.nav_tasks -> TasksFragment()
            R.id.nav_ai -> AIPlannerFragment()
            R.id.nav_stats -> StatsFragment()
            R.id.nav_history -> HistoryFragment()
            R.id.nav_settings -> SettingsFragment()
            else -> HomeTimerFragment()
        }
        binding.toolbar.title = when (itemId) {
            R.id.nav_home -> "Home"
            R.id.nav_tasks -> "Tasks"
            R.id.nav_ai -> "AI Planner"
            R.id.nav_stats -> "Statistics"
            R.id.nav_history -> "History"
            R.id.nav_settings -> "Settings"
            else -> getString(R.string.app_name)
        }
        supportFragmentManager.commit {
            replace(binding.fragmentContainer.id, fragment)
        }
    }
}

class MainViewModel(settingsRepository: com.focus.pomodoro.data.repository.SettingsRepository) : ViewModel() {
    val themeMode = settingsRepository.settingsFlow.asLiveData().map { it.themeMode }
}

class SimpleViewModelFactory<T : ViewModel>(
    private val creator: () -> T,
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <VM : ViewModel> create(modelClass: Class<VM>): VM = creator() as VM
}
