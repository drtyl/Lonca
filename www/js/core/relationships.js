/* ========================================================
   core/relationships.js
   Her karakter, diğer ev arkadaşları ve kullanıcı için ayrı bir
   ilişki verisi tutar (familiarity/trust/affinity). Değerler küçük,
   öngörülebilir adımlarla değişir — dramatik ya da rastgele sıçrama yok.
   ======================================================== */

import { karakterleriKaydet } from "./state.js";
import { simdi } from "./storage.js";

function ilerlemAdimi(mevcutDeger, adim) {
  // Değer 1'e yaklaştıkça artış küçülür (doğal bir doygunluk eğrisi).
  const yeni = mevcutDeger + adim * (1 - mevcutDeger);
  return Math.max(0, Math.min(1, Number(yeni.toFixed(3))));
}

function iliskiKaydiGaranti(karakter, kisiId) {
  if (!karakter.relationships[kisiId]) {
    karakter.relationships[kisiId] = { familiarity: 0.3, trust: 0.4, affinity: 0.4, notes: [] };
  }
  return karakter.relationships[kisiId];
}

/* Bir sohbet/etkileşim sonrası ilişkiyi hafifçe günceller. "sen" kullanıcıyı temsil eder. */
export function etkilesimSonrasiGuncelle(karakter, kisiId) {
  const iliski = iliskiKaydiGaranti(karakter, kisiId);
  iliski.familiarity = ilerlemAdimi(iliski.familiarity, 0.02);
  iliski.trust = ilerlemAdimi(iliski.trust, 0.008);
  iliski.affinity = ilerlemAdimi(iliski.affinity, 0.01);
  karakterleriKaydet();
  return iliski;
}

export function notEkle(karakter, kisiId, not) {
  const iliski = iliskiKaydiGaranti(karakter, kisiId);
  iliski.notes.push({ not, tarih: simdi() });
  if (iliski.notes.length > 15) iliski.notes = iliski.notes.slice(-15);
  karakterleriKaydet();
}

export function iliskiGetir(karakter, kisiId) {
  return karakter.relationships[kisiId] || null;
}

/* Sistem promptuna eklenecek kısa bir ilişki özeti — sadece kullanıcıyla
   olan ilişki (en sık lazım olan) ve varsa dikkate değer notlar. */
export function baglamMetniOlustur(karakter) {
  const kullaniciIliskisi = karakter.relationships["sen"];
  if (!kullaniciIliskisi) return "";
  const yakinlik = kullaniciIliskisi.familiarity > 0.6 ? "yakın" : kullaniciIliskisi.familiarity > 0.3 ? "orta düzeyde tanıdık" : "yeni tanışıyor";
  return `\n\nKullanıcıyla aranızdaki tanışıklık: ${yakinlik}.`;
}

export const relationships = { etkilesimSonrasiGuncelle, notEkle, iliskiGetir, baglamMetniOlustur };
