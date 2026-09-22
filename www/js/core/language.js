/* ========================================================
   core/language.js
   "Dil üretimi" soyutlama katmanı. Bugün arkasında Groq var,
   ama geri kalan hiçbir kod doğrudan Groq'u tanımıyor — hepsi
   language.generate(...) çağırıyor. İleride kendi Lonca AI
   modelimize geçince SADECE bu dosya değişecek.
   ======================================================== */

import { getAyar } from "./state.js";

const GROQ_ADRESI = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODELI = "openai/gpt-oss-120b";

/**
 * @param {string} sistemPrompt - Karakterin kimliği/bağlamı.
 * @param {Array<{role:string, content:string}>} mesajlar - Konuşma geçmişi.
 * @param {object} [secenekler]
 * @returns {Promise<string>} Üretilen metin.
 */
export async function generate(sistemPrompt, mesajlar, secenekler = {}) {
  const apiAnahtari = getAyar("groqAnahtari");
  if (!apiAnahtari) {
    const hata = new Error("Önce Ayarlar'dan bir Groq API anahtarı gir.");
    hata.kod = "ANAHTAR_YOK";
    throw hata;
  }

  const govde = {
    model: secenekler.model || GROQ_MODELI,
    messages: [{ role: "system", content: sistemPrompt }, ...mesajlar],
    temperature: secenekler.sicaklik ?? 0.9,
    max_completion_tokens: secenekler.maxTamamlamaTokeni || 400
  };

  let cevap;
  try {
    cevap = await fetch(GROQ_ADRESI, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiAnahtari}`
      },
      body: JSON.stringify(govde)
    });
  } catch (agHatasi) {
    throw new Error("İnternet bağlantısı yok gibi görünüyor.");
  }

  if (!cevap.ok) {
    if (cevap.status === 401) throw new Error("Groq API anahtarı geçersiz görünüyor.");
    if (cevap.status === 429) throw new Error("Çok fazla istek — biraz bekleyip tekrar dene.");
    throw new Error(`Groq isteği başarısız oldu (${cevap.status}).`);
  }

  const veri = await cevap.json();
  const metin = veri?.choices?.[0]?.message?.content?.trim();
  if (!metin) throw new Error("Groq boş bir cevap döndürdü.");
  return metin;
}

export const language = { generate };
