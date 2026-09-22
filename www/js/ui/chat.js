/* ========================================================
   ui/chat.js
   Karakter odaları, ortak alanlar (Salon, Mutfak, ...) ve içerik-detay
   sohbetleri için ortak render/gönderme mantığı. Cevap üretimi artık
   doğrudan Groq değil, core/brain.js üzerinden yürüyor.
   ======================================================== */

import { karakterBul, mesajlariGetir, mesajEkle, icerikOgesiBul, icerikOgeSil, icerikleriGetir,
  getAyar, ORTAK_ALANLAR } from "../core/state.js";
import { saatOlustur } from "../core/storage.js";
import { dusunVeCevapla } from "../core/brain.js";
import { relationships } from "../core/relationships.js";
import { avatarIcerigi, avatarRengi } from "./avatar.js";
import { ekranAc, bildirimGoster, aktifOrtakAlanIdAyarla } from "./screens.js";
import { speech } from "../native/speech.js";
import { kamerayiAc, kameraHedefiniAyarla } from "./kamera.js";
import { icerikListesiniAc } from "./icerik.js";

const odaSahne = document.getElementById("oda-sahne");
const odaIsimEl = document.getElementById("oda-isim");
const odaDurumEl = document.getElementById("oda-durum");

const ortakOdaSahne = document.getElementById("ortak-oda-sahne");
const ortakOdaIsimEl = document.getElementById("ortak-oda-isim");
const ortakOdaAciklamaEl = document.getElementById("ortak-oda-aciklama");

export let aktifOdaId = null;
export let aktifOrtakAlanId = null;
export let aktifIcerikId = null;
let icerikAktifAlanId = null; // içerik detayından geri dönerken hangi listeye döneceğimiz

/* ---------- ODA (karakterle birebir) ---------- */

export function odayiAc(karakterId) {
  const karakter = karakterBul(karakterId);
  if (!karakter) return;

  aktifOdaId = karakterId;
  odaIsimEl.textContent = karakter.isim;
  odaDurumEl.textContent = karakter.durum;
  odaSahne.style.setProperty("--sahne-renk", karakter.renk);

  if (mesajlariGetir(karakterId).length === 0) {
    mesajEkle(karakterId, { kimden: karakterId, tur: "metin", icerik: karakter.karsilamaMesaji, saat: saatOlustur() });
  }

  mesajlariCiz(karakterId);
  ekranAc("oda");
  document.getElementById("oda-input").focus();
}

/* Karakter silme artık Karakter Sayfası'nda (bkz. ui/karakterProfili.js) — buradan açılıyor. */

/* ---------- ORTAK ALAN (Salon, Mutfak, Atölye, ...) ---------- */

export function ortakAlaniAc(alanId) {
  const alan = ORTAK_ALANLAR.find((o) => o.id === alanId);
  if (!alan) return;

  aktifOrtakAlanId = alanId;
  aktifOrtakAlanIdAyarla(alanId);
  ortakOdaIsimEl.textContent = alan.isim;
  ortakOdaAciklamaEl.textContent = alan.aciklama;
  ortakOdaSahne.style.setProperty("--sahne-renk", alan.renk);
  document.getElementById("ortak-oda-icerik-butonu").hidden = !alan.icerik;

  mesajlariCiz(alanId);
  ekranAc("ortak-oda");
  document.getElementById("ortak-oda-input").focus();
}

document.getElementById("ortak-oda-icerik-butonu").addEventListener("click", () => {
  if (aktifOrtakAlanId) { icerikAktifAlanId = aktifOrtakAlanId; icerikListesiniAc(aktifOrtakAlanId); }
});

document.getElementById("nav-salon-butonu").addEventListener("click", () => ortakAlaniAc("salon"));

/* ---------- İÇERİK DETAY SOHBETİ ---------- */

export function icerikDetayiniAc(itemId, gelenAlanId) {
  const bulunan = icerikOgesiBul(itemId);
  if (!bulunan) return;
  const { item, alanId } = bulunan;
  const alan = ORTAK_ALANLAR.find((o) => o.id === alanId);

  aktifIcerikId = itemId;
  icerikAktifAlanId = gelenAlanId || alanId;
  document.getElementById("icerik-detay-isim").textContent = item.baslik;
  document.getElementById("icerik-detay-alt").textContent = [item.ekstra, item.tur, item.durum].filter(Boolean).join(" · ") || alan.icerik.baslikTekil;
  document.getElementById("icerik-detay-sahne").style.setProperty("--sahne-renk", alan.renk);

  mesajlariCiz(itemId);
  ekranAc("icerik-detay");
  document.getElementById("icerik-detay-input").focus();
}

document.getElementById("icerik-detay-geri-butonu").addEventListener("click", () => {
  if (icerikAktifAlanId) icerikListesiniAc(icerikAktifAlanId);
  else ekranAc("ev");
});

document.getElementById("icerik-detay-sil-butonu").addEventListener("click", () => {
  if (!aktifIcerikId) return;
  const bulunan = icerikOgesiBul(aktifIcerikId);
  if (!bulunan) return;
  const onay = window.confirm(bulunan.item.baslik + " silinsin mi?");
  if (!onay) return;
  icerikOgeSil(aktifIcerikId);
  icerikListesiniAc(bulunan.alanId);
  bildirimGoster(bulunan.item.baslik + " silindi.");
});

/* ---------- ORTAK MESAJ ÇİZİMİ ---------- */

function hedefinMesajlarElementi(hedefTipi) {
  if (ORTAK_ALANLAR.some((o) => o.id === hedefTipi)) return document.getElementById("ortak-oda-mesajlar");
  if (icerikOgesiBul(hedefTipi)) return document.getElementById("icerik-detay-mesajlar");
  return document.getElementById("oda-mesajlar");
}

export function mesajlariCiz(hedefTipi) {
  const mesajlarEl = hedefinMesajlarElementi(hedefTipi);
  const liste = mesajlariGetir(hedefTipi);
  mesajlarEl.innerHTML = "";

  liste.forEach((mesaj) => {
    const kutu = document.createElement("article");
    kutu.className = mesaj.kimden === "sen" ? "mesaj mesaj-kendi" : "mesaj";

    const avatar = document.createElement("span");
    avatar.className = "mesaj-avatar";
    avatar.style.color = avatarRengi(mesaj.kimden);
    avatar.innerHTML = avatarIcerigi(mesaj.kimden);

    const govde = document.createElement("div");
    const baslik = document.createElement("b");
    const karakter = mesaj.kimden !== "sen" ? karakterBul(mesaj.kimden) : null;
    const gonderenAdi = mesaj.kimden === "sen" ? "Sen" : (karakter ? karakter.isim : "?");
    baslik.append(
      document.createTextNode(gonderenAdi + " "),
      Object.assign(document.createElement("time"), { textContent: mesaj.saat })
    );
    govde.appendChild(baslik);

    if (mesaj.tur === "fotograf") {
      const img = document.createElement("img");
      img.src = mesaj.icerik;
      img.className = "mesaj-foto";
      img.alt = "Fotoğraf";
      govde.appendChild(img);
    } else {
      const yazi = document.createElement("p");
      yazi.textContent = karakter ? mesajMetniniTemizle(mesaj.icerik) : mesaj.icerik;
      govde.appendChild(yazi);

      if (karakter && getAyar("sesliOkumaAcik")) {
        const dinleBtn = document.createElement("button");
        dinleBtn.type = "button";
        dinleBtn.className = "mesaj-dinle-butonu";
        dinleBtn.setAttribute("aria-label", "Sesli dinle");
        dinleBtn.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"></path><path d="M17.5 8.5a5 5 0 0 1 0 7"></path></svg>`;
        dinleBtn.addEventListener("click", () => speech.konus(karakter, mesajMetniniTemizle(mesaj.icerik)));
        govde.appendChild(dinleBtn);
      }
    }

    kutu.append(avatar, govde);
    mesajlarEl.appendChild(kutu);
  });

  mesajlarEl.scrollTop = mesajlarEl.scrollHeight;
}

/* Faz 3'ten önceki bir hata yüzünden hafızada bozuk/ham JSON metni olarak
   kalmış eski karakter mesajları olabilir — ekrana çizerken bunları da
   temizliyoruz (yeni mesajlar zaten brain.js'te temiz üretiliyor). */
function mesajMetniniTemizle(icerik) {
  if (!icerik.trim().startsWith("{")) return icerik;
  const eslesme = icerik.match(/"mesaj"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (eslesme) return eslesme[1].replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  return icerik;
}

function metinMesajiGonder(hedefTipi, metin) {
  if (!metin.trim()) return;
  mesajEkle(hedefTipi, { kimden: "sen", tur: "metin", icerik: metin.trim(), saat: saatOlustur() });
  mesajlariCiz(hedefTipi);
}

function yaziyorGosterEkle(mesajlarEl, karakter) {
  const kutu = document.createElement("article");
  kutu.className = "mesaj yaziyor";
  const avatar = document.createElement("span");
  avatar.className = "mesaj-avatar";
  avatar.style.color = karakter.renk;
  avatar.innerHTML = avatarIcerigi(karakter.id);
  const govde = document.createElement("div");
  govde.innerHTML = `<b>${karakter.isim}</b><p><span></span><span></span><span></span></p>`;
  kutu.append(avatar, govde);
  mesajlarEl.appendChild(kutu);
  mesajlarEl.scrollTop = mesajlarEl.scrollHeight;
  return kutu;
}

/* İsim geçmiyorsa, kim cevap versin sorusunu artık ZAR ATARAK değil, her
   karakterin o an konuşmaya ne kadar "istekli" olduğuna bakarak çözüyoruz —
   aynı mantık ui/proaktif.js'de de kullanılıyor: sosyal ihtiyaç + kullanıcıyla
   yakınlık + merak, stresten düşülerek. Küçük bir rastgele gürültü sadece tam
   eşitlik durumunda kararsızlığı kırmak için var, kararı O SÜRÜKLEMİYOR. */
function karakterIstekliligi(karakter) {
  const s = karakter.state;
  const iliski = relationships.iliskiGetir(karakter, "sen") || { familiarity: 0.3 };
  let puan = s.socialNeed * 0.4 + iliski.familiarity * 0.3 + s.curiosity * 0.2;
  if (s.stress > 0.7) puan -= 0.15;
  return puan;
}

function cevaplayaniSec(karakterListesi, hedefId) {
  const gecmis = mesajlariGetir(hedefId);
  const sonMesaj = gecmis[gecmis.length - 1];
  if (sonMesaj && sonMesaj.tur === "metin") {
    const kucukMetin = sonMesaj.icerik.toLocaleLowerCase("tr");
    const bahsedilen = karakterListesi.find((k) => kucukMetin.includes(k.isim.toLocaleLowerCase("tr")));
    if (bahsedilen) return bahsedilen;
  }
  const puanlanmis = karakterListesi
    .map((k) => ({ karakter: k, puan: karakterIstekliligi(k) + Math.random() * 0.05 }))
    .sort((a, b) => b.puan - a.puan);
  return puanlanmis[0].karakter;
}

const MAX_ZINCIR_DERINLIGI = 2; // ilk cevaptan sonra en fazla 2 karakter daha zincire katılabilir
const ZINCIR_ESIGI = 0.35; // adreslenen karakterin kendi isteklilik puanı bunu geçerse katılır

/**
 * Tek giriş noktası — hedefin türüne göre doğru karakteri seçer, core/brain.js'i
 * çağırır, cevabı ekrana yazar. Ortak alanlarda, bir karakter başka birine
 * seslenirse (hedefKisi) o karakter de zincire katılabilir — gerçek bir grup
 * sohbeti hissi için (ama sonsuz döngü olmasın diye derinlik sınırlı).
 */
async function cevapUret(hedefTipi, zorlananKarakterId = null, zincirDerinligi = 0) {
  const { tumKarakterler } = await import("../core/state.js");
  const karakterler = tumKarakterler();
  if (karakterler.length === 0) return;

  const ortakAlanMi = ORTAK_ALANLAR.some((o) => o.id === hedefTipi);
  const icerikBilgisi = !ortakAlanMi ? icerikOgesiBul(hedefTipi) : null;
  const birebirMi = !ortakAlanMi && !icerikBilgisi;

  let karakter, ek = "", icerikKonfig = null, icerikAlanId = null;

  if (birebirMi) {
    karakter = karakterBul(hedefTipi);
    if (!karakter) return;
  } else if (ortakAlanMi) {
    const alan = ORTAK_ALANLAR.find((o) => o.id === hedefTipi);
    karakter = zorlananKarakterId ? karakterBul(zorlananKarakterId) : cevaplayaniSec(karakterler, hedefTipi);
    if (!karakter) return;
    ek = `\n\n${alan.ortamMetni} Hem kullanıcı hem diğer karakterler bu odayı görebiliyor.`;
    icerikKonfig = alan.icerik || null;
    icerikAlanId = hedefTipi;

    if (icerikKonfig) {
      const gercekListe = icerikleriGetir(hedefTipi);
      const baslikKucuk = icerikKonfig.baslikTekil.toLocaleLowerCase("tr");
      if (gercekListe.length > 0) {
        ek += `\n\nBu odadaki GERÇEK ${baslikKucuk} listesi (${gercekListe.length} kayıt):\n` +
          gercekListe.slice(-10).map((o) => `- "${o.baslik}"${o.tur ? " (" + o.tur + ")" : ""}${o.durum ? " [" + o.durum + "]" : ""}`).join("\n");
      } else {
        ek += `\n\nBu odada şu an HİÇ ${baslikKucuk} yok — liste boş.`;
      }
      ek += ` SADECE yukarıda yazılanlar gerçek — listede olmayan bir ${baslikKucuk} ya da eylem varmış gibi ASLA konuşma/uydurma. ` +
        `Liste boşsa ya da elinde bir şey yoksa bunu olduğu gibi söyle ("henüz bir şey yok" gibi), hayali bir şeyle meşgulmüş gibi davranma.`;
    }
  } else {
    const { item, alanId } = icerikBilgisi;
    const alan = ORTAK_ALANLAR.find((o) => o.id === alanId);
    karakter = zorlananKarakterId ? karakterBul(zorlananKarakterId) : cevaplayaniSec(karakterler, hedefTipi);
    if (!karakter) return;
    ek = `\n\nŞu an ${alan.isim}'dasın ve "${item.baslik}" başlıklı bir ${alan.icerik.baslikTekil.toLocaleLowerCase("tr")} ` +
      `hakkında konuşuyorsun.${item.not ? " Not: " + item.not : ""} Bu konuya odaklan, sohbeti dağıtma.`;
  }

  if (!getAyar("groqAnahtari")) { bildirimGoster("Önce Ayarlar'dan bir Groq API anahtarı gir."); return; }

  const gecmis = mesajlariGetir(hedefTipi);
  const guncelMetin = gecmis.length > 0 ? gecmis[gecmis.length - 1].icerik : "";
  const mesajlarEl = hedefinMesajlarElementi(hedefTipi);
  const yaziyorKutusu = yaziyorGosterEkle(mesajlarEl, karakter);

  let sonuc;
  try {
    const tur2 = birebirMi ? "birebir" : (ortakAlanMi ? "ortak-alan" : "icerik");
    sonuc = await dusunVeCevapla({ karakter, hedefId: hedefTipi, tur: tur2, ekBaglam: ek, icerikKonfig, icerikAlanId, guncelMetin });

    if (sonuc.mesaj) {
      mesajEkle(hedefTipi, { kimden: karakter.id, tur: "metin", icerik: sonuc.mesaj, saat: saatOlustur() });
      if (getAyar("kulaklikModu") && birebirMi) speech.konus(karakter, sonuc.mesaj);
    }
    if (sonuc.eklenenOge) {
      bildirimGoster(`${karakter.isim}, ${sonuc.icerikTuru.toLocaleLowerCase("tr")} listesine "${sonuc.eklenenOge.baslik}" ekledi.`);
    }
    if (sonuc.yeniGorev) {
      bildirimGoster(`${karakter.isim} yeni bir görev ekledi: "${sonuc.yeniGorev.metin}"`);
    }
  } catch (hata) {
    bildirimGoster(hata.message || "Cevap alınamadı, internet bağlantını kontrol et.");
    yaziyorKutusu.remove();
    return;
  }

  yaziyorKutusu.remove();
  mesajlariCiz(hedefTipi);

  // Zincirleme: sadece ortak alanlarda, sadece başka bir GERÇEK karaktere sesleniyorsa.
  // Adreslenen karakter zar atmıyor — KENDİ isteklilik puanı eşiği geçiyorsa katılır.
  if (ortakAlanMi && sonuc.hedefKisi && sonuc.hedefKisi !== "sen" && sonuc.hedefKisi !== karakter.id &&
      zincirDerinligi < MAX_ZINCIR_DERINLIGI) {
    const adreslenen = karakterBul(sonuc.hedefKisi);
    if (adreslenen && karakterIstekliligi(adreslenen) > ZINCIR_ESIGI) {
      setTimeout(() => cevapUret(hedefTipi, sonuc.hedefKisi, zincirDerinligi + 1), 500 + Math.random() * 700);
    }
  }
}

/* ---------- SOHBET KURULUMU (Oda, Ortak Oda, İçerik Detay için ortak) ---------- */

function sohbetKur(hedefTipiGetir, onEkler) {
  const on = onEkler;
  const formu = document.getElementById(on + "-formu");
  const input = document.getElementById(on + "-input");
  const mikrofonBtn = document.getElementById(on + "-mikrofon-butonu");
  const kameraBtn = document.getElementById(on + "-kamera-butonu");

  formu.addEventListener("submit", (event) => {
    event.preventDefault();
    const hedef = hedefTipiGetir();
    if (!hedef) return;
    metinMesajiGonder(hedef, input.value);
    input.value = "";
    cevapUret(hedef);
  });

  kameraBtn.addEventListener("click", () => {
    kameraHedefiniAyarla(hedefTipiGetir());
    kamerayiAc();
  });

  mikrofonKur(mikrofonBtn, input);
}

function mikrofonKur(mikrofonBtn, inputEl) {
  mikrofonBtn.addEventListener("click", () => {
    if (speech.dinliyorMu()) { speech.dinlemeyiDurdur(); return; }
    speech.dinlemeyeBasla(
      (metin) => { inputEl.value = metin; },
      () => mikrofonBtn.classList.add("dinliyor"),
      () => mikrofonBtn.classList.remove("dinliyor"),
      (hataMesaji) => { mikrofonBtn.classList.remove("dinliyor"); bildirimGoster(hataMesaji); }
    );
  });
}

sohbetKur(() => aktifOdaId, "oda");
sohbetKur(() => aktifOrtakAlanId, "ortak-oda");
sohbetKur(() => aktifIcerikId, "icerik-detay");

/* Fotoğraf gönderildiğinde kamera.js buradan çağırıyor. */
export function fotografGonderildi(hedef, veriUrl) {
  mesajEkle(hedef, { kimden: "sen", tur: "fotograf", icerik: veriUrl, saat: saatOlustur() });
  mesajlariCiz(hedef);
  cevapUret(hedef);
}
