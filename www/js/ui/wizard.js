/* ========================================================
   ui/wizard.js
   Yeni karakter oluşturma sihirbazı: isim/renk/fotoğraf →
   kişilik soruları → geri bildirim tarzı/değerler → hitap şekli →
   önizleme → kaydet.
   ======================================================== */

import { karakterEkle } from "../core/state.js";
import { ekranAc, bildirimGoster } from "./screens.js";
import { odaListesiniOlustur } from "./ev.js";

const SIHIRBAZ_RENKLERI = ["#4CC9F0", "#E15AFF", "#FF9F1C", "#4ADE80", "#FF6B81", "#FFD166", "#B983FF", "#4FF3E0"];
const DEGER_LIMITI = 3;

const skRenkPaleti = document.getElementById("sk-renk-paleti");
const skInputIsim = document.getElementById("sk-isim");
const skInputIlgi = document.getElementById("sk-ilgi");
const skInputHitap = document.getElementById("sk-hitap");
const skFotoInput = document.getElementById("sk-foto-input");
const skFotoOnizleme = document.getElementById("sk-foto-onizleme");
const skDegerlerGrubu = document.getElementById("sk-degerler-grubu");
const skGeriButonu = document.getElementById("sk-geri-butonu");
const skIleriButonu = document.getElementById("sk-ileri-butonu");
const skKaydetButonu = document.getElementById("sk-kaydet-butonu");
const skOnizlemeAvatar = document.getElementById("sk-onizleme-avatar");
const skOnizlemeIsim = document.getElementById("sk-onizleme-isim");
const skOnizlemeUslup = document.getElementById("sk-onizleme-uslup");

const SON_ADIM = 5;
let skAdim = 1;
let skSecim = { isim: "", renk: "", foto: "", enerji: "", ton: "", yaklasim: "", ilgi: "", geriBildirimTarzi: "", degerler: [], hitap: "" };

export function karakterOlusturmaSihirbaziniAc() {
  skSecim = { isim: "", renk: "", foto: "", enerji: "", ton: "", yaklasim: "", ilgi: "", geriBildirimTarzi: "", degerler: [], hitap: "" };
  skInputIsim.value = "";
  skInputIlgi.value = "";
  skInputHitap.value = "";
  skFotoOnizleme.style.backgroundImage = "";
  skFotoOnizleme.textContent = "?";
  document.querySelectorAll(".cip").forEach((cip) => cip.classList.remove("aktif"));

  skRenkPaleti.innerHTML = "";
  SIHIRBAZ_RENKLERI.forEach((renk) => {
    const ornek = document.createElement("button");
    ornek.type = "button";
    ornek.className = "renk-ornegi";
    ornek.style.background = renk;
    ornek.style.color = renk;
    ornek.addEventListener("click", () => {
      skSecim.renk = renk;
      skRenkPaleti.querySelectorAll(".renk-ornegi").forEach((r) => r.classList.remove("aktif"));
      ornek.classList.add("aktif");
    });
    skRenkPaleti.appendChild(ornek);
  });

  skAdimiGoster(1);
  ekranAc("karakter-olustur");
}

function skAdimiGoster(adim) {
  skAdim = adim;
  document.querySelectorAll(".sihirbaz-adim").forEach((el) => el.classList.toggle("adim-aktif", Number(el.dataset.adim) === adim));
  document.querySelectorAll(".sihirbaz-nokta").forEach((nokta) => nokta.classList.toggle("aktif", Number(nokta.dataset.adimNokta) === adim));
  skGeriButonu.style.visibility = adim === 1 ? "hidden" : "visible";
  skIleriButonu.hidden = adim === SON_ADIM;
  skKaydetButonu.hidden = adim !== SON_ADIM;
  if (adim === SON_ADIM) skOnizlemeyiDoldur();
}

function skUslupOlustur() {
  let uslup = `${skSecim.enerji}, ${skSecim.ton}, ${skSecim.yaklasim}`;
  if (skSecim.ilgi) uslup += `; ilgi alanı: ${skSecim.ilgi}`;
  return uslup;
}

function skOnizlemeyiDoldur() {
  skOnizlemeIsim.textContent = skSecim.isim;
  skOnizlemeUslup.textContent = skUslupOlustur() + (skSecim.degerler.length ? ` — değerleri: ${skSecim.degerler.join(", ")}` : "");
  skOnizlemeAvatar.style.background = skSecim.renk + "1F";
  skOnizlemeAvatar.style.color = skSecim.renk;
  skOnizlemeAvatar.style.boxShadow = `0 0 12px ${skSecim.renk}66`;
  skOnizlemeAvatar.style.overflow = "hidden";
  skOnizlemeAvatar.innerHTML = skSecim.foto
    ? `<img src="${skSecim.foto}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`
    : skSecim.isim.charAt(0).toLocaleUpperCase("tr");
}

/* Tek seçimli sorular (enerji/ton/yaklaşım/geriBildirimTarzi) — hepsi data-soru ile işaretli. */
document.querySelectorAll(".cip-grubu[data-soru]").forEach((grup) => {
  const soru = grup.dataset.soru;
  grup.querySelectorAll(".cip").forEach((cip) => {
    cip.addEventListener("click", () => {
      grup.querySelectorAll(".cip").forEach((c) => c.classList.remove("aktif"));
      cip.classList.add("aktif");
      skSecim[soru] = cip.dataset.deger;
    });
  });
});

/* Değerler — çok seçimli, en fazla DEGER_LIMITI tanesi. */
skDegerlerGrubu.querySelectorAll(".cip").forEach((cip) => {
  cip.addEventListener("click", () => {
    const deger = cip.dataset.deger;
    if (cip.classList.contains("aktif")) {
      cip.classList.remove("aktif");
      skSecim.degerler = skSecim.degerler.filter((d) => d !== deger);
    } else {
      if (skSecim.degerler.length >= DEGER_LIMITI) {
        bildirimGoster(`En fazla ${DEGER_LIMITI} değer seçebilirsin.`);
        return;
      }
      cip.classList.add("aktif");
      skSecim.degerler.push(deger);
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

skFotoInput.addEventListener("change", async () => {
  const dosya = skFotoInput.files[0];
  if (!dosya) return;
  try {
    skSecim.foto = await fotografiKuciilt(dosya, 300);
    skFotoOnizleme.style.backgroundImage = `url(${skSecim.foto})`;
    skFotoOnizleme.textContent = "";
  } catch (hata) {
    bildirimGoster("Fotoğraf yüklenemedi, tekrar dener misin?");
  }
});

skGeriButonu.addEventListener("click", () => { if (skAdim > 1) skAdimiGoster(skAdim - 1); });

skIleriButonu.addEventListener("click", () => {
  if (skAdim === 1) {
    skSecim.isim = skInputIsim.value.trim();
    if (!skSecim.isim) { bildirimGoster("Önce bir isim yaz."); return; }
    if (!skSecim.renk) { bildirimGoster("Bir renk seç."); return; }
  }
  if (skAdim === 2) {
    skSecim.ilgi = skInputIlgi.value.trim();
    if (!skSecim.enerji || !skSecim.ton || !skSecim.yaklasim) { bildirimGoster("Üç soruyu da cevapla."); return; }
  }
  if (skAdim === 3) {
    if (!skSecim.geriBildirimTarzi) { bildirimGoster("Geri bildirim tarzını seç."); return; }
    if (skSecim.degerler.length === 0) { bildirimGoster("En az bir değer seç."); return; }
  }
  if (skAdim === 4) skSecim.hitap = skInputHitap.value.trim() || "Sen";
  skAdimiGoster(skAdim + 1);
});

skKaydetButonu.addEventListener("click", () => {
  const id = "k" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const yeniKarakter = {
    id, isim: skSecim.isim, renk: skSecim.renk, harf: skSecim.isim.charAt(0).toLocaleUpperCase("tr"),
    simge: "", simgeUrl: skSecim.foto || "", uslup: skUslupOlustur(), hitap: skSecim.hitap || "Sen",
    geriBildirimTarzi: skSecim.geriBildirimTarzi || "dengeli", degerler: skSecim.degerler,
    durum: "Yeni katıldı", karsilamaMesaji: `Selam, ben ${skSecim.isim}. Tanıştığımıza sevindim!`
  };

  karakterEkle(yeniKarakter);
  odaListesiniOlustur();
  bildirimGoster(yeniKarakter.isim + " eklendi!");
  ekranAc("ev");
});
