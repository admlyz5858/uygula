# Mobil Focus Pomodoro

Mobil cihazlara uygun, kurulum yapılabilen (PWA) basit bir Pomodoro uygulaması.

## Özellikler

- Odak / kısa mola / uzun mola döngüsü
- Uzun mola için tekrar aralığı ayarı (örn. her 4 odakta bir)
- Başlat, duraklat, sıfırla ve faz geç butonları
- Yerel depolamada ayarların saklanması
- Seans bitiminde ses + titreşim + bildirim denemesi
- Service Worker ile temel offline kullanım
- Gelişmiş animasyonlar (cinematic arka plan, yüzen glow efektleri, dinamik progress)
- Arka plana gömülü stok görsel geçişi ve şeffaf (glassmorphism) uygulama katmanı
- Karanlık / aydınlık / otomatik tema modu
- Telifsiz stok arka plan görselleri
- Telifsiz stok odak müzik/ambiyans oynatıcı (parça seçimi + ses kontrolü)

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

## Medya lisansları (telifsiz stok)

### Görseller

- `assets/images/countryside.webp`  
  Kaynak: `Landscape-countryside-way-fields (24243301441).jpg` (Wikimedia Commons)  
  Lisans: **CC0 1.0 (Public Domain Dedication)**

- `assets/images/river.webp`  
  Kaynak: `Beautiful river landscape in the fall.jpg` (Wikimedia Commons)  
  Lisans: **Public Domain**

- `assets/images/autumn.webp`  
  Kaynak: `Beautiful autumn day.jpg` (Wikimedia Commons)  
  Lisans: **Public Domain**

### Müzik / Ambiyans

- `assets/music/gymnopedie-focus.ogg`  
  Kaynak: `Gymnopedie No. 1..ogg` (Wikimedia Commons)  
  Lisans: **CC0 1.0**

- `assets/music/waves-focus.ogg`  
  Kaynak: `Waves.ogg` (Wikimedia Commons)  
  Lisans: **Public Domain**

- `assets/music/campfire-focus.ogg`  
  Kaynak: `Campfire sound ambience.ogg` (Wikimedia Commons)  
  Lisans: **CC BY 3.0** (Atıf: Glaneur de sons)
