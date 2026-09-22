/* ========================================================
   ui/screens.js
   Ekranlar arası geçiş, alt menü vurgusu, ve küçük "toast" bildirimi.
   ======================================================== */

const ekranlar = document.querySelectorAll(".ekran");
const navSalonButonu = document.getElementById("nav-salon-butonu");
const bildirimMesaji = document.getElementById("bildirim-mesaji");
const aramaInput = document.getElementById("arama-input");
const aramaSonuclari = document.getElementById("arama-sonuclari");
const aramaBosMetni = document.getElementById("arama-bos");

export let aktifOrtakAlanIdReferansi = { deger: null };

export function aktifOrtakAlanIdAyarla(deger) {
  aktifOrtakAlanIdReferansi.deger = deger;
}

export function ekranAc(ekranAdi) {
  ekranlar.forEach((ekran) => {
    ekran.classList.toggle("ekran-aktif", ekran.dataset.ekran === ekranAdi);
  });

  let navVurgusu = ekranAdi;
  if (ekranAdi === "oda" || ekranAdi === "karakter-olustur" || ekranAdi === "karakter-profili" || ekranAdi === "icerik-listesi" || ekranAdi === "icerik-detay") navVurgusu = "ev";
  if (ekranAdi === "ortak-oda") navVurgusu = aktifOrtakAlanIdReferansi.deger === "salon" ? "salon" : "ev";

  document.querySelectorAll(".alt-bar-secim").forEach((buton) => {
    buton.classList.toggle("aktif", buton.dataset.ekranHedef === navVurgusu);
  });
  navSalonButonu.classList.toggle("aktif", navVurgusu === "salon");

  if (ekranAdi === "arama") { aramaInput.value = ""; aramaSonuclari.innerHTML = ""; aramaBosMetni.hidden = false; aramaInput.focus(); }

  window.scrollTo(0, 0);
}

document.querySelectorAll("[data-ekran-hedef]").forEach((buton) => {
  buton.addEventListener("click", (event) => {
    event.preventDefault();
    ekranAc(buton.dataset.ekranHedef);
  });
});

let bildirimZamanlayici;
export function bildirimGoster(mesaj) {
  bildirimMesaji.textContent = mesaj;
  bildirimMesaji.classList.add("bildirim-gorunur");
  clearTimeout(bildirimZamanlayici);
  bildirimZamanlayici = setTimeout(() => bildirimMesaji.classList.remove("bildirim-gorunur"), 3200);
}
