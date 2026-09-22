/* ========================================================
   ui/proaktif.js
   "3 saat sonra rastgele mesaj" yerine, karakterin GERÇEKTEN yazmak
   isteyip istemediğini birkaç sinyale bakarak tartar: sosyal ihtiyacı,
   kullanıcıyla yakınlığı, açık görev var mı, ne kadar zamandır
   konuşulmuyor. Spam olmasın diye uygulama her açılışta EN FAZLA BİR
   kere dener ve son 3 saatten kısa süre geçtiyse hiç denemez.
   ======================================================== */

import { tumKarakterler, tumGorevler, mesajlariGetir, getAyar } from "../core/state.js";
import { dusunVeCevapla } from "../core/brain.js";
import { relationships } from "../core/relationships.js";
import { mesajEkle } from "../core/state.js";
import { saatOlustur } from "../core/storage.js";
import { bildirimGoster } from "./screens.js";
import { mesajlariCiz, aktifOrtakAlanId } from "./chat.js";
import { notifications } from "../native/notifications.js";

const SON_ZIYARET_ANAHTARI = "lonca-son-ziyaret";
const MIN_SAAT_ARALIGI = 3;

function karakterPuanla(karakter) {
  const s = karakter.state;
  const iliski = relationships.iliskiGetir(karakter, "sen") || { familiarity: 0.3 };
  const acikGorevVarMi = tumGorevler().some((g) => !g.tamam);
  let puan = s.socialNeed * 0.45 + iliski.familiarity * 0.25 + s.curiosity * 0.15;
  if (acikGorevVarMi) puan += 0.1;
  if (s.stress > 0.7) puan -= 0.15; // gergin karakter kendiliğinden yazmaya daha az istekli
  return puan;
}

export async function proaktifDenemesiYap() {
  if (!getAyar("groqAnahtari")) return;
  const karakterler = tumKarakterler();
  if (karakterler.length === 0) return;

  const simdiZamani = Date.now();
  const sonZiyaret = Number(localStorage.getItem(SON_ZIYARET_ANAHTARI) || 0);
  localStorage.setItem(SON_ZIYARET_ANAHTARI, String(simdiZamani));
  if (!sonZiyaret) return;

  const saatFarki = (simdiZamani - sonZiyaret) / 3600000;
  if (saatFarki < MIN_SAAT_ARALIGI) return;

  const puanlar = karakterler.map((k) => ({ karakter: k, puan: karakterPuanla(k) })).sort((a, b) => b.puan - a.puan);
  const secilen = puanlar[0];
  if (!secilen || secilen.puan < 0.3) return; // hiçbiri yeterince istekli değilse hiç yazma

  const ek = `\n\nKullanıcı yaklaşık ${Math.round(saatFarki)} saattir uygulamayı açmamıştı, az önce geri döndü. ` +
    `Kendiliğinden, Salon'a kısa bir şey yaz — bir hatırlatma, bir fikir ya da samimi bir karşılama olabilir. Spam gibi durma, tek ve kısa bir mesaj yeter.`;

  try {
    const sonuc = await dusunVeCevapla({ karakter: secilen.karakter, hedefId: "salon", tur: "ortak-alan", ekBaglam: ek });
    if (!sonuc.mesaj) return; // karakter bu sefer sessiz kalmayı seçti, spam yok
    mesajEkle("salon", { kimden: secilen.karakter.id, tur: "metin", icerik: sonuc.mesaj, saat: saatOlustur() });
    if (aktifOrtakAlanId === "salon") mesajlariCiz("salon");
    bildirimGoster(secilen.karakter.isim + " Salon'a bir şey yazdı.");
    notifications.local(secilen.karakter.isim, sonuc.mesaj.slice(0, 120));
  } catch (hata) {
    /* Proaktif mesaj kritik değil, sessizce geç. */
  }
}
