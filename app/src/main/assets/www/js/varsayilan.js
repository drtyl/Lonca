/* İlk açılışta evin içine konan örnek dosyalar. Hepsi Laboratuvar'dan düzenlenebilir. */
window.VARSAYILAN = {

notlar: `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Notlarım</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 16px; background: #0d0b18; color: #ece8ff; font-family: system-ui, sans-serif; }
  .kart { background: #16132a; border: 1px solid #2e2752; border-radius: 18px; padding: 18px; min-height: 70vh; }
  h1 { font-size: 24px; margin: 0 0 16px; }
  ul { list-style: none; padding: 0; margin: 0; }
  li { display: flex; align-items: center; gap: 12px; padding: 10px 0; font-size: 18px; }
  li input { width: 22px; height: 22px; accent-color: #a77de8; flex: none; }
  li span { flex: 1; }
  li.bitti span { color: #6f6894; text-decoration: line-through; }
  li button { background: none; border: 0; color: #6f6894; font-size: 20px; }
  form { display: flex; gap: 8px; margin-top: 16px; }
  form input { flex: 1; background: #1e1a38; color: #ece8ff; border: 1px solid #2e2752; border-radius: 12px; padding: 12px; font-size: 16px; }
  form button { background: #1e1a38; color: #d6c4ff; border: 1px solid #a77de8; border-radius: 12px; padding: 0 16px; font-size: 22px; }
  .bos { color: #6f6894; padding: 10px 0; }
</style>
</head>
<body>
  <div class="kart">
    <h1>Bugünkü plan</h1>
    <ul id="liste"></ul>
    <form id="ekle"><input id="yeni" placeholder="Yeni madde…" autocomplete="off"><button>+</button></form>
  </div>
<script>
  var liste = [];
  function ciz() {
    var ul = document.getElementById('liste'); ul.innerHTML = '';
    if (!liste.length) { ul.innerHTML = '<li class="bos">Henüz bir şey yok.</li>'; return; }
    liste.forEach(function (m, i) {
      var li = document.createElement('li'); if (m.bitti) li.className = 'bitti';
      var cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!m.bitti;
      cb.onchange = function () { m.bitti = cb.checked; kaydet(); if (m.bitti) Lonca.soyle('Aferin, bir iş bitti!'); };
      var sp = document.createElement('span'); sp.textContent = m.metin;
      var sil = document.createElement('button'); sil.textContent = '×';
      sil.onclick = function () { liste.splice(i, 1); kaydet(); };
      li.appendChild(cb); li.appendChild(sp); li.appendChild(sil); ul.appendChild(li);
    });
  }
  function kaydet() { Lonca.kaydet('liste', liste); ciz(); }
  document.getElementById('ekle').onsubmit = function (e) {
    e.preventDefault();
    var inp = document.getElementById('yeni'), t = inp.value.trim(); if (!t) return;
    liste.push({ metin: t, bitti: false }); inp.value = ''; kaydet(); Lonca.soyle('Not aldım.');
  };
  Lonca.oku('liste').then(function (v) { liste = v || [{ metin: 'Ders tekrarı', bitti: false }, { metin: 'Lonca tasarımı', bitti: false }]; ciz(); });
</script>
</body>
</html>
`,

merhaba: `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Merhaba</title>
<style>
  body { margin: 0; padding: 24px; background: #0d0b18; color: #ece8ff; font-family: system-ui, sans-serif; }
  button { background: #1e1a38; color: #ece8ff; border: 1px solid #a77de8; border-radius: 12px; padding: 14px 18px; font-size: 16px; }
  #sayac { font-size: 48px; margin: 20px 0; }
</style>
</head>
<body>
  <h1>Örnek sayfa</h1>
  <p>Bu dosyayı Laboratuvar'da açıp değiştirebilir, sonra "Eve yerleştir" ile evine koyabilirsin.</p>
  <div id="sayac">0</div>
  <button id="bas">Bas</button>
<script>
  var n = 0, el = document.getElementById('sayac');
  Lonca.oku('n').then(function (v) { n = v || 0; el.textContent = n; });
  document.getElementById('bas').onclick = function () {
    n++; el.textContent = n; Lonca.kaydet('n', n);
    if (n % 10 === 0) Lonca.soyle(n + ' oldu!');
  };
</script>
</body>
</html>
`,

benioku: `# Laboratuvar

Burası senin tezgâhın. Burada her türden dosya ve klasör tutabilirsin.

## Eve sayfa eklemek
1. Yeni bir .html dosyası oluştur (ya da içe aktar).
2. Dosyayı açıp "Eve yerleştir" de.
3. Evde bir eşya olarak görünür; dokununca karakter oraya yürür ve sayfayı açar.

## Sayfaların kullanabileceği Lonca araçları
- Lonca.kaydet(anahtar, deger)  → veriyi kalıcı saklar (bu sayfaya özel)
- await Lonca.oku(anahtar)      → saklanan veriyi okur
- Lonca.soyle("metin")          → karakter köşeden bunu söyler

Sayfa aynı klasördeki resim, css ve js dosyalarını kullanabilir (örn. <img src="resim.png">).
Sayfalar kum havuzunda çalışır: uygulamanın geri kalanına dokunamaz.

## Klasörler
- /ev          → evin kendisi (eşyalar, sayfalar, sayfa verileri)
- /karakterler → karakterlerin bilgileri ve 3D modelleri
- /atolye      → karakterin ürettiği, onay bekleyen öneriler
- /lab         → senin serbest çalışma alanın
`
};
