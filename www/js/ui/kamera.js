/* ========================================================
   ui/kamera.js
   Sohbete fotoğraf çekip eklemek için basit kamera akışı
   (getUserMedia — hem tarayıcıda hem native WebView'da çalışır).
   ======================================================== */

import { bildirimGoster } from "./screens.js";

const kameraOverlay = document.getElementById("kamera-overlay");
const kameraVideo = document.getElementById("kamera-video");
const kameraCanvas = document.getElementById("kamera-canvas");
const kameraCekButonu = document.getElementById("kamera-cek-butonu");
const kameraKapatButonu = document.getElementById("kamera-kapat-butonu");

let kameraAkisi = null;
let kameraHedefi = null;

export function kameraHedefiniAyarla(hedef) {
  kameraHedefi = hedef;
}

export async function kamerayiAc() {
  try {
    kameraAkisi = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    kameraVideo.srcObject = kameraAkisi;
    kameraOverlay.hidden = false;
  } catch (hata) {
    bildirimGoster("Kameraya erişilemedi. İzin verdiğinden emin ol.");
  }
}

export function kamerayiKapat() {
  if (kameraAkisi) kameraAkisi.getTracks().forEach((t) => t.stop());
  kameraAkisi = null;
  kameraOverlay.hidden = true;
}

async function fotografCek() {
  if (!kameraAkisi || !kameraHedefi) return;

  kameraCanvas.width = kameraVideo.videoWidth;
  kameraCanvas.height = kameraVideo.videoHeight;
  kameraCanvas.getContext("2d").drawImage(kameraVideo, 0, 0);

  const veriUrl = kameraCanvas.toDataURL("image/jpeg", 0.85);
  const hedef = kameraHedefi;
  kamerayiKapat();

  const { fotografGonderildi } = await import("./chat.js");
  fotografGonderildi(hedef, veriUrl);
}

kameraCekButonu.addEventListener("click", fotografCek);
kameraKapatButonu.addEventListener("click", kamerayiKapat);
