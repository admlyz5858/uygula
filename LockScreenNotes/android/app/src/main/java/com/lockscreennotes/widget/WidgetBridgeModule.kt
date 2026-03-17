package com.lockscreennotes.widget

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * React Native native module that receives todo data from JS
 * and pushes it to SharedPreferences so the Android AppWidget can read it.
 */
class WidgetBridgeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "WidgetBridge"

    @ReactMethod
    fun setWidgetData(jsonString: String) {
        val context = reactApplicationContext
        val prefs = context.getSharedPreferences(
            TodoWidgetProvider.PREFS_NAME,
            android.content.Context.MODE_PRIVATE
        )
        prefs.edit().putString(TodoWidgetProvider.KEY_TODOS, jsonString).apply()

        TodoWidgetProvider.refreshWidget(context)
    }

    @ReactMethod
    fun reloadWidget() {
        TodoWidgetProvider.refreshWidget(reactApplicationContext)
    }
}
