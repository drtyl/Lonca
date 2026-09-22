/* ========================================================
   native/notifications.js
   Bildirim soyutlama katmanı — notification.local(...) ve
   notification.pushAltyapisiniBaslat(...) diye ikiye ayrılıyor:

   1) LOKAL bildirimler (@capacitor/local-notifications): uygulama
      arka plandayken bile telefonun kendisi tetikler, sunucu/gizli
      anahtar GEREKTİRMEZ. "Karakterin sana bir şey söylemek istiyor"
      ve çalışma zamanlayıcısı bunu kullanır.

   2) OneSignal (@onesignal/capacitor-plugin): cihazı push almaya
      hazırlar (App ID Ayarlar'dan giriliyor, kaynak kodda GÖMÜLÜ
      DEĞİL). Gerçek bir push GÖNDERMEK için OneSignal'ın gizli REST
      anahtarı gerekir — bu anahtar bilerek bu projeye hiç girilmedi
      (istemciye asla gömülmemeli). Şimdilik altyapı hazır; bir
      push'u tetiklemek OneSignal panelinden ya da ileride ayrı bir
      sunucudan yapılabilir.
   ======================================================== */

function eklentiler() {
  return (typeof window !== "undefined" && window.Capacitor && window.Capacitor.Plugins) || null;
}
function nativeMi() {
  return !!(typeof window !== "undefined" && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
}

let localIdSayaci = 1;

/** Hemen ya da kısa bir gecikmeyle telefonun bildirim çubuğuna bir bildirim düşürür. */
export async function local(baslik, govde, gecikmeSaniye = 0) {
  const eklenti = eklentiler();
  if (nativeMi() && eklenti?.LocalNotifications) {
    try {
      const izin = await eklenti.LocalNotifications.checkPermissions();
      if (izin.display !== "granted") await eklenti.LocalNotifications.requestPermissions();
      await eklenti.LocalNotifications.schedule({
        notifications: [{
          id: localIdSayaci++,
          title: baslik,
          body: govde,
          schedule: gecikmeSaniye > 0 ? { at: new Date(Date.now() + gecikmeSaniye * 1000) } : undefined
        }]
      });
      return true;
    } catch (hata) {
      console.error("Yerel bildirim gönderilemedi:", hata);
      return false;
    }
  }
  return false; // Tarayıcıda/native olmayan ortamda sessizce atla — uygulamayı bozma.
}

/** OneSignal'ı başlatır (App ID Ayarlar'dan gelir). Sadece native ortamda çalışır. */
export async function pushAltyapisiniBaslat(appId) {
  const eklenti = eklentiler();
  if (!nativeMi() || !eklenti?.OneSignal || !appId) return false;
  try {
    eklenti.OneSignal.initialize(appId);
    await eklenti.OneSignal.Notifications.requestPermission(true);
    return true;
  } catch (hata) {
    console.error("OneSignal başlatılamadı:", hata);
    return false;
  }
}

export const notifications = { local, pushAltyapisiniBaslat };
