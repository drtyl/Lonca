/* ========================================================
   scripts/patch-android-manifest.js
   android/ klasörü her derlemede sıfırdan oluşturuluyor (bkz.
   .github/workflows/android-build.yml), bu yüzden native izin
   ihtiyaçlarını elle bir kere düzenleyip commit'lemek yerine, her
   derlemede otomatik olarak bu script ile ekliyoruz. İdempotent —
   zaten varsa tekrar eklemez, defalarca çalıştırılabilir.
   ======================================================== */

const fs = require("fs");
const path = require("path");

const MANIFEST_YOLU = path.join(__dirname, "..", "android", "app", "src", "main", "AndroidManifest.xml");

const EKLENECEK_IZINLER = [
  '<uses-permission android:name="android.permission.RECORD_AUDIO" />',
  '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />'
];

/* Android 11+ (targetSdk 30+) uygulamaların, cihazdaki TTS servisini
   görebilmesi için bunu açıkça istemesi gerekiyor — yoksa
   getSupportedVoices()/speak() sessizce boş dönebiliyor. */
const EKLENECEK_QUERIES =
  "<queries>\n" +
  '    <intent>\n' +
  '      <action android:name="android.intent.action.TTS_SERVICE" />\n' +
  "    </intent>\n" +
  "  </queries>";

function calistir() {
  if (!fs.existsSync(MANIFEST_YOLU)) {
    console.error("AndroidManifest.xml bulunamadı, önce 'npx cap sync android' çalışmış olmalı:", MANIFEST_YOLU);
    process.exit(1);
  }

  let icerik = fs.readFileSync(MANIFEST_YOLU, "utf8");
  const manifestAcilisEslemesi = icerik.match(/<manifest[^>]*>/);
  if (!manifestAcilisEslemesi) {
    console.error("AndroidManifest.xml beklenen <manifest> etiketini içermiyor, atlandı.");
    process.exit(1);
  }
  const eklemeNoktasi = manifestAcilisEslemesi.index + manifestAcilisEslemesi[0].length;

  let eklenecekMetin = "";
  EKLENECEK_IZINLER.forEach((satir) => {
    if (!icerik.includes(satir)) eklenecekMetin += "\n  " + satir;
  });
  if (!icerik.includes('android.intent.action.TTS_SERVICE')) {
    eklenecekMetin += "\n  " + EKLENECEK_QUERIES;
  }

  if (!eklenecekMetin) {
    console.log("AndroidManifest.xml zaten güncel, eklenecek bir şey yok.");
    return;
  }

  icerik = icerik.slice(0, eklemeNoktasi) + eklenecekMetin + icerik.slice(eklemeNoktasi);
  fs.writeFileSync(MANIFEST_YOLU, icerik, "utf8");
  console.log("AndroidManifest.xml güncellendi:\n" + eklenecekMetin);
}

calistir();
