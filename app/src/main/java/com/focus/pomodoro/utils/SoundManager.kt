package com.focus.pomodoro.utils

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import com.focus.pomodoro.R

class SoundManager(
    context: Context,
) {
    private val appContext = context.applicationContext
    private var ambientPlayer: MediaPlayer? = null

    fun playBell() {
        MediaPlayer.create(appContext, R.raw.bell).apply {
            setAudioAttributes(
                AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .build()
            )
            setOnCompletionListener { player ->
                player.release()
            }
            start()
        }
    }

    fun startAmbientLoop() {
        if (ambientPlayer?.isPlaying == true) return
        ambientPlayer = MediaPlayer.create(appContext, R.raw.ambient_loop).apply {
            isLooping = true
            setVolume(0.35f, 0.35f)
            setAudioAttributes(
                AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .build()
            )
            start()
        }
    }

    fun stopAmbientLoop() {
        ambientPlayer?.stop()
        ambientPlayer?.release()
        ambientPlayer = null
    }
}
