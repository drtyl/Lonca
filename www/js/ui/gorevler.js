/* ========================================================
   ui/gorevler.js
   Görev listesi: ekle, tamamla/geri al, sil, bir karaktere ata,
   atanan karakterin göreve gerçekten çalışmasını başlat, sonucu görüntüle.
   Ayrıca: düzenli aralıklarla "hesap verme" kontrolü — unutulan/geciken
   görevler varsa bir karakter dürüstçe (kendi geri bildirim tarzıyla) haber verir.
   ======================================================== */

import { tumGorevler, gorevOlustur, gorevGuncelle, gorevleriAyarla, tumKarakterler, mesajEkle, getAyar } from "../core/state.js";
import { goreveCalis, dusunVeCevapla } from "../core/brain.js";
import { saatOlustur } from "../core/storage.js";
import { bildirimGoster } from "./screens.js";
import { avatarIcerigi, avatarRengi } from "./avatar.js";
import { mesajlariCiz, aktifOrtakAlanId } from "./chat.js";
import { notifications } from "../native/notifications.js";

const gorevFormu = document.getElementById("gorev-formu");
const gorevInput = document.getElementById("gorev-input");
const gorevTekrarSecimi = document.getElementById("gorev-tekrar-secimi");
const gorevListesi = document.getElementById("gorev-listesi");
const gorevBosMetni = document.getElementById("gorev-bos");

let seciliTekrar = null;
let acikAtamaSatiri = null; // hangi görevin atama çipleri şu an açık

export function gorevleriCiz() {
  const gorevler = tumGorevler();
  gorevListesi.innerHTML = "";
  gorevBosMetni.hidden = gorevler.length > 0;

  gorevler.slice().reverse().forEach((gorev) => {
    const satir = document.createElement("li");
    satir.className = "gorev-satiri" + (gorev.durum === "tamamlandi" ? " gorev-tamam" : "");

    const ustSatir = document.createElement("div");
    ustSatir.className = "gorev-ust-satiri";

    const kutucuk = document.createElement("button");
    kutucuk.type = "button";
    kutucuk.className = "gorev-kutucuk";
    kutucuk.setAttribute("aria-label", "Tamamlandı işaretle");
    kutucuk.innerHTML = gorev.durum === "tamamlandi" ? "✓" : "";
    kutucuk.addEventListener("click", () => {
      gorevGuncelle(gorev.id, { durum: gorev.durum === "tamamlandi" ? "bekliyor" : "tamamlandi" });
      gorevleriCiz();
    });

    const metin = document.createElement("span");
    metin.className = "gorev-metin";
    metin.textContent = gorev.metin + (gorev.tekrar ? (gorev.tekrar === "gunluk" ? " 🔁 günlük" : " 🔁 haftalık") : "");

    const atananKarakter = gorev.atanan ? tumKarakterler().find((k) => k.id === gorev.atanan) : null;

    const ataBtn = document.createElement("button");
    ataBtn.type = "button";
    ataBtn.className = "gorev-ata-butonu";
    ataBtn.setAttribute("aria-label", "Bir karaktere ata");
    if (atananKarakter) {
      ataBtn.style.background = atananKarakter.renk + "29";
      ataBtn.style.color = atananKarakter.renk;
      ataBtn.innerHTML = avatarIcerigi(atananKarakter.id);
    } else {
      ataBtn.textContent = "+";
    }
    ataBtn.addEventListener("click", () => {
      acikAtamaSatiri = acikAtamaSatiri === gorev.id ? null : gorev.id;
      gorevleriCiz();
    });

    const silBtn = document.createElement("button");
    silBtn.type = "button";
    silBtn.className = "gorev-sil-butonu";
    silBtn.setAttribute("aria-label", "Sil");
    silBtn.textContent = "✕";
    silBtn.addEventListener("click", () => {
      gorevleriAyarla(tumGorevler().filter((g) => g.id !== gorev.id));
      gorevleriCiz();
    });

    ustSatir.append(kutucuk, metin, ataBtn, silBtn);
    satir.appendChild(ustSatir);

    // Atama çipleri (açıksa)
    if (acikAtamaSatiri === gorev.id) {
      const cipSatiri = document.createElement("div");
      cipSatiri.className = "gorev-atama-cipleri";
      tumKarakterler().forEach((k) => {
        const cip = document.createElement("button");
        cip.type = "button";
        cip.className = "cip";
        if (gorev.atanan === k.id) cip.classList.add("aktif");
        cip.textContent = k.isim;
        cip.addEventListener("click", () => {
          gorevGuncelle(gorev.id, { atanan: gorev.atanan === k.id ? null : k.id });
          acikAtamaSatiri = null;
          gorevleriCiz();
        });
        cipSatiri.appendChild(cip);
      });
      satir.appendChild(cipSatiri);
    }

    // Atanmış ve bekleyen bir görev: "Başlat" butonu — karakter gerçekten çalışır.
    if (atananKarakter && gorev.durum === "bekliyor") {
      const baslatBtn = document.createElement("button");
      baslatBtn.type = "button";
      baslatBtn.className = "gorev-baslat-butonu";
      baslatBtn.textContent = `${atananKarakter.isim} çalışsın`;
      baslatBtn.addEventListener("click", () => goreveBaslat(gorev, atananKarakter, baslatBtn));
      satir.appendChild(baslatBtn);
    }

    if (gorev.durum === "calisiyor") {
      const durumRozeti = document.createElement("p");
      durumRozeti.className = "gorev-durum-notu";
      durumRozeti.textContent = `${atananKarakter ? atananKarakter.isim : "Birisi"} bu görev üzerinde çalışıyor...`;
      satir.appendChild(durumRozeti);
    }

    if (gorev.sonuc) {
      const sonucKutusu = document.createElement("div");
      sonucKutusu.className = "gorev-sonuc";
      sonucKutusu.innerHTML = `<b>Sonuç${atananKarakter ? " — " + atananKarakter.isim : ""}</b><p>${gorev.sonuc}</p>`;
      satir.appendChild(sonucKutusu);
    }

    gorevListesi.appendChild(satir);
  });
}

async function goreveBaslat(gorev, karakter, buton) {
  if (!getAyar("groqAnahtari")) { bildirimGoster("Önce Ayarlar'dan bir Groq API anahtarı gir."); return; }
  buton.disabled = true;
  buton.textContent = "Çalışıyor...";
  gorevleriCiz();

  try {
    await goreveCalis(karakter, gorev);
    bildirimGoster(`${karakter.isim} görevi tamamladı: "${gorev.metin}"`);
    notifications.local(karakter.isim + " görevi tamamladı", gorev.metin);
  } catch (hata) {
    bildirimGoster(hata.message || "Görev tamamlanamadı, internet bağlantını kontrol et.");
    gorevGuncelle(gorev.id, { durum: "bekliyor" });
  }
  gorevleriCiz();
}

/* Tekrar seçimi (Yok / Günlük / Haftalık) — küçük çip grubu. */
document.querySelectorAll("#gorev-tekrar-secimi .cip").forEach((cip) => {
  cip.addEventListener("click", () => {
    document.querySelectorAll("#gorev-tekrar-secimi .cip").forEach((c) => c.classList.remove("aktif"));
    cip.classList.add("aktif");
    seciliTekrar = cip.dataset.deger || null;
  });
});

gorevFormu.addEventListener("submit", (event) => {
  event.preventDefault();
  const metin = gorevInput.value.trim();
  if (!metin) return;
  gorevOlustur({ metin, tekrar: seciliTekrar });
  gorevInput.value = "";
  seciliTekrar = null;
  document.querySelectorAll("#gorev-tekrar-secimi .cip").forEach((c, i) => c.classList.toggle("aktif", i === 0));
  gorevleriCiz();
});

/* ---------- HESAP VERME KONTROLÜ ---------- */
/* Günde en fazla 1 kez: geciken/uzun süredir bekleyen görevler varsa,
   bir karakter (varsa "sert" geri bildirim tarzı olan biri) durumu
   dürüstçe (kendi tarzıyla) Salon'da gündeme getirir. Spam olmasın diye. */

const HESAP_VERME_ANAHTARI = "lonca-son-hesap-verme";

export async function hesapVermeKontrolunuYap() {
  if (!getAyar("groqAnahtari")) return;
  const sonKontrol = Number(localStorage.getItem(HESAP_VERME_ANAHTARI) || 0);
  if (Date.now() - sonKontrol < 24 * 3600 * 1000) return;

  const gorevler = tumGorevler();
  const UC_GUN = 3 * 24 * 3600 * 1000;
  const gecikenler = gorevler.filter((g) => g.durum !== "tamamlandi" && (Date.now() - new Date(g.guncellendi).getTime()) > UC_GUN);
  if (gecikenler.length === 0) return;

  localStorage.setItem(HESAP_VERME_ANAHTARI, String(Date.now()));

  const karakterler = tumKarakterler();
  if (karakterler.length === 0) return;
  const karakter = karakterler.find((k) => k.geriBildirimTarzi === "sert") || karakterler[Math.floor(Math.random() * karakterler.length)];

  const ek = `\n\nBirkaç gündür üzerinde hiç ilerleme olmayan görevler var:\n` +
    gecikenler.slice(0, 5).map((g) => "- " + g.metin).join("\n") +
    `\n\nBunu kullanıcıyla dürüstçe, kendi geri bildirim tarzınla (yukarıda tarif edildi) gündeme getir — ` +
    `Salon'a kısa bir mesaj yaz, suçlayıcı olma ama gerçeği söylemekten çekinme.`;

  try {
    const sonuc = await dusunVeCevapla({ karakter, hedefId: "salon", tur: "ortak-alan", ekBaglam: ek });
    if (!sonuc.mesaj) return;
    mesajEkle("salon", { kimden: karakter.id, tur: "metin", icerik: sonuc.mesaj, saat: saatOlustur() });
    if (aktifOrtakAlanId === "salon") mesajlariCiz("salon");
    bildirimGoster(karakter.isim + " görevlerinle ilgili bir şey söyledi.");
    notifications.local(karakter.isim, sonuc.mesaj.slice(0, 120));
  } catch (hata) {
    /* kritik değil, sessizce geç */
  }
}
