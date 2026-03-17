package com.focus.pomodoro.feature.media

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.focus.pomodoro.data.repo.MediaRepository
import com.focus.pomodoro.domain.model.AmbientAsset
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class MediaViewModel(private val repository: MediaRepository) : ViewModel() {
    private val _uiState = MutableStateFlow(MediaUiState())
    val uiState: StateFlow<MediaUiState> = _uiState.asStateFlow()

    init {
        _uiState.value = _uiState.value.copy(
            videos = repository.listVideoAssets(),
            audio = repository.listAudioAssets(),
            images = repository.listImageAssets()
        )
    }

    fun generateVideo(background: AmbientAsset, audio: AmbientAsset, minutes: Int, title: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(exporting = true, exportMessage = "Generating 4K Pomodoro video...")
            val result = repository.generatePomodoroVideo(
                backgroundAssetPath = background.path,
                audioAssetPath = audio.path,
                sessionSeconds = minutes * 60,
                title = title.ifBlank { "pomodoro" }
            )
            _uiState.value = _uiState.value.copy(
                exporting = false,
                lastExportPath = result.getOrNull()?.absolutePath,
                exportMessage = result.fold(
                    onSuccess = { "Saved to ${it.absolutePath}" },
                    onFailure = { "Export failed: ${it.message}" }
                )
            )
        }
    }
}

data class MediaUiState(
    val videos: List<AmbientAsset> = emptyList(),
    val audio: List<AmbientAsset> = emptyList(),
    val images: List<AmbientAsset> = emptyList(),
    val exporting: Boolean = false,
    val exportMessage: String = "",
    val lastExportPath: String? = null
)
