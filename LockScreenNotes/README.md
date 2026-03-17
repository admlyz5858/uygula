# Notlarım — Kilit Ekranı Yapılacaklar Widget'ı

Kilit ekranında etkileşimli yapılacaklar listesi gösteren, React Native (Expo) tabanlı mobil uygulama.

## Özellikler

- **Ana Uygulama:** Not ve görev ekleme, düzenleme, silme
- **Tamamlama:** Görevlere dokunarak tamamlama (üstü çizili)
- **Kilit Ekranı Widget'ı:** iOS WidgetKit ve Android AppWidget ile kilit ekranında liste görüntüleme
- **Kilit Ekranı Etkileşimi:** Telefonu açmadan widget üzerinden görev tamamlama
- **Kalıcı Depolama:** MMKV ile hızlı yerel depolama
- **Karanlık Mod:** Otomatik sistem teması desteği (dark/light)
- **Minimalist Tasarım:** Temiz, okunaklı, göz yormayan arayüz

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Framework | React Native + Expo SDK 55 |
| Dil | TypeScript |
| Durum Yönetimi | Zustand |
| Yerel Depolama | react-native-mmkv |
| iOS Widget | WidgetKit + SwiftUI + AppIntents (iOS 17+) |
| Android Widget | AppWidget + RemoteViews + BroadcastReceiver |
| Native Köprü | React Native Native Modules (Swift/Kotlin) |

## Proje Yapısı

```
LockScreenNotes/
├── App.tsx                          # Ana uygulama bileşeni
├── src/
│   ├── types/index.ts               # TypeScript tip tanımları
│   ├── storage/mmkv.ts              # MMKV depolama kurulumu
│   ├── store/useTodoStore.ts        # Zustand store (MMKV kalıcılık)
│   ├── theme/index.ts               # Tema renkleri (dark/light)
│   ├── hooks/useColorScheme.ts      # Tema hook'u
│   ├── native/WidgetBridge.ts       # Native modül köprüsü
│   └── components/
│       ├── TodoItem.tsx             # Tek görev bileşeni
│       ├── AddTodoInput.tsx         # Yeni görev ekleme girişi
│       ├── Header.tsx               # Başlık ve istatistikler
│       └── EmptyState.tsx           # Boş liste durumu
├── ios/LockScreenWidget/
│   ├── LockScreenWidget.swift       # WidgetKit widget tanımı + SwiftUI görünüm
│   ├── LockScreenWidgetBundle.swift # Widget bundle
│   ├── WidgetBridgeModule.swift     # RN → iOS native modül
│   ├── WidgetBridge.m               # Objective-C köprü başlığı
│   └── Info.plist                   # Widget extension ayarları
├── android/app/src/main/
│   ├── java/com/lockscreennotes/widget/
│   │   ├── TodoWidgetProvider.kt    # AppWidget provider + RemoteViews fabrikası
│   │   ├── TodoToggleReceiver.kt    # Widget tıklama broadcast alıcısı
│   │   ├── WidgetBridgeModule.kt    # RN → Android native modül
│   │   └── WidgetBridgePackage.kt   # React Native paket kaydı
│   └── res/
│       ├── xml/todo_widget_info.xml # Widget meta verisi
│       └── layout/
│           ├── widget_todo_list.xml # Widget ana düzeni
│           └── widget_todo_item.xml # Widget liste öğesi düzeni
└── plugins/
    └── withLockScreenWidget.js      # Expo config plugin
```

## Kurulum

### Gereksinimler

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS geliştirme için: macOS + Xcode 15+
- Android geliştirme için: Android Studio + JDK 17

### 1. Bağımlılıkları Yükle

```bash
cd LockScreenNotes
npm install
```

### 2. Native Proje Oluştur (Prebuild)

Expo managed workflow'dan native projeye geçiş için:

```bash
npx expo prebuild
```

Bu komut `ios/` ve `android/` dizinlerini oluşturur ve config plugin widget
dosyalarını doğru yerlere kopyalar.

### 3. iOS Ek Adımlar

Prebuild sonrası Xcode'da ek yapılandırma gerekir:

1. `.xcworkspace` dosyasını Xcode ile aç
2. **Widget Extension Target ekle:**
   - File → New → Target → Widget Extension
   - İsim: `LockScreenWidget`
   - Bundle ID: `com.lockscreennotes.app.LockScreenWidget`
3. **App Group ekle** (hem ana uygulama hem widget target için):
   - Signing & Capabilities → + Capability → App Groups
   - Group: `group.com.lockscreennotes.app`
4. `ios/LockScreenWidget/` dizinindeki Swift dosyalarını widget target'a ekle
5. Widget target'ın minimum deployment hedefini iOS 17.0 yap (AppIntents için)
6. Ana uygulama target'ına `ios/LockScreenWidget/WidgetBridgeModule.swift`
   ve `ios/LockScreenWidget/WidgetBridge.m` dosyalarını ekle

### 4. Android Ek Adımlar

1. `android/app/src/main/java/com/lockscreennotes/app/MainApplication.kt` dosyasına
   `WidgetBridgePackage` kaydını ekle:

```kotlin
// MainApplication.kt içinde getPackages() fonksiyonuna ekle:
import com.lockscreennotes.widget.WidgetBridgePackage

override fun getPackages(): List<ReactPackage> {
    val packages = PackageList(this).packages.toMutableList()
    packages.add(WidgetBridgePackage())
    return packages
}
```

2. `android/app/src/main/AndroidManifest.xml` dosyasında widget receiver
   ve service tanımlarının olduğunu doğrula. Expo config plugin bunları
   otomatik ekler.

3. `TodoWidgetService`'i manifest'e ekle:
```xml
<service
    android:name=".widget.TodoWidgetService"
    android:permission="android.permission.BIND_REMOTEVIEWS" />
```

### 5. Çalıştır

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

## Mimari Açıklama

### Veri Akışı

```
┌─────────────────┐    Zustand + MMKV    ┌──────────────────┐
│  React Native   │ ◄──────────────────► │  Yerel Depolama  │
│  Ana Uygulama   │                      │  (MMKV)          │
└────────┬────────┘                      └──────────────────┘
         │
         │ NativeModule.setWidgetData(json)
         ▼
┌─────────────────┐                      ┌──────────────────┐
│  Native Bridge  │ ────────────────────►│  Paylaşılan Veri │
│  (Swift/Kotlin) │                      │  (UserDefaults / │
└────────┬────────┘                      │  SharedPrefs)    │
         │                               └────────┬─────────┘
         │ WidgetCenter.reloadTimelines()          │ Okuma
         │ AppWidgetManager.notifyChanged()        │
         ▼                                         ▼
┌─────────────────┐                      ┌──────────────────┐
│  Widget Engine  │ ◄───────────────────│  Widget UI       │
│  (WidgetKit /   │    Veri çekme       │  (SwiftUI /      │
│   AppWidget)    │                      │   RemoteViews)   │
└─────────────────┘                      └──────────────────┘
```

### Kilit Ekranı Etkileşimi

**iOS (17+):** `AppIntents` kullanılarak widget üzerindeki butonlar doğrudan
`ToggleTodoIntent`'i tetikler. Bu intent, App Group UserDefaults'taki veriyi
günceller ve timeline'ı yeniden yükler. Kullanıcı telefonu açtığında React Native
tarafı güncel veriyi okur.

**iOS (<17):** URL scheme (`lockscreennotes://toggle/<id>`) kullanılır.
Widget öğesine tıklandığında uygulama açılır ve native modül üzerinden
JS tarafına event gönderilir.

**Android:** `PendingIntent` + `BroadcastReceiver` kullanılarak widget
öğesine tıklandığında `TodoToggleReceiver` tetiklenir. Receiver,
SharedPreferences'taki veriyi günceller ve widget'ı yeniler.
`widgetCategory="home_screen|keyguard"` sayesinde widget kilit ekranında da görünür.

## Lisans

MIT
