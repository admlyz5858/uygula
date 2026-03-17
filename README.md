# Misket Yarışı - Marble Race Game

3D fizik tabanlı misket yarışı oyunu. Three.js ve Cannon.js ile geliştirilmiş, tarayıcı üzerinde çalışan interaktif yarış deneyimi.

## Özellikler

- **12 Benzersiz Misket**: Her biri farklı renk ve isimle (Kırmızı Şimşek, Mavi Fırtına, Yeşil Ejderha vb.)
- **Detaylı Parkur**: 8 farklı bölüm içeren zengin yarış pisti
  - Başlangıç Platformu
  - Dik Yokuş (başlangıç hız bölgesi)
  - Huni Bölgesi (daralan geçit)
  - S Virajları (kıvrımlı bölüm)
  - Ölüm Spirali (helisel iniş)
  - Atlama Rampası (havadan atlayış)
  - Şikane Bölgesi (dar zikzak virajlar)
  - Final Düzlüğü (bitiş çizgisine koşu)
- **Fizik Motoru**: Cannon.js ile gerçekçi fizik simülasyonu
- **Engeller**: Dönen engelller, tamponlar, boost bölgeleri
- **Dinamik Kamera**: 6 farklı açıdan otomatik geçişli kamera sistemi
- **Görsel Efektler**: Misket izleri, konfeti, parçacık efektleri
- **Ses Efektleri**: Geri sayım sesleri, yuvarlanma sesi
- **Canlı Sıralama Tablosu**: Gerçek zamanlı pozisyon takibi
- **Sonuç Ekranı**: Podyum ve detaylı yarış sonuçları
- **Çevre Detayları**: Dağlar, ağaçlar, bulutlar, seyirci tribünleri

## Nasıl Oynanır

1. Ana menüde favori misketini seç
2. "Yarışı Başlat" butonuna tıkla
3. 3-2-1-BAŞLA! geri sayımını bekle
4. Misketlerin yarışını izle ve heyecanlan!
5. Yarış bittiğinde sonuçları gör
6. "Tekrar Oyna" ile yeni bir yarış başlat

## Teknolojiler

- [Three.js](https://threejs.org/) r149 - 3D grafik render
- [Cannon.js](https://schteppe.github.io/cannon.js/) 0.6.2 - Fizik motoru
- Vanilla JavaScript (ES6+)
- CSS3 (Glassmorphism UI)
- Web Audio API (Ses efektleri)

## Çalıştırma

Dosyaları bir web sunucusu üzerinden sunun:

```bash
npx serve .
```

Ardından tarayıcınızda `http://localhost:3000` adresini açın.

## Mobil Destek

Oyun tamamen responsif tasarıma sahiptir ve mobil cihazlarda da oynanabilir. PWA desteği sayesinde ana ekrana eklenebilir.
