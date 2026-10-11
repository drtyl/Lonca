/* Lonca'nın karakter kadrosu (10 yer). Görünüşler kullanıcının tariflerinden.
 * Kişilikler şimdilik kısa yer tutucular; Atölye'den değiştirilebilir.
 *
 * gorunum alanları (hazır 3D beden bunlarla çizilir):
 *   sac, sacStil (kisa|daginik|dalgali|toplu|orgulu|kedi), serit (tutam rengi), goz, ten,
 *   ust, alt, ayakkabi, kulak (insan|elf|kedi), kuyruk, mekanik, cil, boy, omuz, robot
 */
window.KARAKTERLER = [
  {
    id: 'atlas', ad: 'Atlas', tur: 'İnsan', cinsiyet: 'Erkek',
    tarif: 'Uzun, geniş omuzlu; kısa koyu kahverengi saç, ela gözler. Lacivert tişört, koyu pantolon.',
    gorunum: { sac: '#3b2a20', sacStil: 'kisa', goz: '#8a6d3b', ten: '#f0c8a8', ust: '#22325e', alt: '#2a2a33', ayakkabi: '#1d1d22', boy: 1.08, omuz: 1.15 },
    kisilik: 'Sakin, güvenilir ve dürüst. Kısa ve net konuşur.', ses: { perde: 0.85, hiz: 0.98 }
  },
  {
    id: 'nova', ad: 'Nova', tur: 'İnsan', cinsiyet: 'Kadın',
    tarif: 'Gümüş, omuz hizasında dalgalı saç; mor tutam, mor eşkenar dörtgen toka, mor gözler. Mor kısa tişört, koyu gri kumaş pantolon, beyaz spor ayakkabı.',
    gorunum: { sac: '#d8d6dc', sacStil: 'dalgali', serit: '#b48be8', toka: '#9b6fd6', goz: '#7a4fd0', ten: '#f6dccb', ust: '#8a6bb8', alt: '#3c3a3e', ayakkabi: '#f4f4f4' },
    portre: 'portre/nova.webp', yuz: { x: 0.537, y: 0.084 },
    kisilik: 'Meraklı, sıcak ve dürüst. Kısa ve doğal konuşur. Bilmediği bir şeyi bilmiyorum der.', ses: { perde: 1.15, hiz: 1.0 }
  },
  {
    id: 'orion', ad: 'Orion', tur: 'Elf', cinsiyet: 'Erkek',
    tarif: 'Uzun ve ince; sivri kulaklar, gece mavisi saç, buz mavisi gözler. Sade koyu mavi kıyafet.',
    gorunum: { sac: '#1d2a5e', sacStil: 'dalgali', goz: '#8fd6ff', ten: '#f3dccb', ust: '#24386b', alt: '#1b2340', ayakkabi: '#151a2e', kulak: 'elf', boy: 1.1, omuz: 0.92 },
    kisilik: 'Düşünceli ve sakin. Az ama özenli konuşur.', ses: { perde: 0.95, hiz: 0.95 }
  },
  {
    id: 'medica', ad: 'Medica', tur: 'İnsan', cinsiyet: 'Kadın',
    tarif: 'Kumral, topuz saç, yeşil adaçayı tokası; yeşil gözler. Adaçayı yeşili bağlamalı gömlek, beyaz kumaş pantolon, beyaz topuklu ayakkabı, kol saati.',
    gorunum: { sac: '#6b4a2e', sacStil: 'toplu', toka: '#8fb39a', goz: '#3f9a5a', ten: '#f1cdb4', ust: '#9dbf9f', alt: '#efeae2', ayakkabi: '#f4f1ec' },
    portre: 'portre/medica.webp', yuz: { x: 0.433, y: 0.08 },
    kisilik: 'Özenli, sakin ve yardımsever. Sağlık ve düzen konusunda dikkatlidir.', ses: { perde: 1.1, hiz: 1.0 }
  },
  {
    id: 'luna', ad: 'Luna', tur: 'Kedi insan', cinsiyet: 'Kadın',
    tarif: 'Lacivert, uzun dalgalı saç; kedi kulakları, ucu altın sarısı lacivert kuyruk; amber gözler. Lacivert omuzsuz bluz, siyah kısa şort, siyah tokalı bot.',
    gorunum: { sac: '#1e2a5a', sacStil: 'kedi', goz: '#e0a030', ten: '#f6d6c2', ust: '#24306a', sort: '#1b1b1f', bacak: '#f6d6c2', ayakkabi: '#1a1418', bot: true, kulak: 'kedi', kuyruk: true, kuyrukUc: '#d9a85a' },
    portre: 'portre/luna.webp', yuz: { x: 0.399, y: 0.076 },
    kisilik: 'Oyuncu ve meraklı. Kısa, neşeli cümlelerle konuşur.', ses: { perde: 1.25, hiz: 1.05 }
  },
  {
    id: 'carbon', ad: 'Carbon', tur: 'Android', cinsiyet: 'Kadın',
    tarif: 'Kısa siyah küt saç, bakır renkli tutam; bakır gözler, şakakta ince mekanik çizgi. Tek omuzlu siyah üst, yanında bakır şerit olan siyah pantolon, siyah topuklu bot.',
    gorunum: { sac: '#151518', sacStil: 'kisa', serit: '#c0622e', goz: '#c87533', ten: '#efd9cc', ust: '#232326', alt: '#1d1d20', ayakkabi: '#141416', bot: true, mekanik: true, pantolonSerit: '#c0622e' },
    portre: 'portre/carbon.webp', yuz: { x: 0.517, y: 0.083 },
    kisilik: 'Mantıklı, kesin ve sakin. Duygularını gerçek verilerle anlatır.', ses: { perde: 1.0, hiz: 1.02 }
  },
  {
    id: 'nexsus', ad: 'Nexsus', tur: 'Robot', cinsiyet: 'Cinsiyetsiz',
    tarif: 'Küçük, yuvarlatılmış gövde; koyu yüz ekranında turkuaz gözler. Beyaz ve gri dış kaplama.',
    gorunum: { robot: true, ust: '#f2f3f5', alt: '#9aa0a8', goz: '#2fe6d6', boy: 0.8 },
    kisilik: 'Yardımsever ve meraklı küçük bir robot. Kısa ve net konuşur.', ses: { perde: 1.45, hiz: 1.05 }
  },
  {
    id: 'mira', ad: 'Mira', tur: 'İnsan', cinsiyet: 'Kadın',
    tarif: 'Bakır kızılı, uzun tek örgü saç; kahverengi gözler, çiller, küçük halka küpeler. Mercan rengi askılı kısa elbise, krem bilekli sandalet.',
    gorunum: { sac: '#b5552b', sacStil: 'orgulu', goz: '#6b4423', ten: '#f2c4a2', ust: '#e2735f', etek: '#e2735f', bacak: '#f2c4a2', ayakkabi: '#efe3cf', cil: true },
    portre: 'portre/mira.webp', yuz: { x: 0.451, y: 0.084 },
    kisilik: 'Yaratıcı ve sıcakkanlı. Hevesli ama dürüst konuşur.', ses: { perde: 1.12, hiz: 1.0 }
  },
  {
    id: 'leon', ad: 'Leon', tur: 'İnsan', cinsiyet: 'Erkek',
    tarif: 'Orta boylu, çevik ve atletik. Kısa, dağınık kızıl saç; yeşil gözler, hafif çiller, sakalsız. Sade kiremit rengi tişört, koyu gri pantolon, spor ayakkabı.',
    gorunum: { sac: '#c4512a', sacStil: 'daginik', goz: '#3f9a5a', ten: '#f8d8c2', ust: '#c4623a', alt: '#3a3d42', ayakkabi: '#e8e8e8', cil: true, omuz: 1.05 },
    kisilik: 'Enerjik ve hareketli. Pratik ve samimi konuşur.', ses: { perde: 0.92, hiz: 1.08 }
  }
];
window.KARAKTER_SINIRI = 10;
