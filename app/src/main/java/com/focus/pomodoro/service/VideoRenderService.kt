package com.focus.pomodoro.service

import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.media.MediaScannerConnection
import android.os.IBinder
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.FileProvider
import com.arthenica.ffmpegkit.FFmpegKit
import com.arthenica.ffmpegkit.ReturnCode
import com.focus.pomodoro.MainActivity
import com.focus.pomodoro.appContainer
import com.focus.pomodoro.utils.NotificationHelper
import java.io.File
import java.io.FileOutputStream
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class VideoRenderService : Service() {
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val durationSeconds = intent?.getIntExtra(EXTRA_DURATION_SECONDS, 25 * 60) ?: 25 * 60
        serviceScope.launch {
            startForeground(
                NotificationHelper.RENDER_NOTIFICATION_ID,
                applicationContext.appContainer.notificationHelper.buildRenderNotification("Preparing assets"),
            )
            runRender(durationSeconds)
        }
        return START_NOT_STICKY
    }

    private suspend fun runRender(durationSeconds: Int) {
        val container = applicationContext.appContainer
        val backgroundRes = container.natureRepository.backgroundForTimestamp(System.currentTimeMillis())
        val backgroundFile = container.natureRepository.exportDrawableToFile(this, backgroundRes)
        val audioFile = copyRawToCache("ambient_loop.wav", com.focus.pomodoro.R.raw.ambient_loop)
        val outputDir = File(getExternalFilesDir("Movies"), "FocusPomodoroAI").apply { mkdirs() }
        val outputFile = File(outputDir, "focus-${System.currentTimeMillis()}.mp4")
        val command = buildFfmpegCommand(backgroundFile, audioFile, outputFile, durationSeconds)

        NotificationManagerCompat.from(this).notify(
            NotificationHelper.RENDER_NOTIFICATION_ID,
            container.notificationHelper.buildRenderNotification("Rendering ${durationSeconds / 60} min 4K video"),
        )

        FFmpegKit.executeAsync(command) { session ->
            val success = ReturnCode.isSuccess(session.returnCode)
            if (success) {
                MediaScannerConnection.scanFile(this, arrayOf(outputFile.absolutePath), arrayOf("video/mp4"), null)
                serviceScope.launch {
                    container.settingsRepository.persistLastRenderedVideo(outputFile.absolutePath)
                }
                val uri = FileProvider.getUriForFile(this, "$packageName.fileprovider", outputFile)
                val contentIntent = PendingIntent.getActivity(
                    this,
                    301,
                    Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
                )
                NotificationManagerCompat.from(this).notify(
                    NotificationHelper.RENDER_NOTIFICATION_ID,
                    container.notificationHelper.buildRenderNotification("Saved to ${outputFile.name}", true, contentIntent),
                )
            } else {
                NotificationManagerCompat.from(this).notify(
                    NotificationHelper.RENDER_NOTIFICATION_ID,
                    container.notificationHelper.buildRenderNotification("Render failed: ${session.failStackTrace}", true),
                )
            }
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
        }
    }

    private fun buildFfmpegCommand(backgroundFile: File, audioFile: File, outputFile: File, durationSeconds: Int): String {
        val fontPath = "/system/fonts/Roboto-Regular.ttf"
        val escapedOutput = outputFile.absolutePath
        return listOf(
            "-y",
            "-loop 1",
            "-i ${backgroundFile.absolutePath}",
            "-stream_loop -1",
            "-i ${audioFile.absolutePath}",
            "-t $durationSeconds",
            "-vf "scale=3840:2160:force_original_aspect_ratio=increase,crop=3840:2160,drawbox=x=192:y=1880:w=3396:h=20:color=white@0.25:t=fill,drawbox=x=192:y=1880:w='3396*(t/$durationSeconds)':h=20:color=0x73D9BA@0.95:t=fill,drawtext=fontfile=$fontPath:text='Focus Pomodoro AI':fontcolor=white@0.92:fontsize=72:x=(w-text_w)/2:y=240,drawtext=fontfile=$fontPath:text='%{eif\:trunc(($durationSeconds-t)/60)\:d\:2}\:%{eif\:mod(trunc($durationSeconds-t)\,60)\:d\:2}':fontcolor=white:fontsize=220:x=(w-text_w)/2:y=(h-text_h)/2"",
            "-c:v libx264",
            "-preset veryfast",
            "-r 30",
            "-pix_fmt yuv420p",
            "-c:a aac",
            "-b:a 192k",
            "-shortest",
            escapedOutput,
        ).joinToString(" ")
    }

    private fun copyRawToCache(fileName: String, resId: Int): File {
        val file = File(cacheDir, fileName)
        if (file.exists()) return file
        resources.openRawResource(resId).use { input ->
            FileOutputStream(file).use { output -> input.copyTo(output) }
        }
        return file
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        const val EXTRA_DURATION_SECONDS = "duration_seconds"
    }
}
