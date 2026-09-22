/* ========================================================
   ui/ayarlar.js
   Ayarlar ekranı: Groq API anahtarı, OneSignal App ID, kulaklık modu,
   sesli okuma açık/kapalı, ve tüm verileri sıfırlama.
   Hiçbir anahtar kaynak koduna gömülü değil — hepsi burada girilip
   sadece bu cihazın hafızasında (localStorage) saklanıyor.
   ======================================================== */

import { getAyar, setAyar, tumKarakterler, gorevleriAyarla } from "../core/state.js";
import { ANAHTARLAR, depoyaYaz } from "../core/storage.js";
import { ekranAc, bildirimGoster } from "./screens.js";
import { gorevleriCiz } from "./gorevler.js";
import { notifications } from "../native/notifications.js";

const apiAnahtariInput = document.getElementById("api-anahtari-input");
const apiAnahtariKaydetButonu = document.getElementById("api-anahtari-kaydet-butonu");
const verileriSifirlaButonu = document.getElementById("verileri-sifirla-butonu");

const oneSignalInput = document.getElementById("onesignal-appid-input");
const oneSignalKaydetButonu = document.getElementById("onesignal-kaydet-butonu");
const kulaklikModuKutusu = document.getElementById("kulaklik-modu-kutusu");
const sesliOkumaKutusu = document.getElementById("sesli-okuma-kutusu");

export function ayarlarEkraniniDoldur() {
  apiAnahtariInput.value = getAyar("groqAnahtari") || "";
  oneSignalInput.value = getAyar("oneSignalAppId") || "";
  kulaklikModuKutusu.checked = !!getAyar("kulaklikModu");
  sesliOkumaKutusu.checked = getAyar("sesliOkumaAcik") !== false;
}

apiAnahtariKaydetButonu.addEventListener("click", () => {
  const deger = apiAnahtariInput.value.trim();
  setAyar("groqAnahtari", deger);
  bildirimGoster(deger ? "API anahtarı kaydedildi." : "API anahtarı silindi.");
});

oneSignalKaydetButonu.addEventListener("click", async () => {
  const deger = oneSignalInput.value.trim();
  setAyar("oneSignalAppId", deger);
  if (!deger) { bildirimGoster("OneSignal App ID silindi."); return; }
  const basladi = await notifications.pushAltyapisiniBaslat(deger);
  bildirimGoster(basladi ? "Bildirimler etkinleştirildi." : "App ID kaydedildi (native uygulamada etkinleşecek).");
});

kulaklikModuKutusu.addEventListener("change", () => {
  setAyar("kulaklikModu", kulaklikModuKutusu.checked);
  bildirimGoster(kulaklikModuKutusu.checked ? "Kulaklık modu açık — karakter odalarında cevaplar sesli okunur." : "Kulaklık modu kapatıldı.");
});

sesliOkumaKutusu.addEventListener("change", () => {
  setAyar("sesliOkumaAcik", sesliOkumaKutusu.checked);
});

verileriSifirlaButonu.addEventListener("click", () => {
  const onay = window.confirm("Tüm sohbet ve görev verileri silinecek. Emin misin?");
  if (!onay) return;

  const mesajGecmisi = { salon: [] };
  tumKarakterler().forEach((k) => { mesajGecmisi[k.id] = []; });
  depoyaYaz(ANAHTARLAR.MESAJLAR, mesajGecmisi);
  gorevleriAyarla([]);

  gorevleriCiz();
  bildirimGoster("Tüm veriler sıfırlandı.");
  ekranAc("ev");
});

document.querySelectorAll('[data-ekran-hedef="ayarlar"]').forEach((buton) => {
  buton.addEventListener("click", ayarlarEkraniniDoldur);
});
