/* Zihin: karakterin cevap verme katmanı.
 * 1) Önce kendi kuralları (selam, nasılsın, evde ne var...) → internet/API gerektirmez, bedava.
 * 2) Kural yoksa ve Ayarlar'da Groq anahtarı varsa → Groq'a sorar.
 * 3) İkisi de yoksa dürüstçe bilmediğini söyler.
 *
 * Uydurmama kuralı: karakter sadece GERÇEK veriden konuşur (gerçek ruh hali ve sebebi,
 * evdeki gerçek eşyalar, gerçek konumu). Yapay zekâya da bu bilgiler + "uydurma" kuralı verilir.
 */
(function () {
  const kucuk = s => String(s || '').toLocaleLowerCase('tr-TR').replace(/[.,!?;:]+/g, ' ').replace(/\s+/g, ' ').trim();
  const sec = l => l[Math.floor(Math.random() * l.length)];
  const once = z => {
    const d = Math.round((Date.now() - z) / 60000);
    if (d < 1) return 'az önce'; if (d < 60) return d + ' dakika önce';
    const s = Math.round(d / 60); if (s < 24) return s + ' saat önce'; return Math.round(s / 24) + ' gün önce';
  };

  function ayar() { return Depo.okuJSON('/ayarlar.json', {}); }

  // ---- Türkçe ekler (isim ve oda adlarına doğru ek getirmek için)
  const UNLU = 'aeıioöuüAEIİOÖUÜ', KALIN = 'aıouAIOU', SERT = 'fstkçşhpFSTKÇŞHP';
  function sonUnlu(s) { for (let i = s.length - 1; i >= 0; i--) if (UNLU.includes(s[i])) return s[i]; return 'e'; }
  const Dil = {
    /** Nova → Nova'ya, Atlas → Atlas'a, Kütüphane → Kütüphane'ye */
    yonelme(ad) { const k = KALIN.includes(sonUnlu(ad)); const u = UNLU.includes(ad.slice(-1)); return ad + "'" + (u ? 'y' : '') + (k ? 'a' : 'e'); },
    /** Mutfak → Mutfak'ta, Salon → Salon'da, Sanat Odası → Sanat Odası'nda */
    bulunma(ad) {
      if (/(sı|si|su|sü)$/.test(ad)) return ad + "'n" + (KALIN.includes(sonUnlu(ad)) ? 'da' : 'de');
      const k = KALIN.includes(sonUnlu(ad)), d = SERT.includes(ad.slice(-1)) ? 't' : 'd';
      return ad + "'" + d + (k ? 'a' : 'e');
    }
  };
  const DORT = { a: 'ı', ı: 'ı', e: 'i', i: 'i', o: 'u', u: 'u', ö: 'ü', ü: 'ü', A: 'ı', I: 'ı', E: 'i', İ: 'i', O: 'u', U: 'u', Ö: 'ü', Ü: 'ü' };
  /** Nova → Nova'nın, Atlas → Atlas'ın, Nexsus → Nexsus'un */
  Dil.ilgi = ad => ad + "'" + (UNLU.includes(ad.slice(-1)) ? 'n' : '') + DORT[sonUnlu(ad)] + 'n';
  /** Nova → Nova'dan, Atlas → Atlas'tan */
  Dil.ayrilma = ad => ad + "'" + (SERT.includes(ad.slice(-1)) ? 't' : 'd') + (KALIN.includes(sonUnlu(ad)) ? 'an' : 'en');
  window.Dil = Dil;

  /** Evde yaşayan herkes, gerçek konumlarıyla */
  function sakinler() {
    const l = (window.App && App.evdekiler) ? App.evdekiler() : [];
    return l.map(y => ({ y, ad: y.v.ad, tur: y.v.tur, oda: Ev.odaBul(y.x, y.z).ad, ne: y.hareket === 'kos' ? 'koşuyor' : y.hareket === 'yuru' ? 'yürüyor' : 'duruyor' }));
  }

  function sonSebep(y, isaret) {
    // ruh halini en çok etkileyen yakın tarihli gerçek olay
    const l = y.v.olaylar.slice().reverse().filter(o => Date.now() - o.z < 6 * 3600e3 && o.etki && o.etki.includes('mutluluk'));
    const o = l.find(o => isaret > 0 ? o.etki.includes('+') : o.etki.includes('-'));
    return o || null;
  }

  function nerede(y) {
    const oda = Ev.odaBul(y.x, y.z).ad;
    const ne = y.hareket === 'kos' ? 'koşuyorum' : y.hareket === 'yuru' ? 'yürüyorum' : 'duruyorum';
    return { oda, ne, odada: Dil.bulunma(oda) };
  }

  function evOzeti() {
    const l = Ev.esyalar();
    if (!l.length) return 'Evde henüz eklenmiş bir sayfa ya da araç yok.';
    return 'Evde şunlar var: ' + l.map(e => e.ad + ' (' + Ev.odaBul(e.x, e.z).ad + ')').join(', ') + '.';
  }

  // ---------------------------------------------------------------- 1) KURALLAR
  function kural(metin, y) {
    const m = kucuk(metin), d = y.v.durum, ad = y.v.ad;
    const ifade = y.ifade();

    if (/^(selam|merhaba|sa|slm|hey|hi|günaydın|iyi akşamlar|iyi geceler|naber|nbr)\b/.test(m) && m.split(' ').length <= 4) {
      const saat = new Date().getHours();
      const zaman = saat < 11 ? 'Günaydın' : saat < 18 ? 'Selam' : 'İyi akşamlar';
      if (ifade === 'yorgun') return zaman + '. Biraz yorgunum ama buradayım.';
      if (ifade === 'uzgun') return zaman + '. Seni gördüğüme sevindim.';
      return sec([zaman + '! Bugün ne yapalım?', zaman + '! Seni görmek güzel.', zaman + '! Buradayım.']);
    }
    if (/(nasılsın|nasilsin|ne haber|keyfin nasıl|iyi misin)/.test(m)) {
      const durum = { mutlu: 'Mutluyum', uzgun: 'Biraz üzgünüm', yorgun: 'Yorgunum', normal: 'İyiyim, sakinim' }[ifade] || 'İyiyim';
      const sebep = sonSebep(y, ifade === 'uzgun' ? -1 : 1);
      let s = durum + '.';
      if (sebep && (ifade === 'mutlu' || ifade === 'uzgun')) s += ' Çünkü ' + once(sebep.z) + ': ' + sebep.olay.charAt(0).toLocaleLowerCase('tr-TR') + sebep.olay.slice(1) + '.';
      if (ifade === 'yorgun') s += ' Enerjim %' + Math.round(d.enerji) + ', biraz dinlenmem lazım.';
      return s + ' Sen nasılsın?';
    }
    if (/neden (üzgün|mutlu|yorgun|keyifsiz|neşeli)/.test(m)) {
      const sebep = sonSebep(y, /üzgün|keyifsiz/.test(m) ? -1 : 1);
      if (/yorgun/.test(m)) return 'Enerjim şu an %' + Math.round(d.enerji) + '. ' + (y.v.olaylar.slice(-5).some(o => /koş/i.test(o.olay)) ? 'Az önce koşuyordum.' : 'Dinlenince toparlanırım.');
      return sebep ? 'Sebebi şu: ' + sebep.olay + ' (' + once(sebep.z) + ').' : 'Belirli bir sebebi yok, öyle hissediyorum diyemem; aslında son saatlerde beni etkileyen bir olay kaydım yok.';
    }
    if (/(teşekkür|tesekkur|sağ ol|sagol|eyvallah|thanks)/.test(m)) return sec(['Rica ederim!', 'Ne demek, her zaman.', 'Ben teşekkür ederim.']);
    if (/(adın ne|ismin ne|sen kimsin)/.test(m)) return 'Ben ' + ad + '. Bu evde seninle yaşıyorum.';
    if (/(saat kaç|saat kac)/.test(m)) return 'Saat ' + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) + '.';
    if (/(evde ne var|neler var|eşyalar)/.test(m)) return evOzeti();
    if (/(odalar|kaç oda)/.test(m)) return 'Evde ' + Ev.ODALAR.length + ' oda var: ' + Ev.ODALAR.map(o => o.ad).join(', ') + '.';
    if (/(evde kim|kimler var|kim var|ev arkadaş)/.test(m)) {
      const d = sakinler().filter(s => s.y !== y);
      if (!d.length) return 'Şu an evde senden ve benden başka kimse yok.';
      return 'Evde ' + d.length + ' kişi daha var: ' + d.map(s => s.ad + ' (' + s.oda + ')').join(', ') + '.';
    }
    const kimNerede = sakinler().find(s => s.y !== y && new RegExp('\\b' + kucuk(s.ad) + "\\S*\\s+(nerede|ne yapıyor|napıyor|nasıl)").test(m));
    if (kimNerede) {
      if (/nasıl/.test(m)) return kimNerede.ad + ' şu an ' + Dil.bulunma(kimNerede.oda) + '. Nasıl hissettiğini en iyi o söyler; ona dokunup sorabilirsin.';
      return kimNerede.ad + ' şu an ' + Dil.bulunma(kimNerede.oda) + ', ' + kimNerede.ne + '.';
    }
    if (/(ne yapıyorsun|napıyorsun|napiyorsun|neredesin)/.test(m)) {
      const n = nerede(y); return n.odada + ' ' + n.ne + '. Seninle konuşuyorum.';
    }
    if (/^(iyiyim|ben de iyiyim|süperim|harikayım)/.test(m)) return sec(['Buna sevindim!', 'Güzel, sevindim.']);
    return null;
  }

  // ---------------------------------------------------------------- 2) GROQ
  function sistemMetni(y) {
    const d = y.v.durum, n = nerede(y);
    const olaylar = y.v.olaylar.slice(-8).map(o => '- ' + once(o.z) + ': ' + o.olay + (o.etki ? ' (' + o.etki + ')' : '')).join('\n') || '- (kayıtlı olay yok)';
    return [
      'Sen ' + y.v.ad + "'sın. Lonca adlı uygulamada, kullanıcıyla aynı evde yaşayan bir karaktersin.",
      'Kişiliğin: ' + y.v.kisilik,
      '',
      'GERÇEK DURUMUN (bunlar ölçülmüş verilerdir, uydurma değil):',
      '- Mutluluk: ' + Math.round(d.mutluluk) + '/100, Enerji: ' + Math.round(d.enerji) + '/100, Görünen ifaden: ' + y.ifadeAdi(),
      '- Şu an: ' + n.odada + ' ' + n.ne.replace(/um$/, 'sun') + '.',
      '- Türün: ' + (y.v.tur || 'İnsan') + (y.v.tarif ? '. Görünüşün: ' + y.v.tarif : ''),
      '- Son olaylar:\n' + olaylar,
      '- ' + evOzeti(),
      '- Evdeki odalar: ' + Ev.ODALAR.map(o => o.ad).join(', ') + '.',
      '- Evde seninle birlikte yaşayanlar (şu anki gerçek konumları): ' + (sakinler().filter(s => s.y !== y).map(s => s.ad + ' (' + s.tur + ', ' + s.oda + ')').join(', ') || 'kimse') + '. Bunlar dışında kimse yok; onlarla ilgili yaşanmamış bir olay uydurma.',
      '',
      'KURALLAR:',
      '1. Sadece yukarıdaki gerçek bilgilere dayanarak kendinden bahset. Yapmadığın bir şeyi yaptım deme, olmayan kişi, eşya, kitap veya proje uydurma.',
      '2. Geleceğe dair niyet ve öneriler serbest ("istersen birlikte ... yapabiliriz").',
      '3. Duygun sorulursa yukarıdaki sayılar ve olaylarla tutarlı ol; sebebini bilmiyorsan bilmiyorum de.',
      '4. Kısa ve doğal konuş: genelde 1-3 cümle. Cevapların sesli de okunabilir, o yüzden madde işareti ve emoji kullanma.',
      '5. Türkçe konuş.'
    ].join('\n');
  }

  async function groq(mesajlar, { maxTokens = 300, sicaklik = 0.7 } = {}) {
    const a = ayar();
    if (!a.groqAnahtar) throw Object.assign(new Error('anahtar yok'), { kod: 'anahtar' });
    const r = await Depo.http({
      url: 'https://api.groq.com/openai/v1/chat/completions',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + a.groqAnahtar },
      body: JSON.stringify({ model: a.groqModel || 'llama-3.3-70b-versatile', messages: mesajlar, temperature: sicaklik, max_tokens: maxTokens })
    });
    if (r.status === 401) throw Object.assign(new Error('Groq anahtarı geçersiz görünüyor.'), { kod: 'yetki' });
    if (r.status === 429) throw Object.assign(new Error('Groq şu an çok fazla istek aldı, biraz sonra tekrar dene.'), { kod: 'limit' });
    if (r.status === 0) throw Object.assign(new Error('İnternete bağlanamadım.'), { kod: 'ag' });
    if (r.status < 200 || r.status >= 300) {
      let msg = ''; try { msg = JSON.parse(r.text).error.message; } catch (e) {}
      throw Object.assign(new Error('Groq hatası (' + r.status + ') ' + msg), { kod: 'api' });
    }
    const j = JSON.parse(r.text);
    return (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || '').trim();
  }

  // ---------------------------------------------------------------- 3) ATÖLYE ÜRETİMİ
  const URET = /^\/yap\s+(.+)|(.+?)\s*(sayfası|sayfasi|aracı|araci|uygulaması|uygulamasi|hesaplayıcı|takipçi|takipci)\s*(yap|oluştur|olustur|hazırla|hazirla|üret|uret)/i;

  async function uret(istek, y) {
    const sys = [
      "Sen Lonca uygulamasının Atölye'sisin. " + y.v.ad + ' adlı karakter, kullanıcı için bir sayfa/araç hazırlıyor.',
      'Kullanıcının isteğine göre TEK DOSYALIK, mobil ekrana uygun bir HTML sayfası yaz.',
      'Kurallar:',
      '- Sadece ```html ... ``` bloğu içinde tam bir HTML belgesi döndür. Başka açıklama yazma.',
      '- <title> etiketine kısa Türkçe bir başlık koy.',
      '- Koyu tema: arka plan #0d0b18, yazı #ece8ff, vurgu #a77de8. Dokunmatik için büyük butonlar.',
      '- İnternetten hiçbir dosya, font veya kütüphane yükleme; her şey dosyanın içinde olsun.',
      '- Kalıcı veri gerekiyorsa SADECE şunları kullan: window.Lonca.kaydet(anahtar, deger) ve await window.Lonca.oku(anahtar). localStorage kullanma.',
      '- Kullanıcı önemli bir şey yaptığında window.Lonca.soyle("kısa mesaj") ile karakterin konuşmasını sağlayabilirsin (az kullan).'
    ].join('\n');
    const cevap = await groq([{ role: 'system', content: sys }, { role: 'user', content: istek }], { maxTokens: 3500, sicaklik: 0.4 });
    const m = /```html\s*([\s\S]*?)```/i.exec(cevap) || /```\s*([\s\S]*?)```/.exec(cevap);
    const html = (m ? m[1] : cevap).trim();
    if (!/<html|<body|<div|<script/i.test(html)) throw new Error('Atölye geçerli bir sayfa üretemedi.');
    const baslik = ((/<title>([^<]{1,60})<\/title>/i.exec(html) || [])[1] || istek.slice(0, 40)).trim();
    const id = 'o' + Date.now().toString(36);
    const oneri = { id, z: Date.now(), tur: 'sayfa', baslik, istek, kim: y.v.ad, html };
    Depo.yazJSON('/atolye/oneriler/' + id + '.json', oneri);
    return oneri;
  }

  // ---------------------------------------------------------------- ANA GİRİŞ
  async function cevapla(metin, y) {
    const k = kural(metin, y);
    if (k) return { metin: k, kaynak: 'kural' };

    const u = URET.exec(metin.trim());
    if (u) {
      if (!ayar().groqAnahtar) return { metin: "Bunu üretebilmem için bir yapay zekâ motoruna bağlanmam lazım. Ayarlar'dan Groq anahtarı eklersen Atölye'de hazırlarım.", kaynak: 'kural' };
      const istek = (u[1] || metin).trim();
      try {
        const o = await uret(istek, y);
        y.olay("Atölye'de bir şey ürettim: " + o.baslik, 3);
        return { metin: "Atölye'de bir öneri hazırladım: \"" + o.baslik + '". Bakıp onaylarsan eve yerleştiririm.', kaynak: 'atolye', oneri: o };
      } catch (e) {
        return { metin: 'Üretmeye çalıştım ama olmadı: ' + e.message, kaynak: 'hata' };
      }
    }

    if (!ayar().groqAnahtar) {
      return { metin: sec([
        "Bunu henüz anlayamıyorum. Şimdilik selam, nasılsın, evde ne var gibi şeyleri biliyorum. Ayarlar'dan Groq anahtarı eklersen her konuda konuşabiliriz.",
        "Henüz bir yapay zekâ motoruna bağlı değilim, o yüzden bu soruya dürüst bir cevabım yok. Ayarlar'dan Groq anahtarı ekleyebilirsin."
      ]), kaynak: 'kural' };
    }
    const gecmis = y.v.hafiza.slice(-12).map(h => ({ role: h.kim === 'sen' ? 'user' : 'assistant', content: h.metin }));
    // son mesaj zaten hafızada olabilir; yoksa ekle
    if (!gecmis.length || gecmis[gecmis.length - 1].content !== metin) gecmis.push({ role: 'user', content: metin });
    try {
      const c = await groq([{ role: 'system', content: sistemMetni(y) }, ...gecmis]);
      return { metin: c || '…', kaynak: 'groq' };
    } catch (e) {
      return { metin: 'Şu an düşünce motoruma ulaşamıyorum. ' + e.message, kaynak: 'hata' };
    }
  }

  async function dene() {
    return groq([{ role: 'user', content: 'Sadece "tamam" yaz.' }], { maxTokens: 5, sicaklik: 0 });
  }

  window.Zihin = { cevapla, kural, dene, uret, sistemMetni };
})();
