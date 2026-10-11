/* Ses: karakterin konuşması (TTS) ve seni dinlemesi (konuşma tanıma).
 * Telefonda Android'in kendi motorları (native köprü), tarayıcıda Web Speech API yedeği.
 */
(function () {
  const N = window.LoncaNative && typeof window.LoncaNative.konus === 'function' ? window.LoncaNative : null;
  let dinleyici = {};      // { sonuc, kismi, durum, hata, seviye }
  let konusmaBitince = null;
  let konusuyor = false;

  function konusmaBitti() {
    if (!konusuyor) return;
    konusuyor = false;
    Ses.onKonusma && Ses.onKonusma(false);
    const f = konusmaBitince; konusmaBitince = null; if (f) f();
  }

  // Native'den gelen olaylar
  window.__loncaSes = function (olay, veri) {
    switch (olay) {
      case 'konusmaBasladi': Ses.onKonusma && Ses.onKonusma(true); break;
      case 'konusmaBitti': konusmaBitti(); break;
      case 'dinliyor': dinleyici.durum && dinleyici.durum('dinliyor'); break;
      case 'dusunuyor': dinleyici.durum && dinleyici.durum('duydum'); break;
      case 'seviye': dinleyici.seviye && dinleyici.seviye(parseFloat(veri) || 0); break;
      case 'kismi': dinleyici.kismi && dinleyici.kismi(veri); break;
      case 'sonuc': dinleyici.sonuc && dinleyici.sonuc(veri || ''); break;
      case 'dinlemeHatasi': dinleyici.hata && dinleyici.hata(parseInt(veri, 10) || 0, ''); break;
      case 'hata': dinleyici.hata && dinleyici.hata(-1, veri); break;
    }
  };

  // Tarayıcı yedeği
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let tanima = null;

  const Ses = {
    onKonusma: null,
    destek() { return { konusma: !!N || 'speechSynthesis' in window, dinleme: !!N || !!SR }; },

    /** Metni sesli okur; bitince söz (promise) çözülür */
    konus(metin, { perde = 1.1, hiz = 1 } = {}) {
      metin = String(metin || '').replace(/[*_#`>]/g, '').trim();
      return new Promise(ok => {
        if (!metin) return ok();
        Ses.sus();
        konusuyor = true; konusmaBitince = ok;
        // emniyet: motor hiç "bitti" demezse metin uzunluğuna göre kendimiz bitiririz
        const tahmini = 1500 + metin.length * 90 / hiz;
        setTimeout(() => { if (konusmaBitince === ok) konusmaBitti(); }, tahmini + 4000);
        if (N) { Ses.onKonusma && Ses.onKonusma(true); N.konus(metin, perde, hiz); return; }
        if ('speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance(metin);
          u.lang = 'tr-TR'; u.pitch = perde; u.rate = hiz;
          u.onstart = () => Ses.onKonusma && Ses.onKonusma(true);
          u.onend = u.onerror = () => konusmaBitti();
          Ses.onKonusma && Ses.onKonusma(true);
          speechSynthesis.speak(u);
        } else {
          Ses.onKonusma && Ses.onKonusma(true);
          setTimeout(konusmaBitti, tahmini);
        }
      });
    },
    sus() {
      if (N) N.sus(); else if ('speechSynthesis' in window) speechSynthesis.cancel();
      konusmaBitti();
    },

    /** Bir kez dinler. Olaylar: durum, kismi, sonuc, hata, seviye */
    dinle(olaylar) {
      dinleyici = olaylar || {};
      if (N) { N.dinle(); return true; }
      if (!SR) { setTimeout(() => dinleyici.hata && dinleyici.hata(-1, 'Bu cihazda konuşma tanıma yok.'), 0); return false; }
      try {
        tanima = new SR(); tanima.lang = 'tr-TR'; tanima.interimResults = true; tanima.maxAlternatives = 1;
        let son = '';
        tanima.onstart = () => dinleyici.durum && dinleyici.durum('dinliyor');
        tanima.onresult = e => {
          const r = e.results[e.results.length - 1]; son = r[0].transcript;
          if (r.isFinal) dinleyici.sonuc && dinleyici.sonuc(son); else dinleyici.kismi && dinleyici.kismi(son);
        };
        tanima.onerror = e => dinleyici.hata && dinleyici.hata(e.error === 'no-speech' ? 6 : -1, e.error);
        tanima.start();
        return true;
      } catch (e) { dinleyici.hata && dinleyici.hata(-1, String(e)); return false; }
    },
    dinlemeyiBirak() {
      dinleyici = {};
      if (N) N.dinlemeyiBirak(); else if (tanima) { try { tanima.abort(); } catch (e) {} }
    },
    konusuyorMu() { return konusuyor; }
  };
  window.Ses = Ses;
})();
