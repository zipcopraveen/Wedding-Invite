/* ==========================================================================
   guests.js  |  optional personalised links
   Map a lowercase slug to the name shown on the "Dear ..." card.
   With nginx in place, yourdomain.com/priya-and-family opens that guest's
   envelope. While testing in Live Server, use  index.html?to=priya-and-family
   Leave the map empty to switch the feature off. The root address and any
   unknown slug show the normal site.
   ========================================================================== */

window.WEDDING_GUESTS = {
  // "priya-and-family": "Priya and family",
   "arun": "Arun",
};
