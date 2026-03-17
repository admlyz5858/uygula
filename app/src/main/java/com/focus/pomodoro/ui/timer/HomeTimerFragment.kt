package com.focus.pomodoro.ui.timer

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.compose.animation.Crossfade
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.focus.pomodoro.SimpleViewModelFactory
import com.focus.pomodoro.appContainer
import com.focus.pomodoro.ui.theme.FocusPomodoroTheme
import com.focus.pomodoro.utils.formatAsTimer

class HomeTimerFragment : Fragment() {
    private val viewModel by lazy {
        val container = requireContext().applicationContext.appContainer
        ViewModelProvider(this, SimpleViewModelFactory {
            HomeTimerViewModel(
                timerEngine = container.timerEngine,
                settingsRepository = container.settingsRepository,
                natureRepository = container.natureRepository,
                quotesRepository = container.quotesRepository,
            )
        })[HomeTimerViewModel::class.java]
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        return ComposeView(requireContext()).apply {
            setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
            setContent {
                FocusPomodoroTheme {
                    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
                    TimerScreen(
                        state = uiState,
                        onStart = { viewModel.startTimer(requireContext(), uiState.settings) },
                        onPause = { viewModel.pause(requireContext()) },
                        onResume = { viewModel.resume(requireContext()) },
                        onReset = { viewModel.reset(requireContext()) },
                        onSkip = { viewModel.skip(requireContext()) },
                        onRenderVideo = { viewModel.renderVideo(requireContext(), uiState.settings) },
                        onShareVideo = { viewModel.shareLastVideo(requireContext(), uiState.settings.lastRenderedVideoPath) },
                    )
                }
            }
        }
    }
}

@Composable
private fun TimerScreen(
    state: HomeTimerUiState,
    onStart: () -> Unit,
    onPause: () -> Unit,
    onResume: () -> Unit,
    onReset: () -> Unit,
    onSkip: () -> Unit,
    onRenderVideo: () -> Unit,
    onShareVideo: () -> Unit,
) {
    val progress = if (state.timer.totalMillis == 0L) 0f else 1f - (state.timer.remainingMillis.toFloat() / state.timer.totalMillis.toFloat())
    val animatedProgress = androidx.compose.animation.core.animateFloatAsState(
        targetValue = progress.coerceIn(0f, 1f),
        animationSpec = tween(durationMillis = 100, easing = LinearEasing),
        label = "timer-progress",
    )

    Box(modifier = Modifier.fillMaxSize()) {
        Crossfade(targetState = state.backgroundRes, label = "background") { backgroundRes ->
            Image(
                painter = painterResource(id = backgroundRes),
                contentDescription = null,
                modifier = Modifier.fillMaxSize(),
                alpha = 0.92f,
            )
        }
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Brush.verticalGradient(listOf(Color(0x99000000), Color(0xCC09111D))))
        )
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp),
        ) {
            Card(colors = CardDefaults.cardColors(containerColor = Color(0x66101926))) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text(text = "${state.timer.phase.label} mode", color = Color.White, style = MaterialTheme.typography.titleMedium)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(text = state.quote, color = Color.White.copy(alpha = 0.86f), style = MaterialTheme.typography.bodyLarge)
                }
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                contentAlignment = Alignment.Center,
            ) {
                Canvas(modifier = Modifier.size(280.dp)) {
                    drawCircle(color = Color.White.copy(alpha = 0.18f), style = Stroke(width = 20.dp.toPx()))
                    drawArc(
                        color = Color(0xFF73D9BA),
                        startAngle = -90f,
                        sweepAngle = 360f * animatedProgress.value,
                        useCenter = false,
                        style = Stroke(width = 24.dp.toPx(), cap = StrokeCap.Round),
                    )
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(text = state.timer.remainingMillis.formatAsTimer(), color = Color.White, fontSize = 46.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(text = "Completed ${state.timer.completedFocusSessions} sessions", color = Color.White.copy(alpha = 0.82f))
                }
            }

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Button(onClick = { if (state.timer.isRunning) onPause() else onStart() }, modifier = Modifier.weight(1f)) {
                    Text(if (state.timer.isRunning) "Pause" else "Start")
                }
                OutlinedButton(onClick = { if (state.timer.isRunning) onSkip() else onResume() }, modifier = Modifier.weight(1f)) {
                    Text(if (state.timer.isRunning) "Skip" else "Resume")
                }
            }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedButton(onClick = onReset, modifier = Modifier.weight(1f)) { Text("Reset") }
                Button(onClick = onRenderVideo, modifier = Modifier.weight(1f)) { Text("Render 4K Video") }
            }
            OutlinedButton(onClick = onShareVideo, modifier = Modifier.fillMaxWidth()) {
                Text("Share last export")
            }

            Card(colors = CardDefaults.cardColors(containerColor = Color(0x66FFFFFF))) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(text = "Current setup", style = MaterialTheme.typography.titleMedium)
                    Text(text = "Focus ${state.settings.focusMinutes} min / Break ${state.settings.shortBreakMinutes} min / Long break ${state.settings.longBreakMinutes} min")
                    Text(text = "Lock screen overlay ${if (state.settings.lockScreenOverlay) "enabled" else "disabled"} • Ambient ${if (state.settings.ambientEnabled) "on" else "off"}")
                }
            }
        }
        if (state.confettiBursts > 0) {
            ConfettiOverlay(trigger = state.confettiBursts)
        }
    }
}

@Composable
private fun ConfettiOverlay(trigger: Int) {
    val progress = Animatable(0f)
    LaunchedEffect(trigger) {
        progress.snapTo(0f)
        progress.animateTo(1f, tween(durationMillis = 1800, easing = FastOutSlowInEasing))
    }
    Canvas(modifier = Modifier.fillMaxSize()) {
        repeat(28) { index ->
            val x = (size.width / 28f) * index + 24f
            val startY = -40f - (index * 12)
            val endY = size.height * (0.35f + (index % 5) * 0.08f)
            val y = startY + (endY - startY) * progress.value
            val sizePx = 8.dp.toPx() + (index % 4) * 3.dp.toPx()
            val color = listOf(Color(0xFF73D9BA), Color(0xFF5066FF), Color(0xFFFFE082), Color(0xFFFF8A65))[index % 4]
            drawCircle(color = color, radius = sizePx, center = androidx.compose.ui.geometry.Offset(x, y))
        }
    }
}
