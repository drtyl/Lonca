# Lonca — Native Android (Faz 1 + Faz 2)

Bu proje Capacitor ile native Android'e sarılıyor, APK bulutta
(GitHub Actions) derleniyor — bilgisayara/Android Studio'ya gerek yok.

## Klasör yapısı

```
package.json                         ← Capacitor + native eklenti bağımlılıkları
capacitor.config.json                ← uygulama adı, paket kimliği, web klasörü
scripts/patch-android-manifest.js    ← her derlemede mikrofon/bildirim/TTS izinlerini otomatik ekler
.github/workflows/android-build.yml  ← APK'yı bulutta derleyen tarif
www/                                  ← web uygulaması
  index.html, style.css, manifest.json, sw.js, ikonlar
  js/
    data/        karakter ve ortak alan tanımları
    core/        state, language (Groq), research (Groq web arama),
                 memory, relationships, characterState, brain, selfLearning
    native/      speech.js (mikrofon+TTS), notifications.js
    ui/          ekranlar, sohbet, içerik listeleri, sihirbaz, ayarlar...
    app.js       giriş noktası
```

## Kurulum (Spck üzerinden, terminal varsa)

Reponun kökünde, bu paketin TAMAMINI (package.json, capacitor.config.json,
.gitignore, scripts/, .github/, www/) mevcut dosyaların üzerine kopyala/kaydet,
sonra:

```
git add .
git commit -m "Faz 2: modüler mimari + hafıza/araştırma + native mikrofon/ses/bildirim"
git push
```

## Sonra

GitHub → Actions sekmesi → "Android APK Derle" çalışmasını izle → bitince
Artifacts'tan `lonca-debug-apk`'yı indir → telefonunda kur (bilinmeyen
kaynaklardan yüklemeye izin vermen gerekebilir).

## Tek seferlik, senin yapman gereken adımlar

1. **OneSignal (bildirim) App ID** — https://onesignal.com üzerinden ücretsiz
   bir hesap/uygulama oluştur, App ID'yi kopyala, Lonca'nın Ayarlar
   ekranındaki "Bildirimler" kartına yapıştır. Gizli REST anahtarını hiçbir
   yere girme — sadece App ID yeterli ve güvenli (herkese açık bir kimlik).
2. Groq API anahtarın zaten varsa Ayarlar'dan tekrar kontrol et.

Detaylı özellik listesi ve bilinen sınırlamalar için Claude'un bu teslimatla
birlikte verdiği mesaja bak.
