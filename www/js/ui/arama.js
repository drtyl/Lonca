/* ========================================================
   ui/arama.js
   Karakterler ve görevler içinde basit metin araması.
   ======================================================== */

import { tumKarakterler, tumGorevler } from "../core/state.js";
import { avatarIcerigi } from "./avatar.js";
import { ekranAc } from "./screens.js";
import { odayiAc } from "./chat.js";

const aramaInput = document.getElementById("arama-input");
const aramaSonuclari = document.getElementById("arama-sonuclari");
const aramaBosMetni = document.getElementById("arama-bos");

aramaInput.addEventListener("input", () => {
  const sorgu = aramaInput.value.trim().toLocaleLowerCase("tr");
  aramaSonuclari.innerHTML = "";

  if (!sorgu) {
    aramaBosMetni.hidden = false;
    aramaBosMetni.textContent = "Aramak istediğin kelimeyi yaz.";
    return;
  }

  const karakterSonuclari = tumKarakterler().filter((k) =>
    k.isim.toLocaleLowerCase("tr").includes(sorgu) ||
    k.uslup.toLocaleLowerCase("tr").includes(sorgu) ||
    k.durum.toLocaleLowerCase("tr").includes(sorgu)
  );
  const gorevSonuclari = tumGorevler().filter((g) => g.metin.toLocaleLowerCase("tr").includes(sorgu));

  if (karakterSonuclari.length === 0 && gorevSonuclari.length === 0) {
    aramaBosMetni.hidden = false;
    aramaBosMetni.textContent = "Sonuç bulunamadı.";
    return;
  }
  aramaBosMetni.hidden = true;

  karakterSonuclari.forEach((karakter) => {
    const satir = document.createElement("a");
    satir.href = "#";
    satir.className = "arama-sonuc";
    satir.innerHTML = `
      <span class="oda-avatar" style="width:34px;height:34px;background:${karakter.renk}1F;color:${karakter.renk};overflow:hidden;">${avatarIcerigi(karakter.id)}</span>
      <span>${karakter.isim}</span>
      <span class="arama-sonuc-etiket">Karakter</span>
    `;
    satir.addEventListener("click", (event) => {
      event.preventDefault();
      odayiAc(karakter.id);
    });
    aramaSonuclari.appendChild(satir);
  });

  gorevSonuclari.forEach((gorev) => {
    const satir = document.createElement("a");
    satir.href = "#";
    satir.className = "arama-sonuc";
    satir.innerHTML = `<span>${gorev.metin}</span><span class="arama-sonuc-etiket">Görev</span>`;
    satir.addEventListener("click", (event) => {
      event.preventDefault();
      ekranAc("gorevler");
    });
    aramaSonuclari.appendChild(satir);
  });
});
