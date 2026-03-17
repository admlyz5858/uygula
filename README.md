# Marble Race: Ultimate League

Algodoo marble race videolarindan ilham alan, PWA olarak calisan gelismis bir yaris simulatordur.

## Referans video analizi ve oyuna donusumu

Verilen baglantilarin basliklari (oEmbed API ile) ve marble race formatlari baz alinarak oyun modlari tasarlandi:

1. **The Team Marble Race 3 in Algodoo - 30 Colors**
   - Oyundaki karsiligi: **Team Marble Race modu**
   - Uygulama: Bireysel finish puani + takim toplam puani

2. **Territory War x Country Marbles - Marble Race in Algodoo**
   - Oyundaki karsiligi: **Territory War modu**
   - Uygulama: Checkpoint ele gecirme, bolge kontrol puani, takim hakimiyet savasi

3. **213 Countries 212 Eliminations Marble Race in Algodoo**
   - Oyundaki karsiligi: **Country Elimination modu**
   - Uygulama: Periyodik sonuncu eleme, hayatta kalma temelli yaris akisi

4. **50 COUNTRIES MARBLE RACE IN ALGODOO**
   - Oyundaki karsiligi: Buyuk katilimli ulke bazli kalabalik grid
   - Uygulama: 12-120 misket destegi, ulke isimli grid olusturma

5. **Weaponized Tank Arena - Marble Race Countries in Algodoo**
   - Oyundaki karsiligi: **Weaponized Tank Arena modu**
   - Uygulama: Turret hasari, can mekanigi, arena tabanli elenme

6. **Stage Lottery #4 - Roll to Choose - Elimination Marble Race**
   - Oyundaki karsiligi: **Stage Lottery Elimination modu**
   - Uygulama: Yarista rastgele global modifikatirler (Hyper Boost, Ice Drift, Magnet Storm)

## Oyun ozellikleri

- Canvas tabanli prosedurel parkur uretimi (seed destekli)
- Sektor etkileri: Boost, Mud, Chaos, Splitter, Jump
- 5 farkli yaris modu
- Takim renkleri + ulke isimli misketler
- Canli leaderboard, event log, metrik paneli
- Arena hasar ve checkpoint kontrol mekanikleri
- PWA + service worker ile temel offline kullanim

## Calistirma

```bash
python3 -m http.server 8080
```

Ardindan:

`http://localhost:8080`

## APK derleme

```bash
npm install
npm run build:apk
```

APK:

`android/app/build/outputs/apk/debug/app-debug.apk`
