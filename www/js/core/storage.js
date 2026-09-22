/* ========================================================
   core/storage.js
   Telefon hafızasına (localStorage) okuma/yazma için tek nokta.
   Her yerde try/catch ile korunuyor çünkü bazı ortamlarda
   (gizli sekme, kota dolması vb.) bu başarısız olabilir.
   ======================================================== */

export const ANAHTARLAR = {
  KARAKTERLER: "lonca-karakterler",
  MESAJLAR: "lonca-mesajlar",
  GOREVLER: "lonca-gorevler",
  GROQ_ANAHTARI: "lonca-api-anahtari",
  GITHUB_ANAHTARI: "lonca-github-anahtari",
  ONESIGNAL_APP_ID: "lonca-onesignal-app-id",
  ICERIKLER: "lonca-oda-icerikleri",
  ARASTIRMA_ONBELLEGI: "lonca-arastirma-onbellegi",
  OGRENME_GUNLUGU: "lonca-ogrenme-gunlugu",
  GELISTIRME_ONERILERI: "lonca-gelistirme-onerileri",
  AYARLAR: "lonca-ayarlar",
  SEMA_SURUMU: "lonca-sema-surumu"
};

/* Bu, storage şemasının "sürümü" — ileride veri modelini değiştirirsek
   bu sayıyı artırıp goc() içine bir geçiş adımı ekleriz. Eski kullanıcı
   verisi hiçbir zaman silinmez, sadece eksik alanlar tamamlanır. */
export const GUNCEL_SEMA_SURUMU = 2;

export function depoyaYaz(anahtar, veri) {
  try {
    localStorage.setItem(anahtar, JSON.stringify(veri));
    return true;
  } catch (hata) {
    console.error("Hafızaya yazılamadı:", anahtar, hata);
    return false;
  }
}

export function depodanOku(anahtar) {
  try {
    const ham = localStorage.getItem(anahtar);
    return ham ? JSON.parse(ham) : null;
  } catch (hata) {
    console.error("Hafızadan okunamadı:", anahtar, hata);
    return null;
  }
}

export function saatOlustur() {
  return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(new Date());
}

export function simdi() {
  return new Date().toISOString();
}

export function derinKopya(deger) {
  return JSON.parse(JSON.stringify(deger));
}

/* Storage şemasının sürümünü kontrol eder; eski/yeni fark varsa da
   burada bir geçiş adımı çalıştırılabilir (şimdilik sadece kayıt). */
export function semaGocunuCalistir() {
  const mevcutSurum = depodanOku(ANAHTARLAR.SEMA_SURUMU) || 1;
  if (mevcutSurum < GUNCEL_SEMA_SURUMU) {
    // v1 -> v2: karakter/hafıza/ilişki/iç-durum alanları eklendi.
    // Bu alanlar state.js içinde karakterSemayaGoreTamamla() ile
    // her karakter yüklenirken otomatik tamamlanıyor, burada ekstra
    // bir dönüştürme gerekmiyor — sadece sürüm numarasını güncelliyoruz.
    depoyaYaz(ANAHTARLAR.SEMA_SURUMU, GUNCEL_SEMA_SURUMU);
  }
}
