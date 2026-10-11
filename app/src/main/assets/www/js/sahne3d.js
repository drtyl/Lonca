/* Sahne3D: tepeden bakılan 3D ev + içinde yaşayan karakterler.
 * Kütüphaneler window.LONCA3D'den gelir (vendor.js ya da internet). Yoksa uygulama 2D yedeğe geçer.
 *
 * Kamera modları:
 *   ev     → evin üstünden; tek parmakla kaydır, iki parmakla yakınlaştır
 *   sohbet → seçili karakter boy boyu (mesajlaşma ekranının sol sütunu)
 *   sesli  → seçili karakter dizden yukarı
 *   kose   → seçili karakterin yüzü (sayfa kullanırken köşedeki yuvarlak)
 */
(function () {
  const L = window.LONCA3D;
  if (!L) { window.Sahne3D = null; return; }
  const { THREE, GLTFLoader, VRMLoaderPlugin, VRMUtils } = L;

  // ------------------------------------------------------------ yardımcılar
  const mat = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.82, metalness: 0 }, o));
  function golgeli(o) { o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; }
  function kutu(w, h, d, c, o) { return golgeli(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c, o))); }
  function silindir(rt, rb, h, c, o, seg = 16) { return golgeli(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(c, o))); }
  function kapsul(r, l, c, o) { return golgeli(new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 4, 12), mat(c, o))); }
  function kure(r, c, o, a = 16, b = 12) { return golgeli(new THREE.Mesh(new THREE.SphereGeometry(r, a, b), mat(c, o))); }
  const lerp = (a, b, t) => a + (b - a) * t;
  const yer = (o, x, y, z) => { o.position.set(x, y, z); return o; };

  function zeminDokusu(taban, karo) {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const x = c.getContext('2d');
    const base = new THREE.Color(taban);
    if (karo) {
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
        x.fillStyle = '#' + base.clone().multiplyScalar(0.93 + ((i + j) % 2) * 0.07 + Math.random() * 0.03).getHexString();
        x.fillRect(i * 64, j * 64, 64, 64);
      }
      x.strokeStyle = 'rgba(0,0,0,.15)'; x.lineWidth = 2;
      for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, 512); x.stroke(); x.beginPath(); x.moveTo(0, i * 64); x.lineTo(512, i * 64); x.stroke(); }
    } else {
      for (let r = 0; r < 8; r++) {
        let px = -Math.random() * 200;
        while (px < 512) {
          const len = 180 + Math.random() * 220;
          x.fillStyle = '#' + base.clone().multiplyScalar(0.86 + Math.random() * 0.22).getHexString();
          x.fillRect(px, r * 64, len, 64);
          x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(px, r * 64, 2, 64);
          px += len;
        }
        x.fillStyle = 'rgba(0,0,0,.22)'; x.fillRect(0, r * 64 + 62, 512, 2);
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }

  // ------------------------------------------------------------ mobilya
  const KITAP_RENK = ['#7d5ba6', '#3d5a80', '#c9a227', '#a14a4a', '#4a7a5a', '#e0d6c8', '#5a4a8a'];
  const AHSAP = '#7a5236', KOYU_AHSAP = '#5b3b26';

  function mobilyaYap(m, lambalar) {
    const g = new THREE.Group();
    switch (m.tip) {
      case 'kitaplik': {
        g.add(yer(kutu(m.w, m.h, m.d, KOYU_AHSAP), 0, m.h / 2, 0));
        for (let r = 0; r < 3; r++) {
          let x = -m.w / 2 + 0.08;
          const y = 0.12 + r * (m.h - 0.2) / 3;
          while (x < m.w / 2 - 0.12) {
            const bw = 0.05 + Math.random() * 0.06, bh = 0.2 + Math.random() * 0.12;
            g.add(yer(kutu(bw, bh, m.d * 0.7, KITAP_RENK[(Math.random() * KITAP_RENK.length) | 0]), x + bw / 2, y + bh / 2, 0.06));
            x += bw + 0.01;
          }
        }
        break;
      }
      case 'lamba': {
        g.add(yer(silindir(0.02, 0.02, m.h, '#3a3340'), 0, m.h / 2, 0));
        g.add(yer(silindir(0.14, 0.16, 0.04, '#3a3340'), 0, 0.02, 0));
        const s = yer(silindir(0.13, 0.18, 0.26, '#fff1d6', { emissive: '#ffcf8a', emissiveIntensity: 0.9 }), 0, m.h, 0); s.castShadow = false; g.add(s);
        const isik = new THREE.PointLight('#ffc98a', 3, 4.5, 2); isik.position.y = m.h - 0.1; g.add(isik); lambalar.push(isik);
        break;
      }
      case 'tv': {
        g.add(yer(kutu(m.w, 0.42, m.d, AHSAP), 0, 0.21, 0));
        g.add(yer(kutu(m.w * 0.85, 0.62, 0.05, '#111118', { emissive: '#1b2140', emissiveIntensity: 0.6 }), 0, 0.75, -m.d / 2 + 0.06));
        break;
      }
      case 'perde': {
        g.add(yer(kutu(m.w, m.h, 0.06, '#0d0d12', { emissive: '#3b4f9a', emissiveIntensity: 0.7 }), 0, 0.35 + m.h / 2, 0));
        g.add(yer(kutu(m.w + 0.1, 0.08, 0.1, '#222'), 0, 0.3, 0));
        break;
      }
      case 'bitki': {
        g.add(yer(silindir(m.w * 0.36, m.w * 0.28, 0.32, '#c06a45'), 0, 0.16, 0));
        const yesil = ['#3f7d4a', '#4f9a58', '#2f6a3c'];
        for (let i = 0; i < 5; i++) {
          const y = golgeli(new THREE.Mesh(new THREE.IcosahedronGeometry(0.15 + Math.random() * 0.08, 0), mat(yesil[i % 3], { flatShading: true })));
          y.position.set((Math.random() - 0.5) * 0.25, 0.4 + i * (m.h - 0.45) / 5, (Math.random() - 0.5) * 0.25);
          y.rotation.set(Math.random(), Math.random(), Math.random()); g.add(y);
        }
        break;
      }
      case 'hali': {
        const h = new THREE.Mesh(new THREE.CircleGeometry(0.5, 40), mat(m.renk, { roughness: 1 }));
        h.rotation.x = -Math.PI / 2; h.scale.set(m.w, m.d, 1); h.position.y = 0.006; h.receiveShadow = true; g.add(h);
        break;
      }
      case 'koltuk': case 'berjer': {
        const w = m.w, d = m.d, c = m.renk;
        g.add(yer(kutu(w, 0.38, d, c), 0, 0.19, 0));
        g.add(yer(kutu(w, 0.42, 0.2, c), 0, 0.55, -d / 2 + 0.1));
        for (const k of [-1, 1]) g.add(yer(kutu(0.18, 0.26, d, c), k * (w / 2 - 0.09), 0.5, 0));
        const yastik = m.tip === 'koltuk' ? ['#6c4bb4', '#d8d0e0', '#3d4f8a'] : ['#6c4bb4'];
        yastik.forEach((yc, i) => { const y = yer(kutu(0.36, 0.3, 0.12, yc), (i - (yastik.length - 1) / 2) * (w / 3.2), 0.56, -d / 2 + 0.26); y.rotation.x = -0.25; g.add(y); });
        break;
      }
      case 'sehpa': {
        g.add(yer(kutu(m.w, 0.06, m.d, AHSAP), 0, m.h, 0));
        for (const a of [-1, 1]) for (const b of [-1, 1]) g.add(yer(kutu(0.05, m.h, 0.05, KOYU_AHSAP), a * (m.w / 2 - 0.06), m.h / 2, b * (m.d / 2 - 0.06)));
        g.add(yer(silindir(0.04, 0.035, 0.09, '#e9e4f2'), m.w * 0.25, m.h + 0.075, 0.05));
        break;
      }
      case 'puf': {
        g.add(yer(silindir(m.w / 2, m.w / 2, m.h, m.renk, {}, 24), 0, m.h / 2, 0));
        const o = yer(kutu(m.w * 0.5, 0.03, m.w * 1.02, '#8a6cc8'), 0.05, m.h + 0.01, 0); o.rotation.y = 0.5; g.add(o);
        break;
      }
      case 'masa': {
        g.add(yer(kutu(m.w, 0.05, m.d, '#b5895c'), 0, m.h, 0));
        for (const a of [-1, 1]) g.add(yer(kutu(0.05, m.h, m.d * 0.9, KOYU_AHSAP), a * (m.w / 2 - 0.05), m.h / 2, 0));
        g.add(yer(kutu(0.62, 0.38, 0.04, '#15151c', { emissive: '#3b4f9a', emissiveIntensity: 0.55 }), 0, m.h + 0.27, -m.d / 2 + 0.12));
        g.add(yer(kutu(0.42, 0.02, 0.14, '#2a2a33'), 0, m.h + 0.035, 0.08));
        g.add(yer(silindir(0.06, 0.09, 0.08, '#e9e1c8', { emissive: '#ffd59a', emissiveIntensity: 0.8 }), m.w / 2 - 0.2, m.h + 0.36, -0.1));
        g.add(yer(silindir(0.012, 0.012, 0.35, '#2b2b33'), m.w / 2 - 0.2, m.h + 0.18, -0.15));
        const isik = new THREE.PointLight('#ffd59a', 2.5, 2.5, 2); isik.position.set(m.w / 2 - 0.2, m.h + 0.3, 0); g.add(isik); lambalar.push(isik);
        break;
      }
      case 'sandalye': {
        g.add(yer(kutu(m.w, 0.08, m.d, '#2d2a38'), 0, 0.48, 0));
        g.add(yer(kutu(m.w, 0.5, 0.07, '#2d2a38'), 0, 0.78, m.d / 2 - 0.04));
        g.add(yer(silindir(0.03, 0.03, 0.44, '#555'), 0, 0.22, 0));
        g.add(yer(silindir(0.24, 0.24, 0.03, '#444'), 0, 0.02, 0));
        break;
      }
      case 'dolap': {
        g.add(yer(kutu(m.w, m.h, m.d, AHSAP), 0, m.h / 2, 0));
        for (let i = 0; i < 3; i++) g.add(yer(kutu(m.w * 0.9, 0.015, 0.02, KOYU_AHSAP), 0, 0.25 + i * 0.25, m.d / 2));
        g.add(yer(silindir(0.06, 0.08, 0.2, '#a77de8'), -0.35, m.h + 0.1, 0));
        break;
      }
      case 'tezgah': {
        if (m.atolye) {
          g.add(yer(kutu(m.w, 0.07, m.d, '#b5895c'), 0, m.h, 0));
          for (const a of [-1, 1]) g.add(yer(kutu(0.07, m.h, m.d * 0.9, KOYU_AHSAP), a * (m.w / 2 - 0.06), m.h / 2, 0));
          g.add(yer(kutu(m.w * 0.9, 0.04, m.d * 0.8, KOYU_AHSAP), 0, 0.25, 0));
          g.add(yer(kutu(0.3, 0.12, 0.2, '#c9502e'), -m.w * 0.25, m.h + 0.09, 0));          // alet çantası
          g.add(yer(silindir(0.03, 0.03, 0.25, '#888'), m.w * 0.2, m.h + 0.05, 0.05).rotateZ(Math.PI / 2));
          g.add(yer(kutu(0.18, 0.18, 0.18, '#3d5a80'), m.w * 0.05, m.h + 0.12, -0.1));     // kutu
        } else {
          g.add(yer(kutu(m.w, m.h - 0.04, m.d, '#f2ede4'), 0, (m.h - 0.04) / 2, 0));
          g.add(yer(kutu(m.w + 0.02, 0.04, m.d + 0.02, '#3a3a42'), 0, m.h - 0.02, 0));
          for (let i = 0; i < 4; i++) g.add(yer(kutu(0.02, m.h * 0.7, 0.01, '#cfc7ba'), -m.w / 2 + (i + 1) * m.w / 5, m.h * 0.45, m.d / 2 + 0.005));
          g.add(yer(kutu(0.5, 0.02, 0.4, '#222'), m.w * 0.25, m.h + 0.01, 0));               // ocak
          for (const a of [-1, 1]) for (const b of [-1, 1]) g.add(yer(silindir(0.06, 0.06, 0.01, '#555'), m.w * 0.25 + a * 0.12, m.h + 0.025, b * 0.09));
          g.add(yer(kutu(0.45, 0.03, 0.35, '#b8c4cc'), -m.w * 0.25, m.h + 0.005, 0));        // eviye
        }
        break;
      }
      case 'buzdolabi': {
        g.add(yer(kutu(m.w, m.h, m.d, '#e9edf2', { roughness: 0.4 }), 0, m.h / 2, 0));
        g.add(yer(kutu(m.w * 0.96, 0.015, 0.02, '#b8c0c8'), 0, m.h * 0.62, m.d / 2));
        g.add(yer(kutu(0.03, 0.3, 0.03, '#9aa0a8'), m.w * 0.35, m.h * 0.78, m.d / 2 + 0.02));
        break;
      }
      case 'yemekmasasi': {
        g.add(yer(kutu(m.w, 0.05, m.d, '#b5895c'), 0, m.h, 0));
        for (const a of [-1, 1]) for (const b of [-1, 1]) g.add(yer(kutu(0.05, m.h, 0.05, KOYU_AHSAP), a * (m.w / 2 - 0.07), m.h / 2, b * (m.d / 2 - 0.07)));
        for (const [x, z, r] of [[-0.35, -0.7, 0], [0.35, -0.7, 0], [-0.35, 0.7, Math.PI], [0.35, 0.7, Math.PI]]) {
          const s = new THREE.Group();
          s.add(yer(kutu(0.4, 0.05, 0.4, '#8a6cc8'), 0, 0.45, 0));
          s.add(yer(kutu(0.4, 0.4, 0.05, KOYU_AHSAP), 0, 0.68, -0.18));
          for (const a of [-1, 1]) for (const b of [-1, 1]) s.add(yer(kutu(0.04, 0.45, 0.04, KOYU_AHSAP), a * 0.16, 0.22, b * 0.16));
          s.position.set(x, 0, z); s.rotation.y = r; g.add(s);
        }
        g.add(yer(silindir(0.12, 0.1, 0.06, '#efe6d2'), 0, m.h + 0.05, 0));
        g.add(yer(kure(0.05, '#d9534f'), 0.03, m.h + 0.1, 0.02));
        g.add(yer(kure(0.05, '#f0ad4e'), -0.04, m.h + 0.1, -0.03));
        break;
      }
      case 'sovale': {
        const ayak = (x, z, rx, rz) => { const a = yer(kutu(0.04, m.h, 0.04, AHSAP), x, m.h / 2, z); a.rotation.set(rx, 0, rz); g.add(a); };
        ayak(-0.22, 0, 0, 0.12); ayak(0.22, 0, 0, -0.12); ayak(0, -0.2, -0.25, 0);
        const tuval = yer(kutu(0.6, 0.5, 0.03, '#fbf7ef'), 0, m.h * 0.68, 0.05); tuval.rotation.x = -0.1; g.add(tuval);
        for (const [x, y, c] of [[-0.12, 0.08, '#a77de8'], [0.1, -0.05, '#00b7c7'], [0.05, 0.12, '#e8a33d']]) {
          const leke = yer(kutu(0.16, 0.1, 0.005, c), x, m.h * 0.68 + y, 0.07); leke.rotation.x = -0.1; g.add(leke);
        }
        break;
      }
    }
    g.position.set(m.x, 0, m.z);
    if (m.yon) g.rotation.y = m.yon;
    g.userData.z = m.z;
    return g;
  }

  // ------------------------------------------------------------ hazır insan/elf/kedi/android beden (chibi)
  class BedenChibi {
    constructor(v) {
      const g = v.gorunum || {};
      this.g = g; this.tur = 'chibi';
      const S = 0.85 * (g.boy || 1);
      this.grup = new THREE.Group();
      const ic = new THREE.Group(); ic.scale.setScalar(S); this.grup.add(ic);
      const ten = g.ten || '#ffe0cf', sac = g.sac || '#3b2a20', ust = g.ust || '#7d5ba6', alt = g.alt || '#2a2633', ayk = g.ayakkabi || '#f1eef7';

      this.bacak = [];
      for (const k of [1, -1]) {
        const p = new THREE.Group(); p.position.set(k * 0.085, 0.44, 0);
        p.add(yer(kapsul(0.062, 0.3, g.bacak || alt), 0, -0.2, 0));
        if (g.bot) p.add(yer(kapsul(0.068, 0.12, ayk), 0, -0.34, 0.0));
        p.add(yer(kutu(0.12, 0.08, 0.2, ayk), 0, -0.4, 0.03));
        if (g.pantolonSerit) p.add(yer(kutu(0.012, 0.3, 0.02, g.pantolonSerit, { emissive: g.pantolonSerit, emissiveIntensity: 0.3 }), k * 0.062, -0.18, 0));
        ic.add(p); this.bacak.push(p);
      }
      const govde = this.govde = new THREE.Group(); govde.position.y = 0.44; ic.add(govde);
      const ustGovde = yer(kapsul(0.142, 0.16, ust), 0, 0.2, 0); ustGovde.scale.x = g.omuz || 1; govde.add(ustGovde);
      if (g.etek) govde.add(yer(silindir(0.15 * (g.omuz || 1), 0.2, 0.22, g.etek, {}, 20), 0, -0.06, 0));
      else if (g.sort) govde.add(yer(silindir(0.15, 0.165, 0.12, g.sort, {}, 20), 0, -0.02, 0));
      else govde.add(yer(kutu(0.27 * (g.omuz || 1), 0.04, 0.27, Yuz.koyu(alt, 0.7)), 0, 0.03, 0));
      if (v.id === 'medica') govde.add(yer(kutu(0.07, 0.07, 0.01, '#ffffff'), 0.07, 0.26, 0.142));    // forma cebi
      if (g.mekanik) govde.add(yer(kutu(0.2, 0.012, 0.01, '#c87533', { emissive: '#c87533', emissiveIntensity: 0.6 }), 0, 0.32, 0.141));

      this.kol = [];
      for (const k of [1, -1]) {
        const p = new THREE.Group(); p.position.set(k * 0.175 * (g.omuz || 1), 0.33, 0);
        p.add(yer(kapsul(0.055, 0.2, ust), 0, -0.13, 0));
        p.add(yer(kure(0.045, ten, {}, 12, 10), 0, -0.29, 0));
        govde.add(p); this.kol.push(p);
      }

      const kafa = this.kafa = new THREE.Group(); kafa.position.y = 0.42; govde.add(kafa);
      this.yuzCanvas = document.createElement('canvas'); this.yuzCanvas.width = 512; this.yuzCanvas.height = 256;
      this.yuzDoku = new THREE.CanvasTexture(this.yuzCanvas); this.yuzDoku.colorSpace = THREE.SRGBColorSpace;
      const R = 0.24, KY = 0.21;
      kafa.add(yer(golgeli(new THREE.Mesh(new THREE.SphereGeometry(R, 40, 28), mat('#ffffff', { map: this.yuzDoku, roughness: 0.9 }))), 0, KY, 0));
      const sacM = mat(sac, { roughness: 0.6 });
      const sm = geo => golgeli(new THREE.Mesh(geo, sacM));
      const stil = g.sacStil || 'kisa';
      const uzun = stil === 'dalgali' || stil === 'kedi';
      kafa.add(yer(sm(new THREE.SphereGeometry(R * 1.06, 32, 16, 0, Math.PI * 2, 0, stil === 'toplu' || stil === 'orgulu' ? 1.05 : 1.15)), 0, KY, 0));
      kafa.add(yer(sm(new THREE.SphereGeometry(R * 1.09, 32, 20, Math.PI, Math.PI, 0, Math.PI * (uzun ? 0.72 : 0.6))), 0, KY, 0));
      if (uzun) {
        const u = yer(sm(new THREE.SphereGeometry(0.22, 24, 16)), 0, 0.02, -0.12); u.scale.set(1.12, 1.15, 0.6); kafa.add(u);
        for (const k of [1, -1]) {
          const t = yer(kapsul(0.045, 0.22, k === 1 && g.serit ? g.serit : sac), k * 0.2, 0.06, 0.06); t.rotation.z = k * 0.12; kafa.add(t);
        }
      }
      if (stil === 'toplu') {
        kafa.add(yer(sm(new THREE.SphereGeometry(0.1, 16, 12)), 0, KY + 0.2, -0.15));
        if (g.toka) { const t = golgeli(new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.025, 8, 20), mat(g.toka))); t.position.set(0, KY + 0.16, -0.13); t.rotation.x = 0.9; kafa.add(t); }
      } else if (g.toka) kafa.add(yer(kutu(0.05, 0.05, 0.02, g.toka, { emissive: g.toka, emissiveIntensity: 0.3 }), R * 0.62, KY + 0.12, R * 0.8));
      if (stil === 'orgulu') {
        for (let i = 0; i < 7; i++) kafa.add(yer(sm(new THREE.SphereGeometry(0.07 - i * 0.005, 12, 10)), 0, KY - 0.1 - i * 0.085, -0.24 + i * 0.012));
        kafa.add(yer(kutu(0.05, 0.03, 0.05, '#6b7a3a'), 0, KY - 0.7, -0.17));
      }
      if (stil === 'daginik') {
        for (let i = 0; i < 7; i++) {
          const c = sm(new THREE.ConeGeometry(0.06, 0.13, 6)); const a = (i / 7) * Math.PI * 2;
          c.position.set(Math.cos(a) * 0.13, KY + 0.21, Math.sin(a) * 0.13 - 0.02); c.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6); kafa.add(c);
        }
      }
      if (g.kulak === 'elf') {
        for (const k of [1, -1]) { const c = golgeli(new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.17, 8), mat(ten))); c.position.set(k * R * 1.02, KY + 0.02, -0.01); c.rotation.z = -k * (Math.PI / 2 - 0.45); kafa.add(c); }
      }
      if (g.kulak === 'kedi') {
        for (const k of [1, -1]) {
          const c = sm(new THREE.ConeGeometry(0.075, 0.15, 4)); c.position.set(k * 0.13, KY + 0.25, -0.01); c.rotation.z = -k * 0.25; kafa.add(c);
          const ic2 = golgeli(new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.09, 4), mat('#f2b3c9'))); ic2.position.set(k * 0.13, KY + 0.245, 0.03); ic2.rotation.z = -k * 0.25; kafa.add(ic2);
        }
      }
      if (g.mekanik) {
        kafa.add(yer(kutu(0.02, 0.06, 0.05, '#9aa0a8', { metalness: 0.6, roughness: 0.3 }), -R * 0.98, KY + 0.02, 0.06));
        kafa.add(yer(kure(0.012, '#c87533', { emissive: '#c87533', emissiveIntensity: 1.2 }, 8, 6), -R * 1.02, KY + 0.02, 0.07));
      }
      this.kuyruk = null;
      if (g.kuyruk) {
        this.kuyruk = new THREE.Group(); this.kuyruk.position.set(0, 0.1, -0.13); govde.add(this.kuyruk);
        for (let i = 0; i < 8; i++) this.kuyruk.add(yer(kure(0.032 - i * 0.002 + (i > 5 ? 0.008 : 0), i > 5 && g.kuyrukUc ? g.kuyrukUc : sac, {}, 10, 8), 0, i * 0.045, -i * 0.03 + Math.pow(i, 2) * 0.004));
      }
      this.boy = (g.kulak === 'kedi' ? 1.42 : 1.32) * S;
      this.kafaY = (0.44 + 0.42 + KY) * S;
      this.kafaBoyut = 0.62 * S;
      this._yuzAnahtar = '';
    }

    guncelle(y, dt, kamera, yakin) {
      const t = y.t, yur = y.hareket !== 'bekle', kos = y.hareket === 'kos';
      const amp = kos ? 0.95 : yur ? 0.55 : 0, s = Math.sin(y.faz);
      const zipla = kos ? Math.abs(s) * 0.07 : yur ? Math.abs(s) * 0.025 : 0;
      this.grup.position.set(y.x, zipla, y.z);
      this.grup.rotation.y = y.yaw;
      this.bacak[0].rotation.x = s * amp; this.bacak[1].rotation.x = -s * amp;
      const ifade = y.ifade(), yorgun = ifade === 'yorgun';
      this.govde.rotation.x = kos ? 0.16 : (yorgun && !yur ? 0.08 : 0);
      this.govde.scale.y = 1 + (yur ? 0 : Math.sin(t * 2.2) * 0.012);
      this.kol[0].rotation.set(-s * amp * 0.8, 0, 0.1);
      if (y.selamSure > 0) this.kol[1].rotation.set(0, 0, -2.55 + Math.sin(t * 12) * 0.32);
      else this.kol[1].rotation.set(s * amp * 0.8, 0, -0.1);
      this.kafa.rotation.y = yakin ? 0 : Math.sin(t * 0.6) * 0.15;
      this.kafa.rotation.z = Math.sin(t * 0.9) * 0.04 + (ifade === 'uzgun' ? 0.08 : 0);
      this.kafa.rotation.x = yorgun ? 0.12 : 0;
      if (this.kuyruk) { this.kuyruk.rotation.z = Math.sin(t * (ifade === 'mutlu' ? 4 : 2)) * 0.35; this.kuyruk.rotation.x = -0.3; }
      const a = ifade + '|' + Math.round(y.goz * 5) + '|' + Math.round(y.agiz * 6) + '|' + (y.selamSure > 0 ? 1 : 0);
      if (a !== this._yuzAnahtar) {
        this._yuzAnahtar = a;
        Yuz.kafaDokusu(this.yuzCanvas, { ifade, goz: y.goz, agiz: y.agiz, selam: y.selamSure > 0 }, this.g);
        this.yuzDoku.needsUpdate = true;
      }
    }
    dispose() { this.grup.traverse(o => { if (o.isMesh) { o.geometry.dispose(); if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); }
  }

  // ------------------------------------------------------------ robot beden (Nexsus)
  class BedenRobot {
    constructor(v) {
      const g = v.gorunum || {};
      this.g = g; this.tur = 'robot';
      const S = 0.85 * (g.boy || 0.8);
      this.grup = new THREE.Group();
      const ic = this.ic = new THREE.Group(); ic.scale.setScalar(S); this.grup.add(ic);
      const beyaz = g.ust || '#f2f3f5', gri = g.alt || '#9aa0a8', goz = g.goz || '#2fe6d6';
      const parlak = { roughness: 0.35, metalness: 0.1 };
      this.taban = yer(golgeli(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.06, 24), mat(gri, parlak))), 0, 0.1, 0); ic.add(this.taban);
      const isik = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.17, 24), new THREE.MeshBasicMaterial({ color: goz, transparent: true, opacity: 0.6 }));
      isik.rotation.x = -Math.PI / 2; isik.position.y = 0.065; ic.add(isik); this.isik = isik;
      const govde = this.govde = new THREE.Group(); govde.position.y = 0.42; ic.add(govde);
      const g1 = kure(0.3, beyaz, parlak, 24, 18); g1.scale.set(1, 0.9, 0.92); govde.add(g1);
      govde.add(yer(kutu(0.24, 0.1, 0.02, gri, parlak), 0, 0.02, 0.27));
      this.kol = [];
      for (const k of [1, -1]) {
        const p = new THREE.Group(); p.position.set(k * 0.3, 0.05, 0);
        p.add(yer(kapsul(0.05, 0.14, gri, parlak), 0, -0.1, 0));
        p.add(yer(kure(0.055, beyaz, parlak, 12, 10), 0, -0.23, 0));
        govde.add(p); this.kol.push(p);
      }
      const kafa = this.kafa = new THREE.Group(); kafa.position.y = 0.42; govde.add(kafa);
      kafa.add(yer(kure(0.27, beyaz, parlak, 32, 24), 0, 0.2, 0));
      this.ekran = document.createElement('canvas'); this.ekran.width = 256; this.ekran.height = 128;
      this.ekranDoku = new THREE.CanvasTexture(this.ekran); this.ekranDoku.colorSpace = THREE.SRGBColorSpace;
      const yay = 2.2, phiStart = Math.PI / 2 - yay / 2;
      const ek = new THREE.Mesh(new THREE.SphereGeometry(0.275, 32, 16, phiStart, yay, Math.PI * 0.3, Math.PI * 0.38), new THREE.MeshBasicMaterial({ map: this.ekranDoku }));
      ek.position.y = 0.2; kafa.add(ek);
      kafa.add(yer(silindir(0.012, 0.012, 0.14, gri), 0, 0.53, 0));
      kafa.add(yer(kure(0.03, goz, { emissive: goz, emissiveIntensity: 1.2 }, 10, 8), 0, 0.61, 0));
      this.boy = 1.18 * S; this.kafaY = (0.42 + 0.42 + 0.2) * S; this.kafaBoyut = 0.66 * S;
      this._a = '';
    }
    guncelle(y, dt, kamera, yakin) {
      const t = y.t, yur = y.hareket !== 'bekle', kos = y.hareket === 'kos';
      this.grup.position.set(y.x, 0.04 + Math.sin(t * 3) * 0.02, y.z);
      this.grup.rotation.y = y.yaw;
      this.govde.rotation.x = kos ? 0.2 : yur ? 0.08 : 0;
      this.govde.rotation.z = yur ? Math.sin(y.faz) * 0.05 : 0;
      this.kol[0].rotation.set(yur ? -Math.sin(y.faz) * 0.5 : 0, 0, 0.15);
      if (y.selamSure > 0) this.kol[1].rotation.set(0, 0, -2.4 + Math.sin(t * 12) * 0.35);
      else this.kol[1].rotation.set(yur ? Math.sin(y.faz) * 0.5 : 0, 0, -0.15);
      this.kafa.rotation.y = yakin ? 0 : Math.sin(t * 0.7) * 0.2;
      this.kafa.rotation.z = y.ifade() === 'uzgun' ? 0.12 : 0;
      this.isik.material.opacity = 0.4 + Math.sin(t * 4) * 0.2;
      const a = y.ifade() + '|' + Math.round(y.goz * 5) + '|' + Math.round(y.agiz * 6) + '|' + (y.selamSure > 0 ? 1 : 0);
      if (a !== this._a) { this._a = a; Yuz.robotEkran(this.ekran, { ifade: y.ifade(), goz: y.goz, agiz: y.agiz, selam: y.selamSure > 0 }, this.g); this.ekranDoku.needsUpdate = true; }
    }
    dispose() { this.grup.traverse(o => { if (o.isMesh) { o.geometry.dispose(); if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); }
  }

  // ------------------------------------------------------------ VRM beden (kullanıcının yüklediği gerçek model)
  class BedenVRM {
    constructor(vrm) {
      this.tur = 'vrm'; this.vrm = vrm;
      this.grup = new THREE.Group(); this.grup.add(vrm.scene);
      vrm.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
      const k = new THREE.Box3().setFromObject(vrm.scene);
      this.boy = Math.max(0.5, k.max.y - k.min.y);
      const kafa = vrm.humanoid && vrm.humanoid.getNormalizedBoneNode('head');
      const p = new THREE.Vector3();
      if (kafa) { vrm.scene.updateMatrixWorld(true); kafa.getWorldPosition(p); this.kafaY = p.y + this.boy * 0.05; } else this.kafaY = this.boy * 0.9;
      this.kafaBoyut = this.boy * 0.2;
      this.ifadeler = { happy: 0, sad: 0, relaxed: 0, surprised: 0 };
    }
    guncelle(y, dt, kamera, yakin) {
      const t = y.t, yur = y.hareket !== 'bekle', kos = y.hareket === 'kos';
      const amp = kos ? 0.75 : yur ? 0.45 : 0, s = Math.sin(y.faz);
      this.grup.position.set(y.x, kos ? Math.abs(s) * 0.05 : 0, y.z);
      this.grup.rotation.y = y.yaw;
      const h = this.vrm.humanoid;
      const set = (n, a, b, c) => { const k = h && h.getNormalizedBoneNode(n); if (k) k.rotation.set(a, b, c); };
      set('leftUpperLeg', -s * amp, 0, 0); set('rightUpperLeg', s * amp, 0, 0);
      set('leftLowerLeg', Math.max(0, s) * amp * 1.2, 0, 0); set('rightLowerLeg', Math.max(0, -s) * amp * 1.2, 0, 0);
      set('leftUpperArm', s * amp * 0.6, 0, -1.2); set('leftLowerArm', 0, 0, -0.15);
      if (y.selamSure > 0) { set('rightUpperArm', 0, 0, -1.0); set('rightLowerArm', 0, 0, -0.9 + Math.sin(t * 12) * 0.35); }
      else { set('rightUpperArm', -s * amp * 0.6, 0, 1.2); set('rightLowerArm', 0, 0, 0.15); }
      set('spine', kos ? 0.12 : 0, 0, 0); set('chest', Math.sin(t * 2.2) * 0.02, 0, 0);
      const ifade = y.ifade();
      const hedef = { happy: ifade === 'mutlu' || y.selamSure > 0 ? 1 : 0, sad: ifade === 'uzgun' ? 0.8 : 0, relaxed: ifade === 'yorgun' ? 0.7 : 0, surprised: ifade === 'saskin' ? 1 : 0 };
      const em = this.vrm.expressionManager;
      if (em) {
        for (const n in hedef) { this.ifadeler[n] = lerp(this.ifadeler[n], hedef[n], Math.min(1, dt * 6)); em.setValue(n, this.ifadeler[n]); }
        em.setValue('blink', 1 - y.goz); em.setValue('aa', y.agiz * 0.85);
      }
      if (this.vrm.lookAt) this.vrm.lookAt.target = yakin ? kamera : null;
      this.vrm.update(dt);
    }
    dispose() { try { VRMUtils.deepDispose(this.vrm.scene); } catch (e) {} }
  }

  const hazirBeden = v => (v.gorunum && v.gorunum.robot) ? new BedenRobot(v) : new BedenChibi(v);

  // ------------------------------------------------------------ sahne
  class Sahne3D {
    /** cb: { zemineDokun(x,z,cift), karaktereDokun(id), esyayaDokun(id) } */
    constructor(kap, etiketKap, yasamlar, cb) {
      this.kap = kap; this.etiketKap = etiketKap; this.cb = cb;
      this.yasamlar = yasamlar; this.seciliId = yasamlar[0] && yasamlar[0].v.id;
      this.modAdi = 'ev'; this.calisiyor = true; this._kare = 0;
      this.bedenler = new Map(); this.esyaNesneleri = []; this.etiketler = new Map();
      this.isimler = new Map(); this.odaEtiketleri = [];
      this.evKam = { x: Ev.GEN / 2, z: 3, d: 10, hx: Ev.GEN / 2, hz: 3, hd: 10 };
    }
    get secili() { return this.yasamlar.find(y => y.v.id === this.seciliId) || this.yasamlar[0]; }

    kur(ayar) {
      const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      r.outputColorSpace = THREE.SRGBColorSpace;
      r.shadowMap.enabled = ayar.golge !== false;
      r.shadowMap.type = THREE.PCFSoftShadowMap;
      r.domElement.className = 'sahneCanvas';
      this.kap.appendChild(r.domElement);

      const s = this.scene = new THREE.Scene();
      s.background = new THREE.Color('#0b0b14');
      this.kamera = new THREE.PerspectiveCamera(38, 1, 0.05, 120);
      this.kamBak = new THREE.Vector3(5, 0, 8);

      this.hemi = new THREE.HemisphereLight('#fff3e2', '#3b2f50', 1.6); s.add(this.hemi);
      const g = this.gunes = new THREE.DirectionalLight('#ffe6c8', 2.2);
      g.position.set(Ev.GEN / 2 + 3, 14, Ev.DER / 2 + 6); g.target.position.set(Ev.GEN / 2, 0, Ev.DER / 2); s.add(g, g.target);
      g.castShadow = true; g.shadow.mapSize.set(2048, 2048);
      Object.assign(g.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 40 });
      g.shadow.bias = -0.0008; g.shadow.normalBias = 0.02;

      this.lambalar = [];
      this.evInsa();
      for (const y of this.yasamlar) this.karakterEkle(y);
      this.seciliHalka = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.34, 40), new THREE.MeshBasicMaterial({ color: '#00e5ff', transparent: true, opacity: 0.9 }));
      this.seciliHalka.rotation.x = -Math.PI / 2; this.seciliHalka.position.y = 0.015; s.add(this.seciliHalka);
      this.esyalariYenile();
      this.gece(!!ayar.gece);

      this.dokunmaKur();
      this.boyutla();
      const sc = this.secili; if (sc) this.odakla(sc.x, sc.z, true);
      this._son = performance.now();
      const dongu = now => {
        this._raf = requestAnimationFrame(dongu);
        if (!this.calisiyor) { this._son = now; return; }
        const dt = Math.min(0.1, (now - this._son) / 1000); this._son = now;
        this.kare(dt);
      };
      this._raf = requestAnimationFrame(dongu);
    }

    evInsa() {
      const s = this.scene;
      const evG = new THREE.Group(); s.add(evG);
      const dis = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), mat('#12121f', { roughness: 1 }));
      dis.rotation.x = -Math.PI / 2; dis.position.set(Ev.GEN / 2, -0.02, Ev.DER / 2); dis.receiveShadow = true; s.add(dis);
      for (const o of Ev.ODALAR) {
        const w = o.x1 - o.x0, d = o.z1 - o.z0;
        const doku = zeminDokusu(o.zemin, o.karo); doku.repeat.set(w / (o.karo ? 3 : 2), d / (o.karo ? 3 : 2));
        const z = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat('#ffffff', { map: doku, roughness: 0.7 }));
        z.rotation.x = -Math.PI / 2; z.position.set((o.x0 + o.x1) / 2, 0, (o.z0 + o.z1) / 2); z.receiveShadow = true; evG.add(z);
        const el = document.createElement('div'); el.className = 'odaEtiket'; el.textContent = o.ad;
        this.etiketKap.appendChild(el); this.odaEtiketleri.push({ el, x: o.x0 + 0.2, z: o.z0 + 0.25 });
      }
      const T = 0.12;
      this.duvarlar = [];
      const kenarM = mat('#8f6be8', { emissive: '#7a52e0', emissiveIntensity: 0.9 }), duvarM = mat('#efe3d3');
      for (const d of Ev.DUVARLAR) {
        const yatay = d.z0 === d.z1, uz = yatay ? d.x1 - d.x0 : d.z1 - d.z0;
        const h = d.on ? 0.28 : d.ic ? 0.6 : 1.4;
        const w = yatay ? uz + T : T, dd = yatay ? T : uz + T;
        const cx = (d.x0 + d.x1) / 2 + (d.ic || yatay ? 0 : (d.x0 === 0 ? -T / 2 : T / 2));
        const cz = (d.z0 + d.z1) / 2 + (!yatay || d.ic ? 0 : (d.z0 === 0 ? -T / 2 : T / 2));
        const m = golgeli(new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), duvarM)); m.position.set(cx, h / 2, cz);
        const k = new THREE.Mesh(new THREE.BoxGeometry(w + 0.002, 0.03, dd + 0.002), kenarM); k.position.set(cx, h + 0.015, cz);
        for (const o of [m, k]) { o.userData.z = cz; o.userData.onde = d.on || d.ic; evG.add(o); this.duvarlar.push(o); }
      }
      this.pencereler = [];
      for (const x of [3.2, 8.3]) {
        const p = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.6), mat('#a9d4ff', { emissive: '#9ccfff', emissiveIntensity: 0.8 }));
        p.position.set(x, 1.0, 0.005); evG.add(p); this.pencereler.push(p);
        evG.add(yer(kutu(1.1, 0.7, 0.02, '#f7f2ea'), x, 1.0, -0.005));
      }
      evG.add(yer(kutu(0.45, 0.35, 0.03, '#3d4f8a'), 5.6, 1.15, 0.02));
      this.mobilyalar = [];
      for (const m of Ev.MOBILYA) { const o = mobilyaYap(m, this.lambalar); evG.add(o); this.mobilyalar.push(o); }
    }

    // ---------------- karakterler
    karakterEkle(y) {
      if (this.bedenler.has(y.v.id)) return;
      const b = hazirBeden(y.v); b.yasam = y;
      this.bedenler.set(y.v.id, b); this.scene.add(b.grup);
      const el = document.createElement('button'); el.className = 'isimEtiket'; el.textContent = y.v.ad;
      el.style.setProperty('--renk', y.v.gorunum.serit || y.v.gorunum.ust || '#a77de8');
      el.addEventListener('click', e => { e.stopPropagation(); this.cb.karaktereDokun(y.v.id); });
      this.etiketKap.appendChild(el); this.isimler.set(y.v.id, el);
      if (!this.yasamlar.includes(y)) this.yasamlar.push(y);
    }
    karakterCikar(id) {
      const b = this.bedenler.get(id);
      if (b) { this.scene.remove(b.grup); b.dispose(); this.bedenler.delete(id); }
      const el = this.isimler.get(id); if (el) { el.remove(); this.isimler.delete(id); }
      this.yasamlar = this.yasamlar.filter(y => y.v.id !== id);
    }
    sec(id) { this.seciliId = id; }
    /** 2D portre gösterilirken seçili karakterin 3D bedeni yakın modlarda gizlenir (arkada sadece oda kalır) */
    portreModu(evet) { this.portreAktif = !!evet; }
    isimleriYenile() { for (const y of this.yasamlar) { const el = this.isimler.get(y.v.id); if (el) el.textContent = y.v.ad; } }

    bedenDegistir(id, yeni) {
      const eski = this.bedenler.get(id), y = this.yasamlar.find(y => y.v.id === id);
      if (!y) return;
      if (eski) { this.scene.remove(eski.grup); eski.dispose(); }
      yeni.yasam = y; this.bedenler.set(id, yeni); this.scene.add(yeni.grup);
    }
    modelYukle(id, buf) {
      return new Promise((ok, hata) => {
        const yk = new GLTFLoader();
        yk.register(p => new VRMLoaderPlugin(p));
        yk.parse(buf, '', gltf => {
          const vrm = gltf.userData.vrm;
          if (!vrm) return hata(new Error('Bu dosya bir VRM modeli değil.'));
          try { VRMUtils.rotateVRM0(vrm); } catch (e) {}
          this.bedenDegistir(id, new BedenVRM(vrm)); ok();
        }, e => hata(e instanceof Error ? e : new Error(String(e && e.message || e))));
      });
    }
    modeliKaldir(id) { const y = this.yasamlar.find(y => y.v.id === id); if (y) this.bedenDegistir(id, hazirBeden(y.v)); }

    // ---------------- eşyalar
    esyalariYenile() {
      for (const o of this.esyaNesneleri) this.scene.remove(o);
      this.esyaNesneleri = [];
      for (const [, o] of this.etiketler) o.el.remove();
      this.etiketler.clear();
      for (const e of Ev.esyalar()) {
        const g = new THREE.Group(); g.position.set(e.x, 0, e.z);
        const halka = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.26, 32), new THREE.MeshBasicMaterial({ color: '#c9b6ff', transparent: true, opacity: 0.85 }));
        halka.rotation.x = -Math.PI / 2; halka.position.y = 0.012; g.add(halka);
        const vurus = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.2, 12), new THREE.MeshBasicMaterial({ visible: false }));
        vurus.position.y = 0.6; vurus.userData.esyaId = e.id; g.add(vurus);
        g.userData.halka = halka; g.userData.e = e;
        this.scene.add(g); this.esyaNesneleri.push(g);
        const el = document.createElement('button');
        el.className = 'esyaEtiket'; el.innerHTML = Ikon.svg(e.ikon || 'sayfa') + '<span></span>';
        el.querySelector('span').textContent = e.ad;
        el.addEventListener('click', ev => { ev.stopPropagation(); this.cb.esyayaDokun(e.id); });
        this.etiketKap.appendChild(el); this.etiketler.set(e.id, { el, e });
      }
    }

    gece(evet) {
      this.geceMi = evet;
      this.hemi.intensity = evet ? 0.45 : 1.6; this.hemi.color.set(evet ? '#9aa6ff' : '#fff3e2');
      this.gunes.intensity = evet ? 0.35 : 2.2; this.gunes.color.set(evet ? '#8d9cff' : '#ffe6c8');
      for (const p of this.pencereler) { p.material.emissive.set(evet ? '#1c2a5c' : '#9ccfff'); p.material.color.set(evet ? '#1c2a5c' : '#a9d4ff'); }
      for (const l of this.lambalar) l.intensity = evet ? 6 : 2.5;
    }
    golge(evet) { this.renderer.shadowMap.enabled = evet; this.scene.traverse(o => { if (o.material) o.material.needsUpdate = true; }); }

    // ---------------- dokunma: dokun = seç/yürü, sürükle = kaydır, iki parmak = yakınlaştır
    dokunmaKur() {
      const el = this.renderer.domElement;
      const parmak = new Map();
      let bas = null, kaydiriyor = false, pinch = null, son = { t: 0, x: 0, y: 0 };
      el.addEventListener('pointerdown', e => {
        el.setPointerCapture && el.setPointerCapture(e.pointerId);
        parmak.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (parmak.size === 1) { bas = { x: e.clientX, y: e.clientY, t: performance.now() }; kaydiriyor = false; }
        if (parmak.size === 2) { const [a, b] = [...parmak.values()]; pinch = { mesafe: Math.hypot(a.x - b.x, a.y - b.y), d: this.evKam.hd }; bas = null; }
      });
      el.addEventListener('pointermove', e => {
        if (!parmak.has(e.pointerId) || this.modAdi !== 'ev') return;
        const onceki = parmak.get(e.pointerId); parmak.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (parmak.size === 2 && pinch) {
          const [a, b] = [...parmak.values()]; const m = Math.hypot(a.x - b.x, a.y - b.y);
          if (m > 10) this.zoom(pinch.d * pinch.mesafe / m, true);
          return;
        }
        if (parmak.size === 1 && bas) {
          if (!kaydiriyor && Math.hypot(e.clientX - bas.x, e.clientY - bas.y) > 10) kaydiriyor = true;
          if (kaydiriyor) this.kaydir(e.clientX - onceki.x, e.clientY - onceki.y);
        }
      });
      const birak = e => {
        parmak.delete(e.pointerId);
        if (parmak.size < 2) pinch = null;
        if (!bas || parmak.size) { if (!parmak.size) bas = null; return; }
        const sure = performance.now() - bas.t, b = bas; bas = null;
        if (kaydiriyor || sure > 500 || e.type === 'pointercancel') return;
        const cift = performance.now() - son.t < 330 && Math.hypot(e.clientX - son.x, e.clientY - son.y) < 50;
        son = { t: performance.now(), x: e.clientX, y: e.clientY };
        this.dokun(b.x, b.y, cift);
      };
      el.addEventListener('pointerup', birak); el.addEventListener('pointercancel', birak);
      el.addEventListener('wheel', e => { if (this.modAdi === 'ev') { e.preventDefault(); this.zoom(this.evKam.hd * (1 + e.deltaY * 0.0012), true); } }, { passive: false });
    }
    kaydir(dx, dy) {
      const k = this.evKam, h = this.kap.clientHeight || 1;
      const birim = 2 * k.d * Math.tan(19 * Math.PI / 180) / h;
      k.hx = Math.max(0, Math.min(Ev.GEN, k.hx - dx * birim));
      k.hz = Math.max(0, Math.min(Ev.DER, k.hz - dy * birim / Math.sin(EL)));
      k.x = k.hx; k.z = k.hz;
    }
    zoom(d, anlik) {
      const k = this.evKam; k.hd = Math.max(4.5, Math.min(this.evMaks || 30, d)); if (anlik) k.d = k.hd;
    }
    odakla(x, z, anlik) {
      const k = this.evKam; k.hx = x; k.hz = z;
      if (anlik) { k.x = x; k.z = z; }
    }
    dokun(cx, cy, cift) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
      const rc = new THREE.Raycaster(); rc.setFromCamera(ndc, this.kamera);
      let en = null;
      for (const [id, b] of this.bedenler) {
        if (!b.grup.visible) continue;
        const h = rc.intersectObject(b.grup, true)[0];
        if (h && (!en || h.distance < en.d)) en = { id, d: h.distance };
      }
      if (en) return this.cb.karaktereDokun(en.id);
      if (this.modAdi !== 'ev') return;
      const vur = rc.intersectObjects(this.esyaNesneleri, true).find(h => h.object.userData.esyaId);
      if (vur) return this.cb.esyayaDokun(vur.object.userData.esyaId);
      const p = new THREE.Vector3();
      if (rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p)) {
        if (p.x > 0 && p.x < Ev.GEN && p.z > 0 && p.z < Ev.DER) this.cb.zemineDokun(p.x, p.z, cift);
      }
    }

    // ---------------- kamera
    mod(m) { this.modAdi = m; this._anlik = true; this.boyutla(); }

    /** Evin tamamını gösteren uzaklık (en uzak zoom) */
    evMaksimum() {
      const cam = this.kamera.clone(); cam.fov = 38; cam.aspect = this.aspect; cam.updateProjectionMatrix();
      const merkez = new THREE.Vector3(Ev.GEN / 2, 0, Ev.DER / 2 + 0.3);
      const kose = []; for (const x of [-0.2, Ev.GEN + 0.2]) for (const z of [-0.2, Ev.DER + 0.2]) for (const y of [0, 1.4]) kose.push(new THREE.Vector3(x, y, z));
      let a = 3, b = 90;
      for (let i = 0; i < 30; i++) {
        const d = (a + b) / 2;
        cam.position.set(merkez.x, Math.sin(EL) * d, merkez.z + Math.cos(EL) * d); cam.lookAt(merkez); cam.updateMatrixWorld();
        const sigar = kose.every(k => { const v = k.clone().project(cam); return Math.abs(v.x) < 0.96 && Math.abs(v.y) < 0.96; });
        if (sigar) b = d; else a = d;
      }
      return b;
    }

    kameraHedefi(dt) {
      const tanY = f => Math.tan((f / 2) * Math.PI / 180);
      if (this.modAdi === 'ev') {
        const k = this.evKam, t = 1 - Math.exp(-dt * 6);
        k.x = lerp(k.x, k.hx, t); k.z = lerp(k.z, k.hz, t); k.d = lerp(k.d, k.hd, t);
        const merkez = new THREE.Vector3(k.x, 0, k.z);
        return { fov: 38, poz: new THREE.Vector3(k.x, Math.sin(EL) * k.d, k.z + Math.cos(EL) * k.d), bak: merkez };
      }
      const y = this.secili, b = this.bedenler.get(y.v.id);
      // Dar sütunlarda karakter boyu doldursun: genişlik payı küçük tutulur, kamera hafif yukarıdan bakar
      // (böylece arkada boş karanlık yerine zemin ve oda görünür)
      let alt, ust, gen, egim, fov = 30;
      if (this.modAdi === 'sohbet') { alt = -0.03 * b.boy; ust = b.boy * 1.05; gen = b.boy * 0.36; egim = 0.26; }
      else if (this.modAdi === 'sesli') { alt = b.boy * 0.3; ust = b.boy * 1.05; gen = b.boy * 0.4; egim = 0.18; }
      else { alt = b.kafaY - b.kafaBoyut * 0.62; ust = b.kafaY + b.kafaBoyut * 0.55; gen = b.kafaBoyut * 1.1; egim = 0.05; fov = 28; }
      const yuk = ust - alt, ortaY = (alt + ust) / 2;
      const d = Math.max((yuk / 2) / tanY(fov), (gen / 2) / (tanY(fov) * this.aspect)) * 1.04;
      return { fov, poz: new THREE.Vector3(y.x, ortaY + d * Math.sin(egim), y.z + d * Math.cos(egim)), bak: new THREE.Vector3(y.x, ortaY, y.z) };
    }

    boyutla() {
      const w = Math.max(1, this.kap.clientWidth), h = Math.max(1, this.kap.clientHeight);
      this.aspect = w / h;
      this.renderer.setSize(w, h, false);
      this.kamera.aspect = this.aspect; this.kamera.updateProjectionMatrix();
      this.evMaks = this.evMaksimum();
      if (!this._zoomKuruldu) { this._zoomKuruldu = true; this.evKam.d = this.evKam.hd = Math.max(6, this.evMaks * 0.42); }
      else this.zoom(this.evKam.hd);
    }

    // ---------------- her kare
    kare(dt) {
      const yakin = this.modAdi !== 'ev', sec = this.secili;
      for (const y of this.yasamlar) {
        y.guncelle(dt);
        const b = this.bedenler.get(y.v.id);
        if (b) b.guncelle(y, dt, this.kamera, yakin && y === sec);
      }

      const h = this.kameraHedefi(dt);
      const k = this._anlik ? 1 : 1 - Math.exp(-dt * 7); this._anlik = false;
      if (this.modAdi === 'ev') { this.kamera.position.copy(h.poz); this.kamBak.copy(h.bak); }
      else { this.kamera.position.lerp(h.poz, k); this.kamBak.lerp(h.bak, k); }
      if (Math.abs(this.kamera.fov - h.fov) > 0.01) { this.kamera.fov = h.fov; this.kamera.updateProjectionMatrix(); }
      this.kamera.lookAt(this.kamBak);

      // yakın modlarda seçili karakterin önündekileri gizle
      const sinirZ = sec ? sec.z + 0.3 : 99;
      for (const o of this.mobilyalar) o.visible = !yakin || o.userData.z <= sinirZ;
      for (const o of this.duvarlar) o.visible = !yakin || !o.userData.onde || o.userData.z <= (sec ? sec.z : 99);
      for (const y of this.yasamlar) {
        const b = this.bedenler.get(y.v.id); if (!b) continue;
        b.grup.visible = y === sec ? !(yakin && this.portreAktif) : (!yakin || y.z <= sinirZ - 0.1 || Math.abs(y.x - sec.x) > 1.2);
      }
      const t = sec ? sec.t : 0;
      for (const g of this.esyaNesneleri) { g.visible = !yakin; g.userData.halka.scale.setScalar(1 + Math.sin(t * 3) * 0.08); }
      if (sec) { this.seciliHalka.visible = !yakin; this.seciliHalka.position.x = sec.x; this.seciliHalka.position.z = sec.z; this.seciliHalka.scale.setScalar(1 + Math.sin(t * 4) * 0.06); }

      this._kare++;
      if (this.modAdi === 'kose' && (this.portreAktif || this._kare % 2)) { this.etiketleriKonumla(); return; }
      this.renderer.render(this.scene, this.kamera);
      this.etiketleriKonumla();
    }

    ekranKonumu(v) {
      const p = v.clone().project(this.kamera);
      if (p.z > 1 || p.z < -1) return null;
      return { x: (p.x * 0.5 + 0.5) * this.kap.clientWidth, y: (-p.y * 0.5 + 0.5) * this.kap.clientHeight };
    }
    basEkranda(id) {
      const y = id ? this.yasamlar.find(y => y.v.id === id) : this.secili; if (!y) return null;
      const b = this.bedenler.get(y.v.id); if (!b) return null;
      return this.ekranKonumu(new THREE.Vector3(y.x, b.kafaY + b.kafaBoyut * 0.6, y.z));
    }
    etiketleriKonumla() {
      const ev = this.modAdi === 'ev', W = this.kap.clientWidth, H = this.kap.clientHeight;
      const goster = (el, p, ust) => {
        if (!ev || !p || p.x < -40 || p.x > W + 40 || p.y < -20 || p.y > H + 40) { el.style.display = 'none'; return; }
        el.style.display = ''; el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, ${ust ? '-100%' : '0'})`;
      };
      const yakinZoom = this.evKam.d < (this.evMaks || 30) * 0.7;
      for (const [, { el, e }] of this.etiketler) goster(el, this.ekranKonumu(new THREE.Vector3(e.x, 0.75, e.z)), true);
      for (const y of this.yasamlar) {
        const el = this.isimler.get(y.v.id); if (!el) continue;
        el.classList.toggle('secili', y === this.secili);
        if (!yakinZoom && y !== this.secili) { el.style.display = 'none'; continue; }
        const b = this.bedenler.get(y.v.id);
        goster(el, this.ekranKonumu(new THREE.Vector3(y.x, 0, y.z + 0.25)), false);
      }
      for (const o of this.odaEtiketleri) {
        if (!ev) { o.el.style.display = 'none'; continue; }
        const p = this.ekranKonumu(new THREE.Vector3(o.x, 0, o.z));
        if (!p) { o.el.style.display = 'none'; continue; }
        o.el.style.display = ''; o.el.style.transform = `translate(${p.x}px, ${p.y}px)`;
      }
    }

    dur() { this.calisiyor = false; }
    devam() { this.calisiyor = true; }
  }

  const EL = 1.05; // ev kamerasının eğimi (radyan)
  window.Sahne3D = Sahne3D;
})();
