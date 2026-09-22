/* ========================================================
   ui/karakterProfili.js
   Her karakterin kendi sayfası — sonradan isim, renk, fotoğraf,
   hitap, kişilik, geri bildirim tarzı ve değerlerini değiştirebilmek için.
   ======================================================== */

import { karakterBul, karakterleriKaydet } from "../core/state.js";
import { ekranAc, bildirimGoster } from "./screens.js";
import { odaListesiniOlustur, karakterSilOnayIle } from "./ev.js";
import { odayiAc, aktifOdaId } from "./chat.js";

const SIHIRBAZ_RENKLERI = ["#4CC9F0", "#E15AFF", "#FF9F1C", "#4ADE80", "#FF6B81", "#FFD166", "#B983FF", "#4FF3E0"];
const DEGER_LIMITI = 3;

const kpIsim = document.getElementById("kp-isim");
const kpHitap = document.getElementById("kp-hitap");
const kpUslup = document.getElementById("kp-uslup");
const kpRenkPaleti = document.getElementById("kp-renk-paleti");
const kpFotoInput = document.getElementById("kp-foto-input");
const kpFotoOnizleme = document.getElementById("kp-foto-onizleme");
const kpDegerlerGrubu = document.getElementById("kp-degerler-grubu");
const kpKaydetButonu = document.getElementById("kp-kaydet-butonu");
const kpSilButonu = document.getElementById("kp-sil-butonu");

let duzenlenenKarakterId = null;
let kpRenk = "";
let kpGeriBildirimTarzi = "";
let kpDegerler = [];
let kpFoto = "";

export function karakterProfiliniAc(karakterId) {
  const karakter = karakterBul(karakterId);
  if (!karakter) return;

  duzenlenenKarakterId = karakterId;
  kpIsim.value = karakter.isim;
  kpHitap.value = karakter.hitap;
  kpUslup.value = karakter.uslup;
  kpRenk = karakter.renk;
  kpGeriBildirimTarzi = karakter.geriBildirimTarzi;
  kpDegerler = [...(karakter.degerler || [])];
  kpFoto = karakter.simgeUrl || "";

  kpFotoOnizleme.style.backgroundImage = kpFoto ? `url(${kpFoto})` : "";
  kpFotoOnizleme.textContent = kpFoto ? "" : karakter.harf;

  kpRenkPaleti.innerHTML = "";
  SIHIRBAZ_RENKLERI.forEach((renk) => {
    const ornek = document.createElement("button");
    ornek.type = "button";
    ornek.className = "renk-ornegi" + (renk === kpRenk ? " aktif" : "");
    ornek.style.background = renk;
    ornek.style.color = renk;
    ornek.addEventListener("click", () => {
      kpRenk = renk;
      kpRenkPaleti.querySelectorAll(".renk-ornegi").forEach((r) => r.classList.remove("aktif"));
      ornek.classList.add("aktif");
    });
    kpRenkPaleti.appendChild(ornek);
  });

  document.querySelectorAll("#kp-geribildirim-grubu .cip").forEach((cip) => {
    cip.classList.toggle("aktif", cip.dataset.deger === kpGeriBildirimTarzi);
  });
  kpDegerlerGrubu.querySelectorAll(".cip").forEach((cip) => {
    cip.classList.toggle("aktif", kpDegerler.includes(cip.dataset.deger));
  });

  ekranAc("karakter-profili");
}

document.querySelectorAll("#kp-geribildirim-grubu .cip").forEach((cip) => {
  cip.addEventListener("click", () => {
    document.querySelectorAll("#kp-geribildirim-grubu .cip").forEach((c) => c.classList.remove("aktif"));
    cip.classList.add("aktif");
    kpGeriBildirimTarzi = cip.dataset.deger;
  });
});

kpDegerlerGrubu.querySelectorAll(".cip").forEach((cip) => {
  cip.addEventListener("click", () => {
    const deger = cip.dataset.deger;
    if (cip.classList.contains("aktif")) {
      cip.classList.remove("aktif");
      kpDegerler = kpDegerler.filter((d) => d !== deger);
    } else {
      if (kpDegerler.length >= DEGER_LIMITI) { bildirimGoster(`En fazla ${DEGER_LIMITI} değer seçebilirsin.`); return; }
      cip.classList.add("aktif");
      kpDegerler.push(deger);
    }
  });
});

function fotografiKuciilt(dosya, hedefBoyut) {
  return new Promise((resolve, reject) => {
    const okuyucu = new FileReader();
    okuyucu.onerror = () => reject(new Error("Dosya okunamadı"));
    okuyucu.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Görsel yüklenemedi"));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = hedefBoyut;
        canvas.height = hedefBoyut;
        const kenar = Math.min(img.width, img.height);
        const kx = (img.width - kenar) / 2;
        const ky = (img.height - kenar) / 2;
        canvas.getContext("2d").drawImage(img, kx, ky, kenar, kenar, 0, 0, hedefBoyut, hedefBoyut);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = okuyucu.result;
    };
    okuyucu.readAsDataURL(dosya);
  });
}

kpFotoInput.addEventListener("change", async () => {
  const dosya = kpFotoInput.files[0];
  if (!dosya) return;
  try {
    kpFoto = await fotografiKuciilt(dosya, 300);
    kpFotoOnizleme.style.backgroundImage = `url(${kpFoto})`;
    kpFotoOnizleme.textContent = "";
  } catch (hata) {
    bildirimGoster("Fotoğraf yüklenemedi, tekrar dener misin?");
  }
});

kpKaydetButonu.addEventListener("click", () => {
  const karakter = karakterBul(duzenlenenKarakterId);
  if (!karakter) return;

  const yeniIsim = kpIsim.value.trim();
  if (!yeniIsim) { bildirimGoster("İsim boş olamaz."); return; }

  karakter.isim = yeniIsim;
  karakter.harf = yeniIsim.charAt(0).toLocaleUpperCase("tr");
  karakter.hitap = kpHitap.value.trim() || "Sen";
  karakter.uslup = kpUslup.value.trim() || karakter.uslup;
  karakter.renk = kpRenk;
  karakter.simgeUrl = kpFoto;
  karakter.geriBildirimTarzi = kpGeriBildirimTarzi || "dengeli";
  karakter.degerler = kpDegerler;

  karakterleriKaydet();
  odaListesiniOlustur();
  bildirimGoster(karakter.isim + " güncellendi.");
  odayiAc(karakter.id); // oda başlığı/rengi hemen tazelensin
});

kpSilButonu.addEventListener("click", () => {
  if (duzenlenenKarakterId) karakterSilOnayIle(duzenlenenKarakterId);
});

document.getElementById("oda-profil-butonu").addEventListener("click", () => {
  if (aktifOdaId) karakterProfiliniAc(aktifOdaId);
});
