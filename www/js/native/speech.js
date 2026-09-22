/* ========================================================
   native/speech.js
   Mikrofon (konuşmayı yazıya çevirme) ve TTS (karakterin sesli
   konuşması) için tek soyutlama katmanı.

   Native (APK) ortamında: Capacitor eklentilerini kullanır —
     @capacitor-community/speech-recognition
     @capacitor-community/text-to-speech
   Capacitor, bu eklentileri npx cap sync ile native tarafa bağlar ve
   çalışma anında otomatik olarak window.Capacitor.Plugins nesnesine
   ekler — bu proje bir JS paketleyici (bundler) kullanmadığı için
   eklentilere import değil, bu global nesne üzerinden erişiyoruz
   (Capacitor'ın "bundler'sız proje" için resmi yöntemi budur).

   Tarayıcıda (native kabuk olmadan) test edilirken: mikrofon için
   Web Speech API'ye, TTS için window.speechSynthesis'e düşer — böylece
   "npx cap sync" öncesi bile sohbeti tarayıcıda deneyebilirsin.
   ======================================================== */

function eklentiler() {
  return (typeof window !== "undefined" && window.Capacitor && window.Capacitor.Plugins) || null;
}

function nativeMi() {
  return !!(typeof window !== "undefined" && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
}

/* ---------- MİKROFON ---------- */

let dinlemeDurumu = { aktif: false };

export function mikrofonDesteginiKontrolEt() {
  if (nativeMi() && eklentiler()?.SpeechRecognition) return "native";
  if (window.SpeechRecognition || window.webkitSpeechRecognition) return "tarayici";
  return "yok";
}

/**
 * Mikrofonu açar, tek bir cümle algılayınca sonucu callback ile döndürür.
 * @param {(metin:string)=>void} sonucGeldiginde
 * @param {()=>void} basladiginda
 * @param {()=>void} bittiginde
 * @param {(hata:string)=>void} hataOlustuguda
 */
export async function dinlemeyeBasla(sonucGeldiginde, basladiginda, bittiginde, hataOlustuguda) {
  const destek = mikrofonDesteginiKontrolEt();

  if (destek === "native") {
    const { SpeechRecognition } = eklentiler();
    try {
      const izin = await SpeechRecognition.requestPermission();
      if (izin?.speechRecognition && izin.speechRecognition !== "granted") {
        hataOlustuguda("Mikrofon izni verilmedi. Ayarlar'dan izin verebilirsin.");
        return;
      }
    } catch (izinHatasi) {
      // Bazı cihazlarda requestPermission farklı şekil dönebilir — engelleme, start zaten kontrol eder.
    }

    dinlemeDurumu.aktif = true;
    basladiginda();
    try {
      const sonuc = await SpeechRecognition.start({ language: "tr-TR", maxResults: 1, prompt: "Dinliyorum...", partialResults: false, popup: false });
      dinlemeDurumu.aktif = false;
      bittiginde();
      const metin = sonuc?.matches?.[0];
      if (metin) sonucGeldiginde(metin);
    } catch (hata) {
      dinlemeDurumu.aktif = false;
      bittiginde();
      hataOlustuguda("Mikrofon başlatılamadı: " + (hata?.message || "bilinmeyen hata"));
    }
    return;
  }

  if (destek === "tarayici") {
    const TanimaSinifi = window.SpeechRecognition || window.webkitSpeechRecognition;
    const tanima = new TanimaSinifi();
    tanima.lang = "tr-TR";
    tanima.interimResults = false;
    tanima.maxAlternatives = 1;
    tanima.addEventListener("start", () => { dinlemeDurumu.aktif = true; basladiginda(); });
    tanima.addEventListener("end", () => { dinlemeDurumu.aktif = false; bittiginde(); });
    tanima.addEventListener("result", (olay) => {
      const metin = olay.results[0][0].transcript;
      if (metin) sonucGeldiginde(metin);
    });
    tanima.addEventListener("error", (olay) => hataOlustuguda("Mikrofon hatası: " + olay.error));
    tanima.start();
    return;
  }

  hataOlustuguda("Bu cihazda sesli komut desteklenmiyor.");
}

export function dinlemeyiDurdur() {
  const eklenti = eklentiler();
  if (nativeMi() && eklenti?.SpeechRecognition) {
    eklenti.SpeechRecognition.stop().catch(() => {});
  }
  dinlemeDurumu.aktif = false;
}

export function dinliyorMu() {
  return dinlemeDurumu.aktif;
}

/* ---------- SESLİ OKUMA (TTS) ---------- */

let sesListesiOnbellegi = null;

async function nativeSesListesiGetir() {
  if (sesListesiOnbellegi) return sesListesiOnbellegi;
  try {
    const { TextToSpeech } = eklentiler();
    const sonuc = await TextToSpeech.getSupportedVoices();
    sesListesiOnbellegi = sonuc?.voices || [];
  } catch (hata) {
    sesListesiOnbellegi = [];
  }
  return sesListesiOnbellegi;
}

/**
 * Bir karakterin sesiyle bir metni okur.
 * @param {object} karakter - voice: {voiceIndex, pitch, rate}
 * @param {string} metin
 */
export async function konus(karakter, metin) {
  const temizMetin = metin.replace(/\[\[[^\]]*\]\]/g, "").trim();
  if (!temizMetin) return;
  const ses = karakter.voice || { pitch: 1, rate: 1, voiceIndex: 0 };

  if (nativeMi() && eklentiler()?.TextToSpeech) {
    const { TextToSpeech } = eklentiler();
    try {
      const secenekler = { text: temizMetin, lang: "tr-TR", rate: ses.rate, pitch: ses.pitch, volume: 1.0, category: "playback" };
      const sesler = await nativeSesListesiGetir();
      const trSesler = sesler.filter((s) => (s.lang || "").toLowerCase().startsWith("tr"));
      if (trSesler.length > 0) {
        secenekler.voice = trSesler[ses.voiceIndex % trSesler.length].voiceURI || trSesler[ses.voiceIndex % trSesler.length].name;
      }
      await TextToSpeech.speak(secenekler);
    } catch (hata) {
      console.error("Native TTS hatası:", hata);
    }
    return;
  }

  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    const konusma = new SpeechSynthesisUtterance(temizMetin);
    konusma.lang = "tr-TR";
    konusma.pitch = ses.pitch;
    konusma.rate = ses.rate;
    const sesler = window.speechSynthesis.getVoices().filter((s) => s.lang?.toLowerCase().startsWith("tr"));
    if (sesler.length > 0) konusma.voice = sesler[ses.voiceIndex % sesler.length];
    window.speechSynthesis.speak(konusma);
  }
}

export function sesiDurdur() {
  if (nativeMi() && eklentiler()?.TextToSpeech) {
    eklentiler().TextToSpeech.stop().catch(() => {});
  }
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

export const speech = { mikrofonDesteginiKontrolEt, dinlemeyeBasla, dinlemeyiDurdur, dinliyorMu, konus, sesiDurdur };
