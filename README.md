# Parkur Yarışları - 3D Parkour Racing

Three.js tabanlı 3D parkur yarış oyunu. AI kontrollü yarışmacılar farklı parkur pistlerinde yarışır. Yarışları kaydedip YouTube'a yükleyebilirsiniz.

## Özellikler

- **5 Farklı Parkur Pisti**: Şehir Parkuru, Orman Macerası, Fabrika Kaçışı, Mega Parkur, Hız Testi
- **24 Benzersiz Yarışmacı**: Her birinin farklı hız, çeviklik, dayanıklılık ve şans istatistikleri var
- **4 Engel Türü**: Duvarlar, boşluklar, denge kirişleri, trambolinler
- **4 Kamera Modu**: Takip, yan görüş, sinematik, üst görünüm
- **Turnuva Modu**: Tüm parkurlarda sıralı yarışlar
- **Otomatik Yarış**: YouTube kayıt için sinematik kameralı otomatik yarışlar
- **Stickman Karakterler**: Koşma, tırmanma, zıplama ve denge animasyonları
- **Tam Türkçe Arayüz**

## Oyun Modları

### Hızlı Yarış
Bir parkur ve yarışmacı seçip hemen yarışın.

### Turnuva Modu
5 parkurda sıralı yarışlar. Her yarışta puan kazanılır, turnuva sonunda genel sıralama belirlenir.

### Otomatik Yarış (YouTube)
Rastgele parkur ve yarışmacılarla sinematik kameralı otomatik yarış. YouTube içerik üretimi için ideal.

## Engel Türleri

| Engel | Açıklama | Etki |
|-------|----------|------|
| Duvar | Tırmanılması gereken dikey engel | Çeviklik önemli |
| Boşluk | Atlanması gereken uçurum | Hız + çeviklik |
| Denge Kirişi | Dar yolda yürüme | Şans + çeviklik |
| Trampolin | Zıplama rampa | Herkese hız verir |

## Yarışmacı İstatistikleri

- **Hız**: Temel koşu hızı
- **Çeviklik**: Engelleri geçme hızı
- **Dayanıklılık**: Uzun yarışlarda performans düşüşü
- **Şans**: Tökezleme ihtimali

## Çalıştırma

```bash
# Basit HTTP sunucu ile
python3 -m http.server 8080

# veya npx ile
npx http-server -p 8080 -o
```

Tarayıcıda `http://localhost:8080` adresine gidin.

## Teknoloji

- **Three.js** (v0.170.0) - 3D rendering
- **Vanilla JavaScript** - ES Modules
- **CSS3** - Modern UI, glassmorphism efektleri
- **Google Fonts** - Russo One, Exo 2

## YouTube İçin Kayıt

1. "Otomatik Yarış (YouTube)" modunu seçin
2. Ekran kayıt yazılımı (OBS, vb.) ile ekranı kaydedin
3. Yarış otomatik olarak başlar ve biter
4. Sonuçlar ekranını da kaydedin
5. Yeni yarış için tekrar tıklayın
