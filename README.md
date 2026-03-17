# Mobil Focus Pomodoro

Mobil cihazlara uygun, kurulum yapılabilen (PWA) basit bir Pomodoro uygulaması.

## Özellikler

- Odak / kısa mola / uzun mola döngüsü
- Uzun mola için tekrar aralığı ayarı (örn. her 4 odakta bir)
- Başlat, duraklat, sıfırla ve faz geç butonları
- Yerel depolamada ayarların saklanması
- Seans bitiminde ses + titreşim + bildirim denemesi
- Service Worker ile temel offline kullanım

## Çalıştırma

Bu proje statik dosyalardan oluşur. Yerel sunucu ile çalıştır:

```bash
python3 -m http.server 8080
```

Sonra tarayıcıdan:

`http://localhost:8080`

## Mobil kullanım

- Tarayıcı menüsünden **Ana Ekrana Ekle** seçeneğiyle uygulama gibi kurabilirsin.
- Odak seansı sırasında ekranı kilitlemeden uygulamayı açık tutman önerilir.

## Android APK derleme

Capacitor ile Android kabuğu eklenmiştir.

1. Gereksinimler:
   - Node.js
   - Java 21 (veya Gradle'ın desteklediği uygun JDK)
   - Android SDK (ANDROID_HOME veya ANDROID_SDK_ROOT tanımlı)
2. Komut:

```bash
npm install
npm run build:apk
```

APK çıktısı:

`android/app/build/outputs/apk/debug/app-debug.apk`
