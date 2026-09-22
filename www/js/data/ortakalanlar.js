/* ORTAK ALANLAR
   =============
   Lonca'daki odalar artık karakterlere değil, EVE ait — yani sabit.
   Herkes (kullanıcı + tüm karakterler) bu odalarda buluşup konuşabilir.
   Karakterlerin kendi kişisel (bire bir) odaları ayrı ve app.js'de
   KARAKTERLER listesinden otomatik oluşuyor — bu dosya sadece ortak
   alanları tanımlar.

   Her odanın isteğe bağlı bir "icerik" alanı olabilir — bu, odanın
   sadece sohbetten ibaret olmayıp kendine özgü bir liste tuttuğunu
   gösterir (ör. Kütüphane'de kitaplar, Mutfak'ta tarifler). "icerik"
   yoksa (örn. Salon) oda sade bir sohbet alanı olarak kalır.

   icerik şu alanlara sahip olabilir:
   {
     baslikTekil: "Kitap",              // liste ekranının başlığı + tekil isim
     turSecenekleri: ["tıp","bilim"],   // opsiyonel, tek seçim çip grubu
     durumSecenekleri: ["okunacak",...],// opsiyonel, tek seçim çip grubu
     ekstraAlanEtiketi: "Yazar",        // opsiyonel, serbest metin ek alan
     zamanlayici: true                  // opsiyonel, sadece Çalışma Odası'nda basit sayaç gösterir
   }
*/

export const ORTAK_ALANLAR = [
  {
    id: "salon",
    isim: "Salon",
    renk: "#4FF3E0",
    ikon: '<circle cx="9" cy="9" r="3"></circle><path d="M4 19c0-3 2.3-5.2 5-5.2s5 2.2 5 5.2"></path><circle cx="17.3" cy="10" r="2.3"></circle><path d="M14.7 19c.3-2.1 1.6-3.5 3-3.9"></path>',
    aciklama: "Ortak alan, herkes burada takılır",
    ortamMetni: "Şu an Salon'dasın — evin herkesin bir arada takıldığı ortak oturma alanı. Sohbet gündelik ve rahat olabilir."
  },
  {
    id: "mutfak",
    isim: "Mutfak",
    renk: "#4ADE80",
    ikon: '<path d="M6 3v6a2 2 0 0 0 2 2v10M6 3v0M8 3v6M10 3v6"></path><path d="M16 3c-1.7 0-3 1.6-3 4.5S14.3 12 16 12v9"></path>',
    aciklama: "Yemek, atıştırmalık ve sohbet",
    ortamMetni: "Şu an Mutfak'tasın. Burası hem eğlenceli sohbetlerin hem de tarif/fikir üretiminin yapıldığı bir yer. Yemek, tarif ya da yeni fikirlerden doğal şekilde bahsedebilirsin.",
    icerik: {
      baslikTekil: "Tarif/Fikir",
      turSecenekleri: ["tarif", "fikir"]
    }
  },
  {
    id: "calisma-odasi",
    isim: "Çalışma Odası",
    renk: "#4CC9F0",
    ikon: '<rect x="4" y="5" width="16" height="11" rx="1.5"></rect><path d="M2 20h20M9 20l1-4h4l1 4"></path>',
    aciklama: "Ders çalışma ve odaklanma",
    ortamMetni: "Şu an Çalışma Odası'ndasın — ders çalışmaya ve odaklanmaya ayrılmış bir alan. Ders, konu ve çalışma disiplininden bahsedebilirsin.",
    icerik: {
      baslikTekil: "Ders/Konu",
      durumSecenekleri: ["çalışılacak", "çalışılıyor", "bitti"],
      zamanlayici: true
    }
  },
  {
    id: "atolye",
    isim: "Atölye",
    renk: "#E15AFF",
    ikon: '<path d="M15.5 4.5a7.5 7.5 0 1 0 4 13.5 9 9 0 0 1-4-13.5z"></path>',
    aciklama: "Bilimsel/tıbbi araştırma takibi",
    ortamMetni: "Şu an Atölye'desin — tıp ve bilimle ilgili araştırma ve çalışmaların takip edildiği, listelendiği bir alan. Meraklı ve bilgilendirici bir tonda konuşabilirsin.",
    icerik: {
      baslikTekil: "Araştırma",
      turSecenekleri: ["tıp", "bilim", "diğer"],
      durumSecenekleri: ["devam ediyor", "tamamlandı"]
    }
  },
  {
    id: "kutuphane",
    isim: "Kütüphane",
    renk: "#B983FF",
    ikon: '<path d="M4 4h4v16H4zM10 4h4v16h-4zM16 5l3-1 2 15-3 1z"></path>',
    aciklama: "Kitaplık ve okuma kayıtları",
    ortamMetni: "Şu an Kütüphane'desin — kitaplar ve okuma kayıtlarının tutulduğu alan. Bilgilendirici ama sıcak bir ton kullanabilirsin.",
    icerik: {
      baslikTekil: "Kitap",
      durumSecenekleri: ["okunacak", "okunuyor", "bitti"],
      ekstraAlanEtiketi: "Yazar"
    }
  },
  {
    id: "sanat-odasi",
    isim: "Sanat Odası",
    renk: "#FF6B81",
    ikon: '<circle cx="12" cy="12" r="8.5"></circle><circle cx="9" cy="10" r="1"></circle><circle cx="13" cy="8.5" r="1"></circle><circle cx="15.5" cy="12.5" r="1"></circle>',
    aciklama: "Şiir, roman, resim ve müzik fikirleri",
    ortamMetni: "Şu an Sanat Odası'ndasın — şiir, roman, resim ve müzik gibi yaratıcı çalışmaların üretildiği alan.",
    icerik: {
      baslikTekil: "Eser",
      turSecenekleri: ["şiir", "roman", "resim fikri", "müzik fikri"]
    }
  },
  {
    id: "film-odasi",
    isim: "Film Odası",
    renk: "#FFD166",
    ikon: '<rect x="3" y="6" width="18" height="12" rx="1.5"></rect><path d="M8 6 6 3M13 6l-1.5-3M18 6l-1.5-3"></path>',
    aciklama: "Senaryo ve video fikri atölyesi",
    ortamMetni: "Şu an Film Odası'ndasın — senaryo ve video fikirlerinin geliştirildiği bir atölye.",
    icerik: {
      baslikTekil: "Senaryo/Video",
      turSecenekleri: ["senaryo", "video fikri"]
    }
  }
];
