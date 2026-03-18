# Bilye Yarışları - 2D Marble Racing

Canvas tabanlı 2D bilye yarış oyunu. Fizik motoru ile bilyeler parkurlarda yarışır. Yarışları kaydedip YouTube'a yükleyebilirsiniz.

## Özellikler

- **5 Farklı Parkur**: Klasik Yarış, Çılgın Zikzak, Engel Cehennemi, Dev Huni, Mega Parkur
- **24 Benzersiz Bilye**: Her birinin farklı hız, ağırlık, sıçrama ve şans istatistikleri
- **Gerçekçi Fizik**: Yerçekimi, çarpışma, sürtünme, sıçrama
- **Engel Türleri**: Çiviler (Plinko), tamponlar, çubuklar, huniler, zikzaklar
- **Cam Bilye Görünümü**: Gradyan, yansıma ve gölge efektleri
- **İz Efekti**: Bilyelerin geçtiği yolu takip edin
- **Ses Efektleri**: Çarpışma, geri sayım, bitiş sesleri
- **Turnuva Modu**: 5 parkurda puan toplama
- **Otomatik Yarış**: YouTube kayıt için otomatik mod
- **Tam Türkçe Arayüz**

## Engel Türleri

| Engel | Açıklama |
|-------|----------|
| Çivi (Peg) | Plinko tarzı sabit çiviler, bilyeleri saptırır |
| Tampon (Bumper) | Büyük yuvarlak engeller, bilyeleri güçlü iter |
| Çubuk (Bar) | Açılı çizgisel engeller |
| Huni (Funnel) | Daralan kanal, sıkışma yaratır |
| Zikzak | Keskin virajlı geçitler |

## Çalıştırma

```bash
python3 -m http.server 8080
# Tarayıcıda http://localhost:8080
```

## Teknoloji

- **HTML5 Canvas** - 2D rendering
- **Vanilla JavaScript** - Fizik motoru ve oyun mantığı
- **Web Audio API** - Ses efektleri
- **Capacitor** - Android APK
