/* ========================================================
   core/state.js
   Uygulamanın TEK merkezi durumu burada tutulur: karakterler,
   mesajlar, görevler, oda içerikleri, ayarlar. Diğer tüm modüller
   veriye doğrudan localStorage'dan değil, buradan erişir — böylece
   veri şekli değişirse tek yer güncellenir.
   ======================================================== */

import { ANAHTARLAR, depoyaYaz, depodanOku, derinKopya, saatOlustur, simdi, semaGocunuCalistir } from "./storage.js";
import { ORNEK_KARAKTERLER } from "../data/karakterler.js";
import { ORTAK_ALANLAR } from "../data/ortakalanlar.js";

export const KARAKTER_LIMITI = 10;

/* ---------- KARAKTER ŞEMASI ---------- */
/* Eski kaydedilmiş karakterlerde (v1 şema) bu alanlar yoktu. Her
   karakteri okurken eksik alanları makul varsayılanlarla tamamlıyoruz
   — bu sayede kullanıcı yeni sürüme geçince hiçbir veri kaybetmiyor. */
function karakterSemayaGoreTamamla(karakter) {
  if (!karakter.state) {
    karakter.state = { mood: 0.6, energy: 0.7, curiosity: 0.7, socialNeed: 0.5, focus: 0.6, stress: 0.2 };
  }
  if (!karakter.relationships) karakter.relationships = {};
  if (!karakter.memory) {
    karakter.memory = { facts: [], events: [], people: {}, learnedKnowledge: [], preferences: [], importantMemories: [], funMoments: [] };
  }
  if (!karakter.memory.funMoments) karakter.memory.funMoments = []; // v3 şemasına eklendi — lakaplar, iç şakalar, eğlenceli anlar
  if (!karakter.voice) {
    karakter.voice = sesVarsayilaniUret(karakter.id);
  }
  if (!karakter.goals) karakter.goals = [];
  /* Geri bildirim/eleştiri tarzı — sohbet tonundan AYRI bir eksen. Bir karakter
     günlük sohbette şakacı olsa bile seni uyarırken sert olabilir. */
  if (!karakter.geriBildirimTarzi) karakter.geriBildirimTarzi = "dengeli"; // "sert" | "dengeli" | "yumusak"
  if (!karakter.degerler) karakter.degerler = []; // örn. ["disiplin","dürüstlük"]
  /* Zamanla deneyimlerden biriken, SINIRLI ve ayrı bir katman — asla karakterin
     yazdığın çekirdek kişiliğinin (uslup) üzerine yazılmaz, sadece yanına eklenir. */
  if (!karakter.gelisimNotlari) karakter.gelisimNotlari = [];
  if (!karakter._semaSurumu) karakter._semaSurumu = 4;
  return karakter;
}

/* Her karaktere, id'sinden türeyen (deterministik) ama birbirinden farklı
   bir ses profili verir — cihazda sınırlı sayıda TTS sesi olsa bile
   perde/hız farkıyla ayırt edilebilir olsunlar. */
function sesVarsayilaniUret(karakterId) {
  let toplam = 0;
  for (let i = 0; i < karakterId.length; i++) toplam += karakterId.charCodeAt(i);
  return {
    voiceIndex: toplam % 6,
    pitch: 0.85 + (toplam % 5) * 0.08,   // ~0.85 - 1.17
    rate: 0.92 + (toplam % 4) * 0.06     // ~0.92 - 1.10
  };
}

/* ---------- KARAKTERLER ---------- */

let KARAKTERLER = (depodanOku(ANAHTARLAR.KARAKTERLER) || derinKopya(ORNEK_KARAKTERLER)).map(karakterSemayaGoreTamamla);
if (!depodanOku(ANAHTARLAR.KARAKTERLER)) depoyaYaz(ANAHTARLAR.KARAKTERLER, KARAKTERLER);

export function tumKarakterler() {
  return KARAKTERLER;
}

export function karakterBul(karakterId) {
  return KARAKTERLER.find((k) => k.id === karakterId) || null;
}

export function karakterleriKaydet() {
  depoyaYaz(ANAHTARLAR.KARAKTERLER, KARAKTERLER);
}

export function karakterEkle(karakter) {
  karakterSemayaGoreTamamla(karakter);
  KARAKTERLER.push(karakter);
  if (!mesajGecmisi[karakter.id]) mesajGecmisi[karakter.id] = [];
  karakterleriKaydet();
  mesajlariKaydet();
  return karakter;
}

export function karakterSil(karakterId) {
  KARAKTERLER = KARAKTERLER.filter((k) => k.id !== karakterId);
  delete mesajGecmisi[karakterId];
  karakterleriKaydet();
  mesajlariKaydet();
}

/* ---------- MESAJ GEÇMİŞİ ---------- */
/* { atlas: [...], salon: [...], "ic8f2a...": [...] } — karakter id'si,
   ortak alan id'si ya da içerik-öğesi id'si, hepsi bu tek objede. */

let mesajGecmisi = depodanOku(ANAHTARLAR.MESAJLAR) || {};
if (Object.keys(mesajGecmisi).length === 0) {
  mesajGecmisi.salon = [
    { kimden: "luna", tur: "metin", icerik: "Bu akşam hep birlikte bir şeyler konuşalım mı?", saat: saatOlustur() },
    { kimden: "atlas", tur: "metin", icerik: "Kütüphanede ilginç bir kaynak buldum.", saat: saatOlustur() }
  ];
}
KARAKTERLER.forEach((k) => { if (!mesajGecmisi[k.id]) mesajGecmisi[k.id] = []; });
ORTAK_ALANLAR.forEach((o) => { if (!mesajGecmisi[o.id]) mesajGecmisi[o.id] = []; });

export function mesajlariGetir(hedefId) {
  return mesajGecmisi[hedefId] || [];
}

export function mesajEkle(hedefId, mesaj) {
  if (!mesajGecmisi[hedefId]) mesajGecmisi[hedefId] = [];
  mesajGecmisi[hedefId].push(mesaj);
  mesajlariKaydet();
}

export function mesajGecmisiniSil(hedefId) {
  delete mesajGecmisi[hedefId];
  mesajlariKaydet();
}

export function mesajlariKaydet() {
  depoyaYaz(ANAHTARLAR.MESAJLAR, mesajGecmisi);
}

/* ---------- GÖREVLER ---------- */
/* Eski kayıtlarda sadece {id, metin, tamam} vardı — eksik alanları
   tamamlıyoruz ki hiçbir görev kaybolmasın. */
function gorevSemayaGoreTamamla(gorev) {
  if (!gorev.durum) gorev.durum = gorev.tamam ? "tamamlandi" : "bekliyor";
  if (typeof gorev.tamam !== "boolean") gorev.tamam = gorev.durum === "tamamlandi";
  if (gorev.atanan === undefined) gorev.atanan = null;
  if (gorev.tekrar === undefined) gorev.tekrar = null; // null | "gunluk" | "haftalik"
  if (gorev.hedefTarih === undefined) gorev.hedefTarih = null;
  if (gorev.sonuc === undefined) gorev.sonuc = null; // karakterin ürettiği çıktı
  if (!gorev.guncellendi) gorev.guncellendi = simdi();
  return gorev;
}

let gorevler = (depodanOku(ANAHTARLAR.GOREVLER) || []).map(gorevSemayaGoreTamamla);
export function tumGorevler() { return gorevler; }
export function gorevleriKaydet() { depoyaYaz(ANAHTARLAR.GOREVLER, gorevler); }
export function gorevleriAyarla(yeniListe) { gorevler = yeniListe; gorevleriKaydet(); }
export function gorevBul(id) { return gorevler.find((g) => g.id === id) || null; }

export function gorevOlustur(veri) {
  const gorev = gorevSemayaGoreTamamla({
    id: "g" + Date.now().toString(36) + Math.random().toString(36).slice(2, 4),
    metin: veri.metin,
    atanan: veri.atanan || null,
    tekrar: veri.tekrar || null,
    hedefTarih: veri.hedefTarih || null
  });
  gorevler.push(gorev);
  gorevleriKaydet();
  return gorev;
}

export function gorevGuncelle(id, degisiklikler) {
  const gorev = gorevBul(id);
  if (!gorev) return null;
  Object.assign(gorev, degisiklikler, { guncellendi: simdi() });
  if (degisiklikler.durum) gorev.tamam = degisiklikler.durum === "tamamlandi";
  gorevleriKaydet();
  return gorev;
}

/* ---------- ODA İÇERİKLERİ ---------- */

let icerikListesi = depodanOku(ANAHTARLAR.ICERIKLER) || {};
ORTAK_ALANLAR.forEach((o) => { if (!icerikListesi[o.id]) icerikListesi[o.id] = []; });

export function icerikleriGetir(alanId) { return icerikListesi[alanId] || []; }
export function icerikleriKaydet() { depoyaYaz(ANAHTARLAR.ICERIKLER, icerikListesi); }

export function icerikOgeEkle(alanId, veri) {
  const id = "ic" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const oge = {
    id,
    baslik: veri.baslik,
    tur: veri.tur || "",
    durum: veri.durum || "",
    ekstra: veri.ekstra || "",
    not: veri.not || "",
    olusturan: veri.olusturan || "sen",
    tarih: saatOlustur()
  };
  icerikListesi[alanId].push(oge);
  icerikleriKaydet();
  if (!mesajGecmisi[id]) mesajGecmisi[id] = [];
  mesajlariKaydet();
  return oge;
}

export function icerikOgesiBul(itemId) {
  for (const alanId in icerikListesi) {
    const bulunan = icerikListesi[alanId].find((o) => o.id === itemId);
    if (bulunan) return { item: bulunan, alanId };
  }
  return null;
}

export function icerikOgeSil(itemId) {
  const bulunan = icerikOgesiBul(itemId);
  if (!bulunan) return null;
  icerikListesi[bulunan.alanId] = icerikListesi[bulunan.alanId].filter((o) => o.id !== itemId);
  delete mesajGecmisi[itemId];
  icerikleriKaydet();
  mesajlariKaydet();
  return bulunan;
}

/* ---------- GELİŞTİRME ÖNERİLERİ ---------- */
/* "Geliştirme İste" ekranından gelen istekler — GitHub'da açılan PR ile
   eşleşen, uygulama içinde gösterilen kayıtlar. */

let gelistirmeOnerileri = depodanOku(ANAHTARLAR.GELISTIRME_ONERILERI) || [];
export function tumGelistirmeOnerileri() { return gelistirmeOnerileri; }
export function gelistirmeOnerileriniKaydet() { depoyaYaz(ANAHTARLAR.GELISTIRME_ONERILERI, gelistirmeOnerileri); }
export function gelistirmeOnerisiBul(id) { return gelistirmeOnerileri.find((o) => o.id === id) || null; }

export function gelistirmeOnerisiEkle(veri) {
  const oneri = {
    id: "go" + Date.now().toString(36) + Math.random().toString(36).slice(2, 4),
    istek: veri.istek,
    prNo: veri.prNo || null,
    prUrl: veri.prUrl || null,
    dosyalar: veri.dosyalar || [],
    aciklama: veri.aciklama || "",
    durum: veri.durum || "bekliyor", // bekliyor | uygulandi | reddedildi | basarisiz
    hata: veri.hata || null,
    tarih: simdi()
  };
  gelistirmeOnerileri.unshift(oneri);
  gelistirmeOnerileriniKaydet();
  return oneri;
}

export function gelistirmeOnerisiGuncelle(id, degisiklikler) {
  const oneri = gelistirmeOnerisiBul(id);
  if (!oneri) return null;
  Object.assign(oneri, degisiklikler);
  gelistirmeOnerileriniKaydet();
  return oneri;
}

/* ---------- AYARLAR ---------- */
/* Groq/GitHub anahtarları, OneSignal App ID, kulaklık modu vb. hepsi burada.
   Hiçbiri kaynak koduna gömülü değil — hepsi kullanıcı tarafından girilip
   sadece bu cihazın localStorage'ında saklanıyor. */

const AYAR_VARSAYILANLARI = {
  groqAnahtari: "",
  githubAnahtari: "",
  githubRepo: "",
  oneSignalAppId: "",
  kulaklikModu: false,
  sesliOkumaAcik: true
};

let ayarlar = Object.assign({}, AYAR_VARSAYILANLARI, depodanOku(ANAHTARLAR.AYARLAR) || {});
/* Geriye dönük uyum: eski sürümde Groq anahtarı ayrı bir anahtarda duruyordu. */
if (!ayarlar.groqAnahtari) {
  const eskiGroqAnahtari = depodanOku(ANAHTARLAR.GROQ_ANAHTARI);
  if (eskiGroqAnahtari) ayarlar.groqAnahtari = eskiGroqAnahtari;
}

export function getAyar(anahtar) { return ayarlar[anahtar]; }
export function tumAyarlar() { return ayarlar; }
export function setAyar(anahtar, deger) {
  ayarlar[anahtar] = deger;
  depoyaYaz(ANAHTARLAR.AYARLAR, ayarlar);
}

/* ---------- BAŞLANGIÇ ---------- */

semaGocunuCalistir();

export { ORTAK_ALANLAR };
