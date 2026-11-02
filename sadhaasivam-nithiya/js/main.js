/* ==========================================================================
   main.js  |  documentation only, no logic
   Load order (see index.html), one file per feature:
     config.js      window.WEDDING, the single source of truth
     guests.js      optional slug to guest-name map
     utils.js       window.WeddingUtils (IST dates, helpers)
     vendor/lenis   smooth scrolling (MIT licence)
     motion.js      smooth scroll + one shared animation frame
     theme.js       applies theme and font set, fills names and title
     envelope.js    optional "Dear <Name>" gate for personalised links
     animations.js  scroll progress line
     audio.js       background music (off until enabled in config.js)
     touch-magic.js tap sparkles
     mandala.js     builds the kolam drawing
     hero.js        letter-by-letter names + kolam backdrop
     reveal.js      date chapter: scroll draws the kolam, date appears
     countdown.js   odometer countdown
     reception.js   details, .ics and Google Calendar, map
     gallery.js     wipe-transition slideshow
     cursor.js      round "Open" label that follows the mouse
     lightbox.js    maximised viewer (view-transition morph)
     nav.js         the bar at the top: monogram, section links, calendar action
     enter.js       parts of a section arrive one after another

   Styles: variables.css (tokens), themes/zari.css (palette, the .on-wine /
   .on-champagne / .on-pearl scopes, the karai and scallop tiles),
   fonts.css (font sets), base.css, components.css (buttons, the bar),
   animations.css, sections.css, gallery.css, guestbook.css, responsive.css.
   preview.html and css/preview.css are a dev-only style guide, blocked by
   the nginx config and safe to delete before launch.
   ========================================================================== */
