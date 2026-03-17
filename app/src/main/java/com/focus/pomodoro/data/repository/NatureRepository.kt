package com.focus.pomodoro.data.repository

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import androidx.core.content.ContextCompat
import com.focus.pomodoro.R
import java.io.File
import java.io.FileOutputStream
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class NatureRepository {
    private val backgrounds = listOf(
        R.drawable.nature_morning,
        R.drawable.nature_forest,
        R.drawable.nature_sunset,
    )

    fun backgroundForTimestamp(timestamp: Long): Int {
        val index = ((timestamp / FIVE_MINUTES_MS) % backgrounds.size).toInt()
        return backgrounds[index]
    }

    suspend fun ensureCachedBackgrounds(context: Context): List<File> = withContext(Dispatchers.IO) {
        backgrounds.map { exportDrawableToFile(context, it) }
    }

    suspend fun exportDrawableToFile(context: Context, resId: Int): File = withContext(Dispatchers.IO) {
        val file = File(context.cacheDir, "background_$resId.png")
        if (file.exists()) return@withContext file
        val drawable = requireNotNull(ContextCompat.getDrawable(context, resId))
        val width = drawable.intrinsicWidth.takeIf { it > 0 } ?: 1080
        val height = drawable.intrinsicHeight.takeIf { it > 0 } ?: 1920
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        drawable.setBounds(0, 0, canvas.width, canvas.height)
        drawable.draw(canvas)
        FileOutputStream(file).use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
        file
    }

    companion object {
        private const val FIVE_MINUTES_MS = 5 * 60 * 1000L
    }
}
