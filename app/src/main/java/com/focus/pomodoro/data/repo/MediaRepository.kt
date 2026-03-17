package com.focus.pomodoro.data.repo

import android.content.Context
import com.github.pao11.libffmpeg.ExecuteBinaryResponseHandler
import com.github.pao11.libffmpeg.FFmpeg
import com.github.pao11.libffmpeg.FFmpegLoadBinaryResponseHandler
import com.github.pao11.libffmpeg.exceptions.FFmpegCommandAlreadyRunningException
import com.github.pao11.libffmpeg.exceptions.FFmpegNotSupportedException
import com.focus.pomodoro.domain.model.AmbientAsset
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.io.File
import kotlin.coroutines.resume

class MediaRepository(private val context: Context) {
    @Volatile
    private var ffmpegLoaded = false

    fun listVideoAssets(): List<AmbientAsset> = listAssets("videos", "video")
    fun listAudioAssets(): List<AmbientAsset> = listAssets("audio", "audio")
    fun listImageAssets(): List<AmbientAsset> = listAssets("images", "image")

    suspend fun generatePomodoroVideo(
        backgroundAssetPath: String,
        audioAssetPath: String,
        sessionSeconds: Int,
        title: String
    ): Result<File> = withContext(Dispatchers.IO) {
        val loadResult = ensureFfmpegLoaded()
        if (loadResult.isFailure) {
            return@withContext Result.failure(loadResult.exceptionOrNull() ?: IllegalStateException("FFmpeg unavailable"))
        }
        val bgFile = copyAssetToCache(backgroundAssetPath)
        val audioFile = copyAssetToCache(audioAssetPath)
        val exportDir = File(context.getExternalFilesDir(null), "Exports").apply { mkdirs() }
        val output = File(exportDir, "${title.replace("\\s+".toRegex(), "_")}_${System.currentTimeMillis()}.mp4")
        val safeTitle = title.take(20).replace("'", "")

        val command = arrayOf(
            "-y",
            "-stream_loop", "-1", "-i", bgFile.absolutePath,
            "-stream_loop", "-1", "-i", audioFile.absolutePath,
            "-t", sessionSeconds.toString(),
            "-vf",
            "scale=3840:2160,drawbox=x=0:y=ih-70:w=iw*t/$sessionSeconds:h=40:color=0x4CAF50AA:t=fill,drawtext=fontcolor=white:fontsize=80:text='$safeTitle':x=(w-text_w)/2:y=90",
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "20",
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            output.absolutePath
        )

        return@withContext executeFfmpeg(command, output)
    }

    private suspend fun ensureFfmpegLoaded(): Result<Unit> = withContext(Dispatchers.IO) {
        if (ffmpegLoaded) return@withContext Result.success(Unit)
        suspendCancellableCoroutine { continuation ->
            try {
                FFmpeg.getInstance(context).loadBinary(object : FFmpegLoadBinaryResponseHandler {
                    override fun onSuccess() {
                        ffmpegLoaded = true
                        continuation.resume(Result.success(Unit))
                    }

                    override fun onFailure() {
                        continuation.resume(Result.failure(IllegalStateException("FFmpeg binary could not be loaded")))
                    }

                    override fun onStart() = Unit
                    override fun onFinish() = Unit
                })
            } catch (error: FFmpegNotSupportedException) {
                continuation.resume(Result.failure(error))
            }
        }
    }

    private suspend fun executeFfmpeg(command: Array<String>, output: File): Result<File> = withContext(Dispatchers.IO) {
        suspendCancellableCoroutine { continuation ->
            try {
                FFmpeg.getInstance(context).execute(command, object : ExecuteBinaryResponseHandler() {
                    private var failure: String? = null

                    override fun onFailure(message: String) {
                        failure = message
                    }

                    override fun onFinish() {
                        if (output.exists()) {
                            continuation.resume(Result.success(output))
                        } else {
                            continuation.resume(Result.failure(IllegalStateException(failure ?: "FFmpeg command failed")))
                        }
                    }
                })
            } catch (error: FFmpegCommandAlreadyRunningException) {
                continuation.resume(Result.failure(error))
            }
        }
    }

    private fun listAssets(root: String, category: String): List<AmbientAsset> {
        val files = context.assets.list(root).orEmpty()
        return files.map { name ->
            val path = "$root/$name"
            val size = runCatching {
                context.assets.open(path).use { input -> input.available().toLong() }
            }.getOrDefault(0L)
            AmbientAsset(path = path, category = category, title = name.substringBeforeLast('.'), sizeBytes = size)
        }
    }

    private fun copyAssetToCache(path: String): File {
        val cacheDir = File(context.cacheDir, "media_work").apply { mkdirs() }
        val output = File(cacheDir, path.substringAfterLast('/'))
        context.assets.open(path).use { input ->
            output.outputStream().use { out ->
                input.copyTo(out)
            }
        }
        return output
    }
}
