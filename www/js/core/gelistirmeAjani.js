/* ========================================================
   core/gelistirmeAjani.js
   "Geliştirme İste" isteğini alıp, hangi dosya(lar)a dokunulacağına
   karar veren ve değişikliği üreten katman. Groq'u kullanır ama
   KARARI o vermez — kapsam (en fazla 2 dosya, bilinen dosya listesi)
   ve güvenlik (sözdizimi kontrolü, PR = insan onayı) kodda sabit.
   ======================================================== */

import { generate } from "./language.js";
import { dosyaGetir, oneriyiGonder } from "./gelistirme.js";

const MAX_DOSYA = 2;

/* Kod tabanının kısa haritası — ajan hangi dosyaya dokunacağına
   bunu okuyarak karar veriyor. Yeni bir dosya eklenirse buraya da
   eklenmesi gerekir (bu dosyayı da ajan değiştirebilir). */
const DOSYA_HARITASI = [
  { yol: "www/js/data/karakterler.js", aciklama: "Başlangıçtaki örnek karakter (Atlas)" },
  { yol: "www/js/data/ortakalanlar.js", aciklama: "Sabit ortak alanlar: Salon, Mutfak, Atölye, Kütüphane, Sanat Odası, Film Odası, Çalışma Odası — isim, renk, ikon, oda içeriği türü (kitap/tarif/araştırma vb.)" },
  { yol: "www/js/core/brain.js", aciklama: "Karakterlerin nasıl 'düşünüp' cevap ürettiği — sistem promptu, JSON karar şeması, araştırma/görev/içerik eylemleri" },
  { yol: "www/js/core/characterState.js", aciklama: "Karakterin iç durumu (mood/energy/curiosity/socialNeed/focus/stress)" },
  { yol: "www/js/core/relationships.js", aciklama: "Karakterler arası ve kullanıcıyla ilişki (familiarity/trust/affinity)" },
  { yol: "www/js/core/memory.js", aciklama: "Karakter hafızası — ne hatırlanır, nasıl özetlenir" },
  { yol: "www/js/ui/chat.js", aciklama: "Sohbet ekranlarının mantığı — mesaj gönderme, hangi karakterin cevap vereceği, zincirleme" },
  { yol: "www/js/ui/gorevler.js", aciklama: "Görev listesi — ekleme, atama, tekrar, hesap verme kontrolü" },
  { yol: "www/js/ui/icerik.js", aciklama: "Oda içerik listeleri (kitaplar, tarifler vb.) ve Çalışma Odası zamanlayıcısı" },
  { yol: "www/js/ui/wizard.js", aciklama: "Yeni karakter oluşturma sihirbazı" },
  { yol: "www/js/ui/karakterProfili.js", aciklama: "Var olan bir karakteri düzenleme sayfası" },
  { yol: "www/js/ui/ayarlar.js", aciklama: "Ayarlar ekranı mantığı" },
  { yol: "www/style.css", aciklama: "Tüm görsel stiller (renkler, boşluklar, animasyonlar)" },
  { yol: "www/index.html", aciklama: "Tüm ekranların HTML yapısı" }
];

function dosyaHaritasiMetni() {
  return DOSYA_HARITASI.map((d) => `- ${d.yol}: ${d.aciklama}`).join("\n");
}

function jsonAyristir(metin) {
  const temiz = metin.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "");
  const eslesme = temiz.match(/\{[\s\S]*\}/);
  if (!eslesme) throw new Error("Ayrıştırılamadı");
  return JSON.parse(eslesme[0]);
}

/* Çok kaba ama gerçek bir güvenlik ağı: JS dosyaları için sözdizimini
   dener (import/export satırlarını geçici çıkarıp Function() ile
   derlemeyi dener) — HTML/CSS için sadece temel denge kontrolü yapar. */
function sozdizimiGecerliMi(yol, icerik) {
  try {
    if (yol.endsWith(".js")) {
      const test = icerik.replace(/^\s*(import|export)\b[^\n]*\n/gm, "");
      // eslint-disable-next-line no-new-func
      new Function(test);
      return true;
    }
    if (yol.endsWith(".html")) {
      const ac = (icerik.match(/<section/g) || []).length;
      const kapa = (icerik.match(/<\/section>/g) || []).length;
      return ac === kapa;
    }
    return true; // CSS için basit bir kontrol yeterince güvenilir değil, atlanıyor
  } catch (hata) {
    return false;
  }
}

/**
 * @param {string} istek Kullanıcının doğal dille isteği.
 * @returns {Promise<{uygulanabilir:boolean, sebep:string|null, aciklama:string, dosyalar:string[]}>}
 */
export async function oneriUret(istek) {
  // 1) Hangi dosya(lar)?
  const secimPromptu =
    `Bir web uygulamasının kod tabanı haritası aşağıda. Kullanıcının isteğini karşılamak için ` +
    `EN FAZLA ${MAX_DOSYA} dosyaya dokunman gerekiyor. İstek çok büyük/belirsiz/yeni bir sistem gerektiriyorsa ` +
    `ya da hiçbir dosyayla ilgisi yoksa uygulanabilir:false döndür.\n\n` +
    `Dosya haritası:\n${dosyaHaritasiMetni()}\n\n` +
    `SADECE şu JSON formatında cevap ver: {"uygulanabilir":true|false,"sebep":"...","dosyalar":["yol1","yol2"]}`;

  let secim;
  try {
    const cevap = await generate("Sadece istenen JSON formatında cevap ver.", [{ role: "user", content: secimPromptu + "\n\nİstek: " + istek }], { sicaklik: 0.3, maxTamamlamaTokeni: 300 });
    secim = jsonAyristir(cevap);
  } catch (hata) {
    return { uygulanabilir: false, sebep: "İsteği anlayamadım, biraz daha açık yazar mısın?", aciklama: "", dosyalar: [] };
  }

  if (!secim.uygulanabilir || !secim.dosyalar || secim.dosyalar.length === 0) {
    return { uygulanabilir: false, sebep: secim.sebep || "Bu istek şu an için çok büyük ya da belirsiz — daha küçük, tek bir değişiklik olarak dener misin?", aciklama: "", dosyalar: [] };
  }

  const dosyalar = secim.dosyalar.filter((y) => DOSYA_HARITASI.some((d) => d.yol === y)).slice(0, MAX_DOSYA);
  if (dosyalar.length === 0) {
    return { uygulanabilir: false, sebep: "Hangi dosyaya dokunacağımı belirleyemedim.", aciklama: "", dosyalar: [] };
  }

  // 2) Güncel içerikleri çek.
  const mevcutlar = [];
  for (const yol of dosyalar) {
    const dosya = await dosyaGetir(yol);
    if (!dosya) return { uygulanabilir: false, sebep: `"${yol}" GitHub'da bulunamadı.`, aciklama: "", dosyalar: [] };
    mevcutlar.push({ yol, ...dosya });
  }

  // 3) Değişikliği üret.
  const degisiklikPromptu =
    `Aşağıdaki dosya(lar)ı, kullanıcının isteğine göre değiştir. Her dosyanın TAM, eksiksiz yeni halini yaz ` +
    `(sadece değişen kısmı değil, dosyanın tamamını). Kodun geri kalanının çalışma şeklini bozma, sadece istenen ` +
    `değişikliği yap. Türkçe değişken/yorum stiline sadık kal.\n\n` +
    mevcutlar.map((m) => `--- DOSYA: ${m.yol} ---\n${m.icerik}`).join("\n\n") +
    `\n\nİstek: ${istek}\n\n` +
    `SADECE şu JSON formatında cevap ver (yeniIcerik alanlarında gerçek satır sonları için \\n kullan): ` +
    `{"aciklama":"kullanıcıya gösterilecek, 1-2 cümlelik sade bir özet","degisiklikler":[{"yol":"...","yeniIcerik":"..."}]}`;

  let sonuc;
  try {
    const cevap = await generate("Sadece istenen JSON formatında cevap ver, başka hiçbir şey yazma.", [{ role: "user", content: degisiklikPromptu }], { sicaklik: 0.4, maxTamamlamaTokeni: 4000 });
    sonuc = jsonAyristir(cevap);
  } catch (hata) {
    return { uygulanabilir: false, sebep: "Değişikliği üretirken bir sorun oldu, tekrar dener misin?", aciklama: "", dosyalar: [] };
  }

  if (!sonuc.degisiklikler || sonuc.degisiklikler.length === 0) {
    return { uygulanabilir: false, sebep: "Somut bir değişiklik üretemedim.", aciklama: "", dosyalar: [] };
  }

  // 4) Sözdizimi kontrolü — bariz bozuk kod asla PR'a düşmesin.
  for (const d of sonuc.degisiklikler) {
    if (!sozdizimiGecerliMi(d.yol, d.yeniIcerik)) {
      return { uygulanabilir: false, sebep: `"${d.yol}" için ürettiğim kod bozuk çıktı, güvenlik gereği bunu PR'a açmıyorum.`, aciklama: "", dosyalar: [] };
    }
  }

  // 5) GitHub'a gönder.
  const degisiklikler = sonuc.degisiklikler.map((d) => {
    const mevcut = mevcutlar.find((m) => m.yol === d.yol);
    return { yol: d.yol, yeniIcerik: d.yeniIcerik, sha: mevcut ? mevcut.sha : null };
  });

  const { prNo, prUrl } = await oneriyiGonder({ istek, aciklama: sonuc.aciklama, degisiklikler });

  return { uygulanabilir: true, sebep: null, aciklama: sonuc.aciklama, dosyalar, prNo, prUrl };
}

export const gelistirmeAjani = { oneriUret };
