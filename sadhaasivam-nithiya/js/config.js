/* ==========================================================================
   config.js  |  single source of truth for all client data
   Nothing else in the site may hard-code names, dates or venue details.
   Date strings are IST with no timezone marker; always convert them with
   WeddingUtils.istToUTCDate().
   ========================================================================== */

window.WEDDING = {
  font: "editorial",          // "editorial" | "classic" | "soft". Try ?font=classic
  theme: "zari",              // "zari" (light, default) or "aubergine" (dark). Try ?theme=aubergine

  couple: {
    partner1: { name: "Sadhasivam" },
    partner2: { name: "Nithiya" }
  },

  // Domain used for og:url and shareable links (fill in at deploy time)
  domain: "",

  // The only event: the wedding reception.
  reception: {
    title: "Wedding Reception",
    datetimeIST: "2026-11-30T18:30:00",        // "YYYY-MM-DDTHH:mm:00", for example "2027-01-15T18:30:00"
    durationMinutes: 210,
    venueName: "Muthumani Mahal",
    venueAddress: "Near Kattur Bus Stop, Trichy - 19",
    mapEmbedUrl: "https://maps.google.com/maps?q=Muthumani+Mahal&cid=16184187111001692542&ll=10.8019023,78.7433026&z=17&output=embed",   // Google Maps embed URL
    mapLinkUrl: "https://maps.app.goo.gl/wHzWXtdm4Qt3cAdj9"   // Google Maps share or directions link
  },

  // Gallery photos: { src, thumb, alt, focus }. focus is the CSS object-position
  // that keeps faces in frame when a photo is cropped, for example "50% 25%".
  // Each photo is 1200x1600 (3:4) with a 300x400 thumbnail, in assets/images/gallery.
  gallery: [
    { src: "assets/images/gallery/photo-01.jpg", thumb: "assets/images/gallery/photo-01-thumb.jpg", alt: "The couple sitting together on temple steps, smiling at the camera", focus: "50% 30%" },
    { src: "assets/images/gallery/photo-02.jpg", thumb: "assets/images/gallery/photo-02-thumb.jpg", alt: "The bride smiling up at the groom as he gently touches her chin, on temple steps", focus: "50% 35%" },
    { src: "assets/images/gallery/photo-03.jpg", thumb: "assets/images/gallery/photo-03-thumb.jpg", alt: "Close-up of the bride resting her head on the groom's shoulder", focus: "50% 40%" },
    { src: "assets/images/gallery/photo-04.jpg", thumb: "assets/images/gallery/photo-04-thumb.jpg", alt: "The bride smiling as the groom holds her hand at a temple doorway", focus: "50% 25%" },
    { src: "assets/images/gallery/photo-05.jpg", thumb: "assets/images/gallery/photo-05-thumb.jpg", alt: "The groom smiling as he looks at the bride, with a hilltop behind them", focus: "50% 30%" },
    { src: "assets/images/gallery/photo-06.jpg", thumb: "assets/images/gallery/photo-06-thumb.jpg", alt: "Black-and-white close-up of the couple's clasped hands and bangles", focus: "50% 50%" },
    { src: "assets/images/gallery/photo-07.jpg", thumb: "assets/images/gallery/photo-07-thumb.jpg", alt: "The couple holding hands on temple steps", focus: "50% 35%" },
    { src: "assets/images/gallery/photo-08.jpg", thumb: "assets/images/gallery/photo-08-thumb.jpg", alt: "The couple seen from behind, resting together, with their hands reaching toward each other", focus: "50% 60%" }
  ],

  // Background music. Keep enabled:false until you have a licensed track and
  // have copied it to assets/audio/background.mp3.
  // Guestbook. api is the address of the guestbook service (see
  // sadhaasivam-nithiya-api). Without a running service the guestbook still
  // works in preview mode and saves messages on that device only.
  guestbook: { enabled: true, api: "/api/guestbook" },

  music: { src: "assets/audio/background.mp3", enabled: true }
};
