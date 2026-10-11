/* Başlatıcı: uygulamanın scriptlerini sırayla yükler.
 * APK'da 3D kütüphaneleri js/vendor.js içinde gelir (GitHub Actions paketler).
 * vendor.js yoksa (ör. Spck önizlemesi) ve internet varsa, kütüphaneleri internetten dener.
 * O da olmazsa uygulama 2D yedek görünümle açılır; hiçbir durumda açılmamazlık yapmaz.
 */
(function () {
  const SIRA = ['depo', 'ikon', 'ev', 'karakterler', 'yasam', 'yuz', 'sahne3d', 'sahne2d', 'ses', 'zihin', 'panel', 'varsayilan', 'app'];
  const CDN = {
    three: 'https://esm.sh/three@0.169.0',
    gltf: 'https://esm.sh/three@0.169.0/examples/jsm/loaders/GLTFLoader.js',
    vrm: 'https://esm.sh/@pixiv/three-vrm@3?deps=three@0.169.0'
  };

  function scriptYukle(ad) {
    return new Promise((ok, hata) => {
      const s = document.createElement('script');
      s.src = 'js/' + ad + '.js';
      s.onload = ok; s.onerror = () => hata(new Error(ad + '.js yüklenemedi'));
      document.body.appendChild(s);
    });
  }

  function zamanAsimi(ms) { return new Promise((_, h) => setTimeout(() => h(new Error('zaman aşımı')), ms)); }

  async function internettenDene() {
    if (window.LONCA3D || !navigator.onLine) return;
    try {
      const [THREE, gltf, vrm] = await Promise.race([
        Promise.all([import(CDN.three), import(CDN.gltf), import(CDN.vrm)]),
        zamanAsimi(10000)
      ]);
      window.LONCA3D = { THREE, GLTFLoader: gltf.GLTFLoader, VRMLoaderPlugin: vrm.VRMLoaderPlugin, VRMUtils: vrm.VRMUtils };
      console.log('3D kütüphaneleri internetten yüklendi');
    } catch (e) {
      console.warn('3D kütüphaneleri internetten yüklenemedi, 2D yedek kullanılacak:', e.message);
    }
  }

  (async () => {
    await internettenDene();
    for (const ad of SIRA) {
      try { await scriptYukle(ad); }
      catch (e) { console.error(e); document.body.insertAdjacentHTML('beforeend', '<div style="position:fixed;top:60px;left:12px;right:12px;padding:12px;background:#3a1020;color:#fff;border-radius:12px;z-index:99">' + e.message + '</div>'); return; }
    }
  })();
})();
