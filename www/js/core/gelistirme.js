/* ========================================================
   core/gelistirme.js
   GitHub API ile konuşan, ham/teknik katman. "Geliştirme İste"
   özelliğinin GitHub'a dosya yazma/PR açma/onaylama kısmı burada.
   Anahtar (githubAnahtari) ve repo adı (githubRepo, "kullanici/repo"
   formatında) Ayarlar'dan gelir — kaynak koduna hiç gömülü değil.
   ======================================================== */

import { getAyar } from "./state.js";

const API_KOKU = "https://api.github.com";
const DAL_ONEKI = "lonca-gelistirme/";
const PR_ETIKETI = "[Lonca Geliştirme] ";

function ayarlariKontrolEt() {
  const anahtar = getAyar("githubAnahtari");
  const repo = getAyar("githubRepo");
  if (!anahtar || !repo) {
    const hata = new Error("Önce Ayarlar'dan GitHub erişim anahtarını ve repo adını gir.");
    hata.kod = "AYAR_YOK";
    throw hata;
  }
  return { anahtar, repo };
}

async function istekAt(yol, secenekler = {}) {
  const { anahtar } = ayarlariKontrolEt();
  const cevap = await fetch(API_KOKU + yol, {
    ...secenekler,
    headers: {
      Authorization: `Bearer ${anahtar}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      ...(secenekler.headers || {})
    }
  });
  if (!cevap.ok) {
    const govde = await cevap.text().catch(() => "");
    if (cevap.status === 401) throw new Error("GitHub erişim anahtarı geçersiz görünüyor.");
    if (cevap.status === 404) throw new Error("Repo veya dosya bulunamadı — repo adını (kullanıcı/repo) kontrol et.");
    if (cevap.status === 403) throw new Error("Bu anahtarın yetkisi yetersiz (izinleri kontrol et) ya da GitHub'ın istek limiti doldu.");
    throw new Error(`GitHub isteği başarısız (${cevap.status}): ${govde.slice(0, 200)}`);
  }
  if (cevap.status === 204) return null;
  return cevap.json();
}

function base64Encode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function base64Decode(b64) {
  return decodeURIComponent(escape(atob(b64)));
}

/** Bir dosyanın ana daldaki (main) güncel içeriğini ve sha'sını getirir. Yoksa null döner. */
export async function dosyaGetir(yol) {
  const { repo } = ayarlariKontrolEt();
  try {
    const veri = await istekAt(`/repos/${repo}/contents/${encodeURIComponent(yol)}`);
    return { icerik: base64Decode(veri.content.replace(/\n/g, "")), sha: veri.sha };
  } catch (hata) {
    if (hata.message.includes("bulunamadı")) return null;
    throw hata;
  }
}

/** main'in güncel commit'inden yeni bir dal açar. */
async function dalOlustur(dalAdi) {
  const { repo } = ayarlariKontrolEt();
  const anaDal = await istekAt(`/repos/${repo}/git/ref/heads/main`);
  await istekAt(`/repos/${repo}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${dalAdi}`, sha: anaDal.object.sha })
  });
}

/** Bir dosyayı belirtilen dalda günceller (yoksa oluşturur). */
async function dosyaGuncelle(dalAdi, yol, yeniIcerik, mesaj, sha) {
  const { repo } = ayarlariKontrolEt();
  await istekAt(`/repos/${repo}/contents/${encodeURIComponent(yol)}`, {
    method: "PUT",
    body: JSON.stringify({
      message: mesaj,
      content: base64Encode(yeniIcerik),
      branch: dalAdi,
      ...(sha ? { sha } : {})
    })
  });
}

/**
 * Bir öneriyi uçtan uca GitHub'a işler: dal açar, değişen dosyaları commit'ler, PR açar.
 * @param {{istek:string, aciklama:string, degisiklikler:Array<{yol:string, yeniIcerik:string, sha:string|null}>}} veri
 * @returns {Promise<{prNo:number, prUrl:string}>}
 */
export async function oneriyiGonder(veri) {
  const { repo } = ayarlariKontrolEt();
  const dalAdi = DAL_ONEKI + Date.now().toString(36);

  await dalOlustur(dalAdi);
  for (const d of veri.degisiklikler) {
    await dosyaGuncelle(dalAdi, d.yol, d.yeniIcerik, `Lonca: ${veri.istek.slice(0, 60)}`, d.sha);
  }

  const pr = await istekAt(`/repos/${repo}/pulls`, {
    method: "POST",
    body: JSON.stringify({
      title: PR_ETIKETI + veri.istek.slice(0, 70),
      head: dalAdi,
      base: "main",
      body: `**İstek:** ${veri.istek}\n\n**Ne yapıldı:** ${veri.aciklama}\n\n_Bu PR, Lonca'nın "Geliştirme İste" özelliği tarafından otomatik açıldı._`
    })
  });

  return { prNo: pr.number, prUrl: pr.html_url };
}

/** Bir PR'ın dosya bazlı değişiklik özetini (diff) getirir. */
export async function prDiffGetir(prNo) {
  const { repo } = ayarlariKontrolEt();
  const dosyalar = await istekAt(`/repos/${repo}/pulls/${prNo}/files`);
  return dosyalar.map((d) => ({ yol: d.filename, eklenen: d.additions, silinen: d.deletions, yama: d.patch || "" }));
}

/** PR'ı birleştirir (onaylandı, uygulanacak). */
export async function prOnayla(prNo) {
  const { repo } = ayarlariKontrolEt();
  await istekAt(`/repos/${repo}/pulls/${prNo}/merge`, {
    method: "PUT",
    body: JSON.stringify({ merge_method: "squash" })
  });
}

/** PR'ı kapatır, dalını siler (reddedildi). */
export async function prReddet(prNo, dalAdi) {
  const { repo } = ayarlariKontrolEt();
  await istekAt(`/repos/${repo}/pulls/${prNo}`, { method: "PATCH", body: JSON.stringify({ state: "closed" }) });
  if (dalAdi) {
    try { await istekAt(`/repos/${repo}/git/refs/heads/${dalAdi}`, { method: "DELETE" }); } catch (hata) { /* önemli değil */ }
  }
}

export const gelistirme = { dosyaGetir, oneriyiGonder, prDiffGetir, prOnayla, prReddet };
