/* Sahne2D: 3D başlatılamazsa devreye giren basit yedek görünüm (tepeden kat planı).
 * Sahne3D ile aynı arayüze sahiptir.
 */
(function () {
  const MOB_RENK = { kitaplik: '#5b3b26', lamba: '#fff1d6', tv: '#2a2a33', perde: '#1b2140', bitki: '#3f7d4a', koltuk: '#e8ddd0', berjer: '#e8ddd0', sehpa: '#7a5236', puf: '#5a4a8a', masa: '#b5895c', sandalye: '#2d2a38', dolap: '#7a5236', tezgah: '#f2ede4', buzdolabi: '#e9edf2', yemekmasasi: '#b5895c', sovale: '#fbf7ef' };

  class Sahne2D {
    constructor(kap, etiketKap, yasamlar, cb) {
      this.kap = kap; this.etiketKap = etiketKap; this.yasamlar = yasamlar; this.cb = cb;
      this.seciliId = yasamlar[0] && yasamlar[0].v.id;
      this.modAdi = 'ev'; this.calisiyor = true; this.etiketler = new Map(); this.isimler = new Map(); this.yedek = true;
    }
    get secili() { return this.yasamlar.find(y => y.v.id === this.seciliId) || this.yasamlar[0]; }
    kur(ayar) {
      const c = this.canvas = document.createElement('canvas'); c.className = 'sahneCanvas';
      this.kap.appendChild(c); this.ctx = c.getContext('2d');
      this.geceMi = !!ayar.gece;
      this.boyutla(); this.esyalariYenile();
      for (const y of this.yasamlar) this.isimEkle(y);
      let son = { t: 0, x: 0, y: 0 }, bas = null;
      c.addEventListener('pointerdown', e => { bas = { x: e.clientX, y: e.clientY }; });
      c.addEventListener('pointerup', e => {
        if (!bas || Math.hypot(e.clientX - bas.x, e.clientY - bas.y) > 14) { bas = null; return; }
        bas = null;
        const cift = performance.now() - son.t < 330 && Math.hypot(e.clientX - son.x, e.clientY - son.y) < 50;
        son = { t: performance.now(), x: e.clientX, y: e.clientY };
        const r = c.getBoundingClientRect(); this.dokun(e.clientX - r.left, e.clientY - r.top, cift);
      });
      this._son = performance.now();
      const dongu = now => {
        requestAnimationFrame(dongu);
        const dt = Math.min(0.1, (now - this._son) / 1000); this._son = now;
        if (this.calisiyor) this.kare(dt);
      };
      requestAnimationFrame(dongu);
    }
    boyutla() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.W = Math.max(1, this.kap.clientWidth); this.H = Math.max(1, this.kap.clientHeight);
      this.canvas.width = this.W * dpr; this.canvas.height = this.H * dpr; this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const pay = 14;
      this.olcek = Math.min((this.W - pay * 2) / Ev.GEN, (this.H - pay * 2) / Ev.DER);
      this.ox = (this.W - Ev.GEN * this.olcek) / 2; this.oz = (this.H - Ev.DER * this.olcek) / 2;
    }
    mod(m) { this.modAdi = m; this.boyutla(); }
    sec(id) { this.seciliId = id; }
    portreModu(evet) { this.portreAktif = !!evet; }
    odakla() {}
    ekran(x, z) { return { x: this.ox + x * this.olcek, y: this.oz + z * this.olcek }; }
    dokun(px, py, cift) {
      if (this.modAdi !== 'ev') { this.cb.karaktereDokun(this.seciliId); return; }
      for (const y of this.yasamlar) {
        const k = this.ekran(y.x, y.z);
        if (Math.hypot(px - k.x, py - (k.y - 0.3 * this.olcek)) < Math.max(14, 0.35 * this.olcek)) return this.cb.karaktereDokun(y.v.id);
      }
      const x = (px - this.ox) / this.olcek, z = (py - this.oz) / this.olcek;
      if (x > 0 && x < Ev.GEN && z > 0 && z < Ev.DER) this.cb.zemineDokun(x, z, cift);
    }
    isimEkle(y) {
      const el = document.createElement('button'); el.className = 'isimEtiket'; el.textContent = y.v.ad;
      el.addEventListener('click', e => { e.stopPropagation(); this.cb.karaktereDokun(y.v.id); });
      this.etiketKap.appendChild(el); this.isimler.set(y.v.id, el);
    }
    karakterEkle(y) { if (!this.yasamlar.includes(y)) this.yasamlar.push(y); if (!this.isimler.has(y.v.id)) this.isimEkle(y); }
    karakterCikar(id) { this.yasamlar = this.yasamlar.filter(y => y.v.id !== id); const el = this.isimler.get(id); if (el) { el.remove(); this.isimler.delete(id); } }
    isimleriYenile() { for (const y of this.yasamlar) { const el = this.isimler.get(y.v.id); if (el) el.textContent = y.v.ad; } }
    esyalariYenile() {
      for (const [, el] of this.etiketler) el.remove();
      this.etiketler.clear();
      for (const e of Ev.esyalar()) {
        const el = document.createElement('button');
        el.className = 'esyaEtiket'; el.innerHTML = Ikon.svg(e.ikon || 'sayfa') + '<span></span>';
        el.querySelector('span').textContent = e.ad;
        el.addEventListener('click', ev => { ev.stopPropagation(); this.cb.esyayaDokun(e.id); });
        this.etiketKap.appendChild(el); this.etiketler.set(e.id, el);
      }
    }
    modelYukle() { return Promise.reject(new Error('3D modeller bu cihazda gösterilemiyor (3D başlatılamadı).')); }
    modeliKaldir() {}
    gece(evet) { this.geceMi = evet; }
    golge() {}
    dur() { this.calisiyor = false; }
    devam() { this.calisiyor = true; }

    basEkranda(id) {
      const y = id ? this.yasamlar.find(y => y.v.id === id) : this.secili; if (!y) return null;
      if (this.modAdi === 'ev') { const k = this.ekran(y.x, y.z); return { x: k.x, y: k.y - 0.75 * this.olcek }; }
      return { x: this.W / 2, y: this.H * 0.08 };
    }

    kare(dt) {
      for (const y of this.yasamlar) y.guncelle(dt);
      const c = this.ctx;
      c.fillStyle = this.geceMi ? '#07070f' : '#0b0b14'; c.fillRect(0, 0, this.W, this.H);
      const ev = this.modAdi === 'ev';
      if (ev) this.evCiz(c); else this.portreCiz(c);
      for (const e of Ev.esyalar()) {
        const el = this.etiketler.get(e.id); if (!el) continue;
        if (!ev) { el.style.display = 'none'; continue; }
        const p = this.ekran(e.x, e.z);
        el.style.display = ''; el.style.transform = `translate(${p.x}px, ${p.y - 8}px) translate(-50%, -100%)`;
      }
      for (const y of this.yasamlar) {
        const el = this.isimler.get(y.v.id); if (!el) continue;
        el.classList.toggle('secili', y === this.secili);
        if (!ev) { el.style.display = 'none'; continue; }
        const p = this.ekran(y.x, y.z);
        el.style.display = ''; el.style.transform = `translate(${p.x}px, ${p.y + 4}px) translate(-50%, 0)`;
      }
    }

    evCiz(c) {
      const s = this.olcek;
      for (const o of Ev.ODALAR) {
        const a = this.ekran(o.x0, o.z0);
        c.fillStyle = o.zemin; c.fillRect(a.x, a.y, (o.x1 - o.x0) * s, (o.z1 - o.z0) * s);
        c.fillStyle = 'rgba(255,255,255,.55)'; c.font = '10px system-ui'; c.fillText(o.ad, a.x + 4, a.y + 12);
      }
      if (this.geceMi) { c.fillStyle = 'rgba(20,24,70,.45)'; const a = this.ekran(0, 0); c.fillRect(a.x, a.y, Ev.GEN * s, Ev.DER * s); }
      c.strokeStyle = '#8f6be8'; c.lineWidth = 3; c.lineCap = 'round';
      for (const d of Ev.DUVARLAR) { const a = this.ekran(d.x0, d.z0), b = this.ekran(d.x1, d.z1); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
      for (const m of Ev.MOBILYA) {
        const p = this.ekran(m.x, m.z);
        const dik = m.yon && Math.abs(Math.sin(m.yon)) > 0.5;
        const w = (dik ? m.d : m.w) * s, d = (dik ? m.w : m.d) * s;
        if (m.tip === 'hali') { c.fillStyle = m.renk; c.beginPath(); c.ellipse(p.x, p.y, w / 2, d / 2, 0, 0, Math.PI * 2); c.fill(); continue; }
        if (m.tip === 'bitki') { c.fillStyle = '#3f7d4a'; c.beginPath(); c.arc(p.x, p.y, w / 2, 0, Math.PI * 2); c.fill(); continue; }
        c.fillStyle = m.renk || MOB_RENK[m.tip] || '#777'; c.fillRect(p.x - w / 2, p.y - d / 2, w, d);
        c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; c.strokeRect(p.x - w / 2, p.y - d / 2, w, d);
      }
      const t = this.secili ? this.secili.t : 0;
      for (const e of Ev.esyalar()) {
        const p = this.ekran(e.x, e.z);
        c.strokeStyle = '#c9b6ff'; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y, 0.24 * s * (1 + Math.sin(t * 3) * 0.08), 0, Math.PI * 2); c.stroke();
      }
      for (const y of [...this.yasamlar].sort((a, b) => a.z - b.z)) {
        const g = y.v.gorunum || {}, p = this.ekran(y.x, y.z);
        const zipla = y.hareket !== 'bekle' ? Math.abs(Math.sin(y.faz)) * 0.05 * s : 0;
        if (y === this.secili) { c.strokeStyle = '#00e5ff'; c.lineWidth = 2; c.beginPath(); c.ellipse(p.x, p.y + 2, 0.3 * s, 0.13 * s, 0, 0, Math.PI * 2); c.stroke(); }
        c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(p.x, p.y + 2, 0.22 * s, 0.09 * s, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = g.ust || '#a98be0'; c.beginPath(); c.ellipse(p.x, p.y - 0.15 * s - zipla, 0.17 * s, 0.17 * s, 0, 0, Math.PI * 2); c.fill();
        this.kafaCiz(c, y, p.x, p.y - 0.45 * s - zipla, 0.22 * s);
      }
    }

    kafaCiz(c, y, x, yy, r) {
      const g = y.v.gorunum || {};
      if (g.robot) {
        c.fillStyle = g.ust || '#f2f3f5'; c.beginPath(); c.arc(x, yy + r * 0.15, r * 1.08, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#10141c'; c.beginPath(); c.ellipse(x, yy + r * 0.2, r * 0.8, r * 0.55, 0, 0, Math.PI * 2); c.fill();
      } else {
        c.fillStyle = g.sac || '#3b2a20'; c.beginPath(); c.arc(x, yy + r * 0.1, r * 1.12, 0, Math.PI * 2); c.fill();
        if (g.kulak === 'kedi') for (const k of [-1, 1]) { c.beginPath(); c.moveTo(x + k * r * 0.4, yy - r * 0.8); c.lineTo(x + k * r * 0.9, yy - r * 1.4); c.lineTo(x + k * r * 1.0, yy - r * 0.5); c.fill(); }
        c.fillStyle = g.ten || '#ffe0cf'; c.beginPath(); c.arc(x, yy + r * 0.15, r, 0, Math.PI * 2); c.fill();
        if (g.kulak === 'elf') for (const k of [-1, 1]) { c.beginPath(); c.moveTo(x + k * r * 0.9, yy); c.lineTo(x + k * r * 1.5, yy - r * 0.4); c.lineTo(x + k * r * 0.95, yy + r * 0.3); c.fill(); }
        c.fillStyle = g.sac || '#3b2a20'; c.beginPath(); c.arc(x, yy + r * 0.1, r * 1.1, Math.PI * 1.05, Math.PI * 1.95); c.quadraticCurveTo(x, yy - r * 0.2, x - r * 1.05, yy - r * 0.15); c.fill();
      }
      Yuz.ciz(c, x, yy + r * 0.2, r / 80, { ifade: y.ifade(), goz: y.goz, agiz: y.agiz, selam: y.selamSure > 0 }, g);
    }

    portreCiz(c) {
      const W = this.W, H = this.H, kose = this.modAdi === 'kose', y = this.secili; if (!y) return;
      const g = y.v.gorunum || {};
      const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1c1630'); gr.addColorStop(1, '#0b0b14');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      if (this.portreAktif) return;
      const r = kose ? Math.min(W, H) * 0.42 : Math.min(W * 0.36, H * 0.16);
      const kx = W / 2, ky = kose ? H * 0.55 : H * (this.modAdi === 'sesli' ? 0.25 : 0.2);
      if (!kose) {
        c.fillStyle = g.ust || '#a98be0';
        c.beginPath(); c.moveTo(kx - r * 0.95, ky + r * 1.2); c.lineTo(kx + r * 0.95, ky + r * 1.2); c.lineTo(kx + r * 1.05, ky + r * 3.3); c.lineTo(kx - r * 1.05, ky + r * 3.3); c.fill();
        if (this.modAdi === 'sohbet' && !g.robot) { c.fillStyle = g.alt || '#2d2838'; c.fillRect(kx - r * 0.5, ky + r * 3.3, r * 0.42, r * 2.1); c.fillRect(kx + r * 0.08, ky + r * 3.3, r * 0.42, r * 2.1); }
      }
      this.kafaCiz(c, y, kx, ky, r);
    }
  }
  window.Sahne2D = Sahne2D;
})();
