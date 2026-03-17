package com.focus.pomodoro.ui.ai

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.focus.pomodoro.SimpleViewModelFactory
import com.focus.pomodoro.appContainer
import com.focus.pomodoro.ui.theme.FocusPomodoroTheme

class AIPlannerFragment : Fragment() {
    private val viewModel by lazy {
        val container = requireContext().applicationContext.appContainer
        ViewModelProvider(this, SimpleViewModelFactory {
            AIPlannerViewModel(container.aiService, container.taskRepository)
        })[AIPlannerViewModel::class.java]
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        return ComposeView(requireContext()).apply {
            setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
            setContent {
                FocusPomodoroTheme {
                    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
                    PlannerScreen(
                        state = uiState,
                        onInputChange = viewModel::updateInput,
                        onGenerate = viewModel::generatePlan,
                        onSave = viewModel::savePlanToTasks,
                        onUpdateItem = viewModel::updateItem,
                    )
                }
            }
        }
    }
}

@Composable
private fun PlannerScreen(
    state: AIPlannerUiState,
    onInputChange: (String) -> Unit,
    onGenerate: () -> Unit,
    onSave: () -> Unit,
    onUpdateItem: (Int, String?, String?, Int?, Int?) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(text = state.title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Text(text = state.summary, style = MaterialTheme.typography.bodyLarge)
        OutlinedTextField(
            value = state.input,
            onValueChange = onInputChange,
            label = { Text("What do you want to accomplish?") },
            modifier = Modifier.fillMaxWidth(),
            minLines = 4,
        )
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Button(onClick = onGenerate) {
                Text("Generate plan")
            }
            Button(onClick = onSave, enabled = state.items.isNotEmpty()) {
                Text("Save to tasks")
            }
            if (state.isLoading) {
                CircularProgressIndicator(modifier = Modifier.padding(top = 8.dp))
            }
        }
        state.statusMessage?.let {
            Text(text = it, color = Color(0xFF2E7D32))
        }
        Spacer(modifier = Modifier.height(4.dp))
        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            itemsIndexed(state.items) { index, item ->
                Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = item.title,
                            onValueChange = { onUpdateItem(index, it, null, null, null) },
                            label = { Text("Task") },
                            modifier = Modifier.fillMaxWidth(),
                        )
                        OutlinedTextField(
                            value = item.description,
                            onValueChange = { onUpdateItem(index, null, it, null, null) },
                            label = { Text("Details") },
                            modifier = Modifier.fillMaxWidth(),
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            OutlinedTextField(
                                value = item.suggestedSessions.toString(),
                                onValueChange = { onUpdateItem(index, null, null, it.toIntOrNull() ?: 1, null) },
                                label = { Text("Sessions") },
                                modifier = Modifier.weight(1f),
                            )
                            OutlinedTextField(
                                value = item.priority.toString(),
                                onValueChange = { onUpdateItem(index, null, null, null, it.toIntOrNull() ?: 3) },
                                label = { Text("Priority") },
                                modifier = Modifier.weight(1f),
                            )
                        }
                    }
                }
            }
        }
    }
}
