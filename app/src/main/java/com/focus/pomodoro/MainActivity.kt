package com.focus.pomodoro

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.focus.pomodoro.app.FocusPomodoroApplication
import com.focus.pomodoro.core.AppViewModelFactory
import com.focus.pomodoro.core.util.toClock
import com.focus.pomodoro.data.local.entity.TaskEntity
import com.focus.pomodoro.domain.model.AmbientAsset
import com.focus.pomodoro.feature.history.HistoryViewModel
import com.focus.pomodoro.feature.home.HomeViewModel
import com.focus.pomodoro.feature.media.MediaViewModel
import com.focus.pomodoro.feature.planner.PlannerViewModel
import com.focus.pomodoro.feature.settings.SettingsViewModel
import com.focus.pomodoro.feature.stats.StatsXmlActivity
import com.focus.pomodoro.feature.tasks.TasksViewModel
import com.focus.pomodoro.service.PomodoroForegroundService
import com.focus.pomodoro.ui.theme.FocusPomodoroTheme
import java.io.File

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val app = application as FocusPomodoroApplication
        val factory = AppViewModelFactory(app.container)

        setContent {
            val settingsVm: SettingsViewModel = viewModel(factory = factory)
            val dark by settingsVm.darkMode.collectAsState()
            FocusPomodoroTheme(forceDark = dark) {
                FocusApp(factory = factory)
            }
        }
    }
}

private data class NavItem(val route: String, val label: String, val icon: androidx.compose.ui.graphics.vector.ImageVector)

@Composable
private fun FocusApp(factory: AppViewModelFactory) {
    val navController = rememberNavController()
    val items = listOf(
        NavItem("home", "Home", Icons.Default.Home),
        NavItem("tasks", "Tasks", Icons.Default.List),
        NavItem("planner", "AI Plan", Icons.Default.Star),
        NavItem("media", "Media", Icons.Default.PlayArrow),
        NavItem("history", "History", Icons.Default.Person),
        NavItem("settings", "Settings", Icons.Default.Settings)
    )

    Scaffold(
        bottomBar = {
            NavigationBar {
                val current by navController.currentBackStackEntryAsState()
                val route = current?.destination?.route
                items.forEach { item ->
                    NavigationBarItem(
                        selected = route == item.route,
                        onClick = {
                            navController.navigate(item.route) {
                                popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = { Icon(item.icon, contentDescription = item.label) },
                        label = { Text(item.label) }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = "home",
            modifier = Modifier.padding(innerPadding)
        ) {
            composable("home") {
                val vm: HomeViewModel = viewModel(factory = factory)
                HomeScreen(vm)
            }
            composable("tasks") {
                val vm: TasksViewModel = viewModel(factory = factory)
                TasksScreen(vm)
            }
            composable("planner") {
                val vm: PlannerViewModel = viewModel(factory = factory)
                PlannerScreen(vm)
            }
            composable("media") {
                val vm: MediaViewModel = viewModel(factory = factory)
                MediaScreen(vm)
            }
            composable("history") {
                val vm: HistoryViewModel = viewModel(factory = factory)
                HistoryScreen(vm)
            }
            composable("settings") {
                val vm: SettingsViewModel = viewModel(factory = factory)
                SettingsScreen(vm)
            }
        }
    }
}

@Composable
private fun HomeScreen(viewModel: HomeViewModel) {
    val context = LocalContext.current
    val timer by viewModel.timer.collectAsState()
    val stats by viewModel.stats.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(MaterialTheme.colorScheme.primary.copy(alpha = 0.25f), MaterialTheme.colorScheme.background)))
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .blur(0.6.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.85f))
        ) {
            Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Pomodoro Timer", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                Text(timer.remainingSeconds.toClock(), style = MaterialTheme.typography.displayLarge)
                LinearProgressIndicator(
                    progress = {
                        val done = timer.totalSeconds - timer.remainingSeconds
                        if (timer.totalSeconds == 0) 0f else done.toFloat() / timer.totalSeconds
                    },
                    modifier = Modifier.fillMaxWidth()
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(onClick = {
                        ContextCompat.startForegroundService(
                            context,
                            Intent(context, PomodoroForegroundService::class.java)
                                .setAction(PomodoroForegroundService.ACTION_START)
                                .putExtra(PomodoroForegroundService.EXTRA_MINUTES, viewModel.focusMinutes)
                        )
                    }) { Text("Start") }
                    Button(onClick = {
                        ContextCompat.startForegroundService(
                            context,
                            Intent(context, PomodoroForegroundService::class.java)
                                .setAction(PomodoroForegroundService.ACTION_PAUSE)
                        )
                    }) { Text("Pause") }
                    Button(onClick = {
                        ContextCompat.startForegroundService(
                            context,
                            Intent(context, PomodoroForegroundService::class.java)
                                .setAction(PomodoroForegroundService.ACTION_RESUME)
                        )
                    }) { Text("Resume") }
                    Button(onClick = {
                        ContextCompat.startForegroundService(
                            context,
                            Intent(context, PomodoroForegroundService::class.java)
                                .setAction(PomodoroForegroundService.ACTION_STOP)
                        )
                    }) { Text("Stop") }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    Text("Today: ${stats.todayMinutes} min")
                    Text("Streak: ${stats.streak}")
                    Text("Level: ${stats.level}")
                }
                Button(onClick = {
                    context.startActivity(Intent(context, StatsXmlActivity::class.java))
                }) {
                    Text("Open Advanced XML Chart")
                }
            }
        }
    }
}

@Composable
private fun TasksScreen(viewModel: TasksViewModel) {
    val tasks by viewModel.tasks.collectAsState()
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var priority by remember { mutableStateOf(3f) }
    var minutes by remember { mutableStateOf(25f) }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text("Task Manager", style = MaterialTheme.typography.headlineSmall)
        OutlinedTextField(title, onValueChange = { title = it }, label = { Text("Task title") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(description, onValueChange = { description = it }, label = { Text("Description") }, modifier = Modifier.fillMaxWidth())
        Text("Priority: ${priority.toInt()}")
        Slider(value = priority, onValueChange = { priority = it }, valueRange = 1f..5f, steps = 3)
        Text("Estimated Minutes: ${minutes.toInt()}")
        Slider(value = minutes, onValueChange = { minutes = it }, valueRange = 10f..180f)
        Button(onClick = {
            viewModel.addTask(title, description, priority.toInt(), minutes.toInt())
            title = ""
            description = ""
        }) { Text("Add Task") }

        LazyColumn(contentPadding = PaddingValues(vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(tasks, key = { it.id }) { task ->
                TaskRow(task = task, onToggle = { viewModel.toggle(task) }, onDelete = { viewModel.delete(task.id) })
            }
        }
    }
}

@Composable
private fun TaskRow(task: TaskEntity, onToggle: () -> Unit, onDelete: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(modifier = Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(task.title, fontWeight = FontWeight.Bold)
                Text(task.description)
                Text("Priority ${task.priority} • ${task.estimatedMinutes} min")
            }
            Button(onClick = onToggle) { Text(if (task.completed) "Undo" else "Done") }
            Spacer(modifier = Modifier.size(6.dp))
            Button(onClick = onDelete) { Text("Del") }
        }
    }
}

@Composable
private fun PlannerScreen(viewModel: PlannerViewModel) {
    val state by viewModel.state.collectAsState()

    Column(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text("AI Task Planner", style = MaterialTheme.typography.headlineSmall)
        OutlinedTextField(
            value = state.input,
            onValueChange = viewModel::updateInput,
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Describe your goals, deadline, workload") }
        )
        Button(onClick = viewModel::generate, enabled = !state.loading) {
            Text(if (state.loading) "Generating..." else "Generate Pomodoro Plan")
        }
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(state.suggestions) { suggestion ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(suggestion.title, fontWeight = FontWeight.Bold)
                        Text("Priority ${suggestion.priority} • ${suggestion.sessions} sessions × ${suggestion.minutesPerSession} min")
                        Text(suggestion.notes)
                        Button(onClick = { viewModel.saveSuggestion(suggestion) }) { Text("Save to Tasks") }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MediaScreen(viewModel: MediaViewModel) {
    val context = LocalContext.current
    val state by viewModel.uiState.collectAsState()
    var selectedVideo by remember(state.videos) { mutableStateOf(state.videos.firstOrNull()) }
    var selectedAudio by remember(state.audio) { mutableStateOf(state.audio.firstOrNull()) }
    var minutes by remember { mutableStateOf(25f) }
    var title by remember { mutableStateOf("Focus Session") }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Nature Media + 4K Video Generator", style = MaterialTheme.typography.headlineSmall)
        Text("Videos: ${state.videos.size}, Audio: ${state.audio.size}, Images: ${state.images.size}")

        selectedVideo?.let { video ->
            Text("Preview: ${video.title}")
            VideoPreview(assetPath = video.path)
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = { selectedVideo = state.videos.randomOrNull() ?: selectedVideo }) { Text("Random Video") }
            Button(onClick = { selectedAudio = state.audio.randomOrNull() ?: selectedAudio }) { Text("Random Audio") }
        }

        OutlinedTextField(value = title, onValueChange = { title = it }, label = { Text("Export title") }, modifier = Modifier.fillMaxWidth())
        Text("Duration: ${minutes.toInt()} minutes")
        Slider(value = minutes, onValueChange = { minutes = it }, valueRange = 10f..60f)

        Button(
            enabled = selectedVideo != null && selectedAudio != null && !state.exporting,
            onClick = {
                viewModel.generateVideo(selectedVideo!!, selectedAudio!!, minutes.toInt(), title)
            }
        ) { Text(if (state.exporting) "Exporting..." else "Generate 4K MP4") }

        AnimatedVisibility(state.exportMessage.isNotBlank()) {
            Text(state.exportMessage)
        }

        state.lastExportPath?.let { path ->
            Button(onClick = { shareExport(context, path) }) { Text("Share Export") }
        }
    }
}

@Composable
private fun VideoPreview(assetPath: String) {
    val context = LocalContext.current
    val exoPlayer = remember(assetPath) {
        ExoPlayer.Builder(context).build().apply {
            setMediaItem(MediaItem.fromUri("asset:///$assetPath"))
            repeatMode = Player.REPEAT_MODE_ALL
            playWhenReady = true
            prepare()
        }
    }

    LaunchedEffect(exoPlayer) {
        exoPlayer.play()
    }

    AndroidView(
        factory = {
            PlayerView(it).apply {
                player = exoPlayer
                useController = false
            }
        },
        modifier = Modifier
            .fillMaxWidth()
            .height(190.dp)
    )
}

@Composable
private fun HistoryScreen(viewModel: HistoryViewModel) {
    val sessions by viewModel.sessions.collectAsState()
    val achievements by viewModel.achievements.collectAsState()

    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        item {
            Text("Focus History", style = MaterialTheme.typography.headlineSmall)
        }
        item {
            Text("Recent Sessions")
        }
        items(sessions.take(20), key = { it.id }) { session ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Text(
                    "${session.durationMinutes} min • ${if (session.completed) "Completed" else "Stopped"}",
                    modifier = Modifier.padding(12.dp)
                )
            }
        }
        item {
            Spacer(Modifier.height(8.dp))
            Text("Achievements")
        }
        items(achievements, key = { it.key }) { item ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Text(
                    "${if (item.unlocked) "✅" else "🔒"} ${item.title}",
                    modifier = Modifier.padding(12.dp)
                )
            }
        }
    }
}

@Composable
private fun SettingsScreen(viewModel: SettingsViewModel) {
    val dark by viewModel.darkMode.collectAsState()
    val apiKey by viewModel.apiKey.collectAsState()
    val focus by viewModel.focus.collectAsState()
    val breakMin by viewModel.breakMinutes.collectAsState()

    Column(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Settings", style = MaterialTheme.typography.headlineSmall)
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("Dark mode", modifier = Modifier.weight(1f))
            Switch(checked = dark, onCheckedChange = viewModel::setDarkMode)
        }
        OutlinedTextField(
            value = apiKey,
            onValueChange = viewModel::setApiKey,
            modifier = Modifier.fillMaxWidth(),
            label = { Text("OpenAI API key") }
        )
        Text("Focus minutes: $focus")
        Slider(value = focus.toFloat(), onValueChange = { viewModel.setFocusMinutes(it.toInt()) }, valueRange = 10f..90f)
        Text("Break minutes: $breakMin")
        Slider(value = breakMin.toFloat(), onValueChange = { viewModel.setBreakMinutes(it.toInt()) }, valueRange = 3f..30f)
    }
}

private fun shareExport(context: android.content.Context, path: String) {
    val file = File(path)
    if (!file.exists()) return
    val uri = FileProvider.getUriForFile(context, "${context.packageName}.provider", file)
    val intent = Intent(Intent.ACTION_SEND)
        .setType("video/mp4")
        .putExtra(Intent.EXTRA_STREAM, uri)
        .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    context.startActivity(Intent.createChooser(intent, "Share Pomodoro Video"))
}

private fun <T> List<T>.randomOrNull(): T? = if (isEmpty()) null else random()
