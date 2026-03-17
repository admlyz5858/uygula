# Misket Arena Championship

Tarayicida calisan, mobil uyumlu ve kurulabilir bir PWA marble race oyunu.

Bu surum, kullanicinin paylastigi YouTube referanslarindaki Algodoo marble race alt turlerini tek bir simulasyon oyunu icinde birlestirir:

- takim sprinti
- territory / zone control race
- buyuk field eleme yarisi
- country grand prix
- weaponized arena
- stage lottery tabanli asamali eleme

## Oyun ozellikleri

- Canvas tabanli canli marble race simulasyonu
- 6 farkli event tipi ve ayri pist geometri verileri
- Tur bazli finish, eleme kapisi ve combat hazard mantigi
- Territory zone kontrolunden gelen takim buff sistemi
- Lottery gate ile rastgele koridor secimleri
- Canli olay akisi ve anlik sira tablosu
- Sezon puani ve 6 etaplik sampiyona modu
- Yerel depolamada event, hiz ve marble sayisi tercihlerinin saklanmasi
- Service Worker ile temel offline destek
- PWA manifest ve mobil kurulabilirlik

## Referans videolardan oyuna aktarılan tasarım kararları

Video sayfalarindan cekilebilen kamuya acik metadata uzerinden su formatlar referans alindi:

1. `The Team Marble Race 3 in Algodoo - 30 Colors`  
   -> toplu cikis, boost sektorleri, renkli pack yarisi
2. `Territory War x Country Marbles - Marble Race in Algodoo`  
   -> capture zone ve takim baskisi
3. `213 Countries 212 Eliminations Marble Race in Algodoo`  
   -> kademeli eleme kapilari ve survival akisi
4. `50 COUNTRIES MARBLE RACE IN ALGODOO`  
   -> daha klasik, teknik grand prix yapisi
5. `Weaponized Tank Arena - Marble Race Countries in Algodoo`  
   -> kule atislari, shield ve arena combat zonu
6. `Stage Lottery #4 - Roll to Choose - Elimination Marble Race`  
   -> rastgele secim kapilari ve stage bazli eleme

## Calistirma

Bu proje statik dosyalardan olusur. Yerel sunucu ile calistir:

```bash
python3 -m http.server 8080
```

Ardindan tarayicidan ac:

`http://localhost:8080`

## Build

Web build:

```bash
npm run build:web
```

Android paketlemek icin:

```bash
npm install
npm run build:apk
```

## Mobil kullanim

- Tarayicidan **Ana Ekrana Ekle** ile PWA olarak kurulabilir.
- Oyun hem dikey hem yatay duzende calisir; arena alani genis ekranlarda daha rahat izlenir.

## Teknik notlar

- Uygulama vanilla HTML, CSS ve JavaScript ile yazilmistir.
- Fizik motoru yerine pist segmentleri, hazard zonelari ve pack etkileşimi kullanan ozellestirilmis bir simulasyon uygulanmistir.
- Bu tercih, mevcut repodaki yalın statik yapiyi koruyup oyunu hizli yuklenir halde tutmak icindir.
