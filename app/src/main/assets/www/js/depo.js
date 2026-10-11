/* Depo: evin dosya sistemi.
 * Telefonda: native köprü (LoncaNative) → gerçek dosyalar, uygulamanın kendi depolamasında.
 * Tarayıcıda deneme: localStorage içinde sahte bir dosya sistemi.
 * Tüm yollar "/" ile başlar, örn. "/ev/esyalar.json".
 */
(function () {
  const N = window.LoncaNative || null;

  // ---- yardımcılar
  function norm(p) {
    p = ('/' + (p || '')).replace(/\/+/g, '/');
    const parts = [];
    for (const s of p.split('/')) {
      if (!s || s === '.') continue;
      if (s === '..') parts.pop(); else parts.push(s);
    }
    return '/' + parts.join('/');
  }
  function utf8ToB64(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function b64ToUtf8(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  const MIME = {
    html: 'text/html', htm: 'text/html', css: 'text/css', js: 'text/javascript', json: 'application/json',
    txt: 'text/plain', md: 'text/markdown', svg: 'image/svg+xml', xml: 'text/xml', csv: 'text/csv',
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', mp4: 'video/mp4', pdf: 'application/pdf'
  };
  const METIN = ['html', 'htm', 'css', 'js', 'json', 'txt', 'md', 'svg', 'xml', 'csv', 'kt', 'java', 'py', 'ts', 'yml', 'yaml', 'ini', 'log'];
  function uzanti(p) { const m = /\.([^./]+)$/.exec(p); return m ? m[1].toLowerCase() : ''; }
  function mime(p) { return MIME[uzanti(p)] || 'application/octet-stream'; }
  function metinMi(p) { return METIN.includes(uzanti(p)) || !uzanti(p); }
  function resimMi(p) { return /^image\//.test(mime(p)); }

  function cevap(json) {
    const r = JSON.parse(json);
    if (!r.ok) throw new Error(r.error || 'Depo hatası');
    return r.data;
  }

  // ---- tarayıcı yedeği (localStorage)
  const LS = 'lfs:';
  const yerel = {
    list(p) {
      p = norm(p); const on = p === '/' ? '/' : p + '/';
      const seen = new Map();
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k.startsWith(LS)) continue;
        const yol = k.slice(LS.length);
        if (!yol.startsWith(on) || yol === on) continue;
        const kalan = yol.slice(on.length).replace(/\/$/, '');
        if (!kalan) continue;
        const ad = kalan.split('/')[0];
        const dir = kalan.includes('/') || yol.endsWith('/');
        if (!seen.has(ad) || dir) {
          let size = 0;
          if (!dir) { try { const v = JSON.parse(localStorage.getItem(k)); size = v.b64 ? Math.floor(v.b64.length * 3 / 4) : (v.text || '').length; } catch (e) {} }
          seen.set(ad, { name: ad, dir, size, mtime: 0 });
        }
      }
      return [...seen.values()].sort((a, b) => (b.dir - a.dir) || a.name.localeCompare(b.name, 'tr'));
    },
    exists(p) {
      p = norm(p);
      if (localStorage.getItem(LS + p) !== null || localStorage.getItem(LS + p + '/') !== null) return true;
      for (let i = 0; i < localStorage.length; i++) if (localStorage.key(i).startsWith(LS + p + '/')) return true;
      return false;
    },
    get(p) { const v = localStorage.getItem(LS + norm(p)); if (v === null) throw new Error('Dosya yok: ' + p); return JSON.parse(v); },
    read(p) { const v = yerel.get(p); return v.text !== undefined ? v.text : b64ToUtf8(v.b64); },
    readB64(p) { const v = yerel.get(p); return v.b64 !== undefined ? v.b64 : utf8ToB64(v.text); },
    write(p, text) { localStorage.setItem(LS + norm(p), JSON.stringify({ text })); },
    writeB64(p, b64) { localStorage.setItem(LS + norm(p), JSON.stringify({ b64 })); },
    mkdir(p) { localStorage.setItem(LS + norm(p) + '/', '{"dir":1}'); },
    remove(p) {
      p = norm(p);
      const sil = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k === LS + p || k.startsWith(LS + p + '/')) sil.push(k);
      }
      sil.forEach(k => localStorage.removeItem(k));
    },
    rename(a, b) {
      a = norm(a); b = norm(b);
      const tasi = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k === LS + a || k.startsWith(LS + a + '/')) tasi.push(k);
      }
      tasi.forEach(k => { const v = localStorage.getItem(k); localStorage.removeItem(k); localStorage.setItem(LS + b + k.slice((LS + a).length), v); });
    }
  };

  // ---- ortak arayüz
  const Depo = {
    native: !!N,
    norm, utf8ToB64, b64ToUtf8, mime, metinMi, resimMi, uzanti,

    liste(p) { return N ? cevap(N.list(norm(p))) : yerel.list(p); },
    var(p) { return N ? N.exists(norm(p)) : yerel.exists(p); },
    oku(p) { try { return N ? cevap(N.read(norm(p))) : yerel.read(p); } catch (e) { return null; } },
    okuB64(p) { try { return N ? cevap(N.readBase64(norm(p))) : yerel.readB64(p); } catch (e) { return null; } },
    yaz(p, text) { N ? cevap(N.write(norm(p), String(text))) : yerel.write(p, String(text)); },
    yazB64(p, b64) { N ? cevap(N.writeBase64(norm(p), b64)) : yerel.writeB64(p, b64); },
    klasor(p) { N ? cevap(N.mkdir(norm(p))) : yerel.mkdir(p); },
    sil(p) { if (norm(p) === '/') throw new Error('Kök silinemez'); N ? cevap(N.remove(norm(p))) : yerel.remove(p); },
    tasi(a, b) { N ? cevap(N.rename(norm(a), norm(b))) : yerel.rename(a, b); },

    okuJSON(p, yedek) {
      const t = Depo.oku(p);
      if (t === null) return yedek;
      try { return JSON.parse(t); } catch (e) { return yedek; }
    },
    yazJSON(p, obj) { Depo.yaz(p, JSON.stringify(obj, null, 2)); },
    dataURL(p) { const b = Depo.okuB64(p); return b === null ? null : 'data:' + Depo.mime(p) + ';base64,' + b; },

    /* İnternet isteği. Telefonda native üzerinden (CORS derdi yok), tarayıcıda fetch. */
    http({ url, method = 'POST', headers = {}, body = '' }) {
      if (!N) {
        return fetch(url, { method, headers, body: method === 'GET' ? undefined : body })
          .then(async r => ({ status: r.status, text: await r.text() }))
          .catch(e => ({ status: 0, text: String(e) }));
      }
      return new Promise(res => {
        const id = 'h' + Date.now() + Math.random().toString(36).slice(2);
        Depo._bekleyen[id] = res;
        N.http(id, url, method, JSON.stringify(headers), body);
      });
    },
    _bekleyen: {}
  };

  window.__loncaHttpDone = function (id, status, b64) {
    const f = Depo._bekleyen[id];
    delete Depo._bekleyen[id];
    if (f) f({ status, text: b64ToUtf8(b64) });
  };

  window.Depo = Depo;
})();
