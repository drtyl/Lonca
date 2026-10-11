/* Yüz çizici: hazır karakterlerin yüzünü bir canvas'a çizer (3D'de kafa dokusu, 2D'de doğrudan).
 * Her karakterin göz rengi, ten, saç rengi, çilleri farklıdır (g = gorunum).
 * İfade, göz açıklığı ve ağız açıklığı Yaşam'dan gelir.
 */
(function () {
  const VARS = { sac: '#3b2a20', goz: '#5b3a8f', ten: '#ffe0cf' };
  const koyu = (hex, k) => {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.round(((n >> 16) & 255) * k), g = Math.round(((n >> 8) & 255) * k), b = Math.round((n & 255) * k);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  };
  const CIZGI = '#3a2436', AGIZ = '#7a2944';

  function robotYuz(ctx, cx, cy, s, o, g) {
    const goz = g.goz || '#2fe6d6', ifade = o.ifade || 'normal';
    ctx.save();
    ctx.shadowColor = goz; ctx.shadowBlur = 10 * s;
    ctx.fillStyle = goz; ctx.strokeStyle = goz; ctx.lineCap = 'round'; ctx.lineWidth = 5 * s;
    for (const k of [-1, 1]) {
      const gx = cx + k * 26 * s;
      if ((o.goz != null && o.goz < 0.12)) { ctx.beginPath(); ctx.moveTo(gx - 10 * s, cy); ctx.lineTo(gx + 10 * s, cy); ctx.stroke(); }
      else if (ifade === 'mutlu' || o.selam) { ctx.beginPath(); ctx.arc(gx, cy + 4 * s, 10 * s, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
      else if (ifade === 'uzgun') { ctx.beginPath(); ctx.arc(gx, cy - 6 * s, 10 * s, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); }
      else { const h = (ifade === 'yorgun' ? 5 : 12) * s; ctx.beginPath(); ctx.ellipse(gx, cy, 8 * s, h, 0, 0, Math.PI * 2); ctx.fill(); }
    }
    const a = o.agiz || 0;
    if (a > 0.06) { ctx.beginPath(); ctx.ellipse(cx, cy + 26 * s, 10 * s, (2 + a * 8) * s, 0, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.lineWidth = 3.5 * s; ctx.beginPath(); ctx.moveTo(cx - 9 * s, cy + 25 * s); ctx.quadraticCurveTo(cx, cy + (ifade === 'uzgun' ? 20 : 31) * s, cx + 9 * s, cy + 25 * s); ctx.stroke(); }
    ctx.restore();
  }

  /** cx,cy = iki gözün ortası; s = ölçek (1 ≈ 100px genişlikte yüz); g = görünüm */
  function ciz(ctx, cx, cy, s, o, g) {
    g = g || {};
    if (g.robot) return robotYuz(ctx, cx, cy, s, o, g);
    const ifade = o.ifade || 'normal', goz = o.goz == null ? 1 : o.goz, agiz = o.agiz || 0;
    const mutlu = ifade === 'mutlu' || o.selam;
    const gozRenk = g.goz || VARS.goz, ten = g.ten || VARS.ten, kas = koyu(g.sac || VARS.sac, 0.8);
    const ara = 30 * s, gw = 13 * s, gh = 17 * s;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    for (const k of [-1, 1]) {
      const gx = cx + k * ara;
      ctx.strokeStyle = kas; ctx.lineWidth = 3.4 * s;
      ctx.beginPath();
      if (ifade === 'uzgun') { ctx.moveTo(gx - k * 13 * s, cy - 20 * s); ctx.lineTo(gx + k * 9 * s, cy - 27 * s); }
      else if (ifade === 'saskin') { ctx.moveTo(gx - 11 * s, cy - 30 * s); ctx.quadraticCurveTo(gx, cy - 35 * s, gx + 11 * s, cy - 30 * s); }
      else { ctx.moveTo(gx - 11 * s, cy - 25 * s); ctx.quadraticCurveTo(gx, cy - 29 * s, gx + 11 * s, cy - 25 * s); }
      ctx.stroke();

      if (goz < 0.12) {
        ctx.strokeStyle = CIZGI; ctx.lineWidth = 3 * s;
        ctx.beginPath(); ctx.moveTo(gx - gw, cy + 2 * s); ctx.quadraticCurveTo(gx, cy + 6 * s, gx + gw, cy + 2 * s); ctx.stroke();
      } else if (mutlu && goz > 0.5) {
        ctx.strokeStyle = CIZGI; ctx.lineWidth = 3.4 * s;
        ctx.beginPath(); ctx.moveTo(gx - gw, cy + 3 * s); ctx.quadraticCurveTo(gx, cy - 12 * s, gx + gw, cy + 3 * s); ctx.stroke();
      } else {
        const h = gh * (ifade === 'saskin' ? 1.15 : 1);
        ctx.save();
        ctx.beginPath(); ctx.ellipse(gx, cy, gw, h, 0, 0, Math.PI * 2); ctx.clip();
        ctx.fillStyle = '#fff'; ctx.fillRect(gx - gw, cy - h, gw * 2, h * 2);
        const bx = (o.bakisX || 0) * 3 * s;
        ctx.fillStyle = gozRenk; ctx.beginPath(); ctx.ellipse(gx + bx, cy + 2 * s, gw * 0.85, h * 0.9, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = koyu(gozRenk, 0.4); ctx.beginPath(); ctx.ellipse(gx + bx, cy + 3 * s, gw * 0.45, h * 0.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(gx + bx + 4 * s, cy - 5 * s, 3.6 * s, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(gx + bx - 3 * s, cy + 7 * s, 1.8 * s, 0, Math.PI * 2); ctx.fill();
        if (goz < 0.98) { ctx.fillStyle = ten; ctx.fillRect(gx - gw, cy - h, gw * 2, h * 2 * (1 - goz)); }
        ctx.restore();
        ctx.strokeStyle = CIZGI; ctx.lineWidth = 3 * s;
        const ust = cy - h + h * 2 * (1 - goz);
        ctx.beginPath(); ctx.moveTo(gx - gw - 1 * s, ust + 3 * s); ctx.quadraticCurveTo(gx, ust - 3 * s, gx + gw + 1 * s, ust + 3 * s); ctx.stroke();
      }
    }

    if (mutlu || ifade === 'normal') {
      ctx.fillStyle = mutlu ? 'rgba(255,110,150,.35)' : 'rgba(255,110,150,.16)';
      for (const k of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + k * 40 * s, cy + 18 * s, 9 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fill(); }
    }
    if (g.cil) {
      ctx.fillStyle = 'rgba(150,80,40,.55)';
      for (const k of [-1, 1]) for (const [dx, dy] of [[-6, 0], [0, 4], [6, -1], [3, 9], [-4, 8]]) {
        ctx.beginPath(); ctx.arc(cx + k * (38 * s + dx * s), cy + 14 * s + dy * s, 1.6 * s, 0, Math.PI * 2); ctx.fill();
      }
    }

    const ay = cy + 32 * s;
    ctx.strokeStyle = CIZGI; ctx.fillStyle = AGIZ; ctx.lineWidth = 2.6 * s;
    if (agiz > 0.06) {
      const h = (2 + agiz * 9) * s, w = (5 + agiz * 3) * s;
      ctx.beginPath(); ctx.ellipse(cx, ay, w, h, 0, 0, Math.PI * 2); ctx.fill();
    } else if (ifade === 'saskin') {
      ctx.beginPath(); ctx.ellipse(cx, ay, 4 * s, 6 * s, 0, 0, Math.PI * 2); ctx.fill();
    } else if (mutlu) {
      ctx.beginPath(); ctx.moveTo(cx - 9 * s, ay - 2 * s); ctx.quadraticCurveTo(cx, ay + 11 * s, cx + 9 * s, ay - 2 * s); ctx.closePath(); ctx.fill();
    } else if (ifade === 'uzgun') {
      ctx.beginPath(); ctx.moveTo(cx - 7 * s, ay + 4 * s); ctx.quadraticCurveTo(cx, ay - 4 * s, cx + 7 * s, ay + 4 * s); ctx.stroke();
    } else if (ifade === 'yorgun') {
      ctx.beginPath(); ctx.moveTo(cx - 5 * s, ay + 1 * s); ctx.lineTo(cx + 5 * s, ay + 1 * s); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(cx - 6 * s, ay); ctx.quadraticCurveTo(cx, ay + 5 * s, cx + 6 * s, ay); ctx.stroke();
    }
    ctx.restore();
  }

  /** 3D kafa dokusu: 512x256, yüz u=0.25 (öne bakan taraf) civarında */
  function kafaDokusu(canvas, o, g) {
    g = g || {};
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height, fx = W * 0.25;
    if (g.robot) {
      ctx.fillStyle = '#10141c'; ctx.fillRect(0, 0, W, H);
      robotYuz(ctx, fx, H * 0.5, 1.1, o, g);
      return;
    }
    ctx.fillStyle = g.ten || VARS.ten; ctx.fillRect(0, 0, W, H);
    // perçemler
    const sac = g.sac || VARS.sac;
    ctx.fillStyle = sac;
    const kisa = g.sacStil === 'kisa' || g.sacStil === 'daginik';
    const alt = kisa ? 0.36 : 0.4;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H * alt);
    const sol = fx - 95, sag = fx + 95;
    ctx.lineTo(sag + 30, H * alt);
    const dis = g.sacStil === 'toplu' || g.sacStil === 'orgulu'
      ? [[sag, 0.44], [fx + 40, 0.36], [fx, 0.33], [fx - 40, 0.36], [sol, 0.44]]            // geriye taranmış
      : kisa
        ? [[sag, 0.4], [fx + 50, 0.34], [fx + 25, 0.42], [fx, 0.35], [fx - 25, 0.42], [fx - 50, 0.34], [sol, 0.4]]
        : [[sag, 0.47], [fx + 62, 0.38], [fx + 40, 0.5], [fx + 18, 0.39], [fx - 6, 0.52], [fx - 30, 0.4], [fx - 52, 0.49], [fx - 74, 0.38], [sol, 0.47]];
    for (const [x, y] of dis) ctx.lineTo(x, H * y);
    ctx.lineTo(sol - 30, H * alt); ctx.lineTo(0, H * alt); ctx.closePath(); ctx.fill();
    if (g.serit) {
      ctx.fillStyle = g.serit;
      ctx.beginPath(); ctx.moveTo(fx + 40, 0); ctx.lineTo(fx + 60, 0); ctx.lineTo(fx + 44, H * 0.5); ctx.lineTo(fx + 34, H * 0.44); ctx.closePath(); ctx.fill();
    }
    if (g.mekanik) {
      // şakakta küçük mekanik detay (yüzün sol yanı)
      ctx.fillStyle = '#9aa0a8'; ctx.fillRect(fx - 92, H * 0.5, 18, 26);
      ctx.fillStyle = '#c87533'; ctx.beginPath(); ctx.arc(fx - 83, H * 0.5 + 13, 4, 0, Math.PI * 2); ctx.fill();
    }
    ciz(ctx, fx, H * 0.6, 1.0, o, g);
  }

  /** Robotun yüz ekranı (ortalanmış) */
  function robotEkran(canvas, o, g) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#10141c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    robotYuz(ctx, canvas.width / 2, canvas.height * 0.42, canvas.height / 110, o, g);
  }

  window.Yuz = { ciz, kafaDokusu, robotEkran, koyu };
})();
