/* ========================================================
   js/app.js — GİRİŞ NOKTASI
   Bu dosya index.html tarafından tek <script type="module"> olarak
   yükleniyor. Görevi: tüm modülleri içeri alıp (bu, her modülün
   kendi event listener'larını bağlamasını sağlar) ve uygulamayı
   ilk durumuna getirmek.
   ======================================================== */

import "./ui/screens.js";
import "./ui/kamera.js";
import "./ui/chat.js";
import "./ui/icerik.js";
import "./ui/wizard.js";
import "./ui/karakterProfili.js";
import "./ui/gorevler.js";
import "./ui/arama.js";
import "./ui/ayarlar.js";
import "./ui/gelistirme.js";

import { odaListesiniOlustur, ortakAlanIzgarasiniOlustur } from "./ui/ev.js";
import { gorevleriCiz, hesapVermeKontrolunuYap } from "./ui/gorevler.js";
import { proaktifDenemesiYap } from "./ui/proaktif.js";
import { getAyar } from "./core/state.js";
import { notifications } from "./native/notifications.js";

ortakAlanIzgarasiniOlustur();
odaListesiniOlustur();
gorevleriCiz();
proaktifDenemesiYap();
hesapVermeKontrolunuYap();

const oneSignalAppId = getAyar("oneSignalAppId");
if (oneSignalAppId) notifications.pushAltyapisiniBaslat(oneSignalAppId);
