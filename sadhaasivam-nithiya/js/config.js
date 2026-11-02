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
    partner1: { name: "Sadhaasivam" },
    partner2: { name: "Nithiya" }
  },

  // Domain used for og:url and shareable links (fill in at deploy time)
  domain: "",

  // The only event: the wedding reception.
  reception: {
    title: "Wedding Reception",
    datetimeIST: "2026-11-30T18:30:00",        // "YYYY-MM-DDTHH:mm:00", for example "2027-01-15T18:30:00"
    durationMinutes: 210,
    venueName: "",
    venueAddress: "",
    mapEmbedUrl: <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.1228446935493!2d78.74330259999999!3d10.8019023!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3baaf49f00000001%3A0xe099c86e11b6197e!2sMuthumani%20Mahal!5e0!3m2!1sen!2sin!4v1793614093350!5m2!1sen!2sin" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>,          // Google Maps embed URL
    mapLinkUrl: ""            // Google Maps share or directions link
  },

  // Gallery photos: { src, thumb, alt, focus }. focus is the CSS object-position
  // that keeps faces in frame when a photo is cropped, for example "50% 25%".
  // These are placeholders: replace the files in assets/images/gallery.
  gallery: [
    { src: "assets/images/gallery/photo-01.svg", thumb: "assets/images/gallery/photo-01.svg", alt: "Placeholder photo 1", focus: "50% 50%" },
    { src: "assets/images/gallery/photo-02.svg", thumb: "assets/images/gallery/photo-02.svg", alt: "Placeholder photo 2", focus: "50% 40%" },
    { src: "assets/images/gallery/photo-03.svg", thumb: "assets/images/gallery/photo-03.svg", alt: "Placeholder photo 3", focus: "50% 50%" },
    { src: "assets/images/gallery/photo-04.svg", thumb: "assets/images/gallery/photo-04.svg", alt: "Placeholder photo 4", focus: "50% 50%" },
    { src: "assets/images/gallery/photo-05.svg", thumb: "assets/images/gallery/photo-05.svg", alt: "Placeholder photo 5", focus: "50% 40%" },
    { src: "assets/images/gallery/photo-06.svg", thumb: "assets/images/gallery/photo-06.svg", alt: "Placeholder photo 6", focus: "50% 50%" },
    { src: "assets/images/gallery/photo-07.svg", thumb: "assets/images/gallery/photo-07.svg", alt: "Placeholder photo 7", focus: "50% 40%" },
    { src: "assets/images/gallery/photo-08.svg", thumb: "assets/images/gallery/photo-08.svg", alt: "Placeholder photo 8", focus: "50% 50%" }
  ],

  // Background music. Keep enabled:false until you have a licensed track and
  // have copied it to assets/audio/background.mp3.
  // Guestbook. api is the address of the guestbook service (see
  // sadhaasivam-nithiya-api). Without a running service the guestbook still
  // works in preview mode and saves messages on that device only.
  guestbook: { enabled: true, api: "/api/guestbook" },

  music: { src: "assets/audio/background.mp3", enabled: false }
};
