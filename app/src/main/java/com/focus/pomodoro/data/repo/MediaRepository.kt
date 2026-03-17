package com.focus.pomodoro.data.repo

import android.content.Context
import com.arthenica.ffmpegkit.FFmpegKit
import com.arthenica.ffmpegkit.ReturnCode
import com.focus.pomodoro.domain.model.AmbientAsset
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

class MediaRepository(private val context: Context) {

    fun listVideoAssets(): List<AmbientAsset> = listAssets("videos", "video")
    fun listAudioAssets(): List<AmbientAsset> = listAssets("audio", "audio")
    fun listImageAssets(): List<AmbientAsset> = listAssets("images", "image")

    suspend fun generatePomodoroVideo(
        backgroundAssetPath: String,
        audioAssetPath: String,
        sessionSeconds: Int,
        title: String
    ): Result<File> = withContext(Dispatchers.IO) {
        val bgFile = copyAssetToCache(backgroundAssetPath)
        val audioFile = copyAssetToCache(audioAssetPath)
        val exportDir = File(context.getExternalFilesDir(null), "Exports").apply { mkdirs() }
        val output = File(exportDir, "${title.replace("\\s+".toRegex(), "_")}_${System.currentTimeMillis()}.mp4")

        val command = listOf(
            "-y",
            "-stream_loop", "-1", "-i", bgFile.absolutePath,
            "-stream_loop", "-1", "-i", audioFile.absolutePath,
            "-t", sessionSeconds.toString(),
            "-vf",
            "scale=3840:2160,drawbox=x=0:y=ih-70:w=iw*t/$sessionSeconds:h=40:color=0x4CAF50AA:t=fill,drawtext=fontcolor=white:fontsize=80:text='${title.take(20)}':x=(w-text_w)/2:y=90",
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "20",
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            output.absolutePath
        ).joinToString(" ")

        val session = FFmpegKit.execute(command)
        return@withContext if (ReturnCode.isSuccess(session.returnCode)) {
            Result.success(output)
        } else {
            Result.failure(IllegalStateException(session.failStackTrace ?: "FFmpeg command failed"))
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
