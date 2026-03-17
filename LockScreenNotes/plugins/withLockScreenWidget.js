const {
  withXcodeProject,
  withInfoPlist,
  withAndroidManifest,
  withDangerousMod,
  IOSConfig,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const APP_GROUP_ID = 'group.com.lockscreennotes.app';
const WIDGET_BUNDLE_ID = 'com.lockscreennotes.app.LockScreenWidget';
const WIDGET_TARGET_NAME = 'LockScreenWidget';

/**
 * Expo config plugin that injects the native lock screen widget
 * extensions for both iOS (WidgetKit) and Android (AppWidget).
 */
function withLockScreenWidget(config) {
  // iOS: Add App Group entitlement and widget extension files
  config = withIOSWidget(config);

  // Android: Register the AppWidget provider in AndroidManifest
  config = withAndroidWidget(config);

  return config;
}

// ────────────────────────────────────────────────────────────────
// iOS Widget Extension
// ────────────────────────────────────────────────────────────────

function withIOSWidget(config) {
  config = withInfoPlist(config, (mod) => {
    return mod;
  });

  config = withDangerousMod(config, [
    'ios',
    async (mod) => {
      const iosPath = path.join(mod.modRequest.platformProjectRoot);
      const widgetDir = path.join(iosPath, WIDGET_TARGET_NAME);

      if (!fs.existsSync(widgetDir)) {
        fs.mkdirSync(widgetDir, { recursive: true });
      }

      // Copy Swift widget source files
      const pluginAssetsDir = path.join(__dirname, '..', 'ios', 'LockScreenWidget');

      const filesToCopy = [
        'LockScreenWidget.swift',
        'LockScreenWidgetBundle.swift',
        'Info.plist',
      ];

      for (const file of filesToCopy) {
        const src = path.join(pluginAssetsDir, file);
        const dest = path.join(widgetDir, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
        }
      }

      // Create widget entitlements
      const entitlements = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.application-groups</key>
  <array>
    <string>${APP_GROUP_ID}</string>
  </array>
</dict>
</plist>`;
      fs.writeFileSync(path.join(widgetDir, `${WIDGET_TARGET_NAME}.entitlements`), entitlements);

      // Also create entitlements for the main app target
      const mainAppName = mod.modRequest.projectName || 'LockScreenNotes';
      const mainEntitlementsPath = path.join(iosPath, mainAppName, `${mainAppName}.entitlements`);
      const mainEntitlements = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.application-groups</key>
  <array>
    <string>${APP_GROUP_ID}</string>
  </array>
</dict>
</plist>`;
      fs.writeFileSync(mainEntitlementsPath, mainEntitlements);

      return mod;
    },
  ]);

  return config;
}

// ────────────────────────────────────────────────────────────────
// Android AppWidget
// ────────────────────────────────────────────────────────────────

function withAndroidWidget(config) {
  config = withAndroidManifest(config, (mod) => {
    const mainApp = mod.modResults.manifest.application?.[0];
    if (!mainApp) return mod;

    if (!mainApp.receiver) {
      mainApp.receiver = [];
    }

    const widgetReceiverExists = mainApp.receiver.some(
      (r) => r.$?.['android:name'] === '.widget.TodoWidgetProvider'
    );

    if (!widgetReceiverExists) {
      mainApp.receiver.push({
        $: {
          'android:name': '.widget.TodoWidgetProvider',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.appwidget.action.APPWIDGET_UPDATE',
                },
              },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': '@xml/todo_widget_info',
            },
          },
        ],
      });
    }

    // Add the toggle broadcast receiver
    const toggleReceiverExists = mainApp.receiver.some(
      (r) => r.$?.['android:name'] === '.widget.TodoToggleReceiver'
    );

    if (!toggleReceiverExists) {
      mainApp.receiver.push({
        $: {
          'android:name': '.widget.TodoToggleReceiver',
          'android:exported': 'false',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'com.lockscreennotes.TOGGLE_TODO',
                },
              },
            ],
          },
        ],
      });
    }

    return mod;
  });

  config = withDangerousMod(config, [
    'android',
    async (mod) => {
      const androidPath = mod.modRequest.platformProjectRoot;
      const packagePath = 'com/lockscreennotes/app';

      // Copy Kotlin widget files
      const widgetSrcDir = path.join(
        androidPath,
        'app',
        'src',
        'main',
        'java',
        packagePath,
        'widget'
      );

      if (!fs.existsSync(widgetSrcDir)) {
        fs.mkdirSync(widgetSrcDir, { recursive: true });
      }

      const pluginAndroidDir = path.join(
        __dirname,
        '..',
        'android',
        'app',
        'src',
        'main',
        'java',
        'com',
        'lockscreennotes',
        'widget'
      );

      const kotlinFiles = [
        'TodoWidgetProvider.kt',
        'TodoToggleReceiver.kt',
        'WidgetBridgeModule.kt',
        'WidgetBridgePackage.kt',
      ];

      for (const file of kotlinFiles) {
        const src = path.join(pluginAndroidDir, file);
        const dest = path.join(widgetSrcDir, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
        }
      }

      // Copy XML widget metadata
      const resXmlDir = path.join(androidPath, 'app', 'src', 'main', 'res', 'xml');
      if (!fs.existsSync(resXmlDir)) {
        fs.mkdirSync(resXmlDir, { recursive: true });
      }

      const xmlSrc = path.join(
        __dirname,
        '..',
        'android',
        'app',
        'src',
        'main',
        'res',
        'xml',
        'todo_widget_info.xml'
      );
      if (fs.existsSync(xmlSrc)) {
        fs.copyFileSync(xmlSrc, path.join(resXmlDir, 'todo_widget_info.xml'));
      }

      // Copy layout XML
      const resLayoutDir = path.join(androidPath, 'app', 'src', 'main', 'res', 'layout');
      if (!fs.existsSync(resLayoutDir)) {
        fs.mkdirSync(resLayoutDir, { recursive: true });
      }

      const layoutSrc = path.join(
        __dirname,
        '..',
        'android',
        'app',
        'src',
        'main',
        'res',
        'layout',
        'widget_todo_list.xml'
      );
      if (fs.existsSync(layoutSrc)) {
        fs.copyFileSync(layoutSrc, path.join(resLayoutDir, 'widget_todo_list.xml'));
      }

      const layoutItemSrc = path.join(
        __dirname,
        '..',
        'android',
        'app',
        'src',
        'main',
        'res',
        'layout',
        'widget_todo_item.xml'
      );
      if (fs.existsSync(layoutItemSrc)) {
        fs.copyFileSync(layoutItemSrc, path.join(resLayoutDir, 'widget_todo_item.xml'));
      }

      return mod;
    },
  ]);

  return config;
}

module.exports = withLockScreenWidget;
