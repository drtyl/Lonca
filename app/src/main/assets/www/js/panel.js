/* Panel: sağdan açılan Laboratuvar, Atölye ve Ayarlar.
 *  Laboratuvar → senin çalışma tezgâhın: her türden dosya ve klasör, metin düzenleme, içe aktarma, eve yerleştirme
 *  Atölye      → karakterin tezgâhı: ürettiği öneriler (senin onayın olmadan eve girmez), karakterin kendisi
 *  Ayarlar     → yapay zekâ, ses, görünüm, veriler
 */
(function () {
  let A = null; // App
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const boyut = n => n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(1) + ' MB';
  const once = z => new Date(z).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  function dosyaOku(f, cb) {
    const r = new FileReader();
    r.onload = () => cb(String(r.result).split(',')[1] || '');
    r.onerror = () => A.bildir(f.name + ' okunamadı');
    r.readAsDataURL(f);
  }

  // ================================================================ LABORATUVAR
  const Lab = {
    yol: '/',
    ciz() {
      const kok = $('#sekme-lab');
      let liste;
      try { liste = Depo.liste(Lab.yol); } catch (e) { Lab.yol = '/'; liste = Depo.liste('/'); }
      const parcalar = Lab.yol.split('/').filter(Boolean);
      let yolHtml = '<a href="#" data-yol="/">ev-kökü</a>';
      parcalar.forEach((p, i) => { yolHtml += ' / <a href="#" data-yol="/' + parcalar.slice(0, i + 1).join('/') + '">' + esc(p) + '</a>'; });
      kok.innerHTML = `
        <p class="aciklama">Senin tezgâhın. Her türden dosya ve klasör burada; bir HTML sayfasını "Eve yerleştir" ile evine eşya olarak koyabilirsin.</p>
        <div class="yol">${yolHtml}</div>
        <div class="satir" style="margin-bottom:10px">
          <button class="kucukBtn" id="labKlasor">${Ikon.svg('klasor')} Klasör</button>
          <button class="kucukBtn" id="labDosya">${Ikon.svg('arti')} Dosya</button>
          <button class="kucukBtn vurgu" id="labAktar">${Ikon.svg('yukle')} İçe aktar</button>
          <input type="file" id="labInput" multiple class="gizli">
        </div>
        <ul class="dosyalar">${liste.map(d => `
          <li class="${d.dir ? 'klasor' : ''}" data-ad="${esc(d.name)}" data-dir="${d.dir ? 1 : 0}">
            ${Ikon.svg(d.dir ? 'klasor' : Depo.resimMi(d.name) ? 'resim' : 'dosya')}
            <span class="ad">${esc(d.name)}</span>
            <span class="ek">${d.dir ? '' : boyut(d.size)}</span>
            ${d.dir ? `<button class="sil" data-sil="${esc(d.name)}" aria-label="Sil">${Ikon.svg('cop')}</button>` : ''}
          </li>`).join('') || '<li class="bos">Bu klasör boş.</li>'}
        </ul>`;
      kok.querySelectorAll('[data-yol]').forEach(a => a.onclick = e => { e.preventDefault(); Lab.yol = a.dataset.yol; Lab.ciz(); });
      kok.querySelectorAll('li[data-ad]').forEach(li => li.onclick = e => {
        if (e.target.closest('[data-sil]')) return;
        const p = Depo.norm(Lab.yol + '/' + li.dataset.ad);
        if (li.dataset.dir === '1') { Lab.yol = p; Lab.ciz(); } else Editor.ac(p);
      });
      kok.querySelectorAll('[data-sil]').forEach(b => b.onclick = async () => {
        const p = Depo.norm(Lab.yol + '/' + b.dataset.sil);
        if (await A.sor('"' + b.dataset.sil + '" klasörü ve içindeki her şey silinsin mi?', 'Sil')) {
          try { Depo.sil(p); A.esyalarDegisti(); } catch (e) { A.bildir(e.message); }
          Lab.ciz();
        }
      });
      $('#labKlasor').onclick = async () => {
        const ad = await A.sor('Yeni klasörün adı:', 'Oluştur', '');
        if (ad) { Depo.klasor(Depo.norm(Lab.yol + '/' + ad.replace(/\//g, '-'))); Lab.ciz(); }
      };
      $('#labDosya').onclick = async () => {
        const ad = await A.sor('Yeni dosyanın adı (örn. sayfam.html):', 'Oluştur', 'sayfam.html');
        if (!ad) return;
        const p = Depo.norm(Lab.yol + '/' + ad.replace(/\//g, '-'));
        if (Depo.var(p)) return A.bildir('Bu isimde bir dosya zaten var');
        Depo.yaz(p, /\.html?$/i.test(ad) ? SABLON : '');
        Lab.ciz(); Editor.ac(p);
      };
      $('#labAktar').onclick = () => $('#labInput').click();
      $('#labInput').onchange = e => {
        const dosyalar = [...e.target.files]; let kalan = dosyalar.length;
        dosyalar.forEach(f => dosyaOku(f, b64 => {
          try { Depo.yazB64(Depo.norm(Lab.yol + '/' + f.name), b64); } catch (err) { A.bildir(err.message); }
          if (--kalan === 0) { A.bildir(dosyalar.length + ' dosya içe aktarıldı'); Lab.ciz(); }
        }));
      };
    }
  };

  const SABLON = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Yeni sayfa</title>
<style>
  body { margin:0; padding:20px; background:#0d0b18; color:#ece8ff; font-family:system-ui, sans-serif; }
  button { background:#1e1a38; color:#ece8ff; border:1px solid #a77de8; border-radius:12px; padding:12px 16px; font-size:16px; }
</style>
</head>
<body>
  <h1>Merhaba!</h1>
  <p>Bu sayfayı Laboratuvar'da düzenleyip eve yerleştirebilirsin.</p>
  <button onclick="Lonca.soyle('Butona bastın!')">Nova'ya söylet</button>
</body>
</html>
`;

  // ================================================================ EDİTÖR
  const Editor = {
    yol: null,
    ac(p) {
      Editor.yol = p;
      const ad = p.split('/').pop();
      $('#editorBaslik').textContent = ad;
      const govde = $('#editorGovde'); govde.innerHTML = '';
      const metin = Depo.metinMi(p);
      $('#editorKaydet').classList.toggle('gizli', !metin);
      if (metin) {
        const ta = document.createElement('textarea'); ta.spellcheck = false; ta.value = Depo.oku(p) || '';
        govde.appendChild(ta);
      } else if (Depo.resimMi(p)) {
        const img = document.createElement('img'); img.src = Depo.dataURL(p) || ''; govde.appendChild(img);
      } else {
        govde.innerHTML = '<div class="bilgi">Bu dosya türü burada düzenlenemez.<br>' + esc(ad) + '</div>';
      }
      const html = /\.html?$/i.test(p), vrm = /\.vrm$/i.test(p);
      $('#editorAlt').innerHTML = `
        ${html ? `<button class="kucukBtn" data-e="onizle">${Ikon.svg('goz')} Önizle</button>` : ''}
        ${html ? `<button class="kucukBtn vurgu" data-e="yerlestir">${Ikon.svg('ev')} Eve yerleştir</button>` : ''}
        ${vrm ? `<button class="kucukBtn vurgu" data-e="model">Karakterin bedeni yap</button>` : ''}
        <button class="kucukBtn" data-e="adlandir">${Ikon.svg('kalem')} Yeniden adlandır</button>
        <button class="kucukBtn tehlike" data-e="sil">${Ikon.svg('cop')} Sil</button>`;
      $('#editorAlt').querySelectorAll('[data-e]').forEach(b => b.onclick = () => Editor[b.dataset.e]());
      $('#editor').classList.remove('gizli');
    },
    kapat() { $('#editor').classList.add('gizli'); Editor.yol = null; Lab.ciz(); },
    acikMi() { return !$('#editor').classList.contains('gizli'); },
    kaydet(sessiz) {
      const ta = $('#editorGovde textarea');
      if (!ta || !Editor.yol) return;
      Depo.yaz(Editor.yol, ta.value);
      if (!sessiz) A.bildir('Kaydedildi');
    },
    onizle() { Editor.kaydet(true); A.onizle(Editor.yol, Editor.yol.split('/').pop()); },
    async yerlestir() {
      Editor.kaydet(true);
      const metin = Depo.oku(Editor.yol) || '';
      const baslik = ((/<title>([^<]{1,40})<\/title>/i.exec(metin) || [])[1] || Editor.yol.split('/').pop().replace(/\.html?$/i, '')).trim();
      const s = await A.esyaSor(baslik);
      if (!s) return;
      const e = Ev.esyaEkle({ ad: s.ad, dosya: Editor.yol, ikon: s.ikon });
      Editor.kapat(); A.esyaEklendi(e);
    },
    async adlandir() {
      const eski = Editor.yol, ad = await A.sor('Yeni ad:', 'Değiştir', eski.split('/').pop());
      if (!ad) return;
      const yeni = Depo.norm(eski.replace(/[^/]+$/, '') + ad.replace(/\//g, '-'));
      try {
        Depo.tasi(eski, yeni);
        const l = Ev.esyalar(); let degisti = false;
        l.forEach(e => { if (e.dosya === eski) { e.dosya = yeni; degisti = true; } });
        if (degisti) Ev.esyalariKaydet(l);
        Editor.ac(yeni);
      } catch (e) { A.bildir(e.message); }
    },
    async sil() {
      const p = Editor.yol;
      if (!(await A.sor('"' + p.split('/').pop() + '" silinsin mi?', 'Sil'))) return;
      Depo.sil(p);
      const l = Ev.esyalar(), kalan = l.filter(e => e.dosya !== p);
      if (kalan.length !== l.length) { Ev.esyalariKaydet(kalan); A.esyalarDegisti(); }
      Editor.kapat();
    },
    async model() { const p = Editor.yol; Editor.kapat(); await Atolye.modelAyarla(p); }
  };

  // ================================================================ ATÖLYE
  const Atolye = {
    oneriler() {
      let l = [];
      try { l = Depo.liste('/atolye/oneriler').filter(d => !d.dir && d.name.endsWith('.json')).map(d => Depo.okuJSON('/atolye/oneriler/' + d.name, null)).filter(Boolean); } catch (e) {}
      return l.sort((a, b) => b.z - a.z);
    },
    ciz() {
      const kok = $('#sekme-atolye'), y = A.yasam, v = y.v, d = v.durum;
      const l = Atolye.oneriler();
      const groq = !!(A.ayar().groqAnahtar);
      const hepsi = A.yasamlar, sinir = window.KARAKTER_SINIRI || 10;
      kok.innerHTML = `
        <div class="kutu">
          <h3>Karakterler (${hepsi.length}/${sinir})</h3>
          <p class="aciklama">İsme dokun: onunla konuş ve aşağıdan düzenle. Anahtar: evde olsun ya da olmasın.</p>
          ${hepsi.map(k => `
            <div class="karakterSatir ${k === y ? 'secili' : ''}" data-k="${k.v.id}">
              <i style="background:${esc(k.v.gorunum.serit || k.v.gorunum.ust || '#a77de8')}"></i>
              <b>${esc(k.v.ad)}</b><span>${esc(k.v.tur || '')}</span>
              <input type="checkbox" data-evde="${k.v.id}" ${k.v.evde ? 'checked' : ''} aria-label="Evde">
            </div>`).join('')}
          ${hepsi.length < sinir ? `<details class="yeniKarakter"><summary>+ Yeni karakter (${sinir - hepsi.length} boş yer)</summary>
            <label class="alan">Adı</label><input id="ykAd" maxlength="16">
            <div class="satir" style="margin-top:8px">
              <select id="ykTur"><option>İnsan</option><option>Elf</option><option>Kedi insan</option><option>Android</option><option>Robot</option></select>
              <select id="ykCins"><option>Kadın</option><option>Erkek</option><option>Cinsiyetsiz</option></select>
            </div>
            <div class="satir" style="margin-top:8px">
              <select id="ykStil"><option value="kisa">Kısa saç</option><option value="daginik">Dağınık saç</option><option value="dalgali">Uzun dalgalı</option><option value="toplu">Toplu</option><option value="orgulu">Örgülü</option></select>
            </div>
            <div class="renkler">
              <label>Saç<input type="color" id="ykSac" value="#3b2a20"></label>
              <label>Göz<input type="color" id="ykGoz" value="#5b3a8f"></label>
              <label>Üst<input type="color" id="ykUst" value="#7d5ba6"></label>
              <label>Alt<input type="color" id="ykAlt" value="#2a2633"></label>
            </div>
            <label class="alan">Görünüş tarifi</label><textarea id="ykTarif" rows="2"></textarea>
            <label class="alan">Kişiliği</label><textarea id="ykKisilik" rows="2"></textarea>
            <div class="satir" style="margin-top:10px"><button class="kucukBtn vurgu" id="ykOlustur">Oluştur ve eve al</button></div>
          </details>` : ''}
        </div>

        <div class="kutu">
          <h3>${esc(Dil.ilgi(v.ad))} önerileri</h3>
          <p class="aciklama">${esc(v.ad)} burada senin için bir şeyler üretir. Sen onaylamadan hiçbiri eve girmez.</p>
          ${l.map(o => `
            <div class="oneri" data-id="${o.id}">
              <div class="ust"><span>${esc(o.kim || v.ad)} · ${once(o.z)}</span><span>sayfa</span></div>
              <b>${esc(o.baslik)}</b>
              <p class="aciklama" style="margin:4px 0 8px">İstek: ${esc(o.istek || '')}</p>
              <div class="satir">
                <button class="kucukBtn" data-o="bak">${Ikon.svg('goz')} Önizle</button>
                <button class="kucukBtn vurgu" data-o="onay">${Ikon.svg('tik')} Onayla</button>
                <button class="kucukBtn tehlike" data-o="red">Reddet</button>
              </div>
            </div>`).join('') || '<div class="bos">Bekleyen öneri yok.</div>'}
          <label class="alan">${esc(Dil.ayrilma(v.ad))} bir şey iste</label>
          <textarea id="atIstek" rows="2" placeholder="Örn: su içme takipçisi, basit bir zamanlayıcı…"></textarea>
          <div class="satir"><button class="kucukBtn vurgu" id="atUret" ${groq ? '' : 'disabled'}>Üret</button>
          ${groq ? '' : '<span class="aciklama" style="margin:0">Üretim için Ayarlar\'dan Groq anahtarı gerekli.</span>'}</div>
        </div>

        <div class="kutu">
          <h3>${esc(v.ad)}: bilgiler</h3>
          <p class="aciklama">${esc((v.tur || '') + (v.cinsiyet ? ' · ' + v.cinsiyet : ''))}${v.tarif ? '<br>' + esc(v.tarif) : ''}</p>
          <label class="alan">Adı</label><input id="atAd" value="${esc(v.ad)}">
          <label class="alan">Kişiliği</label><textarea id="atKisilik" rows="3">${esc(v.kisilik)}</textarea>
          <div class="satir" style="margin-top:10px"><button class="kucukBtn vurgu" id="atKaydet">Kaydet</button></div>
        </div>

        <div class="kutu">
          <h3>${esc(v.ad)}: sohbet görünümü</h3>
          ${v.portre ? `<img class="portreKucuk" src="${esc(A.portreKaynak(y) || '')}" alt="">` : ''}
          <p class="aciklama">${v.portre ? 'Mesajlaşma ve sesli konuşmada bu görsel canlı portre olarak görünür; evde 3D beden dolaşır.' : 'Portre yok: mesajlaşmada 3D beden görünür. ChatGPT vb. ile hazırladığın boy boyu, şeffaf arka planlı bir görsel yükleyebilirsin.'}</p>
          ${v.portre ? `<label class="anahtar"><span>Sohbette portreyi göster (kapalıysa 3D beden)</span><input type="checkbox" id="atPortreAcik" ${v.sohbetGorunum !== '3d' ? 'checked' : ''}></label>` : ''}
          <div class="satir">
            <button class="kucukBtn vurgu" id="atPortre">${Ikon.svg('resim')} ${v.portre ? 'Portreyi değiştir' : 'Portre yükle'}</button>
            ${v.portre ? '<button class="kucukBtn" id="atPortreSil">Kaldır</button>' : ''}
            <input type="file" id="atPortreInput" accept="image/*" class="gizli">
          </div>
        </div>

        <div class="kutu">
          <h3>${esc(v.ad)}: 3D beden</h3>
          <p class="aciklama">Şu an: <b>${v.model ? esc(v.model.split('/').pop()) : 'hazır beden'}</b>. VRoid ile yapılmış bir .vrm modeli yükleyerek ${esc(Dil.ilgi(v.ad))} bedenini değiştirebilirsin.${A.sahne.yedek ? ' (Bu cihazda 3D başlatılamadı, yedek görünüm kullanılıyor.)' : ''}</p>
          <div class="satir">
            <button class="kucukBtn vurgu" id="atVrm">${Ikon.svg('yukle')} VRM yükle</button>
            ${v.model ? '<button class="kucukBtn" id="atChibi">Hazır bedene dön</button>' : ''}
            <input type="file" id="atVrmInput" accept=".vrm,model/gltf-binary,application/octet-stream" class="gizli">
          </div>
        </div>

        <div class="kutu">
          <h3>${esc(v.ad)}: ses</h3>
          <label class="alan">Ses perdesi: <span id="atPerdeD">${v.ses.perde.toFixed(2)}</span></label>
          <input type="range" id="atPerde" min="0.5" max="2" step="0.05" value="${v.ses.perde}">
          <label class="alan">Konuşma hızı: <span id="atHizD">${v.ses.hiz.toFixed(2)}</span></label>
          <input type="range" id="atHiz" min="0.5" max="1.8" step="0.05" value="${v.ses.hiz}">
          <div class="satir" style="margin-top:10px"><button class="kucukBtn" id="atSesDene">${Ikon.svg('hoparlor')} Dene</button></div>
        </div>

        <div class="kutu">
          <h3>${esc(v.ad)}: gerçek iç durum</h3>
          <p class="aciklama">Bu sayılar uydurma değil; aşağıdaki olaylarla değişir. Yüz ifadesi buradan gelir.</p>
          <div class="durumSatir"><span>Mutluluk</span><div class="durumCubuk"><i style="width:${d.mutluluk}%"></i></div><b>${Math.round(d.mutluluk)}</b></div>
          <div class="durumSatir"><span>Enerji</span><div class="durumCubuk"><i style="width:${d.enerji}%"></i></div><b>${Math.round(d.enerji)}</b></div>
          <ul class="olaylar">${v.olaylar.slice(-6).reverse().map(o => `<li>${esc(o.olay)}${o.etki ? ' · ' + esc(o.etki) : ''} <span style="float:right">${once(o.z)}</span></li>`).join('') || '<li>Henüz olay yok.</li>'}</ul>
        </div>`;

      kok.querySelectorAll('.karakterSatir').forEach(r => r.onclick = e => {
        if (e.target.matches('input')) return;
        A.karakterSec(r.dataset.k); Atolye.ciz();
      });
      kok.querySelectorAll('[data-evde]').forEach(c => c.onchange = () => {
        if (!A.evdeAyarla(c.dataset.evde, c.checked)) c.checked = !c.checked;
        Atolye.ciz();
      });
      if ($('#ykOlustur')) $('#ykOlustur').onclick = () => {
        const ad = $('#ykAd').value.trim(); if (!ad) return A.bildir('Bir ad yaz');
        const tur = $('#ykTur').value;
        const gorunum = { sac: $('#ykSac').value, sacStil: tur === 'Kedi insan' ? 'kedi' : $('#ykStil').value, goz: $('#ykGoz').value, ust: $('#ykUst').value, alt: $('#ykAlt').value };
        if (tur === 'Elf') gorunum.kulak = 'elf';
        if (tur === 'Kedi insan') { gorunum.kulak = 'kedi'; gorunum.kuyruk = true; }
        if (tur === 'Android') gorunum.mekanik = true;
        if (tur === 'Robot') Object.assign(gorunum, { robot: true, boy: 0.8 });
        try {
          const yeni = Yasam.olustur({ ad, tur, cinsiyet: $('#ykCins').value, tarif: $('#ykTarif').value.trim(), kisilik: $('#ykKisilik').value.trim() || 'Sakin ve dürüst. Kısa ve doğal konuşur.', gorunum, ses: { perde: $('#ykCins').value === 'Erkek' ? 0.9 : 1.12, hiz: 1 } });
          A.karakterEkle(yeni); A.karakterSec(yeni.v.id);
          yeni.olay('Eve yeni taşındım', 5);
          A.bildir(ad + ' eve taşındı');
        } catch (err) { A.bildir(err.message); }
        Atolye.ciz();
      };
      kok.querySelectorAll('.oneri').forEach(div => {
        const o = l.find(x => x.id === div.dataset.id);
        div.querySelector('[data-o=bak]').onclick = () => A.onizleHtml(o.html, o.baslik);
        div.querySelector('[data-o=onay]').onclick = () => Atolye.onayla(o);
        div.querySelector('[data-o=red]').onclick = async () => {
          if (!(await A.sor('"' + o.baslik + '" reddedilsin mi?', 'Reddet'))) return;
          Depo.sil('/atolye/oneriler/' + o.id + '.json');
          y.olay('Önerim reddedildi: ' + o.baslik, -3);
          Atolye.ciz();
        };
      });
      const uretBtn = $('#atUret');
      uretBtn.onclick = async () => {
        const istek = $('#atIstek').value.trim(); if (!istek) return;
        uretBtn.disabled = true; uretBtn.textContent = 'Üretiliyor…';
        try {
          const o = await Zihin.uret(istek, y);
          y.olay("Atölye'de bir şey ürettim: " + o.baslik, 3);
          A.bildir('Öneri hazır: ' + o.baslik);
        } catch (e) { A.bildir(e.message); }
        Atolye.ciz();
      };
      $('#atKaydet').onclick = () => {
        v.ad = $('#atAd').value.trim() || v.ad; v.kisilik = $('#atKisilik').value.trim() || v.kisilik;
        y.kaydet(); A.basligiGuncelle(); A.sahne.isimleriYenile(); A.bildir('Kaydedildi');
      };
      $('#atPortre').onclick = () => $('#atPortreInput').click();
      $('#atPortreInput').onchange = e => {
        const f = e.target.files[0]; if (!f) return;
        const uz = (f.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
        dosyaOku(f, b64 => {
          const yol = '/karakterler/' + v.id + '/portre.' + uz;
          try { Depo.yazB64(yol, b64); } catch (err) { return A.bildir(err.message); }
          A.portreUnut(yol);
          v.portre = yol; v.sohbetGorunum = 'portre'; v.yuz = { x: 0.5, y: 0.09 }; y.kaydet();
          A.portreGuncelle(); A.bildir('Portre hazır'); Atolye.ciz();
        });
      };
      if ($('#atPortreSil')) $('#atPortreSil').onclick = async () => {
        if (!(await A.sor(Dil.ilgi(v.ad) + ' portresi kaldırılsın mı? Sohbette 3D beden görünür.', 'Kaldır'))) return;
        v.portre = ''; y.kaydet(); A.portreGuncelle(); Atolye.ciz();
      };
      if ($('#atPortreAcik')) $('#atPortreAcik').onchange = e => { v.sohbetGorunum = e.target.checked ? 'portre' : '3d'; y.kaydet(); A.portreGuncelle(); };
      $('#atVrm').onclick = () => $('#atVrmInput').click();
      $('#atVrmInput').onchange = e => {
        const f = e.target.files[0]; if (!f) return;
        A.bildir('Model yükleniyor…');
        dosyaOku(f, async b64 => {
          const yol = '/karakterler/' + v.id + '/' + f.name.replace(/[^\w.\-]/g, '_');
          try { Depo.yazB64(yol, b64); } catch (err) { return A.bildir(err.message); }
          await Atolye.modelAyarla(yol);
        });
      };
      if ($('#atChibi')) $('#atChibi').onclick = () => { v.model = ''; y.kaydet(); A.sahne.modeliKaldir(v.id); A.bildir('Hazır bedene dönüldü'); Atolye.ciz(); };
      const perde = $('#atPerde'), hiz = $('#atHiz');
      perde.oninput = () => { v.ses.perde = parseFloat(perde.value); $('#atPerdeD').textContent = v.ses.perde.toFixed(2); y.kirli = true; };
      hiz.oninput = () => { v.ses.hiz = parseFloat(hiz.value); $('#atHizD').textContent = v.ses.hiz.toFixed(2); y.kirli = true; };
      $('#atSesDene').onclick = () => { y.kaydet(); A.konus('Merhaba, ben ' + v.ad + '. Sesim böyle.', true); };
    },
    async modelAyarla(yol) {
      const v = A.yasam.v;
      try {
        await A.modelYukle(v.id, yol);
        v.model = yol; A.yasam.kaydet();
        A.yasam.olay('Yeni bir bedenim oldu', 5);
        A.bildir('Yeni beden hazır');
      } catch (e) { A.bildir('Model yüklenemedi: ' + e.message); }
      if (Panel.sekme === 'atolye') Atolye.ciz();
    },
    onayla(o) {
      const ad = o.baslik.replace(/[^\wçğıöşüÇĞİÖŞÜ \-]/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'sayfa';
      let yol = '/ev/sayfalar/' + ad + '.html', i = 2;
      while (Depo.var(yol)) yol = '/ev/sayfalar/' + ad + '-' + (i++) + '.html';
      Depo.yaz(yol, o.html);
      Depo.sil('/atolye/oneriler/' + o.id + '.json');
      const e = Ev.esyaEkle({ ad: o.baslik.slice(0, 24), dosya: yol, ikon: 'sayfa' });
      A.yasam.olay('Önerim onaylandı: ' + o.baslik, 8);
      A.esyaEklendi(e);
      Atolye.ciz();
    }
  };

  // ================================================================ AYARLAR
  const Ayarlar = {
    ciz() {
      const kok = $('#sekme-ayarlar'), a = A.ayar();
      kok.innerHTML = `
        <div class="kutu">
          <h3>Yapay zekâ</h3>
          <p class="aciklama">Anahtar olmadan da ${esc(A.yasam.v.ad)} basit şeylere cevap verir. Groq anahtarı eklersen gerçek sohbet ve Atölye üretimi açılır. Anahtar sadece bu telefonda saklanır.</p>
          <label class="alan">Groq API anahtarı</label><input id="ayAnahtar" type="password" value="${esc(a.groqAnahtar || '')}" placeholder="gsk_…">
          <label class="alan">Model</label><input id="ayModel" value="${esc(a.groqModel || 'llama-3.3-70b-versatile')}">
          <div class="satir" style="margin-top:10px">
            <button class="kucukBtn vurgu" id="ayKaydet">Kaydet</button>
            <button class="kucukBtn" id="ayDene">Bağlantıyı dene</button>
          </div>
        </div>
        <div class="kutu">
          <h3>Ses ve görünüm</h3>
          <label class="anahtar"><span>Mesajlaşmada cevapları sesli oku</span><input type="checkbox" id="aySesli" ${a.mesajSesli ? 'checked' : ''}></label>
          <label class="anahtar"><span>Gece modu</span><input type="checkbox" id="ayGece" ${a.gece ? 'checked' : ''}></label>
          <label class="anahtar"><span>Gölgeler (kapatmak pili korur)</span><input type="checkbox" id="ayGolge" ${a.golge !== false ? 'checked' : ''}></label>
        </div>
        <div class="kutu">
          <h3>Veriler</h3>
          <p class="aciklama">Tüm veriler sadece bu telefonda, uygulamanın kendi klasöründe durur.</p>
          <div class="satir">
            <button class="kucukBtn" id="aySohbetSil">Sohbet geçmişini sil</button>
            <button class="kucukBtn tehlike" id="ayHepsiniSil">Her şeyi sıfırla</button>
          </div>
        </div>
        <div class="kutu">
          <h3>Hakkında</h3>
          <p class="aciklama" style="margin:0">Lonca v0.1 · Görüntü: ${A.sahne.yedek ? '2D yedek (3D başlatılamadı)' : '3D'} · Ses: ${Ses.destek().konusma ? 'var' : 'yok'} · Dinleme: ${Ses.destek().dinleme ? 'var' : 'yok'}</p>
        </div>`;
      $('#ayKaydet').onclick = () => {
        A.ayarYaz({ groqAnahtar: $('#ayAnahtar').value.trim(), groqModel: $('#ayModel').value.trim() || 'llama-3.3-70b-versatile' });
        A.bildir('Kaydedildi');
      };
      $('#ayDene').onclick = async () => {
        A.ayarYaz({ groqAnahtar: $('#ayAnahtar').value.trim(), groqModel: $('#ayModel').value.trim() || 'llama-3.3-70b-versatile' });
        A.bildir('Deneniyor…');
        try { await Zihin.dene(); A.bildir('Bağlantı çalışıyor'); } catch (e) { A.bildir(e.message); }
      };
      $('#aySesli').onchange = e => A.ayarYaz({ mesajSesli: e.target.checked });
      $('#ayGece').onchange = e => { A.ayarYaz({ gece: e.target.checked }); A.sahne.gece(e.target.checked); };
      $('#ayGolge').onchange = e => { A.ayarYaz({ golge: e.target.checked }); A.sahne.golge(e.target.checked); };
      $('#aySohbetSil').onclick = async () => {
        if (!(await A.sor('Sohbet geçmişi silinsin mi?', 'Sil'))) return;
        A.yasam.v.hafiza = []; A.yasam.kaydet(); A.mesajlariCiz(); A.bildir('Silindi');
      };
      $('#ayHepsiniSil').onclick = async () => {
        if (!(await A.sor('Ev, Laboratuvar dosyaları, karakter ve ayarlar dahil HER ŞEY silinecek. Emin misin?', 'Her şeyi sil'))) return;
        for (const d of Depo.liste('/')) Depo.sil('/' + d.name);
        location.reload();
      };
    }
  };

  // ================================================================ PANEL KABUĞU
  const Panel = {
    sekme: 'lab',
    kur(app) {
      A = app;
      $('#menuBtn').innerHTML = Ikon.svg('menu');
      $('#menuBtn').onclick = () => Panel.ac();
      $('#perde').onclick = () => Panel.kapat();
      document.querySelectorAll('#sekmeler button').forEach(b => b.onclick = () => Panel.goster(b.dataset.sekme));
      $('#editorKapat').innerHTML = Ikon.svg('kapat');
      $('#editorKapat').onclick = () => Editor.kapat();
      $('#editorKaydet').onclick = () => Editor.kaydet();
    },
    ac(sekme) {
      $('#panel').classList.add('acik'); $('#panel').setAttribute('aria-hidden', 'false');
      $('#perde').classList.remove('gizli');
      Panel.goster(sekme || Panel.sekme);
    },
    kapat() {
      $('#panel').classList.remove('acik'); $('#panel').setAttribute('aria-hidden', 'true');
      $('#perde').classList.add('gizli');
    },
    acikMi() { return $('#panel').classList.contains('acik'); },
    goster(s) {
      Panel.sekme = s;
      document.querySelectorAll('#sekmeler button').forEach(b => b.classList.toggle('aktif', b.dataset.sekme === s));
      document.querySelectorAll('.sekme').forEach(x => x.classList.toggle('aktif', x.id === 'sekme-' + s));
      try { ({ lab: Lab, atolye: Atolye, ayarlar: Ayarlar })[s].ciz(); } catch (e) { console.error(e); A.bildir('Panel hatası: ' + e.message); }
    },
    Editor, Lab, Atolye
  };
  window.Panel = Panel;
})();
