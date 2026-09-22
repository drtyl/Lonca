/* ========================================================
   core/selfLearning.js
   Karakterlerin kendi kaynak kodunu değiştirmesi DEĞİL — deneyimlerden
   çıkarılabilecek küçük "ders" kayıtları tutar (context/decision/
   response/feedback/lesson). İleride kendi Lonca AI modelimizi
   eğitirken kullanılabilecek formatta. Sınırsız büyümez.
   ======================================================== */

import { ANAHTARLAR, depoyaYaz, depodanOku, simdi } from "./storage.js";
import { generate } from "./language.js";

const GUNLUK_LIMITI = 150;

function gunlugu() {
  return depodanOku(ANAHTARLAR.OGRENME_GUNLUGU) || [];
}

export function kaydet(kayit) {
  const gunluk = gunlugu();
  gunluk.push({
    context: kayit.context || "",
    decision: kayit.decision || "",
    response: kayit.response || "",
    feedback: kayit.feedback || null,
    lesson: kayit.lesson || null,
    score: typeof kayit.score === "number" ? kayit.score : null,
    tarih: simdi()
  });
  const kirpilmis = gunluk.length > GUNLUK_LIMITI ? gunluk.slice(gunluk.length - GUNLUK_LIMITI) : gunluk;
  depoyaYaz(ANAHTARLAR.OGRENME_GUNLUGU, kirpilmis);
}

export function tumKayitlar() {
  return gunlugu();
}

/* Belirli aralıklarla (dışarıdan tetiklenir) son birkaç kayıttan
   Groq'a "ders çıkar" dedirtip lesson alanını doldurur — öğretmen rolü. */
export async function sonKayitlardanDersCikar(adet = 5) {
  const gunluk = gunlugu();
  const dersiOlmayanlar = gunluk.filter((k) => !k.lesson).slice(-adet);
  if (dersiOlmayanlar.length === 0) return;

  const ozet = dersiOlmayanlar.map((k, i) => `${i + 1}. Bağlam: ${k.context}\nCevap: ${k.response}`).join("\n\n");
  let cevapMetni;
  try {
    cevapMetni = await generate(
      "Bir yapay zeka asistanının geçmiş cevaplarından kısa dersler çıkarıyorsun. Her biri için tek cümlelik bir ders yaz.",
      [{ role: "user", content: `Aşağıdaki olaylardan kısa dersler çıkar, JSON dizisi olarak döndür: [{"index":1,"ders":"..."}]\n\n${ozet}` }],
      { sicaklik: 0.4, maxTamamlamaTokeni: 400 }
    );
  } catch (hata) {
    return;
  }

  try {
    const esleme = cevapMetni.match(/\[[\s\S]*\]/);
    const dersler = esleme ? JSON.parse(esleme[0]) : [];
    dersler.forEach((d) => {
      const kayit = dersiOlmayanlar[d.index - 1];
      if (kayit) kayit.lesson = d.ders;
    });
    depoyaYaz(ANAHTARLAR.OGRENME_GUNLUGU, gunluk);
  } catch (ayristirmaHatasi) {
    /* sessizce vazgeç */
  }
}

export const selfLearning = { kaydet, tumKayitlar, sonKayitlardanDersCikar };
