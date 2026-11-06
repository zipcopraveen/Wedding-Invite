# Wedding-Invite

A wedding reception invitation website for **Sadhasivam & Nithiya**, built as plain HTML, CSS and JavaScript with no build step. It opens like an envelope, then scrolls through the couple's names, the date, a countdown, the venue, a photo gallery and a guestbook.

Live site: <https://nithiyawedssadhasivam.in/>

## What is in this repository

| Folder | What it is |
| --- | --- |
| `sadhaasivam-nithiya/` | The website itself. This is the web root; open `index.html`. |
| `sadhaasivam-nithiya-api/` | A tiny guestbook service (Node, no dependencies) that stores messages in a JSON file. |
| `sadhaasivam-nithiya-deploy/` | Docker Compose, nginx templates and `DEPLOY.md` for the VPS. |
| `.github/` | The lint and deploy workflow, and the HTML and CSS lint rules. |

## The site, section by section

1. **Envelope.** The first screen shows "Dear *guest name*" with a gold seal and an "Open the invitation" button. Personalised links fill in the guest's name (see below).
2. **Hero.** "Love in every chapter", the couple's names drawn over a kolam (mandala) backdrop, and "Invite you to our wedding reception".
3. **Save the date.** Scrolling draws the kolam and reveals the day, month and time inside it.
4. **Countdown.** A countdown to the reception, in Indian Standard Time.
5. **Gallery.** A wipe-transition slideshow with a full-screen viewer.
6. **Guestbook.** Guests leave a message; messages are listed beside the form.
7. **Reception.** The date and venue ticket, "Add to calendar" (an `.ics` file), "Get directions", and a Google Maps embed inside an arch.
8. **Closing section.** An S & N monogram with twinkling stars and a beating heart; tapping the heart opens a thank-you message and signature.

Also included: background music with a toggle (bottom right), tap sparkles, smooth scrolling, a light theme (`zari`) and a dark one (`aubergine`).

## Run it on your computer

No install is needed.

1. Open the `sadhaasivam-nithiya` folder in VS Code.
2. Right-click `index.html` and choose **Open with Live Server** (any static server works).

Handy test switches on the address:

| Add to the address | Effect |
| --- | --- |
| `?to=arun` | Opens the envelope for a guest. The slug must exist in `js/guests.js`. |
| `?font=classic` or `?font=soft` | Try the other font sets. |
| `?theme=aubergine` | Try the dark theme. |

`preview.html` is a development-only style guide; it is blocked by the nginx config and can be deleted before launch.

## Where to change the content

Everything about the couple and the event lives in one file, **`sadhaasivam-nithiya/js/config.js`**: names, reception date (IST, no timezone marker), venue name and address, the Google Maps embed and link, the gallery photos, the guestbook address, and the music switch. Nothing else in the site hard-codes these.

- **Personalised links:** map a lowercase slug to a guest's name in `js/guests.js`. On the real domain, `yourdomain.com/priya-and-family` then opens that guest's envelope.
- **Gallery photos:** replace the placeholders in `assets/images/gallery` and update the `gallery` list. Portrait photos (3:4) work best.
- **Share banner:** `assets/og/og-banner.png` (1200 × 630), the picture shown when the link is shared. Set `og:url` and an absolute `og:image` address in `index.html` once the domain is final.
- **Music:** `assets/audio/background.mp3`, switched on by `music.enabled` in `config.js`.

## How the code is organised

Scripts load in the order listed in `sadhaasivam-nithiya/js/main.js` (documentation only), one file per feature: `config.js`, `guests.js`, `utils.js`, `motion.js`, `theme.js`, `envelope.js`, `hero.js`, `reveal.js`, `countdown.js`, `reception.js`, `gallery.js`, `guestbook.js` and others. Styles are split the same way in `css/`: `variables.css` (tokens), `themes/zari.css` (palette), `fonts.css`, `base.css`, `components.css`, `sections.css`, `gallery.css`, `guestbook.css`, `envelope.css`, `responsive.css`.

Some of the newer visuals, such as the heart message and the twinkling stars in the closing section, are CSS-only so they need no extra script.

## Guestbook service

`sadhaasivam-nithiya-api/` stores messages in a JSON file and serves them to the site. Names are limited to 60 characters and messages to 500; links are rejected; each address is rate-limited; addresses are stored only as salted hashes. Moderation uses an admin key sent in a request header. See `sadhaasivam-nithiya-api/README.md` for running it, moderating and backing up.

Without a running service the guestbook still works in **preview mode**, saving messages on that device only. `sadhaasivam-nithiya/admin.html` is a small moderation page for the admin key.

## Deploying

The site is static files served by one nginx container, with the guestbook service behind `/api/` and TLS from Certbot. `sadhaasivam-nithiya-deploy/DEPLOY.md` covers DNS, first boot, certificates, renewals, backups, updates and a pre-launch checklist.

Secrets (`ADMIN_KEY`, `IP_SALT`) live in a `.env` file on the server, copied from `.env.example`, and are never committed.

### Automatic deploy

Pushing to `main` with changes inside `sadhaasivam-nithiya/` runs `.github/workflows/deploy-site.yml`:

1. **Lint:** JavaScript syntax, HTML (htmlhint), CSS (stylelint), and a check that every local file referenced by `index.html` exists. The server is case-sensitive, so a wrong filename that works on a Mac would break live.
2. **Deploy:** the server runs a pinned `git pull --ff-only` over SSH.
3. **Check:** the live site must answer.

## Working on it

- Make changes on a feature branch (for example `mpu-ui-fix`), open a pull request, and merge to `main` only with approval. **Merging to `main` publishes the live site.**
- Edit locally and never edit files on the server.
- Keep UI changes in CSS and markup where possible; behaviour lives in `js/` and the data in `config.js`.

## Before sharing the link (licences)

Check these before the site goes public or a merge to `main` goes live:

- **Fonts from dafont.com.** Several are free for personal use only, and some downloads carry no licence text. Check each licence, or buy one, before public use. In the repo: Aurora, Nexa, Against, Amore Christmas, Vogue, Big Larian Customs, Campana Script, Butler Stencil (free version, read its EULA) and Adelia. Cinzel is open source. The Guestbook heading uses Lexend, which is open source (SIL OFL) and loads from the Google Fonts link in `index.html`, as do the other Google Fonts families.
- **Music.** `assets/audio/background.mp3` is a short clip of a track that is not licensed for this use. Use only a track you are licensed to use, or switch music off in `config.js`.
- **Gallery.** The gallery still holds placeholder pictures until the real photos are added.
- **Share banner.** Set the full web address for `og:image` (and `og:url`) in `index.html` for the real domain.
- **Guestbook.** `guestbook.api` in `config.js` must be `"/api/guestbook"` on the server, and any test messages should be deleted through the admin address.
- **Real phone test.** Test over HTTPS on a real phone, including the WhatsApp in-app browser, an unknown guest slug, and the bare domain.

## Third-party code

Smooth scrolling uses [Lenis](https://github.com/darkroomengineering/lenis) (MIT licence, included under `sadhaasivam-nithiya/js/vendor/`).
