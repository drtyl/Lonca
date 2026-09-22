/* ========================================================
   ui/gelistirme.js
   "Geliştirme İste" ekranı, öneri listesi ve onay ekranı.
   ======================================================== */

import { getAyar, setAyar, tumGelistirmeOnerileri, gelistirmeOnerisiEkle, gelistirmeOnerisiGuncelle, gelistirmeOnerisiBul } from "../core/state.js";
import { oneriUret } from "../core/gelistirmeAjani.js";
import { prDiffGetir, prOnayla, prReddet } from "../core/gelistirme.js";
import { ekranAc, bildirimGoster } from "./screens.js";

const githubAnahtariInput = document.getElementById("github-anahtari-input");
const githubRepoInput = document.getElementById("github-repo-input");
const githubKaydetButonu = document.getElementById("github-kaydet-butonu");

const giIstekInput = document.getElementById("gi-istek-input");
const giGonderButonu = document.getElementById("gi-gonder-butonu");
const giDurum = document.getElementById("gi-durum");

const goListe = document.getElementById("go-liste");
const goBos = document.getElementById("go-bos");

const gdIstek = document.getElementById("gd-istek");
const gdAciklama = document.getElementById("gd-aciklama");
const gdTeknikGosterButonu = document.getElementById("gd-teknik-goster-butonu");
const gdYama = document.getElementById("gd-yama");
const gdButonlar = document.getElementById("gd-butonlar");
const gdDurumEtiketi = document.getElementById("gd-durum-etiketi");
const gdReddetButonu = document.getElementById("gd-reddet-butonu");
const gdUygulaButonu = document.getElementById("gd-uygula-butonu");

let aktifOneriId = null;

/* ---------- AYARLAR: GitHub anahtarı/repo ---------- */

document.querySelectorAll('[data-ekran-hedef="ayarlar"]').forEach((buton) => {
  buton.addEventListener("click", () => {
    githubAnahtariInput.value = getAyar("githubAnahtari") || "";
    githubRepoInput.value = getAyar("githubRepo") || "";
  });
});

githubKaydetButonu.addEventListener("click", () => {
  setAyar("githubAnahtari", githubAnahtariInput.value.trim());
  setAyar("githubRepo", githubRepoInput.value.trim());
  bildirimGoster("GitHub bilgileri kaydedildi.");
});

/* ---------- GELİŞTİRME İSTE ---------- */

document.querySelectorAll('[data-ekran-hedef="gelistirme-iste"]').forEach((b) => {
  b.addEventListener("click", () => { giIstekInput.value = ""; giDurum.hidden = true; });
});

giGonderButonu.addEventListener("click", async () => {
  const istek = giIstekInput.value.trim();
  if (!istek) { bildirimGoster("Önce ne istediğini yaz."); return; }
  if (!getAyar("groqAnahtari")) { bildirimGoster("Önce Ayarlar'dan bir Groq API anahtarı gir."); return; }
  if (!getAyar("githubAnahtari") || !getAyar("githubRepo")) { bildirimGoster("Önce Ayarlar'dan GitHub anahtarı ve repo adını gir."); return; }

  giGonderButonu.disabled = true;
  giGonderButonu.textContent = "Düşünüyor...";
  giDurum.hidden = false;
  giDurum.textContent = "İsteğini inceliyorum, ilgili dosyaları kontrol ediyorum...";

  try {
    const sonuc = await oneriUret(istek);
    if (!sonuc.uygulanabilir) {
      giDurum.textContent = sonuc.sebep;
      gelistirmeOnerisiEkle({ istek, durum: "basarisiz", hata: sonuc.sebep, aciklama: sonuc.sebep });
    } else {
      gelistirmeOnerisiEkle({ istek, prNo: sonuc.prNo, prUrl: sonuc.prUrl, dosyalar: sonuc.dosyalar, aciklama: sonuc.aciklama, durum: "bekliyor" });
      giDurum.textContent = "Bir öneri hazırladım! \"Geliştirme Önerilerim\"den inceleyip onaylayabilirsin.";
      giIstekInput.value = "";
    }
  } catch (hata) {
    giDurum.textContent = hata.message || "Bir şeyler ters gitti, tekrar dener misin?";
  }

  giGonderButonu.disabled = false;
  giGonderButonu.textContent = "Öneri Oluştur";
});

/* ---------- ÖNERİ LİSTESİ ---------- */

document.querySelectorAll('[data-ekran-hedef="gelistirme-onerileri"]').forEach((b) => {
  b.addEventListener("click", onerileriCiz);
});

function onerileriCiz() {
  const oneriler = tumGelistirmeOnerileri();
  goListe.innerHTML = "";
  goBos.hidden = oneriler.length > 0;

  oneriler.forEach((oneri) => {
    const satir = document.createElement("a");
    satir.href = "#";
    satir.className = "gelistirme-oneri-satiri";
    satir.innerHTML = `
      <span class="gelistirme-oneri-istek">${oneri.istek}</span>
      <span class="gelistirme-oneri-rozet ${oneri.durum}">${
        { bekliyor: "Onay bekliyor", uygulandi: "Uygulandı", reddedildi: "Reddedildi", basarisiz: "Yapılamadı" }[oneri.durum] || oneri.durum
      }</span>
    `;
    satir.addEventListener("click", (e) => { e.preventDefault(); oneriDetayiniAc(oneri.id); });
    goListe.appendChild(satir);
  });
}

/* ---------- ÖNERİ DETAYI ---------- */

async function oneriDetayiniAc(oneriId) {
  const oneri = gelistirmeOnerisiBul(oneriId);
  if (!oneri) return;
  aktifOneriId = oneriId;

  gdIstek.textContent = oneri.istek;
  gdAciklama.textContent = oneri.aciklama || oneri.hata || "—";
  gdYama.hidden = true;
  gdYama.textContent = "";
  gdTeknikGosterButonu.hidden = !oneri.prNo;
  gdButonlar.style.display = oneri.durum === "bekliyor" ? "flex" : "none";
  gdDurumEtiketi.hidden = oneri.durum === "bekliyor";
  gdDurumEtiketi.textContent = oneri.durum === "uygulandi" ? "Bu öneri uygulandı — yeni APK'yı Actions'tan indirip kurabilirsin."
    : oneri.durum === "reddedildi" ? "Bu öneri reddedildi." : "";

  ekranAc("gelistirme-detay");
}

gdTeknikGosterButonu.addEventListener("click", async () => {
  const oneri = gelistirmeOnerisiBul(aktifOneriId);
  if (!oneri || !oneri.prNo) return;
  if (!gdYama.hidden) { gdYama.hidden = true; return; }

  gdTeknikGosterButonu.textContent = "Yükleniyor...";
  try {
    const dosyalar = await prDiffGetir(oneri.prNo);
    gdYama.textContent = dosyalar.map((d) => `--- ${d.yol} (+${d.eklenen}/-${d.silinen}) ---\n${d.yama}`).join("\n\n");
    gdYama.hidden = false;
  } catch (hata) {
    bildirimGoster(hata.message || "Teknik detay alınamadı.");
  }
  gdTeknikGosterButonu.textContent = "Teknik detayı göster";
});

gdUygulaButonu.addEventListener("click", async () => {
  const oneri = gelistirmeOnerisiBul(aktifOneriId);
  if (!oneri || !oneri.prNo) return;
  gdUygulaButonu.disabled = true;
  gdUygulaButonu.textContent = "Uygulanıyor...";
  try {
    await prOnayla(oneri.prNo);
    gelistirmeOnerisiGuncelle(oneri.id, { durum: "uygulandi" });
    bildirimGoster("Uygulandı! Actions'ta yeni bir APK derlenmeye başladı.");
    oneriDetayiniAc(oneri.id);
  } catch (hata) {
    bildirimGoster(hata.message || "Uygulanamadı, tekrar dener misin?");
  }
  gdUygulaButonu.disabled = false;
  gdUygulaButonu.textContent = "Uygula";
});

gdReddetButonu.addEventListener("click", async () => {
  const oneri = gelistirmeOnerisiBul(aktifOneriId);
  if (!oneri) return;
  const onay = window.confirm("Bu öneri reddedilsin mi?");
  if (!onay) return;
  gdReddetButonu.disabled = true;
  try {
    if (oneri.prNo) await prReddet(oneri.prNo);
    gelistirmeOnerisiGuncelle(oneri.id, { durum: "reddedildi" });
    bildirimGoster("Reddedildi.");
    oneriDetayiniAc(oneri.id);
  } catch (hata) {
    bildirimGoster(hata.message || "Reddedilemedi, tekrar dener misin?");
  }
  gdReddetButonu.disabled = false;
});
