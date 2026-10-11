/* Ev: odalar, duvarlar/kapılar, mobilyalar, eşyalar (eve yerleştirilen sayfalar) ve yürüme haritası.
 * Birim: metre. x = soldan sağa (0..GEN), z = yukarıdan aşağıya (0..DER). Ekranda üst = z küçük.
 *
 *  z 0..6   : Salon (x 0..6.5)      | Mutfak (x 6.5..10)
 *  z 6..11  : Çalışma (x 0..5)      | Kütüphane (x 5..10)
 *  z 11..16 : Atölye (0..3.4) | Sanat Odası (3.4..6.7) | Film Odası (6.7..10)
 */
(function () {
  const GEN = 10, DER = 16, SURUM = 2;
  const ODALAR = [
    { id: 'salon', ad: 'Salon', x0: 0, z0: 0, x1: 6.5, z1: 6, zemin: '#b07a4a' },
    { id: 'mutfak', ad: 'Mutfak', x0: 6.5, z0: 0, x1: 10, z1: 6, zemin: '#d9cdb8', karo: true },
    { id: 'calisma', ad: 'Çalışma', x0: 0, z0: 6, x1: 5, z1: 11, zemin: '#a87046' },
    { id: 'kutuphane', ad: 'Kütüphane', x0: 5, z0: 6, x1: 10, z1: 11, zemin: '#8c5a36' },
    { id: 'atolye', ad: 'Atölye', x0: 0, z0: 11, x1: 3.4, z1: 16, zemin: '#9a9188', karo: true },
    { id: 'sanat', ad: 'Sanat Odası', x0: 3.4, z0: 11, x1: 6.7, z1: 16, zemin: '#c09466' },
    { id: 'film', ad: 'Film Odası', x0: 6.7, z0: 11, x1: 10, z1: 16, zemin: '#5a4a6e' }
  ];

  // İç duvarlar ve üzerlerindeki kapı aralıkları
  const IC_DUVARLAR = [
    { yatay: true, z: 6, a: 0, b: 10, kapilar: [[2.5, 3.5], [7.5, 8.5]] },
    { yatay: true, z: 11, a: 0, b: 10, kapilar: [[1.2, 2.2], [4.0, 4.8], [8.0, 9.0]] },
    { yatay: false, x: 6.5, a: 0, b: 6, kapilar: [[2.4, 3.6]] },
    { yatay: false, x: 5, a: 6, b: 11, kapilar: [[8.0, 9.0]] },
    { yatay: false, x: 3.4, a: 11, b: 16, kapilar: [[13.0, 14.0]] },
    { yatay: false, x: 6.7, a: 11, b: 16, kapilar: [[13.0, 14.0]] }
  ];
  /** Kapılar çıkarılmış duvar parçaları: {x0,z0,x1,z1, ic} */
  function duvarParcalari() {
    const p = [
      { x0: 0, z0: 0, x1: GEN, z1: 0, ic: false, arka: true }, { x0: 0, z0: 0, x1: 0, z1: DER, ic: false },
      { x0: GEN, z0: 0, x1: GEN, z1: DER, ic: false }, { x0: 0, z0: DER, x1: GEN, z1: DER, ic: false, on: true }
    ];
    for (const d of IC_DUVARLAR) {
      let bas = d.a;
      const kesik = [...d.kapilar].sort((a, b) => a[0] - b[0]);
      for (const [k0, k1] of kesik.concat([[d.b, d.b]])) {
        if (k0 > bas + 0.01) p.push(d.yatay ? { x0: bas, z0: d.z, x1: k0, z1: d.z, ic: true } : { x0: d.x, z0: bas, x1: d.x, z1: k0, ic: true });
        bas = k1;
      }
    }
    return p;
  }
  const DUVARLAR = duvarParcalari();

  const P = Math.PI;
  const MOBILYA = [
    // ---- Salon
    { tip: 'kitaplik', x: 1.0, z: 0.3, w: 1.6, d: 0.4, h: 1.5 },
    { tip: 'lamba', x: 0.35, z: 1.0, w: 0.35, d: 0.35, h: 1.4 },
    { tip: 'tv', x: 4.4, z: 0.3, w: 1.8, d: 0.45, h: 0.5 },
    { tip: 'bitki', x: 6.1, z: 0.45, w: 0.5, d: 0.5, h: 0.9 },
    { tip: 'hali', x: 2.6, z: 2.7, w: 3.4, d: 2.6, renk: '#cbb7d9', engel: false },
    { tip: 'koltuk', x: 2.4, z: 1.5, w: 2.4, d: 0.9, h: 0.8, renk: '#e8ddd0' },
    { tip: 'sehpa', x: 2.4, z: 2.8, w: 1.1, d: 0.6, h: 0.42 },
    { tip: 'berjer', x: 4.9, z: 2.7, w: 0.9, d: 0.9, h: 0.8, yon: -P / 2, renk: '#e8ddd0' },
    { tip: 'puf', x: 4.0, z: 4.2, w: 0.7, d: 0.7, h: 0.4, renk: '#5a4a8a' },
    { tip: 'bitki', x: 0.4, z: 5.55, w: 0.5, d: 0.5, h: 1.0 },
    // ---- Mutfak
    { tip: 'tezgah', x: 8.3, z: 0.35, w: 3.2, d: 0.6, h: 0.9 },
    { tip: 'buzdolabi', x: 9.6, z: 1.5, w: 0.7, d: 0.7, h: 1.8, yon: -P / 2 },
    { tip: 'yemekmasasi', x: 8.2, z: 3.8, w: 1.5, d: 0.9, h: 0.75 },
    { tip: 'bitki', x: 9.6, z: 5.55, w: 0.45, d: 0.45, h: 0.8 },
    // ---- Çalışma
    { tip: 'masa', x: 1.3, z: 6.55, w: 1.9, d: 0.7, h: 0.75 },
    { tip: 'sandalye', x: 1.3, z: 7.35, w: 0.55, d: 0.55, h: 0.9 },
    { tip: 'dolap', x: 0.3, z: 9.2, w: 1.2, d: 0.45, h: 0.9, yon: P / 2 },
    { tip: 'hali', x: 2.6, z: 8.6, w: 2.4, d: 1.6, renk: '#d9cfc2', engel: false },
    { tip: 'bitki', x: 4.6, z: 6.4, w: 0.45, d: 0.45, h: 0.8 },
    // ---- Kütüphane
    { tip: 'kitaplik', x: 6.0, z: 6.3, w: 1.6, d: 0.4, h: 1.8 },
    { tip: 'kitaplik', x: 9.7, z: 8.5, w: 2.2, d: 0.4, h: 1.8, yon: -P / 2 },
    { tip: 'kitaplik', x: 5.3, z: 10.0, w: 1.4, d: 0.4, h: 1.6, yon: P / 2 },
    { tip: 'hali', x: 7.9, z: 9.0, w: 2.6, d: 2.0, renk: '#6f4a80', engel: false },
    { tip: 'berjer', x: 7.3, z: 8.4, w: 0.85, d: 0.85, h: 0.8, renk: '#7d5ba6' },
    { tip: 'berjer', x: 8.6, z: 8.4, w: 0.85, d: 0.85, h: 0.8, renk: '#7d5ba6' },
    { tip: 'sehpa', x: 7.95, z: 9.6, w: 0.7, d: 0.5, h: 0.42 },
    { tip: 'lamba', x: 9.6, z: 6.4, w: 0.35, d: 0.35, h: 1.4 },
    // ---- Atölye
    { tip: 'tezgah', x: 0.35, z: 13.6, w: 2.6, d: 0.6, h: 0.9, yon: P / 2, atolye: true },
    { tip: 'kitaplik', x: 3.05, z: 15.0, w: 1.2, d: 0.4, h: 1.5, yon: -P / 2 },
    { tip: 'bitki', x: 0.4, z: 15.6, w: 0.45, d: 0.45, h: 0.8 },
    // ---- Sanat Odası
    { tip: 'hali', x: 5.0, z: 13.8, w: 2.2, d: 1.6, renk: '#e3c6a8', engel: false },
    { tip: 'sovale', x: 5.0, z: 13.2, w: 0.7, d: 0.5, h: 1.5 },
    { tip: 'sehpa', x: 5.9, z: 15.4, w: 1.1, d: 0.6, h: 0.42 },
    { tip: 'bitki', x: 3.8, z: 15.6, w: 0.45, d: 0.45, h: 0.9 },
    // ---- Film Odası
    { tip: 'perde', x: 8.35, z: 15.75, w: 2.6, d: 0.12, h: 1.4 },
    { tip: 'koltuk', x: 8.35, z: 13.0, w: 2.2, d: 0.9, h: 0.8, renk: '#3d3550' },
    { tip: 'puf', x: 7.3, z: 14.6, w: 0.6, d: 0.6, h: 0.4, renk: '#7d5ba6' },
    { tip: 'bitki', x: 9.6, z: 11.4, w: 0.45, d: 0.45, h: 0.9 }
  ].map(m => Object.assign({ engel: true }, m));

  // Yeni eşyaların konacağı noktalar (sırayla doldurulur)
  const ESYA_YERLERI = [
    { x: 2.4, z: 2.8 }, { x: 1.0, z: 0.7 }, { x: 4.4, z: 0.75 }, { x: 1.3, z: 6.55 },
    { x: 6.0, z: 6.7 }, { x: 8.2, z: 3.8 }, { x: 5.0, z: 13.2 }, { x: 8.35, z: 15.3 },
    { x: 0.75, z: 13.6 }, { x: 7.95, z: 9.6 }, { x: 4.0, z: 4.2 }, { x: 2.6, z: 8.6 },
    { x: 8.3, z: 0.75 }, { x: 5.9, z: 15.4 }, { x: 0.7, z: 9.2 }, { x: 7.3, z: 14.6 }
  ];

  // ---------- yürüme ızgarası
  const H = 0.2, NX = Math.round(GEN / H), NZ = Math.round(DER / H);
  const R = 0.22, T = 0.12; // karakter yarıçapı, duvar kalınlığı
  let engel = null;

  function izgaraKur() {
    engel = new Uint8Array(NX * NZ);
    for (let iz = 0; iz < NZ; iz++) for (let ix = 0; ix < NX; ix++) {
      const x = (ix + 0.5) * H, z = (iz + 0.5) * H;
      let e = x < R || x > GEN - R || z < R || z > DER - R;
      if (!e) for (const d of DUVARLAR) {
        if (!d.ic) continue;
        const px = Math.max(d.x0, Math.min(d.x1, x)), pz = Math.max(d.z0, Math.min(d.z1, z));
        if (Math.hypot(x - px, z - pz) < R + T / 2) { e = true; break; }
      }
      if (!e) for (const m of MOBILYA) {
        if (!m.engel) continue;
        const dik = m.yon && Math.abs(Math.sin(m.yon)) > 0.5;
        const w = (dik ? m.d : m.w) / 2 + R, d = (dik ? m.w : m.d) / 2 + R;
        if (Math.abs(x - m.x) < w && Math.abs(z - m.z) < d) { e = true; break; }
      }
      engel[iz * NX + ix] = e ? 1 : 0;
    }
  }
  const hucre = (x, z) => [Math.max(0, Math.min(NX - 1, Math.floor(x / H))), Math.max(0, Math.min(NZ - 1, Math.floor(z / H)))];
  const merkez = (ix, iz) => ({ x: (ix + 0.5) * H, z: (iz + 0.5) * H });
  const bosMu = (ix, iz) => ix >= 0 && iz >= 0 && ix < NX && iz < NZ && !engel[iz * NX + ix];

  function enYakinBos(x, z) {
    if (!engel) izgaraKur();
    const [cx, cz] = hucre(x, z);
    if (bosMu(cx, cz)) return [cx, cz];
    for (let r = 1; r < 40; r++) {
      let en = null, enD = 1e9;
      for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        if (bosMu(cx + dx, cz + dz)) { const d = dx * dx + dz * dz; if (d < enD) { enD = d; en = [cx + dx, cz + dz]; } }
      }
      if (en) return en;
    }
    return [cx, cz];
  }

  /** A* yol bulma (ikili yığın ile). Dönen: [{x,z}, ...] */
  function yolBul(ax, az, bx, bz) {
    if (!engel) izgaraKur();
    const [sx, sz] = enYakinBos(ax, az), [hx, hz] = enYakinBos(bx, bz);
    const N = NX * NZ, bas = sz * NX + sx, hedef = hz * NX + hx;
    if (bas === hedef) return [merkez(hx, hz)];
    const g = new Float32Array(N).fill(1e9), gel = new Int32Array(N).fill(-1), kapali = new Uint8Array(N);
    const h = i => Math.hypot(i % NX - hx, ((i / NX) | 0) - hz);
    const yigin = [[h(bas), bas]]; g[bas] = 0;
    const it = (a) => { yigin.push(a); let i = yigin.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (yigin[p][0] <= yigin[i][0]) break; [yigin[p], yigin[i]] = [yigin[i], yigin[p]]; i = p; } };
    const al = () => { const ust = yigin[0], son = yigin.pop(); if (yigin.length) { yigin[0] = son; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let k = i; if (l < yigin.length && yigin[l][0] < yigin[k][0]) k = l; if (r < yigin.length && yigin[r][0] < yigin[k][0]) k = r; if (k === i) break; [yigin[k], yigin[i]] = [yigin[i], yigin[k]]; i = k; } } return ust; };
    while (yigin.length) {
      const [, c] = al();
      if (kapali[c]) continue;
      if (c === hedef) break;
      kapali[c] = 1;
      const cx = c % NX, cz = (c / NX) | 0;
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dz) continue;
        const nx = cx + dx, nz = cz + dz;
        if (!bosMu(nx, nz)) continue;
        if (dx && dz && (!bosMu(cx + dx, cz) || !bosMu(cx, cz + dz))) continue;
        const n = nz * NX + nx; if (kapali[n]) continue;
        const ng = g[c] + (dx && dz ? 1.4142 : 1);
        if (ng < g[n]) { g[n] = ng; gel[n] = c; it([ng + h(n), n]); }
      }
    }
    if (gel[hedef] === -1) return [];
    const yol = []; let c = hedef;
    while (c !== bas && c !== -1) { yol.push(merkez(c % NX, (c / NX) | 0)); c = gel[c]; }
    yol.reverse();
    return sadelestir({ x: ax, z: az }, yol);
  }

  function gorus(a, b) {
    const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / (H * 0.5));
    for (let i = 1; i < n; i++) {
      const t = i / n; const [ix, iz] = hucre(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t);
      if (!bosMu(ix, iz)) return false;
    }
    return true;
  }
  function sadelestir(bas, yol) {
    if (yol.length < 3) return yol;
    const s = []; let onceki = bas, i = 0;
    while (i < yol.length) {
      let j = yol.length - 1;
      while (j > i && !gorus(onceki, yol[j])) j--;
      s.push(yol[j]); onceki = yol[j]; i = j + 1;
    }
    return s;
  }

  function rastgeleBos(odaId) {
    if (!engel) izgaraKur();
    const o = ODALAR.find(o => o.id === odaId) || ODALAR[Math.floor(Math.random() * ODALAR.length)];
    for (let k = 0; k < 60; k++) {
      const x = o.x0 + 0.4 + Math.random() * (o.x1 - o.x0 - 0.8), z = o.z0 + 0.4 + Math.random() * (o.z1 - o.z0 - 0.8);
      const [ix, iz] = hucre(x, z);
      if (bosMu(ix, iz)) return merkez(ix, iz);
    }
    const [ix, iz] = enYakinBos((o.x0 + o.x1) / 2, (o.z0 + o.z1) / 2);
    return merkez(ix, iz);
  }

  function odaBul(x, z) { return ODALAR.find(o => x >= o.x0 && x < o.x1 && z >= o.z0 && z < o.z1) || ODALAR[0]; }

  // ---------- eşyalar (kalıcı)
  const ESYA_YOL = '/ev/esyalar.json';
  let onbellek = null;
  const Ev = {
    GEN, DER, SURUM, ODALAR, DUVARLAR, MOBILYA, yolBul, enYakinBos, rastgeleBos, odaBul,
    odaAdi(id) { return (ODALAR.find(o => o.id === id) || {}).ad || id; },
    yurunebilir(x, z) { if (!engel) izgaraKur(); const [ix, iz] = hucre(x, z); return bosMu(ix, iz); },
    esyalar() { if (!onbellek) onbellek = Depo.okuJSON(ESYA_YOL, []); return onbellek.slice(); },
    esyalariKaydet(l) { onbellek = l.slice(); Depo.yazJSON(ESYA_YOL, l); },
    bosYer(dolu) {
      const kume = new Set(dolu.map(e => e.x.toFixed(1) + ',' + e.z.toFixed(1)));
      const y = ESYA_YERLERI.find(y => !kume.has(y.x.toFixed(1) + ',' + y.z.toFixed(1)));
      return y ? { x: y.x, z: y.z } : rastgeleBos();
    },
    esyaEkle({ ad, dosya, ikon = 'sayfa' }) {
      const l = Ev.esyalar();
      const yer = Ev.bosYer(l);
      const e = { id: 'e' + Date.now().toString(36), ad, dosya, ikon, oda: odaBul(yer.x, yer.z).id, x: yer.x, z: yer.z };
      l.push(e); Ev.esyalariKaydet(l);
      return e;
    },
    /** Eski (2 odalı) evden kalan eşyaları yeni evin yerlerine taşır */
    tasi() {
      const eski = Ev.esyalar(), yeni = [];
      for (const e of eski) { const y = Ev.bosYer(yeni); yeni.push(Object.assign({}, e, { x: y.x, z: y.z, oda: odaBul(y.x, y.z).id })); }
      Ev.esyalariKaydet(yeni);
    },
    esyaSil(id) { Ev.esyalariKaydet(Ev.esyalar().filter(e => e.id !== id)); },
    esyaBul(id) { return Ev.esyalar().find(e => e.id === id) || null; }
  };
  window.Ev = Ev;
})();
