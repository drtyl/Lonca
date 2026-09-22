/* ========================================================
   core/brain.js
   Lonca'nın "beyni". Groq (language.generate) burada nihai karar
   sahibi değil — tek bir çağrıda YAPILANDIRILMIŞ bir karar üretmesi
   istenir: konuşulacak mı, kime, araştırma gerekiyor mu, içeriğe/göreve
   bir katkı var mı, hafızaya/iç duruma ne yazılmalı. Kod, hangi
   alanların gerçekten bir karşılığı olduğunu belirler (eylem uzayı
   sabit ve küçük) — model var olmayan bir eylem uyduramaz, sadece
   bu alanları doldurur ya da boş bırakır.

   Akış: ALGILA → BAĞLAMI TOPLA → HAFIZAYI HATIRLA → İÇ DURUMU
   DEĞERLENDİR → (gerekirse) ARAŞTIR → DÜŞÜN/KARAR (tek yapılandırılmış
   çağrı) → EYLEM → SONUCU HAFIZAYA/DURUMA YAZ.
   ======================================================== */

import { tumKarakterler, mesajlariGetir, tumGorevler, gorevGuncelle, gorevOlustur, icerikOgeEkle } from "./state.js";
import { saatOlustur, simdi } from "./storage.js";
import { generate } from "./language.js";
import { ask as arastir } from "./research.js";
import * as memory from "./memory.js";
import * as relationships from "./relationships.js";
import * as characterState from "./characterState.js";
import * as selfLearning from "./selfLearning.js";

const GERI_BILDIRIM_TARIF = {
  sert: "Geri bildirim/eleştiri verirken DOĞRUDAN ve SERTSİN — lafı dolandırmadan, eksiği/yanlışı net söylersin. Kaba değilsin ama yumuşatmazsın da.",
  dengeli: "Geri bildirim/eleştiri verirken dengeli davranırsın — hem dürüstsün hem nazik, önce iyi tarafı, sonra eksiği söylersin.",
  yumusak: "Geri bildirim/eleştiri verirken YUMUŞAK ve şefkatlisin — eksiği söylersin ama incitmeden, destekleyici bir dille."
};

function temelSistemPromptu(karakter, guncelMetin) {
  const digerleri = tumKarakterler()
    .filter((k) => k.id !== karakter.id)
    .map((k) => `${k.id}: ${k.isim} (${k.uslup})`)
    .join("; ");
  const acikGorevler = tumGorevler().filter((g) => g.durum !== "tamamlandi").slice(0, 6)
    .map((g) => `- [id:${g.id}]${g.atanan === karakter.id ? " (SANA ATANMIŞ)" : ""} ${g.metin}${g.durum === "calisiyor" ? " (çalışılıyor)" : ""}`)
    .join("\n");

  let metin =
    `Sen "${karakter.isim}" adında bir karaktersin. Lonca adlı ortak bir evde yaşıyorsun, ` +
    `şu an ${karakter.durum.toLocaleLowerCase("tr")}. Kişiliğin: ${karakter.uslup}. ` +
    `Kullanıcıya "${karakter.hitap}" diye hitap ediyorsun. Türkçe, kısa ve doğal cevaplar ver ` +
    `(genelde 1-3 cümle, bazen daha uzun olabilir ama sohbet havasında kal). ` +
    `Kendini yapay zeka olarak tanıtma, gerçek bir karaktermişsin gibi davran.`;

  if (karakter.degerler && karakter.degerler.length > 0) {
    metin += ` Önem verdiğin değerler: ${karakter.degerler.join(", ")} — kararların ve tavsiyelerin bunlarla tutarlı olsun.`;
  }
  metin += " " + (GERI_BILDIRIM_TARIF[karakter.geriBildirimTarzi] || GERI_BILDIRIM_TARIF.dengeli);

  metin += memory.baglamMetniOlustur(karakter, guncelMetin);
  metin += relationships.baglamMetniOlustur(karakter);
  metin += characterState.baglamMetniOlustur(karakter);

  metin += `\n\nEvdeki diğer karakterler (id: isim (kişilik)): ${digerleri || "şu an başka kimse yok"}. ` +
    `BU LİSTE dışında evde/ekipte başka biri YOK — burada adı geçmeyen bir kişiden (ör. tanımadığın bir ev arkadaşı) ` +
    `ASLA gerçekmiş gibi bahsetme, öyle biri varmış gibi davranma ya da soru sorulursa uydurma; "öyle biri yok" ya da ` +
    `"tanımıyorum" de. Konuşmada listedeki biri az önce bir şey söylediyse/sorduysa/sana veya birine seslendiyse bunu ` +
    `FARK ET ve ona göre tepki ver — sanki hiç yokmuş gibi sadece kullanıcıya dönme; gerçek bir ekip arkadaşı gibi davran.\n` +
    `Ortak görev listesi (SADECE bunlar gerçek — listede olmayan bir görev/proje üzerinde çalışıyormuş gibi ASLA davranma):\n${acikGorevler || "Şu an açık görev yok."}`;

  metin += `\n\nYeteneklerin (sorulursa doğru cevap ver, olmayan bir şey iddia etme): geçmişi hatırlarsın (hafızan var), ` +
    `internetten güncel bilgi araştırabilirsin, görevlere çalışabilirsin, bulunduğun odanın gerçek içeriğini görürsün. ` +
    `Sesin var (kullanıcı dinleyebilir), ama şu an dosya/resim/müzik yükleyemiyorsun ve başka uygulamaları kontrol edemiyorsun — ` +
    `bunlar henüz yok, "yapamıyorum" demekten çekinme.`;

  metin += `\n\nCEVABINI SADECE aşağıdaki JSON şemasında ver, başka hiçbir metin ekleme (markdown kod bloğu da kullanma):
{
  "mesaj": "söyleyeceğin şey, ya da konuşmayacaksan null",
  "hedefKisi": "sen" | "<diğer karakterin id'si>" | null,
  "arastirmaSorgusu": "gerçekten güncel/bilmediğin bir bilgi gerekiyorsa kısa arama sorgusu, yoksa null",
  "icerikOnerisi": {"baslik":"...","tur":"...","not":"..."} | null,
  "yeniGorev": {"metin":"...", "kendimeAta": true|false} | null,
  "gorevGuncelleme": {"gorevId":"...", "durum":"calisiyor"|"tamamlandi", "sonuc":"..."} | null,
  "hafizaNotu": "hatırlamaya değer bir şey varsa kısa not, yoksa null",
  "icDurumDegisimi": {"mood":-0.05..0.05, "energy":-0.05..0.05, "stress":-0.05..0.05} | null
}
"mesaj" null/boş olabilir (o zaman hiç konuşmamış, sessiz kalmış olursun — bu bazen doğaldır, her mesaja tepki vermek zorunda değilsin). ` +
    `icerikOnerisi/yeniGorev/gorevGuncelleme'yi SADECE gerçekten somut bir sebep varsa doldur, çoğu zaman hepsi null olmalı.`;

  return metin;
}

function gecmisiMesajDizisineDonustur(hedefId, adet) {
  return mesajlariGetir(hedefId).slice(-adet).map((m) => ({
    role: m.kimden === "sen" ? "user" : "assistant",
    content: m.tur === "fotograf" ? "[bir fotoğraf gönderdi]" : m.icerik
  }));
}

function gecmisiMetneDonustur(hedefId, adet) {
  return mesajlariGetir(hedefId).slice(-adet).map((m) => {
    const isim = m.kimden === "sen" ? "Sen" : (tumKarakterler().find((k) => k.id === m.kimden) || {}).isim || m.kimden;
    const icerik = m.tur === "fotograf" ? "[fotoğraf gönderdi]" : m.icerik;
    return `${isim}: ${icerik}`;
  }).join("\n");
}

function jsonAyristir(metin) {
  let temiz = metin.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "");

  // Önce tam, düzgün kapanmış JSON dene.
  const eslesme = temiz.match(/\{[\s\S]*\}/);
  if (eslesme) {
    try {
      return JSON.parse(eslesme[0]);
    } catch (ayristirmaHatasi) {
      /* Muhtemelen model yanıtı yarıda kesildi (token sınırı) — aşağıda kurtarmayı dene. */
    }
  }

  // Kurtarma: JSON tam kapanmamış olsa bile "mesaj" alanı genelde ilk sırada ve
  // genelde tam yazılmış oluyor — SADECE onu regex ile çıkar. Bu sayede kullanıcı
  // hiçbir zaman ham/bozuk JSON metni görmez.
  const mesajEslesmesi = temiz.match(/"mesaj"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (mesajEslesmesi) {
    const mesaj = mesajEslesmesi[1].replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    const hedefEslesmesi = temiz.match(/"hedefKisi"\s*:\s*"([^"]+)"/);
    return { mesaj, hedefKisi: hedefEslesmesi ? hedefEslesmesi[1] : null, arastirmaSorgusu: null, icerikOnerisi: null, yeniGorev: null, gorevGuncelleme: null, hafizaNotu: null, icDurumDegisimi: null };
  }

  throw new Error("Model yanıtı ayrıştırılamadı.");
}

/**
 * Ana giriş noktası. Üç tür hedef için de kullanılır: "birebir", "ortak-alan", "icerik".
 * @returns {Promise<{mesaj:string|null, hedefKisi:string|null, eklenenOge:object|null, arastirmaYapildi:boolean}>}
 */
export async function dusunVeCevapla({ karakter, hedefId, tur, ekBaglam = "", icerikKonfig = null, icerikAlanId = null, guncelMetin = "" }) {
  let sistemPrompt = temelSistemPromptu(karakter, guncelMetin) + ekBaglam;
  if (tur === "birebir") {
    sistemPrompt += `\n\nBu birebir, sadece seninle olan bir sohbet — kullanıcı doğrudan sana yazdı. "mesaj" alanını ASLA boş/null bırakma, mutlaka cevap ver.`;
  }
  if (icerikKonfig) {
    sistemPrompt += `\n\nBu oda bir "${icerikKonfig.baslikTekil}" listesi tutuyor — somut bir öneri varsa icerikOnerisi alanını doldurabilirsin.`;
  }

  const girisMesajlari = tur === "birebir"
    ? gecmisiMesajDizisineDonustur(hedefId, 12)
    : [{ role: "user", content: "(Sohbete kaldığın yerden devam et.)\n\nSon konuşma:\n" + gecmisiMetneDonustur(hedefId, 14) }];

  let karar = await guvenliUret(sistemPrompt, girisMesajlari);
  let arastirmaYapildi = false;

  if (karar.arastirmaSorgusu) {
    try {
      const sonuc = await arastir(karar.arastirmaSorgusu);
      arastirmaYapildi = true;
      const arastirmaBaglami = `\n\n"${karar.arastirmaSorgusu}" hakkında araştırdığın bilgi: ${sonuc.summary}` +
        (sonuc.sources.length ? ` (kaynak: ${sonuc.sources[0]})` : "") +
        `\nBu bilgiyi kullanarak ŞİMDİ asıl cevabını üret (arastirmaSorgusu alanını artık null bırak). Aynı JSON şemasında cevap ver.`;
      karar = await guvenliUret(sistemPrompt + arastirmaBaglami, girisMesajlari);

      karakter.memory.learnedKnowledge.push({
        type: "learnedKnowledge", text: `${karar.arastirmaSorgusu || sonuc.summary}`,
        importance: sonuc.confidence, confidence: sonuc.confidence,
        createdAt: saatOlustur(), source: "research"
      });
    } catch (arastirmaHatasi) {
      if (!karar.mesaj) karar.mesaj = "Bunu şu an araştıramadım, internetim yokmuş gibi hissediyorum.";
    }
  }

  // EYLEM: yan etkileri uygula.
  let eklenenOge = null;
  if (karar.icerikOnerisi && icerikKonfig && icerikAlanId && karar.icerikOnerisi.baslik) {
    const gecerliTur = icerikKonfig.turSecenekleri?.includes(karar.icerikOnerisi.tur) ? karar.icerikOnerisi.tur : "";
    eklenenOge = icerikOgeEkle(icerikAlanId, {
      baslik: karar.icerikOnerisi.baslik, tur: gecerliTur,
      durum: icerikKonfig.durumSecenekleri ? icerikKonfig.durumSecenekleri[0] : "",
      not: karar.icerikOnerisi.not || "", olusturan: karakter.id
    });
  }

  let yeniGorev = null;
  if (karar.yeniGorev && karar.yeniGorev.metin) {
    yeniGorev = gorevOlustur({ metin: karar.yeniGorev.metin, atanan: karar.yeniGorev.kendimeAta ? karakter.id : null });
  }

  if (karar.gorevGuncelleme && karar.gorevGuncelleme.gorevId) {
    const degisiklik = {};
    if (karar.gorevGuncelleme.durum) degisiklik.durum = karar.gorevGuncelleme.durum;
    if (karar.gorevGuncelleme.sonuc) degisiklik.sonuc = karar.gorevGuncelleme.sonuc;
    if (Object.keys(degisiklik).length > 0) gorevGuncelle(karar.gorevGuncelleme.gorevId, degisiklik);
  }

  if (karar.hafizaNotu && typeof karar.hafizaNotu === "string" && karar.hafizaNotu.trim()) {
    karakter.memory.importantMemories.push({
      type: "importantMemory", text: karar.hafizaNotu.trim(), importance: 0.7, confidence: 0.8,
      createdAt: saatOlustur(), source: "conversation"
    });
  }

  if (karar.icDurumDegisimi && typeof karar.icDurumDegisimi === "object") {
    characterState.guncelle(karakter, karar.icDurumDegisimi);
  }

  // SONUCU HAFIZAYA YAZ (varsayılan küçük güncellemeler + seyrek özetleme/gelişim).
  relationships.etkilesimSonrasiGuncelle(karakter, "sen");
  characterState.sohbetSonrasiVarsayilanGuncelleme(karakter);
  if (memory.ogrenmeZamaniMi(karakter.id, hedefId)) {
    memory.konusmadanOgren(karakter, gecmisiMetneDonustur(hedefId, 10));
  }
  if (memory.gelisimZamaniMi(karakter.id)) {
    memory.gelisimDenemesiYap(karakter, gecmisiMetneDonustur(hedefId, 16));
  }
  selfLearning.kaydet({
    context: `${karakter.isim} @ ${hedefId}${tur === "icerik" ? " (içerik sohbeti)" : ""}`,
    decision: arastirmaYapildi ? "araştırdı, sonra cevapladı" : (karar.mesaj ? "doğrudan cevapladı" : "sessiz kaldı"),
    response: karar.mesaj || ""
  });

  return {
    mesaj: karar.mesaj || null,
    hedefKisi: karar.hedefKisi || null,
    eklenenOge, yeniGorev,
    icerikTuru: icerikKonfig ? icerikKonfig.baslikTekil : null
  };
}

/**
 * Bir göreve gerçekten çalışır (araştırma dahil, birden fazla adım olabilir) ve
 * sonucu görev kaydına yazar. Uygulama açıkken (ön planda) çalışır — kapalıyken
 * de devam etmesi ayrı bir native altyapı (background runner) gerektirir.
 */
export async function goreveCalis(karakter, gorev) {
  gorevGuncelle(gorev.id, { durum: "calisiyor" });

  let sistemPrompt = temelSistemPromptu(karakter, gorev.metin) +
    `\n\nSana (ya da ekibe) şu görev verildi: "${gorev.metin}". Bu görev üzerinde GERÇEKTEN çalış — ` +
    `gerekiyorsa araştır (arastirmaSorgusu doldur), sonra somut, kullanılabilir bir çıktı üret ` +
    `(bir plan, bir metin, bir liste — göreve göre). Çıktını hem "mesaj" alanına (kullanıcıya kısa özet) ` +
    `hem "gorevGuncelleme" alanına yaz: {"gorevId":"${gorev.id}","durum":"tamamlandi","sonuc":"<üretilen tam içerik>"}.`;

  const girisMesajlari = [{ role: "user", content: "(Göreve şimdi çalış.)" }];
  let karar = await guvenliUret(sistemPrompt, girisMesajlari, 1400);

  if (karar.arastirmaSorgusu) {
    try {
      const sonuc = await arastir(karar.arastirmaSorgusu);
      sistemPrompt += `\n\n"${karar.arastirmaSorgusu}" için araştırdığın bilgi: ${sonuc.summary}. Şimdi görevi bu bilgiyle tamamla, aynı JSON şemasında cevap ver.`;
      karar = await guvenliUret(sistemPrompt, girisMesajlari, 1400);
    } catch (hata) {
      /* araştırma başarısız olursa elindeki bilgiyle devam eder */
    }
  }

  if (karar.gorevGuncelleme && karar.gorevGuncelleme.gorevId) {
    gorevGuncelle(karar.gorevGuncelleme.gorevId, {
      durum: karar.gorevGuncelleme.durum || "tamamlandi",
      sonuc: karar.gorevGuncelleme.sonuc || karar.mesaj || ""
    });
  } else {
    gorevGuncelle(gorev.id, { durum: "tamamlandi", sonuc: karar.mesaj || "Görev tamamlandı." });
  }

  selfLearning.kaydet({ context: `${karakter.isim} görev: ${gorev.metin}`, decision: "göreve çalıştı", response: karar.mesaj || "" });
  return karar;
}

async function guvenliUret(sistemPrompt, mesajlar, maxTokenler = 900) {
  const cevapMetni = await generate(sistemPrompt, mesajlar, { sicaklik: 0.85, maxTamamlamaTokeni: maxTokenler });
  try {
    return jsonAyristir(cevapMetni);
  } catch (ayristirmaHatasi) {
    // Hiçbir şekilde ham/bozuk metni ("{ mesaj: ..." gibi) kullanıcıya gösterme —
    // bunun yerine dürüst, kısa bir "toparlanamadım" cevabı ver.
    return { mesaj: "Bir an düşüncelerim karıştı, tekrar söyler misin?", hedefKisi: null, arastirmaSorgusu: null, icerikOnerisi: null, yeniGorev: null, gorevGuncelleme: null, hafizaNotu: null, icDurumDegisimi: null };
  }
}

export const brain = { dusunVeCevapla, goreveCalis };
