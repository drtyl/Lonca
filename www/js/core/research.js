/* ========================================================
   core/research.js
   "Araştırma" soyutlama katmanı — karakterler bir şeyi bilmediğinde
   burayı çağırır. Bugün arkasında Groq'un "groq/compound" sistemi var
   (gerçek zamanlı internet araması, ekstra API anahtarı GEREKTİRMİYOR —
   aynı Groq anahtarını kullanıyor). İleride başka bir arama sağlayıcısına
   geçilirse SADECE bu dosya değişecek.
   ======================================================== */

import { getAyar } from "./state.js";
import { ANAHTARLAR, depoyaYaz, depodanOku, simdi } from "./storage.js";

const GROQ_ADRESI = "https://api.groq.com/openai/v1/chat/completions";
const ARASTIRMA_MODELI = "groq/compound";
const ONBELLEK_SURESI_SAAT = 6;

function onbellegiOku() {
  return depodanOku(ANAHTARLAR.ARASTIRMA_ONBELLEGI) || {};
}
function onbellegeYaz(onbellek) {
  depoyaYaz(ANAHTARLAR.ARASTIRMA_ONBELLEGI, onbellek);
}

/**
 * @param {string} soru - Araştırılacak, doğal dilde bir soru/konu.
 * @returns {Promise<{summary:string, sources:string[], confidence:number, fromCache:boolean}>}
 */
export async function ask(soru) {
  const anahtarKelime = soru.trim().toLocaleLowerCase("tr");
  const onbellek = onbellegiOku();
  const onbellekKaydi = onbellek[anahtarKelime];
  if (onbellekKaydi && (Date.now() - onbellekKaydi.zaman) < ONBELLEK_SURESI_SAAT * 3600 * 1000) {
    return { summary: onbellekKaydi.summary, sources: onbellekKaydi.sources, confidence: onbellekKaydi.confidence, fromCache: true };
  }

  const apiAnahtari = getAyar("groqAnahtari");
  if (!apiAnahtari) {
    const hata = new Error("Araştırma için Groq API anahtarı gerekiyor.");
    hata.kod = "ANAHTAR_YOK";
    throw hata;
  }

  let cevap;
  try {
    cevap = await fetch(GROQ_ADRESI, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiAnahtari}` },
      body: JSON.stringify({
        model: ARASTIRMA_MODELI,
        messages: [
          { role: "system", content: "Kısa, doğru ve güncel bilgi ver. Türkçe cevap ver. 3-4 cümleyi geçme." },
          { role: "user", content: soru }
        ]
      })
    });
  } catch (agHatasi) {
    throw new Error("Araştırma için internet bağlantısı gerekiyor.");
  }

  if (!cevap.ok) {
    throw new Error(`Araştırma isteği başarısız oldu (${cevap.status}).`);
  }

  const veri = await cevap.json();
  const mesaj = veri?.choices?.[0]?.message;
  const summary = mesaj?.content?.trim() || "Bu konuda bir şey bulamadım.";
  const kaynaklar = (mesaj?.executed_tools?.[0]?.search_results?.results || [])
    .map((r) => r.url)
    .filter(Boolean)
    .slice(0, 5);

  const sonuc = { summary, sources: kaynaklar, confidence: kaynaklar.length > 0 ? 0.75 : 0.5 };

  onbellek[anahtarKelime] = { ...sonuc, zaman: Date.now(), tarih: simdi() };
  /* Önbellek sınırsız büyümesin — en fazla son 60 soruyu tut. */
  const anahtarlar = Object.keys(onbellek);
  if (anahtarlar.length > 60) {
    anahtarlar
      .sort((a, b) => onbellek[a].zaman - onbellek[b].zaman)
      .slice(0, anahtarlar.length - 60)
      .forEach((k) => delete onbellek[k]);
  }
  onbellegeYaz(onbellek);

  return { ...sonuc, fromCache: false };
}

export const research = { ask };
