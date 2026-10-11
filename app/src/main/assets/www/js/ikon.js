/* İnce çizgili ikonlar (tek yerden). Ikon.svg('mikrofon') → <svg>…</svg> */
(function () {
  const P = {
    menu: 'M4 7h16M4 12h16M4 17h16',
    geri: 'M15 5l-7 7 7 7',
    kapat: 'M6 6l12 12M18 6L6 18',
    gonder: 'M4 12l16-8-6 16-3-7z',
    mikrofon: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
    mikrofonKapali: 'M15 9.3V6a3 3 0 0 0-5.7-1.3M9 9v3a3 3 0 0 0 5.1 2.1M5 11a7 7 0 0 0 11.4 5.4M19 11a7 7 0 0 1-.6 2.8M12 18v3M3 3l18 18',
    mesaj: 'M4 5h16v11H8l-4 4z',
    telefonKapat: 'M3 14c5-5 13-5 18 0l-2.5 2.5-3-1.5v-2.5a10 10 0 0 0-5 0V15l-3 1.5z',
    sayfa: 'M7 3h7l4 4v14H7zM14 3v4h4',
    not: 'M5 4h14v16H5zM8 9h8M8 13h8M8 17h5',
    muzik: 'M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z',
    kitap: 'M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1zM12 6v14',
    gorev: 'M5 5h14v14H5zM8.5 12l2.5 2.5 4.5-5',
    proje: 'M4 5h16v11H4zM2 19h20',
    klasor: 'M3 6h6l2 2h10v11H3z',
    dosya: 'M7 3h7l4 4v14H7zM14 3v4h4',
    resim: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9.5a1.5 1.5 0 1 1 0-.01',
    arti: 'M12 5v14M5 12h14',
    cop: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
    ev: 'M4 11l8-7 8 7M6 10v10h12V10',
    ayar: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1',
    yukle: 'M12 16V4M7 9l5-5 5 5M4 20h16',
    kalem: 'M4 20l4-1 11-11-3-3L5 16zM14 6l3 3',
    goz: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    tik: 'M5 12l5 5 9-10',
    hoparlor: 'M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11'
  };
  const Ikon = {
    adlar: Object.keys(P),
    svg(ad) { return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + (P[ad] || P.sayfa) + '"/></svg>'; }
  };
  window.Ikon = Ikon;
})();
