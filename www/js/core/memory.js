/* ========================================================
   core/memory.js
   Her karakterin kendi, bağımsız hafızası. Her mesajı sonsuza kadar
   prompta doldurmak yerine: belirli aralıklarla son konuşmadan
   "önemli" bilgiler çıkarılıp hafızaya kalıcı olarak yazılır.
   Vector database YOK (henüz gerekmiyor) — ama importance/confidence/
   createdAt/source alanları sayesinde ileride kolayca vektöre taşınabilir.
   ======================================================== */

import { karakterleriKaydet } from "./state.js";
import { generate } from "./language.js";
import { simdi } from "./storage.js";

const KATEGORI_LIMITI = 40;      // her kategori en fazla bu kadar kayıt tutar
const OZETLEME_ARALIGI = 8;      // her N kullanıcı mesajında bir hafıza çıkarımı denenir
const BAGLAMA_EKLENECEK_ADET = 6; // sistem promptuna en fazla bu kadar hafıza eklenir
const GELISIM_ARALIGI = 24;      // her N mesajda bir kişilik-gelişim çıkarımı denenir (hafızadan seyrek)
const GELISIM_NOT_LIMITI = 8;    // en fazla bu kadar gelişim notu birikir

const mesajSayaci = {}; // { "<karakterId>|<hedefId>": sayi }
const gelisimSayaci = {};

function limitleUygula(liste) {
  if (liste.length <= KATEGORI_LIMITI) return liste;
  return liste.sort((a, b) => b.importance - a.importance).slice(0, KATEGORI_LIMITI);
}

/* Basit metin benzerliği — aynı bilginin tekrar tekrar eklenmesini önler.
   Gerçek bir embedding modeli olmadan yapılabilecek en sağlam, ucuz yöntem. */
function benzerVarMi(liste, yeniMetin) {
  const kucukYeni = yeniMetin.toLocaleLowerCase("tr");
  return liste.some((k) => {
    const kucukEski = k.text.toLocaleLowerCase("tr");
    return kucukEski === kucukYeni || kucukEski.includes(kucukYeni) || kucukYeni.includes(kucukEski);
  });
}

/* Vektör veritabanı olmadan, çok ucuz bir "ilgi puanı": güncel mesajla hafıza
   kaydı arasındaki ortak kelime sayısı. "3 ay önce konuştuğumuz film işi"
   gibi bağlantıları, sadece önem sırasına göre değil, konuya göre de bulur. */
function ilgiPuani(kayitMetni, guncelMetin) {
  if (!guncelMetin) return 0;
  const DURAK_KELIMELER = new Set(["bir", "bu", "şu", "ve", "ile", "de", "da", "mi", "mı", "mu", "mü", "için", "gibi", "ne", "nasıl"]);
  const kelimelerinden = (s) => s.toLocaleLowerCase("tr").replace(/[^\wçğıöşü\s]/gi, " ").split(/\s+/).filter((k) => k.length > 2 && !DURAK_KELIMELER.has(k));
  const guncelKelimeler = new Set(kelimelerinden(guncelMetin));
  if (guncelKelimeler.size === 0) return 0;
  const kayitKelimeler = kelimelerinden(kayitMetni);
  let ortak = 0;
  kayitKelimeler.forEach((k) => { if (guncelKelimeler.has(k)) ortak++; });
  return ortak / Math.max(3, guncelKelimeler.size);
}

function hafizaKaydiOlustur(text, kategori, kaynak) {
  return { type: kategori, text, importance: 0.6, confidence: 0.7, createdAt: simdi(), source: kaynak };
}

/**
 * Sistem promptuna eklenecek kısa bir "hafıza özeti" metni üretir.
 * guncelMetin verilirse (şu an konuşulan şey), sadece en önemli değil,
 * KONUYLA İLGİLİ kayıtları da öne çıkarır — "3 ay önce konuştuğumuz
 * film işi" gibi bağlantıları bu sayede yakalar.
 */
export function baglamMetniOlustur(karakter, guncelMetin = "") {
  const m = karakter.memory;
  if (!m) return "";

  const hepsi = [
    ...m.importantMemories.map((k) => ({ ...k, etiket: "Önemli" })),
    ...m.funMoments.map((k) => ({ ...k, etiket: "Eğlenceli an" })),
    ...m.facts.map((k) => ({ ...k, etiket: "Bilgi" })),
    ...m.preferences.map((k) => ({ ...k, etiket: "Tercih" })),
    ...m.learnedKnowledge.map((k) => ({ ...k, etiket: "Öğrenilmiş" }))
  ]
    .map((k) => ({ ...k, puan: k.importance * 0.5 + ilgiPuani(k.text, guncelMetin) * 0.5 }))
    .sort((a, b) => b.puan - a.puan)
    .slice(0, BAGLAMA_EKLENECEK_ADET);

  const kisiler = Object.entries(m.people || {}).slice(0, 4)
    .map(([isim, bilgi]) => `${isim}: ${bilgi.not || bilgi}`);

  let metin = "";
  if (hepsi.length > 0) {
    metin += "\n\nHatırladıkların:\n" + hepsi.map((k) => `- (${k.etiket}) ${k.text}`).join("\n");
  }
  if (kisiler.length > 0) {
    metin += "\n\nTanıdığın kişiler:\n" + kisiler.map((s) => "- " + s).join("\n");
  }
  if (karakter.gelisimNotlari && karakter.gelisimNotlari.length > 0) {
    metin += "\n\nZamanla, deneyimlerinle biriken eğilimlerin (temel kişiliğini DEĞİŞTİRMEZ, sadece ince bir ton katar):\n" +
      karakter.gelisimNotlari.map((n) => "- " + n).join("\n");
  }
  return metin;
}

/**
 * Bir konuşma parçasından (son birkaç mesaj) önemli bilgi çıkarmayı dener.
 * Maliyeti kontrol altında tutmak için HER mesajda değil, belirli aralıklarla çağrılır
   (bkz. mesajSayaciniArttirVeKontrolEt).
 */
export async function konusmadanOgren(karakter, sonMesajlarMetni) {
  const istemMetni =
    `Aşağıda "${karakter.isim}" adlı bir karakterin katıldığı bir konuşma var. ` +
    `Bu konuşmada, karakterin ileride hatırlaması gerekebilecek somut, kısa bilgiler var mı? ` +
    `(kullanıcı hakkında bir gerçek, bir tercih, önemli bir olay, öğrenilen yeni bir bilgi, ` +
    `YA DA eğlenceli/kişisel bir an — bir lakap, tekrar eden bir iç şaka, esprili bir alışkanlık) ` +
    `Varsa en fazla 2 tanesini seç. SADECE şu formatta bir JSON dizisi döndür, başka hiçbir şey yazma: ` +
    `[{"tur":"fact|preference|event|learnedKnowledge|funMoment","metin":"kısa cümle","onem":0.0-1.0}] ` +
    `Hiçbir şey yoksa boş dizi döndür: []\n\nKonuşma:\n${sonMesajlarMetni}`;

  let cevapMetni;
  try {
    cevapMetni = await generate(
      "Sadece istenen JSON formatında cevap ver, açıklama ekleme.",
      [{ role: "user", content: istemMetni }],
      { sicaklik: 0.3, maxTamamlamaTokeni: 300 }
    );
  } catch (hata) {
    return; // Hafıza çıkarımı başarısız olursa sohbeti etkilemesin, sessizce vazgeç.
  }

  let cikartilanlar;
  try {
    const esleme = cevapMetni.match(/\[[\s\S]*\]/);
    cikartilanlar = esleme ? JSON.parse(esleme[0]) : [];
  } catch (ayristirmaHatasi) {
    return;
  }

  if (!Array.isArray(cikartilanlar) || cikartilanlar.length === 0) return;

  const m = karakter.memory;
  let degisti = false;

  cikartilanlar.forEach((oge) => {
    if (!oge.metin || typeof oge.metin !== "string") return;
    const kategori =
      oge.tur === "preference" ? "preferences" :
      oge.tur === "event" ? "events" :
      oge.tur === "learnedKnowledge" ? "learnedKnowledge" :
      oge.tur === "funMoment" ? "funMoments" : "facts";

    if (benzerVarMi(m[kategori], oge.metin)) return;

    const kayit = hafizaKaydiOlustur(oge.metin, oge.tur || "fact", "conversation");
    kayit.importance = typeof oge.onem === "number" ? Math.max(0, Math.min(1, oge.onem)) : 0.6;
    m[kategori].push(kayit);
    m[kategori] = limitleUygula(m[kategori]);
    degisti = true;
  });

  if (degisti) karakterleriKaydet();
}

/* Her (karakter, hedef) çifti için mesaj sayacı tutar; belirli aralıkta
   true döner (o anda öğrenme denemesi yapılmalı demektir). */
export function ogrenmeZamaniMi(karakterId, hedefId) {
  const anahtar = karakterId + "|" + hedefId;
  mesajSayaci[anahtar] = (mesajSayaci[anahtar] || 0) + 1;
  if (mesajSayaci[anahtar] >= OZETLEME_ARALIGI) {
    mesajSayaci[anahtar] = 0;
    return true;
  }
  return false;
}

/* Hafızadan çok daha seyrek çalışır — kişilik gelişimi hafıza gibi sık
   güncellenmemeli, yoksa karakterin tutarlılığı bozulur. */
export function gelisimZamaniMi(karakterId) {
  gelisimSayaci[karakterId] = (gelisimSayaci[karakterId] || 0) + 1;
  if (gelisimSayaci[karakterId] >= GELISIM_ARALIGI) {
    gelisimSayaci[karakterId] = 0;
    return true;
  }
  return false;
}

/* Deneyimlerden ÇOK KISA, SINIRLI bir "eğilim" notu çıkarmayı dener.
   Karakterin yazdığın çekirdek kişiliğine (uslup) ASLA dokunmaz — sadece
   ayrı, kırpılabilir bir listeye eklenir. */
export async function gelisimDenemesiYap(karakter, sonMesajlarMetni) {
  const istemMetni =
    `"${karakter.isim}" adlı karakterin son zamanlardaki konuşmalarına bakınca, onun genel DAVRANIŞ ` +
    `EĞİLİMİNDE (kişiliğinde değil, sadece küçük bir eğilimde) fark edilir bir şey var mı? ` +
    `(örn. "artık daha sık şaka yapıyor", "iş konularında daha temkinli davranıyor") ` +
    `Gerçekten belirgin bir şey yoksa boş string döndür. Varsa EN FAZLA tek, çok kısa (10 kelimeyi geçmeyen) ` +
    `bir cümle döndür. SADECE şu JSON formatında cevap ver: {"not":"..."} ya da {"not":""}\n\n` +
    `Konuşmalar:\n${sonMesajlarMetni}`;

  let cevapMetni;
  try {
    cevapMetni = await generate(
      "Sadece istenen JSON formatında cevap ver.",
      [{ role: "user", content: istemMetni }],
      { sicaklik: 0.4, maxTamamlamaTokeni: 100 }
    );
  } catch (hata) {
    return;
  }

  try {
    const esleme = cevapMetni.match(/\{[\s\S]*\}/);
    const veri = esleme ? JSON.parse(esleme[0]) : null;
    if (!veri || !veri.not || typeof veri.not !== "string") return;
    if (benzerVarMi(karakter.gelisimNotlari.map((n) => ({ text: n })), veri.not)) return;

    karakter.gelisimNotlari.push(veri.not.trim());
    if (karakter.gelisimNotlari.length > GELISIM_NOT_LIMITI) karakter.gelisimNotlari.shift();
    karakterleriKaydet();
  } catch (ayristirmaHatasi) {
    /* sessizce vazgeç */
  }
}

/* Bir kişi hakkında (kullanıcı ya da başka bir karakter) not günceller. */
export function kisiNotuGuncelle(karakter, kisiAdi, not) {
  if (!karakter.memory.people) karakter.memory.people = {};
  karakter.memory.people[kisiAdi] = { not, guncellendi: simdi() };
  karakterleriKaydet();
}

export const memory = { baglamMetniOlustur, konusmadanOgren, ogrenmeZamaniMi, gelisimZamaniMi, gelisimDenemesiYap, kisiNotuGuncelle };
