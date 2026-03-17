# Keep Room entities and database classes
-keep class com.focus.pomodoro.data.local.entity.** { *; }
-keep class com.focus.pomodoro.data.local.FocusDatabase { *; }

# Keep WorkManager workers
-keep class * extends androidx.work.ListenableWorker { *; }

# Keep FFmpegKit entrypoints
-keep class com.arthenica.ffmpegkit.** { *; }

# Keep serialization models
-keep class kotlinx.serialization.** { *; }
-keepclassmembers class ** {
    @kotlinx.serialization.Serializable *;
}
