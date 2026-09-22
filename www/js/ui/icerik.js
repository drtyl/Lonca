/* ========================================================
   ui/icerik.js
   Kütüphane/Mutfak/Atölye/Sanat Odası/Film Odası/Çalışma Odası'nın
   liste ekranı: kayıt ekleme, listeleme, Çalışma Odası zamanlayıcısı.
   ======================================================== */

import { icerikleriGetir, icerikOgeEkle, ORTAK_ALANLAR } from "../core/state.js";
import { ekranAc, bildirimGoster } from "./screens.js";
import { icerikDetayiniAc } from "./chat.js";
import { notifications } from "../native/notifications.js";

let icerikAktifAlanId = null;
let icerikFormSecim = { tur: "", durum: "" };

const icerikBaslikInput = document.getElementById("icerik-baslik-input");
const icerikEkAlanlarEl = document.getElementById("icerik-ek-alanlar");
const icerikNotInput = document.getElementById("icerik-not-input");
const icerikListeEl = document.getElementById("icerik-liste");
const icerikBosEl = document.getElementById("icerik-bos");
const icerikZamanlayiciEl = document.getElementById("icerik-zamanlayici");
const icerikZamanlayiciSureEl = document.getElementById("icerik-zamanlayici-sure");
const icerikZamanlayiciSurelerEl = document.getElementById("icerik-zamanlayici-sureler");

export function icerikListesiniAc(alanId) {
  const alan = ORTAK_ALANLAR.find((o) => o.id === alanId);
  if (!alan || !alan.icerik) return;

  icerikAktifAlanId = alanId;
  document.getElementById("icerik-listesi-baslik").textContent = alan.icerik.baslikTekil + " Listesi";

  icerikFormSecim = { tur: "", durum: "" };
  icerikBaslikInput.value = "";
  icerikNotInput.value = "";
  icerikEkAlanlarEl.innerHTML = "";

  if (alan.icerik.turSecenekleri) {
    icerikEkAlanlarEl.appendChild(cipGrubuOlustur("Tür", alan.icerik.turSecenekleri, (deger) => { icerikFormSecim.tur = deger; }));
  }
  if (alan.icerik.durumSecenekleri) {
    icerikEkAlanlarEl.appendChild(cipGrubuOlustur("Durum", alan.icerik.durumSecenekleri, (deger) => { icerikFormSecim.durum = deger; }, alan.icerik.durumSecenekleri[0]));
  }
  if (alan.icerik.ekstraAlanEtiketi) {
    const sarmalayici = document.createElement("div");
    sarmalayici.className = "icerik-ek-alan-grup";
    sarmalayici.innerHTML = `<span class="icerik-ek-alan-etiket">${alan.icerik.ekstraAlanEtiketi}</span>`;
    const girdi = document.createElement("input");
    girdi.type = "text";
    girdi.className = "sihirbaz-input";
    girdi.id = "icerik-ekstra-input";
    girdi.maxLength = 60;
    sarmalayici.appendChild(girdi);
    icerikEkAlanlarEl.appendChild(sarmalayici);
  }

  icerikZamanlayiciEl.hidden = !alan.icerik.zamanlayici;
  if (alan.icerik.zamanlayici) zamanlayiciyiKur();

  ciz(alanId);
  ekranAc("icerik-listesi");
}

function cipGrubuOlustur(etiket, secenekler, secildiginde, varsayilan) {
  const sarmalayici = document.createElement("div");
  sarmalayici.className = "icerik-ek-alan-grup";
  const baslik = document.createElement("span");
  baslik.className = "icerik-ek-alan-etiket";
  baslik.textContent = etiket;
  const grup = document.createElement("div");
  grup.className = "cip-grubu";

  secenekler.forEach((secenek) => {
    const cip = document.createElement("button");
    cip.type = "button";
    cip.className = "cip";
    cip.textContent = secenek;
    if (secenek === varsayilan) { cip.classList.add("aktif"); secildiginde(secenek); }
    cip.addEventListener("click", () => {
      grup.querySelectorAll(".cip").forEach((c) => c.classList.remove("aktif"));
      cip.classList.add("aktif");
      secildiginde(secenek);
    });
    grup.appendChild(cip);
  });

  sarmalayici.append(baslik, grup);
  return sarmalayici;
}

function ciz(alanId) {
  const liste = icerikleriGetir(alanId);
  icerikListeEl.innerHTML = "";
  icerikBosEl.hidden = liste.length > 0;

  liste.slice().reverse().forEach((oge) => {
    const satir = document.createElement("a");
    satir.href = "#";
    satir.className = "icerik-satiri";

    const rozetler = [oge.tur, oge.durum].filter(Boolean).map((r) => `<span class="icerik-rozet">${r}</span>`).join("");
    satir.innerHTML = `
      <span class="icerik-satiri-govde">
        <strong>${oge.baslik}</strong>
        <span class="icerik-satiri-rozetler">${rozetler}</span>
      </span>
      <span class="icerik-satiri-ok">›</span>
    `;

    satir.addEventListener("click", (event) => {
      event.preventDefault();
      icerikDetayiniAc(oge.id, alanId);
    });

    icerikListeEl.appendChild(satir);
  });
}

document.getElementById("icerik-ekle-butonu").addEventListener("click", () => {
  const baslik = icerikBaslikInput.value.trim();
  if (!baslik) { bildirimGoster("Önce bir başlık yaz."); return; }
  if (!icerikAktifAlanId) return;

  const ekstraInput = document.getElementById("icerik-ekstra-input");
  icerikOgeEkle(icerikAktifAlanId, {
    baslik, tur: icerikFormSecim.tur || "", durum: icerikFormSecim.durum || "",
    ekstra: ekstraInput ? ekstraInput.value.trim() : "", not: icerikNotInput.value.trim(), olusturan: "sen"
  });

  icerikBaslikInput.value = "";
  icerikNotInput.value = "";
  if (ekstraInput) ekstraInput.value = "";
  ciz(icerikAktifAlanId);
});

/* ---------- ÇALIŞMA ODASI ZAMANLAYICISI ---------- */

const ZAMANLAYICI_SURELERI = [15, 25, 45];
let zamanlayiciSaniye = ZAMANLAYICI_SURELERI[1] * 60;
let zamanlayiciCalisiyor = false;
let zamanlayiciId = null;

function zamanlayiciyiKur() {
  icerikZamanlayiciSurelerEl.innerHTML = "";
  ZAMANLAYICI_SURELERI.forEach((dakika) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = dakika + " dk";
    if (dakika === 25) btn.classList.add("aktif");
    btn.addEventListener("click", () => {
      if (zamanlayiciCalisiyor) return;
      zamanlayiciSaniye = dakika * 60;
      icerikZamanlayiciSurelerEl.querySelectorAll("button").forEach((b) => b.classList.remove("aktif"));
      btn.classList.add("aktif");
      goruntuyuGuncelle();
    });
    icerikZamanlayiciSurelerEl.appendChild(btn);
  });
  goruntuyuGuncelle();
}

function goruntuyuGuncelle() {
  const dk = String(Math.floor(zamanlayiciSaniye / 60)).padStart(2, "0");
  const sn = String(zamanlayiciSaniye % 60).padStart(2, "0");
  icerikZamanlayiciSureEl.textContent = `${dk}:${sn}`;
}

document.getElementById("icerik-zamanlayici-baslat-butonu").addEventListener("click", (event) => {
  const btn = event.currentTarget;
  if (zamanlayiciCalisiyor) {
    clearInterval(zamanlayiciId);
    zamanlayiciCalisiyor = false;
    btn.textContent = "Başlat";
    return;
  }
  zamanlayiciCalisiyor = true;
  btn.textContent = "Duraklat";
  zamanlayiciId = setInterval(() => {
    zamanlayiciSaniye--;
    goruntuyuGuncelle();
    if (zamanlayiciSaniye <= 0) {
      clearInterval(zamanlayiciId);
      zamanlayiciCalisiyor = false;
      btn.textContent = "Başlat";
      bildirimGoster("Süre doldu! Harika iş çıkardın. 🎉");
      notifications.local("Çalışma süresi doldu", "Harika iş çıkardın. Kısa bir mola verebilirsin.");
    }
  }, 1000);
});

document.getElementById("icerik-zamanlayici-sifirla-butonu").addEventListener("click", () => {
  clearInterval(zamanlayiciId);
  zamanlayiciCalisiyor = false;
  document.getElementById("icerik-zamanlayici-baslat-butonu").textContent = "Başlat";
  const aktifBtn = icerikZamanlayiciSurelerEl.querySelector("button.aktif");
  zamanlayiciSaniye = (aktifBtn ? parseInt(aktifBtn.textContent, 10) : 25) * 60;
  goruntuyuGuncelle();
});
