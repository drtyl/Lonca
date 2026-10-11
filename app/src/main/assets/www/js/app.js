/* App: her şeyi birbirine bağlayan katman.
 * Modlar: ev (tepeden ev) · sohbet (mesajlaşma, karakter solda) · sesli (sesli görüşme) · sayfa (karakter köşede)
 */
(function () {
  const $ = s => document.querySelector(s);
  const sec = l => l[Math.floor(Math.random() * l.length)];
  const App = window.App = {};

  // ---------------------------------------------------------------- ayarlar
  let ayarlar = Depo.okuJSON('/ayarlar.json', {});
  App.ayar = () => ayarlar;
  App.ayarYaz = p => { Object.assign(ayarlar, p); Depo.yazJSON('/ayarlar.json', ayarlar); };

  // ---------------------------------------------------------------- ilk kurulum
  function ilkKurulum() {
    if (Depo.var('/ev/esyalar.json')) return;
    Depo.klasor('/lab'); Depo.klasor('/atolye/oneriler'); Depo.klasor('/ev/veri');
    Depo.yaz('/ev/sayfalar/notlar.html', VARSAYILAN.notlar);
    Depo.yaz('/lab/ornek/merhaba.html', VARSAYILAN.merhaba);
    Depo.yaz('/lab/BENIOKU.md', VARSAYILAN.benioku);
    Ev.esyalariKaydet([]);
    Ev.esyaEkle({ ad: 'Notlar', dosya: '/ev/sayfalar/notlar.html', ikon: 'not' });
    App.ayarYaz({ evSurum: Ev.SURUM });
  }

  // ---------------------------------------------------------------- küçük arayüz yardımcıları
  let bildirimZ = null;
  App.bildir = metin => {
    const b = $('#bildirim'); b.textContent = metin; b.classList.remove('gizli');
    clearTimeout(bildirimZ); bildirimZ = setTimeout(() => b.classList.add('gizli'), 2600);
  };

  let sorKapat = null;
  /** Onay ya da metin sorar. varsayilan verilirse metin kutusu çıkar ve metin döner. */
  App.sor = (mesaj, evet = 'Tamam', varsayilan) => new Promise(ok => {
    const p = document.createElement('div'); p.className = 'sorPerde';
    const metinli = varsayilan !== undefined;
    p.innerHTML = `<div class="sorKutu"><p></p>${metinli ? '<input>' : ''}<div class="satir"><button class="kucukBtn" data-h="0">Vazgeç</button><button class="kucukBtn vurgu" data-h="1"></button></div></div>`;
    p.querySelector('p').textContent = mesaj; p.querySelector('[data-h="1"]').textContent = evet;
    const inp = p.querySelector('input'); if (inp) inp.value = varsayilan;
    const bitir = v => { p.remove(); sorKapat = null; ok(v); };
    sorKapat = () => bitir(metinli ? null : false);
    p.querySelector('[data-h="0"]').onclick = () => bitir(metinli ? null : false);
    p.querySelector('[data-h="1"]').onclick = () => bitir(metinli ? (inp.value.trim() || null) : true);
    if (inp) inp.onkeydown = e => { if (e.key === 'Enter') bitir(inp.value.trim() || null); };
    document.body.appendChild(p); if (inp) setTimeout(() => inp.focus(), 50);
  });

  /** Eve yerleştirirken ad ve ikon sorar */
  App.esyaSor = baslik => new Promise(ok => {
    const p = document.createElement('div'); p.className = 'sorPerde';
    const ikonlar = ['sayfa', 'not', 'gorev', 'kitap', 'muzik', 'proje', 'resim', 'ayar'];
    let secili = 'sayfa';
    p.innerHTML = `<div class="sorKutu"><p>Eve yerleştir</p>
      <label class="alan">Evde görünecek adı</label><input maxlength="24">
      <label class="alan">İkon</label><div class="ikonSec">${ikonlar.map(i => `<button data-i="${i}" class="${i === secili ? 'secili' : ''}">${Ikon.svg(i)}</button>`).join('')}</div>
      <div class="satir"><button class="kucukBtn" data-h="0">Vazgeç</button><button class="kucukBtn vurgu" data-h="1">Yerleştir</button></div></div>`;
    const inp = p.querySelector('input'); inp.value = baslik;
    p.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { secili = b.dataset.i; p.querySelectorAll('[data-i]').forEach(x => x.classList.toggle('secili', x === b)); });
    const bitir = v => { p.remove(); sorKapat = null; ok(v); };
    sorKapat = () => bitir(null);
    p.querySelector('[data-h="0"]').onclick = () => bitir(null);
    p.querySelector('[data-h="1"]').onclick = () => bitir(inp.value.trim() ? { ad: inp.value.trim(), ikon: secili } : null);
    document.body.appendChild(p);
  });

  // ---------------------------------------------------------------- karakterler ve sahne
  ilkKurulum();
  if (ayarlar.evSurum !== Ev.SURUM) { Ev.tasi(); App.ayarYaz({ evSurum: Ev.SURUM }); }   // eski 2 odalı evden geçiş
  const hepsi = App.yasamlar = Yasam.hepsi();
  App.evdekiler = () => hepsi.filter(y => y.v.evde);
  let yasam = hepsi.find(y => y.v.id === ayarlar.secili && y.v.evde) || hepsi.find(y => y.v.id === 'nova' && y.v.evde) || App.evdekiler()[0] || hepsi[0];
  if (!yasam.v.evde) { yasam.v.evde = true; yasam.kaydet(); }
  Object.defineProperty(App, 'yasam', { get: () => yasam });

  const cb = {
    zemineDokun: (x, z, cift) => { yasam.etkilesim(); yasam.git(x, z, cift); ipucuGizle(); },
    karaktereDokun: id => karaktereDokun(id),
    esyayaDokun: id => esyayaDokun(id)
  };
  let sahne = null;
  try {
    if (!window.Sahne3D) throw new Error('3D kütüphaneleri yok');
    sahne = new Sahne3D($('#sahneKap'), $('#etiketler'), App.evdekiler(), cb);
    sahne.sec(yasam.v.id);
    sahne.kur(ayarlar);
  } catch (e) {
    console.warn('3D başlatılamadı, 2D yedek kullanılıyor:', e);
    $('#sahneKap').querySelectorAll('canvas').forEach(c => c.remove());
    $('#etiketler').innerHTML = '';
    sahne = new Sahne2D($('#sahneKap'), $('#etiketler'), App.evdekiler(), cb);
    sahne.sec(yasam.v.id);
    sahne.kur(ayarlar);
  }
  App.sahne = sahne;
  if (window.ResizeObserver) new ResizeObserver(() => sahne.boyutla()).observe($('#sahneKap'));
  window.addEventListener('resize', () => sahne.boyutla());

  App.modelYukle = (id, yol) => {
    const b64 = Depo.okuB64(yol);
    if (!b64) return Promise.reject(new Error('Dosya bulunamadı'));
    const bin = atob(b64), buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return sahne.modelYukle(id, buf.buffer);
  };
  for (const y of App.evdekiler()) if (y.v.model) App.modelYukle(y.v.id, y.v.model).catch(e => App.bildir(y.v.ad + ' için kayıtlı model yüklenemedi (' + e.message + ')'));

  /** Konuşulan (seçili) karakteri değiştir */
  App.karakterSec = id => {
    const y = hepsi.find(k => k.v.id === id);
    if (!y || !y.v.evde || y === yasam) return;
    yasam.konus(false); yasam.sabitle(false);
    yasam = y;
    sahne.sec(id); App.ayarYaz({ secili: id });
    App.portreGuncelle();
    if (mod !== 'ev') yasam.sabitle(true); else sahne.odakla(y.x, y.z);
    App.basligiGuncelle();
    if (mod === 'sohbet') App.mesajlariCiz();
  };
  /** Bir karakteri evden çıkar / eve al */
  App.evdeAyarla = (id, evet) => {
    const y = hepsi.find(k => k.v.id === id); if (!y) return false;
    if (!evet && App.evdekiler().length <= 1) { App.bildir('Evde en az bir karakter kalmalı'); return false; }
    y.v.evde = evet; y.kaydet();
    if (evet) { sahne.karakterEkle(y); if (y.v.model) App.modelYukle(y.v.id, y.v.model).catch(() => {}); }
    else { sahne.karakterCikar(id); if (y === yasam) App.karakterSec(App.evdekiler()[0].v.id); }
    return true;
  };
  App.karakterEkle = y => { hepsi.push(y); sahne.karakterEkle(y); };

  /** Karakter seçici (başlığa dokununca) */
  App.karakterSor = () => new Promise(ok => {
    const p = document.createElement('div'); p.className = 'sorPerde';
    p.innerHTML = '<div class="sorKutu"><p>Kiminle konuşmak istersin?</p><div class="karakterListe"></div><div class="satir"><button class="kucukBtn" data-h="0">Kapat</button></div></div>';
    const liste = p.querySelector('.karakterListe');
    for (const y of App.evdekiler()) {
      const b = document.createElement('button'); b.className = 'karakterSatir' + (y === yasam ? ' secili' : '');
      b.innerHTML = '<i></i><b></b><span></span>';
      b.querySelector('i').style.background = y.v.gorunum.serit || y.v.gorunum.ust || '#a77de8';
      b.querySelector('b').textContent = y.v.ad;
      b.querySelector('span').textContent = Ev.odaBul(y.x, y.z).ad + ' · ' + y.ifadeAdi();
      b.onclick = () => { bitir(); App.karakterSec(y.v.id); };
      liste.appendChild(b);
    }
    const bitir = () => { p.remove(); sorKapat = null; ok(); };
    sorKapat = bitir;
    p.querySelector('[data-h="0"]').onclick = bitir;
    document.body.appendChild(p);
  });
  $('#baslik').onclick = () => { if (mod === 'ev' || mod === 'sohbet' || mod === 'sesli') App.karakterSor(); };

  // ---------------------------------------------------------------- 2D portre
  const portreOnbellek = {};
  App.portreKaynak = y => {
    const p = y.v.portre; if (!p) return null;
    if (!p.startsWith('/')) return p;                       // uygulamayla gelen görsel (portre/nova.webp)
    if (!(p in portreOnbellek)) portreOnbellek[p] = Depo.dataURL(p);
    return portreOnbellek[p];
  };
  App.portreUnut = yol => { delete portreOnbellek[yol]; };
  let portreSrc = null, portreIfade = '';
  App.portreGuncelle = () => {
    const el = $('#portre'), img = el.querySelector('img');
    const src = yasam.v.sohbetGorunum === '3d' ? null : App.portreKaynak(yasam);
    $('#govde').classList.toggle('portreVar', !!src);
    sahne.portreModu && sahne.portreModu(!!src);
    if (!src) { portreSrc = null; return; }
    if (src !== portreSrc) {
      portreSrc = src;
      img.onload = () => koseYuzu();
      img.src = src;
      el.style.setProperty('--portre', 'url("' + src + '")');
    } else koseYuzu();
  };
  /** Köşedeki yuvarlakta portrenin yüz kısmını göster */
  function koseYuzu() {
    const el = $('#portre'), img = el.querySelector('img');
    if (!img.naturalWidth) return;
    const D = 78, nw = img.naturalWidth, nh = img.naturalHeight, yz = yasam.v.yuz || { x: 0.5, y: 0.09 };
    const k = (D * 1.1) / (nh * 0.15);
    el.style.backgroundSize = (nw * k) + 'px ' + (nh * k) + 'px';
    el.style.backgroundPosition = (D / 2 - yz.x * nw * k) + 'px ' + (D / 2 - yz.y * nh * k + 4) + 'px';
  }
  $('#portre').onclick = () => karaktereDokun(yasam.v.id);

  // ---------------------------------------------------------------- modlar
  let mod = 'ev', aktifEsya = null;
  App.mod = () => mod;

  function modAyarla(m) {
    mod = m;
    $('#govde').className = 'mod-' + m;
    App.portreGuncelle();
    document.body.classList.toggle('gizliGiris', m === 'sesli' || m === 'sayfa');
    yasam.sabitle(m !== 'ev');
    sahne.mod(m === 'sayfa' ? 'kose' : m);
    App.basligiGuncelle();
    if (m === 'sohbet') { App.mesajlariCiz(); }
    if (m !== 'ev' && m !== 'sayfa') balonGizle();
  }
  App.modAyarla = modAyarla;

  App.basligiGuncelle = () => {
    const ad = yasam.v.ad;
    const geri = $('#geriBtn'), eylem = $('#eylemBtn'), rozet = $('#ruhRozet');
    geri.classList.toggle('gizli', mod === 'ev');
    $('#baslik .logo').classList.toggle('gizli', mod !== 'ev');
    document.body.classList.toggle('mod-ev-ust', mod === 'ev');
    rozet.classList.toggle('gizli', mod !== 'sohbet');
    eylem.classList.toggle('gizli', mod === 'ev');
    $('#mesaj').placeholder = Dil.yonelme(ad) + ' yaz…';
    if (mod === 'ev') $('#baslikYazi').textContent = ad + ' · ' + Ev.odaBul(yasam.x, yasam.z).ad;
    else if (mod === 'sohbet') { $('#baslikYazi').textContent = ad; rozet.textContent = yasam.ifadeAdi(); eylem.innerHTML = Ikon.svg('mikrofon'); eylem.setAttribute('aria-label', 'Sesli konuş'); }
    else if (mod === 'sesli') { $('#baslikYazi').textContent = 'Sesli · ' + ad; eylem.innerHTML = Ikon.svg('mesaj'); eylem.setAttribute('aria-label', 'Mesajlaşmaya geç'); }
    else if (mod === 'sayfa') { $('#baslikYazi').textContent = aktifEsya ? aktifEsya.ad : 'Sayfa'; eylem.innerHTML = Ikon.svg('cop'); eylem.setAttribute('aria-label', 'Evden kaldır'); }
  };

  function geri() {
    if (mod === 'sesli') return sesliBitir();
    if (mod === 'sayfa') { aktifEsya = null; $('#sayfaIframe').srcdoc = ''; }
    modAyarla('ev');
  }

  $('#geriBtn').innerHTML = Ikon.svg('geri');
  $('#geriBtn').onclick = geri;
  $('#eylemBtn').onclick = async () => {
    if (mod === 'sohbet') sesliBaslat();
    else if (mod === 'sesli') sesliBitir('sohbet');
    else if (mod === 'sayfa' && aktifEsya) {
      if (!(await App.sor('"' + aktifEsya.ad + '" evden kaldırılsın mı? Dosyası Laboratuvar\'da kalır.', 'Kaldır'))) return;
      Ev.esyaSil(aktifEsya.id); sahne.esyalariYenile(); aktifEsya = null; modAyarla('ev'); App.bildir('Evden kaldırıldı');
    }
  };

  // ---------------------------------------------------------------- konuşma balonu
  let balonZ = null;
  App.balon = (metin, sure) => {
    if (mod === 'sohbet' || mod === 'sesli') return;
    $('#balonYazi').textContent = metin; $('#balon').classList.remove('gizli');
    clearTimeout(balonZ); balonZ = setTimeout(balonGizle, sure || Math.min(9000, 2200 + metin.length * 60));
  };
  function balonGizle() { $('#balon').classList.add('gizli'); }
  function balonKonumla() {
    const b = $('#balon'); if (b.classList.contains('gizli')) return;
    const g = $('#govde');
    if (mod === 'sayfa') {
      b.classList.add('sagda');
      b.style.transform = `translate(${g.clientWidth - 14}px, ${g.clientHeight - 104}px) translate(-100%, -100%)`;
    } else {
      b.classList.remove('sagda');
      const p = sahne.basEkranda(); if (!p) return;
      const yarim = b.offsetWidth / 2 + 8;
      const x = Math.max(yarim, Math.min(g.clientWidth - yarim, p.x));
      b.style.transform = `translate(${x}px, ${p.y - 10}px) translate(-50%, -100%)`;
    }
  }

  // karakter konuşurken ağız hareketi: sesli okuma varsa ses motoru, yoksa metin uzunluğu belirler
  Ses.onKonusma = f => yasam.konus(f);
  let agizZ = null;
  App.konus = (metin, sesli) => {
    if (sesli) return Ses.konus(metin, yasam.v.ses);
    yasam.konus(true); clearTimeout(agizZ);
    agizZ = setTimeout(() => yasam.konus(false), Math.min(6000, 500 + metin.length * 45));
    return Promise.resolve();
  };

  // ---------------------------------------------------------------- dokunma
  let ipucuGitti = false;
  function ipucuGizle() { if (!ipucuGitti) { ipucuGitti = true; $('#ipucu').style.opacity = 0; } }
  setTimeout(ipucuGizle, 9000);

  let sonDokunmaOlayi = 0;
  function karaktereDokun(id) {
    if (id && id !== yasam.v.id) App.karakterSec(id);
    yasam.etkilesim();
    if (mod === 'sayfa') return modAyarla('sohbet');
    yasam.selam();
    if (Date.now() - sonDokunmaOlayi > 60000) { sonDokunmaOlayi = Date.now(); yasam.olay('Bana dokundun, selam verdim', 4); }
    if (mod === 'ev') { const s = sec(['Selam!', 'Buradayım!', 'Hey!', 'Ne yapalım?']); App.balon(s); App.konus(s); }
  }

  function esyayaDokun(id) {
    const e = Ev.esyaBul(id); if (!e) return;
    yasam.etkilesim(); ipucuGizle();
    const ac = () => { yasam.hedefYaw = 0; App.balon('Açıyorum: ' + e.ad, 1200); setTimeout(() => { if (mod === 'ev') sayfaAc(e); }, 450); };
    if (Math.hypot(yasam.x - e.x, yasam.z - e.z) < 0.9) ac();
    else yasam.git(e.x, e.z, false, ac);
  }

  // ---------------------------------------------------------------- sayfalar (kum havuzu + Lonca API)
  const LONCA_API = `<script>(function(){var n=0,w={};window.Lonca={kaydet:function(k,v){parent.postMessage({lonca:1,tur:'kaydet',anahtar:String(k),deger:v},'*')},oku:function(k){return new Promise(function(r){var id=++n;w[id]=r;parent.postMessage({lonca:1,tur:'oku',anahtar:String(k),id:id},'*')})},soyle:function(m){parent.postMessage({lonca:1,tur:'soyle',metin:String(m).slice(0,200)},'*')}};addEventListener('message',function(e){var d=e.data;if(d&&d.lonca&&d.tur==='cevap'&&w[d.id]){w[d.id](d.deger);delete w[d.id]}})})();<\/script>`;

  function hazirla(html, yol) {
    const klasor = (yol || '/').replace(/[^/]*$/, '');
    html = String(html || '').replace(/(src|href)\s*=\s*"([^"]+)"/gi, (m, at, url) => {
      if (/^(https?:|data:|#|javascript:|mailto:|blob:)/i.test(url)) return m;
      const p = Depo.norm(url.startsWith('/') ? url : klasor + url);
      if (!Depo.var(p)) return m;
      const d = Depo.dataURL(p);
      return d ? at + '="' + d + '"' : m;
    });
    if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, h => h + LONCA_API);
    return LONCA_API + html;
  }

  function sayfaAc(e) {
    const html = Depo.oku(e.dosya);
    if (html === null) { App.bildir('Dosya bulunamadı: ' + e.dosya); return; }
    aktifEsya = e;
    $('#sayfaIframe').srcdoc = hazirla(html, e.dosya);
    modAyarla('sayfa');
  }
  App.sayfaAc = sayfaAc;

  App.onizle = (yol, baslik) => App.onizleHtml(Depo.oku(yol) || '', baslik, yol);
  App.onizleHtml = (html, baslik, yol) => {
    $('#onizlemeBaslik').textContent = 'Önizleme · ' + (baslik || '');
    $('#onizlemeIframe').srcdoc = hazirla(html, yol || '/atolye/');
    $('#onizleme').classList.remove('gizli');
  };
  $('#onizlemeKapat').innerHTML = Ikon.svg('kapat');
  $('#onizlemeKapat').onclick = () => { $('#onizleme').classList.add('gizli'); $('#onizlemeIframe').srcdoc = ''; };

  window.addEventListener('message', ev => {
    const d = ev.data; if (!d || !d.lonca) return;
    const sayfa = $('#sayfaIframe').contentWindow, oniz = $('#onizlemeIframe').contentWindow;
    if (ev.source !== sayfa && ev.source !== oniz) return;
    const veriYolu = '/ev/veri/' + (ev.source === sayfa && aktifEsya ? aktifEsya.id : 'onizleme') + '.json';
    if (d.tur === 'kaydet') { const v = Depo.okuJSON(veriYolu, {}); v[d.anahtar] = d.deger; Depo.yazJSON(veriYolu, v); }
    else if (d.tur === 'oku') { const v = Depo.okuJSON(veriYolu, {}); ev.source.postMessage({ lonca: 1, tur: 'cevap', id: d.id, deger: v[d.anahtar] === undefined ? null : v[d.anahtar] }, '*'); }
    else if (d.tur === 'soyle' && ev.source === sayfa) { App.balon(d.metin); App.konus(d.metin); }
  });

  App.esyaEklendi = e => {
    sahne.esyalariYenile(); Panel.kapat();
    if (mod !== 'ev') modAyarla('ev');
    yasam.olay('Eve yeni bir şey eklendi: ' + e.ad, 4);
    yasam.etkilesim();
    yasam.git(e.x, e.z, yasam.v.durum.enerji > 30, () => { yasam.selam(); App.balon('Yeni bir şey! ' + e.ad); });
    App.bildir('"' + e.ad + '" eve yerleştirildi');
  };
  App.esyalarDegisti = () => sahne.esyalariYenile();

  // ---------------------------------------------------------------- sohbet
  const sohbetSaati = z => new Date(z).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  function mesajDom(kim, metin, z) {
    const d = document.createElement('div'); d.className = 'msj ' + kim;
    d.textContent = metin;
    if (kim !== 'sistem') { const s = document.createElement('small'); s.textContent = sohbetSaati(z || Date.now()); d.appendChild(s); }
    $('#mesajListe').appendChild(d);
    $('#mesajListe').scrollTop = 1e9;
  }
  App.mesajlariCiz = () => {
    $('#mesajListe').innerHTML = '';
    const h = yasam.v.hafiza.slice(-40);
    if (!h.length) mesajDom('sistem', yasam.v.ad + ' ile sohbetin burada görünür.');
    h.forEach(m => mesajDom(m.kim, m.metin, m.z));
  };
  function mesajEkle(kim, metin) { yasam.hatirla(kim, metin); if (mod === 'sohbet' || mod === 'sesli') mesajDom(kim, metin); }

  let sonSohbetOlayi = 0;
  async function dusunVeCevapla(metin) {
    mesajEkle('sen', metin);
    yasam.etkilesim();
    if (Date.now() - sonSohbetOlayi > 180000) { sonSohbetOlayi = Date.now(); yasam.olay('Benimle konuştun', 2); }
    const yz = $('#yaziyor'); yz.querySelector('span').textContent = yasam.v.ad + ' yazıyor…'; yz.classList.remove('gizli');
    const [c] = await Promise.all([Zihin.cevapla(metin, yasam), new Promise(r => setTimeout(r, 450))]);
    yz.classList.add('gizli');
    mesajEkle('ben', c.metin);
    if (c.oneri) { if (mod === 'sohbet') mesajDom('sistem', "Öneri Atölye'de seni bekliyor."); }
    yasam.kaydet();
    App.basligiGuncelle();
    return c;
  }

  $('#gonderBtn').innerHTML = Ikon.svg('gonder');
  $('#mikBtn').innerHTML = Ikon.svg('mikrofon');
  $('#mikBtn').onclick = () => sesliBaslat();
  $('#mesaj').addEventListener('focus', () => { if (mod === 'ev') modAyarla('sohbet'); });
  $('#giris').addEventListener('submit', async e => {
    e.preventDefault();
    const inp = $('#mesaj'), metin = inp.value.trim(); if (!metin) return;
    inp.value = '';
    if (mod === 'ev') modAyarla('sohbet');
    const c = await dusunVeCevapla(metin);
    if (mod === 'sohbet') App.konus(c.metin, !!ayarlar.mesajSesli);
  });

  // ---------------------------------------------------------------- sesli görüşme
  const sv = { aktif: false, sessiz: false, dinliyor: false, hata: 0, seviye: 0, donulecek: 'ev' };
  const dalga = $('#dalga'); for (let i = 0; i < 11; i++) dalga.appendChild(document.createElement('i'));
  $('#sesliMik').innerHTML = Ikon.svg('mikrofon');
  $('#sesliSessiz span').innerHTML = Ikon.svg('mikrofonKapali');
  $('#sesliBitir span').innerHTML = Ikon.svg('telefonKapat');
  const sesliDurum = t => { $('#sesliDurum').textContent = t; };
  function mikGorunum() {
    $('#sesliMik').classList.toggle('aktif', sv.dinliyor);
    $('#sesliMik').classList.toggle('kapali', sv.sessiz);
    $('#sesliMik').innerHTML = Ikon.svg(sv.sessiz ? 'mikrofonKapali' : 'mikrofon');
    $('#sesliSessiz').classList.toggle('secili', sv.sessiz);
  }

  async function sesliBaslat() {
    sv.donulecek = mod === 'sohbet' ? 'sohbet' : 'ev';
    sv.aktif = true; sv.sessiz = false; sv.hata = 0; sv.dinliyor = false;
    $('#mesaj').blur();
    modAyarla('sesli'); mikGorunum();
    $('#sesliKismi').textContent = '';
    yasam.etkilesim();
    if (!Ses.destek().dinleme) { sesliDurum('Bu cihazda konuşma tanıma bulunamadı.'); return; }
    sesliDurum(yasam.v.ad + ' konuşuyor…');
    await App.konus(sec(['Seni dinliyorum.', 'Buradayım, anlat.', 'Dinliyorum.']), true);
    sesliDinle();
  }

  function sesliDinle() {
    if (!sv.aktif || sv.sessiz) return;
    sv.dinliyor = true; mikGorunum(); sesliDurum('Dinliyorum…');
    Ses.dinle({
      durum: d => { if (d === 'duydum') { sv.dinliyor = false; mikGorunum(); sesliDurum('Düşünüyorum…'); } },
      seviye: r => { sv.seviye = Math.max(0, Math.min(1, (r + 2) / 12)); },
      kismi: t => { $('#sesliKismi').textContent = t; },
      sonuc: async t => {
        sv.dinliyor = false; mikGorunum();
        if (!sv.aktif) return;
        if (!t.trim()) return sesliDinle();
        sv.hata = 0;
        $('#sesliKismi').textContent = '“' + t + '”';
        sesliDurum('Düşünüyorum…');
        const c = await dusunVeCevapla(t);
        if (!sv.aktif) return;
        sesliDurum(yasam.v.ad + ' konuşuyor…');
        await App.konus(c.metin, true);
        if (sv.aktif && !sv.sessiz) setTimeout(sesliDinle, 250);
      },
      hata: (kod, msg) => {
        sv.dinliyor = false; mikGorunum();
        if (!sv.aktif) return;
        if (kod === 6 || kod === 7) {                      // sessizlik / anlaşılamadı
          if (++sv.hata > 4) { sv.sessiz = true; mikGorunum(); sesliDurum('Seni duyamadım. Mikrofona dokununca tekrar dinlerim.'); }
          else setTimeout(sesliDinle, 200);
        } else if (kod === 5 || kod === 8) setTimeout(sesliDinle, 600); // meşgul
        else { sv.sessiz = true; mikGorunum(); sesliDurum(msg || (kod === 9 ? 'Mikrofon izni gerekli.' : 'Dinleme hatası (' + kod + ').')); }
      }
    });
  }

  function sesliBitir(hedef) {
    sv.aktif = false; sv.dinliyor = false;
    Ses.dinlemeyiBirak(); Ses.sus();
    modAyarla(hedef || sv.donulecek || 'ev');
  }
  const sessizDegistir = () => {
    sv.sessiz = !sv.sessiz; sv.hata = 0;
    if (sv.sessiz) { Ses.dinlemeyiBirak(); sv.dinliyor = false; sesliDurum('Mikrofon kapalı'); mikGorunum(); }
    else { mikGorunum(); if (!Ses.konusuyorMu()) sesliDinle(); }
  };
  $('#sesliMik').onclick = sessizDegistir;
  $('#sesliSessiz').onclick = sessizDegistir;
  $('#sesliBitir').onclick = () => sesliBitir();

  // ---------------------------------------------------------------- kare döngüsü (arayüz)
  let rozetSay = 0;
  function arayuzDongusu() {
    requestAnimationFrame(arayuzDongusu);
    balonKonumla();
    if (mod === 'sesli') {
      const bars = dalga.children, t = performance.now() / 1000;
      const seviye = sv.dinliyor ? sv.seviye : yasam.konusuyor ? yasam.agiz : 0.04;
      for (let i = 0; i < bars.length; i++) {
        const m = 1 - Math.abs(i - 5) / 6;
        bars[i].style.height = (6 + seviye * 60 * m * (0.6 + 0.4 * Math.sin(t * 9 + i * 1.7))) + 'px';
      }
      sv.seviye *= 0.92;
    }
    if (++rozetSay % 60 === 0 && (mod === 'sohbet' || mod === 'ev')) App.basligiGuncelle();
    if (portreSrc && mod !== 'ev') {
      const el = $('#portre');
      el.classList.toggle('konusuyor', yasam.konusuyor);
      el.classList.toggle('selam', yasam.selamSure > 0);
      const ifd = 'ifade-' + yasam.ifade();
      if (ifd !== portreIfade) { if (portreIfade) el.classList.remove(portreIfade); el.classList.add(ifd); portreIfade = ifd; }
    }
  }
  requestAnimationFrame(arayuzDongusu);

  // ---------------------------------------------------------------- Android yaşam döngüsü & geri tuşu
  window.loncaPause = () => { try { sahne.dur(); yasam.kaydet(); } catch (e) {} };
  window.loncaResume = () => { try { sahne.devam(); } catch (e) {} };
  document.addEventListener('visibilitychange', () => document.hidden ? window.loncaPause() : window.loncaResume());
  window.loncaBack = () => {
    if (sorKapat) { sorKapat(); return true; }
    if (!$('#onizleme').classList.contains('gizli')) { $('#onizlemeKapat').click(); return true; }
    if (Panel.Editor.acikMi()) { Panel.Editor.kapat(); return true; }
    if (Panel.acikMi()) { Panel.kapat(); return true; }
    if (mod !== 'ev') { geri(); return true; }
    return false;
  };

  window.addEventListener('error', e => { console.error(e.error || e.message); App.bildir('Bir hata oldu: ' + (e.message || '')); });
  window.addEventListener('unhandledrejection', e => { console.error(e.reason); });

  Panel.kur(App);
  modAyarla('ev');
  setTimeout(() => {
    const ilk = !yasam.v.hafiza.length;
    const s = ilk ? 'Merhaba! Ben ' + yasam.v.ad + '. Bu ev bizim.' : sec(['Tekrar hoş geldin!', 'Selam, geldin!']);
    App.balon(s); App.konus(s);
  }, 900);

})();
