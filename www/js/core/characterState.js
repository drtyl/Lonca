/* ========================================================
   core/characterState.js
   Karakterlerin kişilik promptunun ÖTESİNDE, zamanla küçük miktarlarda
   değişen bir "iç durumu" var: mood, energy, curiosity, socialNeed,
   focus, stress. Bunlar sistem promptuna kısa bir ton yönlendirmesi
   olarak eklenir — dramatik davranış değişikliği YARATMAZ, sadece
   ince bir ton farkı verir.
   ======================================================== */

import { karakterleriKaydet } from "./state.js";

const ALANLAR = ["mood", "energy", "curiosity", "socialNeed", "focus", "stress"];

function sinirla(deger) {
  return Math.max(0, Math.min(1, Number(deger.toFixed(3))));
}

/* Bir etkileşim sonrası iç durumu hafifçe günceller.
   delta: { mood: +0.02, stress: -0.01, ... } gibi kısmi bir obje. */
export function guncelle(karakter, delta) {
  ALANLAR.forEach((alan) => {
    if (typeof delta[alan] === "number") {
      karakter.state[alan] = sinirla(karakter.state[alan] + delta[alan]);
    }
  });
  karakterleriKaydet();
}

/* Sohbet etmek genelde sosyal ihtiyacı azaltır, hafifçe enerjiyi/ruh halini
   olumlu etkiler — küçük, öngörülebilir bir varsayılan güncelleme. */
export function sohbetSonrasiVarsayilanGuncelleme(karakter) {
  guncelle(karakter, { socialNeed: -0.03, mood: 0.01, energy: -0.01 });
}

/* Sistem promptuna eklenecek kısa bir "şu an nasıl hissediyor" ton notu. */
export function baglamMetniOlustur(karakter) {
  const s = karakter.state;
  if (!s) return "";
  const notlar = [];
  if (s.energy < 0.35) notlar.push("biraz yorgun");
  if (s.mood > 0.75) notlar.push("keyfi yerinde");
  if (s.mood < 0.35) notlar.push("biraz durgun");
  if (s.curiosity > 0.75) notlar.push("meraklı bir modda");
  if (s.stress > 0.65) notlar.push("biraz gergin");
  if (s.socialNeed > 0.7) notlar.push("sohbet etmeye can atıyor");
  if (notlar.length === 0) return "";
  return `\n\nŞu anki ruh halin: ${notlar.join(", ")}. Bunu abartma, sadece tonuna hafifçe yansıt.`;
}

export const characterState = { guncelle, sohbetSonrasiVarsayilanGuncelleme, baglamMetniOlustur };
