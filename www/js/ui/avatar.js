/* ========================================================
   ui/avatar.js
   Bir kimlik (karakter id ya da "sen") için avatar HTML'i üretir.
   Öncelik: simgeUrl (fotoğraf) > simge (ikon) > harf.
   ======================================================== */

import { karakterBul } from "../core/state.js";

export function avatarIcerigi(kimlik) {
  if (kimlik === "sen") return "S";
  const karakter = karakterBul(kimlik);
  if (!karakter) return "?";
  if (karakter.simgeUrl) {
    return `<img src="${karakter.simgeUrl}" alt="${karakter.isim}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`;
  }
  if (karakter.simge) {
    return `<svg viewBox="0 0 24 24" width="60%" height="60%" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${karakter.simge}</svg>`;
  }
  return karakter.harf;
}

export function avatarRengi(kimlik) {
  if (kimlik === "sen") return "#9A9CA6";
  const karakter = karakterBul(kimlik);
  return karakter ? karakter.renk : "#9A9CA6";
}
