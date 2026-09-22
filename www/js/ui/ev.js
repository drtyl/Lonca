/* ========================================================
   ui/ev.js
   Ev ekranı: karakter listesi + sabit Ortak Alanlar ızgarası.
   ======================================================== */

import { tumKarakterler, KARAKTER_LIMITI, karakterSil as stateKarakterSil, ORTAK_ALANLAR } from "../core/state.js";
import { avatarIcerigi } from "./avatar.js";
import { bildirimGoster, ekranAc } from "./screens.js";
import { odayiAc, ortakAlaniAc } from "./chat.js";
import { karakterOlusturmaSihirbaziniAc } from "./wizard.js";

const odaListesi = document.getElementById("oda-listesi");
const ortakAlanIzgara = document.getElementById("ortak-alan-izgara");

export function odaListesiniOlustur() {
  odaListesi.innerHTML = "";

  tumKarakterler().forEach((karakter) => {
    const satir = document.createElement("a");
    satir.href = "#";
    satir.className = "oda-satiri";
    satir.setAttribute("aria-label", karakter.isim + "'nin odasına git");

    satir.innerHTML = `
      <span class="oda-avatar" style="background:${karakter.renk}1F;color:${karakter.renk};box-shadow:0 0 12px ${karakter.renk}66;overflow:hidden;">${avatarIcerigi(karakter.id)}</span>
      <span class="oda-bilgi">
        <strong>${karakter.isim}</strong>
        <small>${karakter.durum}</small>
      </span>
      <span class="oda-durum-noktasi" style="background:${karakter.renk};box-shadow:0 0 6px ${karakter.renk};"></span>
    `;

    satir.addEventListener("click", (event) => {
      event.preventDefault();
      odayiAc(karakter.id);
    });

    odaListesi.appendChild(satir);
  });

  if (tumKarakterler().length < KARAKTER_LIMITI) {
    const ekleSatiri = document.createElement("a");
    ekleSatiri.href = "#";
    ekleSatiri.className = "oda-satiri oda-satiri-ekle";
    ekleSatiri.setAttribute("aria-label", "Yeni karakter ekle");
    ekleSatiri.innerHTML = `
      <span class="oda-avatar oda-avatar-ekle">+</span>
      <span class="oda-bilgi">
        <strong>Yeni Karakter</strong>
        <small>Kendi arkadaşını ekle</small>
      </span>
    `;
    ekleSatiri.addEventListener("click", (event) => {
      event.preventDefault();
      karakterOlusturmaSihirbaziniAc();
    });
    odaListesi.appendChild(ekleSatiri);
  } else {
    const limitNotu = document.createElement("p");
    limitNotu.className = "karakter-limit-notu";
    limitNotu.textContent = `En fazla ${KARAKTER_LIMITI} karakter olabilir.`;
    odaListesi.appendChild(limitNotu);
  }
}

document.getElementById("karakter-ekle-butonu").addEventListener("click", () => {
  if (tumKarakterler().length >= KARAKTER_LIMITI) {
    bildirimGoster(`En fazla ${KARAKTER_LIMITI} karakter olabilir.`);
    return;
  }
  karakterOlusturmaSihirbaziniAc();
});

export function ortakAlanIzgarasiniOlustur() {
  ortakAlanIzgara.innerHTML = "";

  ORTAK_ALANLAR.forEach((alan) => {
    const kart = document.createElement("a");
    kart.href = "#";
    kart.className = "ortak-alan-karti";
    kart.style.setProperty("--alan-renk", alan.renk);
    kart.style.setProperty("--alan-wash1", alan.renk + "66");
    kart.style.setProperty("--alan-wash2", alan.renk + "38");
    kart.style.setProperty("--alan-border", alan.renk + "4D");
    kart.style.setProperty("--alan-bg", alan.renk + "29");
    kart.style.setProperty("--alan-glow", alan.renk + "8C");
    kart.setAttribute("aria-label", alan.isim + "'a git");

    kart.innerHTML = `
      <span class="ortak-alan-ikon">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${alan.ikon}</svg>
      </span>
      <strong>${alan.isim}</strong>
      <small>${alan.aciklama}</small>
    `;

    kart.addEventListener("click", (event) => {
      event.preventDefault();
      ortakAlaniAc(alan.id);
    });

    ortakAlanIzgara.appendChild(kart);
  });
}

/* Karakteri ve tüm sohbet geçmişini kalıcı olarak siler (örnek karakterler dahil). */
export function karakterSilOnayIle(karakterId) {
  const karakter = tumKarakterler().find((k) => k.id === karakterId);
  if (!karakter) return;
  const onay = window.confirm(karakter.isim + " silinsin mi? Bu karakterin tüm sohbet geçmişi de silinecek.");
  if (!onay) return;

  stateKarakterSil(karakterId);
  odaListesiniOlustur();
  bildirimGoster(karakter.isim + " silindi.");
  ekranAc("ev");
}
