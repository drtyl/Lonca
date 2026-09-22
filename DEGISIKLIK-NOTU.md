# Lonca — Birleştirme Notu (sürüm 0.9)

8 zip'i açıp inceledim. Özet: **elindeki gerçek uygulama, benim bildiğimden çok daha
olgunmuş.** `core/brain.js`, `core/memory.js`, `core/characterState.js`,
`core/relationships.js`, `core/language.js`, `core/research.js`, `core/selfLearning.js`
ve yeni `core/gelistirmeAjani.js` (GitHub PR ile kendi kodunu geliştirme ajanı) —
bunların hiçbirini daha önce görmemiştim. Bu değişti benim planımı.

## Bu paket neyin üzerine kuruldu

- **Temel (`www/`)**: `lonca-gelistirme-hatti` — 4 faz içindeki en yeni sürüm
  (faz2 → faz3 → faz3b → gelistirme-hatti zincirini diff'leyerek doğruladım).
- **Native iskelet** (`capacitor.config.json`, `package.json`, `scripts/`,
  `.gitignore`): `faz2`'den — sonraki fazlar sadece `www/` içeriği güncellemiş,
  bu dosyalara dokunmamışlar.
- **İmza/workflow düzeltmesi**: `lonca-imzalama-sabitleme` — sabit
  `debug.keystore` + onu her build'de yükleyen workflow adımı. Bu, konuştuğumuz
  "her build'de imza değişip güncelleme kurulamıyor" sorununu zaten çözmüş.

## Attığım şeyler (ve neden)

**Eski `ai-core` + `loncaBrain` entegrasyonunu (benim `lonca_ai_js.zip` ve
`lonca_ai_entegrasyon.zip`'te yaptığım iş) pakete DAHİL ETMEDİM.**

Sebebi: `core/memory.js`, `core/characterState.js`, `core/relationships.js`
zaten karakter-başına hafıza/iç durum/ilişki tutuyor — benim ayrı kurduğum
`episodicMemory` bunun kötü bir kopyasıydı. `core/language.js` zaten Groq'a
TEK giriş noktası (senin "tek kapı" istediğin şey buymuş, ben bilmeden ikinci
bir kapı açmışım). Bunu geri eklemek, tam senin şikayet ettiğin "iki ayrı
beyin, iki ayrı hafıza" sorununu YENİDEN yaratmak olurdu. Attım.

**`lonca_v2_temel`'i (event bus, characterBrain, confidence engine) de
DAHİL ETMEDİM** — aynı sebep: `core/*.js` zaten bu işlerin çoğunu (hafıza,
ilişki, iç durum, tek Groq kapısı) gerçek, test edilmiş şekilde yapıyor.
Üstüne bir tane daha "bağımsız zihin" mimarisi bindirmek, çalışan şeyi
karmaşıklaştırmaktan başka bir şey yapmazdı. `app/capabilities` (Android
yetenek registry'si) fikri hâlâ geçerli ve gerçekten eksik — ama onu ayrı,
küçük bir adımda, gerçekten bir yeteneğe (ör. YouTube açma) bağlayarak
eklemek daha doğru olur; şimdi boş bir iskelet daha eklemek istemedim.

## Yaptığım gerçek düzeltmeler (`www/js/ui/chat.js`, `www/js/core/brain.js`)

**1) Ortak alanda "kim cevap versin" artık zar atmıyor.**
`cevaplayaniSec()` isim geçmiyorsa `Math.random()` ile seçiyordu. Şimdi
`ui/proaktif.js`'in ZATEN kullandığı mantığı (sosyal ihtiyaç + kullanıcıyla
yakınlık + merak − stres) buraya da uyguladım — her karakterin o an
konuşmaya ne kadar "istekli" olduğunu puanlıyor, en istekli cevap veriyor.
Ufak bir rastgele gürültü sadece tam eşitlikte kararsızlığı kırıyor, kararı
sürüklemiyor.

**2) Zincirleme artık zar atmıyor.**
Bir karakter başka birine seslendiğinde, eskiden %65 sabit ihtimalle o
karakter katılırdı. Şimdi adreslenen karakterin KENDİ isteklilik puanı bir
eşiği geçiyorsa katılıyor — yani "neden katıldı/katılmadı" sorusunun artık
gerçek bir cevabı var.

**3) Var olmayan kişi uydurma kuralı güçlendirildi.**
`temelSistemPromptu()` zaten gerçek karakter listesini veriyordu ama
"listede olmayan biri yokmuş gibi davranma" diye AÇIK bir yasak yoktu —
model buna rağmen "Luna" diye biri uydurdu. Şimdi net: "BU LİSTE dışında
kimse yok, adı geçmeyen biriyle ilgili soru gelirse 'öyle biri yok' de."
Bu bir garanti değil (LLM'ler yine de hata yapabilir) ama şansı belirgin
azaltır.

## Hâlâ açık olan, uydurmadığım şeyler

- **Gün-bazlı (3/5 gün) kısa/uzun hafıza** henüz yok — `core/memory.js`
  mesaj-sayısı bazlı çalışıyor (her 8 mesajda bir çıkarım). Bu, konuştuğumuz
  spesifik 3-5 gün kuralından farklı bir tasarım; çalışıyor ama istersen
  gün-bazlıya çevirmek ayrı bir iş.
- **Android capability registry** (YouTube aç, takvime ekle, vb.) hâlâ yok.
- **Kişi uydurma düzeltmesi test edilmedi** — gerçek bir Groq çağrısı
  gerektiriyor, ben burada çalıştıramadım. İlk fırsatta "Luna kim?" gibi bir
  soruyla tekrar dener misin, gerçekten düzeldi mi görmek için.

## Doğruladığım şeyler

- `www/js` altındaki HER dosya `node --check` ile sözdizimi olarak geçerli.
- `index.html`/`app.js`'te eski `loncaBrain` bağlantısından hiçbir iz yok
  (temiz, tek beyin).
- Sürüm etiketi 0.9'a çekildi.
