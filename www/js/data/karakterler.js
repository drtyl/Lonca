/* ÖRNEK KARAKTER
   ==============
   ÖNEMLİ: Bu artık uygulamanın gerçek karakter listesi DEĞİL.
   Uygulama ilk kez açıldığında Ev ekranını boş göstermemek için
   kullanılan TEK bir "örnek/öneri" karakteri. Kullanıcı bunu silebilir
   ve kendi karakterlerini Ev ekranındaki "+ Yeni Karakter" ile,
   uygulama içindeki sihirbazdan (fotoğraf, kişilik soruları vb.) ekler.
   En fazla 10 karakter olabilir (bkz. app.js → KARAKTER_LIMITI).

   NOT: Odalar artık karaktere değil eve ait (Salon, Mutfak, Atölye vb. —
   bkz. ortakalanlar.js). Bu yüzden karakterlerin kendine ait bir "durum"
   metni olsa da artık belirli bir odayla ilişkilendirilmiyor.

   Gerçek, güncel karakter listesi app.js içinde `KARAKTERLER` değişkeninde
   tutulur ve telefonun hafızasına (localStorage) kaydedilir — bu dosyayı
   elle düzenlemene artık gerek yok.

   Aşağıdaki obje şu alanlara sahip:
   {
     id: "kisaisim",              // benzersiz, küçük harf, boşluksuz
     isim: "Görünen İsim",
     renk: "#RRGGBB",             // karakterin neon rengi
     harf: "İ",                   // simge/simgeUrl yoksa avatar dairesindeki baş harf
     simge: "",                   // opsiyonel: küçük bir SVG ikonu (iç path/shape), boş bırakılırsa harf kullanılır
     simgeUrl: "",                // opsiyonel: kullanıcının galeriden seçtiği profil fotoğrafı (base64)
     uslup: "kişiliği kısaca",    // API'ye kişilik olarak verilir
     hitap: "Doktor bey",         // karakterin kullanıcıya hitap şekli
     durum: "Şu an ne yapıyor",   // oda kartında görünen tek satır
     karsilamaMesaji: "Karakterin odaya girince söylediği ilk şey"
   }
*/

export const ORNEK_KARAKTERLER = [
  {
    id: "atlas",
    isim: "Atlas",
    renk: "#4CC9F0",
    harf: "A",
    /* simge: karakterin görsel işareti (gerçek bir profil fotoğrafın olunca
       simgeUrl alanına dosya yolunu yazman yeterli, o zaman bu simge yerine
       fotoğraf kullanılır). */
    simge: '<circle cx="12" cy="12" r="7"></circle><path d="M12 8.5 14 12l-2 3.5-2-3.5z"></path>',
    simgeUrl: "",
    uslup: "sakin, düşünceli, bilgi verici",
    hitap: "Sen",
    durum: "Şu an müsait, seninle sohbete hazır",
    karsilamaMesaji: "Selam. Bir şey mi araştırıyorduk?"
  }
];

