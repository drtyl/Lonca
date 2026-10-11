# Lonca Core · Versiyon 0.2 (3D, 10 karakter)

Tepeden bakılan 7 odalı 3D bir ev, içinde birlikte yaşayan karakterler ve evi birlikte döşediğiniz iki tezgâh: **Laboratuvar** (senin) ve **Atölye** (karakterlerin).

## Ev

Salon, Mutfak, Çalışma, Kütüphane, Atölye, Sanat Odası, Film Odası. Odalar kapılarla bağlı; karakterler yol bularak odalar arasında dolaşır.

- **Tek parmakla sürükle:** evde gezin
- **İki parmakla:** yakınlaştır / uzaklaştır
- **Yere dokun:** seçili karakter oraya yürür, **iki kez dokun:** koşar
- **Bir karaktere dokun:** onu seçersin; mesajlaşma, sesli konuşma ve köşedeki avatar seçili karakterle olur
- **Başlığa dokun:** karakter listesi açılır

## Karakterler (10 yer)

| Ad | Tür | Görünüş |
|---|---|---|
| Atlas | İnsan, erkek | Kısa koyu kahve saç, ela göz, lacivert tişört |
| Nova | İnsan, kadın | Gümüş dalgalı saç, mor tutam ve mor göz, mor üst |
| Orion | Elf, erkek | Sivri kulak, gece mavisi saç, buz mavisi göz |
| Medica | İnsan, kadın | Kumral toplu saç, yeşil göz, mint sağlık forması |
| Luna | Kedi insan, kadın | Koyu mor saç, kedi kulağı ve kuyruk, amber göz |
| Carbon | Android, kadın | Kısa siyah saç, bakır göz, şakakta mekanik detay |
| Nexsus | Robot | Yuvarlak beyaz-gri gövde, ekran yüzde turkuaz gözler |
| Mira | İnsan, kadın | Bakır kızılı örgülü saç, çiller, krem üst, zeytin yeşili pantolon |
| Leon | İnsan, erkek | Dağınık kızıl saç, çiller, kiremit tişört |
| (boş) | | Atölye → Karakterler → Yeni karakter |

Her karakterin kendi ruh hali, olay kaydı, sohbet geçmişi, sesi ve (istersen) VRM modeli vardır. Atölye'den karakterleri evden çıkarıp geri alabilirsin. Kişilikler şimdilik kısa yer tutucular; Atölye'den değiştirilebilir.

## Ekranlar (görsel kurallar)

| Ne yapıyorsun | Karakter nerede |
|---|---|
| Evdesin | Tepeden ev, karakterler küçük ve odalarda kendi başlarına dolaşıyor |
| Bir sayfa kullanıyorsun | Seçili karakter köşede küçük bir yuvarlakta, ekranı kapatmıyor |
| Mesajlaşıyorsun | Seçili karakter sol sütunda boy boyu, sana bakıyor |
| Sesli konuşuyorsun | Seçili karakter daha büyük, ağzı konuşmayla oynuyor |

Sağ üstteki menü her ekranda Laboratuvar, Atölye ve Ayarlar'ı açar.

## APK nasıl alınır (bilgisayar gerekmez)

1. Bu klasörün içindekileri GitHub reposuna yükle (ör. `drtyl/Loncacore`).
2. Repo sayfasında **Actions** sekmesine gir. "APK Derle" kendiliğinden başlar (yaklaşık 5 dakika).
3. Bitince çalışmanın sayfasının altında **Lonca-v0-apk** dosyası çıkar. İndir, zip'i aç, `app-debug.apk`'yı telefona kur.

Derleme sırasında 3D kütüphaneleri (three.js ve three-vrm) otomatik indirilip uygulamanın içine gömülür; uygulama internetsiz de açılır. İnternet sadece Groq ile konuşmak için gerekir.

## Neler var

- **3D ev:** 7 oda, mobilyalar, ışıklar, gölgeler, gece/gündüz.
- **Karakterler:** yürür, koşar, selam verir, göz kırpar, nefes alır, konuşurken ağzı oynar; Luna'nın kuyruğu sallanır, Nexsus süzülür.
- **Gerçek ruh hali:** mutluluk ve enerji uydurma değil; dokunma, sohbet, koşma, dinlenme, yalnız kalma, önerisinin onaylanması gibi gerçek olaylarla değişir. Yüz ifadesi buradan gelir. Atölye'de sayılar ve sebepleri görünür.
- **Uydurmama kuralı:** karakter kendinden ve ev arkadaşlarından bahsederken sadece gerçek veriyi kullanır (gerçek konum, gerçek eşyalar, gerçek olaylar). Yapay zekâya da bu bilgiler ve "uydurma" kuralı verilir.
- **Sohbet:** selam, nasılsın, neden üzgünsün, evde ne var, evde kim var, Atlas nerede, odalar, ne yapıyorsun, saat kaç gibi şeyleri kendi bilir (internet gerekmez). Ayarlar'a Groq anahtarı girilirse her konuda konuşur.
- **Sesli görüşme:** telefon görüşmesi gibi; Nova konuşur, sonra seni dinler, sırayla devam eder. Sessize al ve bitir düğmeleri var. Android'in kendi ses motorları kullanılır.
- **Laboratuvar:** her türden dosya ve klasör, metin düzenleme, içe aktarma, önizleme, "Eve yerleştir".
- **Atölye:** Nova'dan bir sayfa/araç iste ("su takip sayfası yap" de ya da Atölye'den yaz). Öneri olarak bekler; sen onaylamadan eve girmez. Onaylanınca evde eşya olur.
- **Sayfalar kum havuzunda:** eve konan sayfalar uygulamanın geri kalanına dokunamaz. Şu araçları kullanabilirler: `Lonca.kaydet(anahtar, deger)`, `await Lonca.oku(anahtar)`, `Lonca.soyle("metin")`.
- **Yedek görünüm:** telefon 3D'yi başlatamazsa uygulama çökmez, basit 2D görünüme geçer.

## Bir karakterin gerçek 3D modelini koymak

Her karakter tarifine göre çizilmiş hazır bir bedenle gelir. Daha detaylı bir model için:

1. **VRoid Studio** (bilgisayar) ya da **VRoid Mobile** ile karakteri tasarla.
2. Modeli **.vrm** olarak dışa aktar.
3. Uygulamada karakteri seç, **Atölye → 3D beden → VRM yükle**.

Göz kırpma, ifadeler (mutlu/üzgün/yorgun/şaşkın), ağız hareketi, sana bakma ve yürüme otomatik olarak yeni bedene uygulanır.

## Dosya yapısı

```
app/src/main/java/.../MainActivity.kt   Android kabuğu: WebView, dosya köprüsü, internet, ses
app/src/main/assets/www/                Uygulamanın kendisi
  js/depo.js      dosya sistemi (telefonda gerçek dosyalar)
  js/ev.js        odalar, duvar/kapılar, mobilyalar, eşyalar, yol bulma
  js/karakterler.js  10 kişilik kadro: görünüş, tür, kişilik, ses
  js/yasam.js     her karakterin hayatı ve gerçek ruh hali
  js/sahne3d.js   3D ev, bedenler (chibi, robot, VRM), kamera modları
  js/sahne2d.js   3D çalışmazsa yedek görünüm
  js/zihin.js     cevap verme (kurallar + Groq), Atölye üretimi
  js/ses.js       konuşma ve dinleme
  js/panel.js     Laboratuvar, Atölye, Ayarlar
  js/app.js       modlar ve her şeyi bağlayan kısım
web-src/vendor.js  3D kütüphanelerinin paketlenme noktası
.github/workflows/build.yml  bulutta APK derleme
```

Telefonda tüm veriler uygulamanın kendi klasöründe durur: `/ev`, `/karakterler`, `/atolye`, `/lab`, `/ayarlar.json`.

## Bilinen sınırlar (v0)

- 3D çizim ve Android ses motorları geliştirme ortamında gerçek cihazda test edilemedi; arayüz, sohbet, Laboratuvar, Atölye ve yedek görünüm tarayıcıda test edildi. İlk derlemede bir sorun çıkarsa Actions kaydını paylaş.
- Mobilya taşıma, oda ekleme ve her karakterin özel odası sonraki versiyonda.
- Karakterler henüz kendi aralarında konuşmuyor; sadece seninle konuşuyorlar.
- Arka planda (uygulama kapalıyken) karakter yaşamaz, bildirim yoktur.
- Konuşma tanıma için telefonda Google'ın ses servisi gerekir.

## Sonraki versiyonlar için bekleyen istekler

- Mobilya taşıma, oda ekleme, dekor
- Karakterlerin kendi aralarında konuşması ve özel odaları
- Arka planda çalışma ve bildirimler
- Karakterin kendi kendine iş üretmesi ve görev takibi
- Dopamin/ilgi sistemi, kısa ve uzun süreli hafıza
- Groq bağımlılığını azaltan yerel küçük zihin
