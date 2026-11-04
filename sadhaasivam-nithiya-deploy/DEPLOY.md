# Deploying Sadhaasivam & Nithiya to the VPS

Static site, one nginx container, TLS from Certbot on the host.
Folder layout on the server (both folders come from the same git repo):

```
repo/
├── sadhaasivam-nithiya/          the site (web root, mounted read-only)
├── sadhaasivam-nithiya-api/      the guestbook service (no dependencies)
└── sadhaasivam-nithiya-deploy/   this folder
```

## 1. Before you start

- DNS (at the registrar, e.g. BigRock's DNS manager): plain **A records** for
  `@` (the bare domain) and `www` pointing at the VPS IP.
  Remove any registrar parking CNAME or URL-redirect records first, or the
  certificate request will fail. Check with `dig +short yourdomain.com`.
- On the VPS: Docker with the compose plugin, and Certbot (`sudo apt install certbot`).
- Firewall: `sudo ufw allow OpenSSH && sudo ufw allow 80,443/tcp && sudo ufw enable`.
  Allow SSH first or you lock yourself out.
- A 2 GB swap file, so a memory spike cannot kill the containers.

## 2. First boot (HTTP only)

```bash
cd sadhaasivam-nithiya-deploy
cp .env.example .env            # then edit DOMAIN, ADMIN_KEY and IP_SALT
                                # (make the last two with: openssl rand -hex 24)
mkdir -p certbot/www
docker compose up -d            # NGINX_MODE=http-only in .env
curl -I http://yourdomain.com   # should answer 200
```

## 3. Get the certificate

```bash
sudo certbot certonly --webroot -w "$(pwd)/certbot/www" \
  -d yourdomain.com -d www.yourdomain.com
```

## 4. Switch to HTTPS

Set `NGINX_MODE=https` in `.env`, then recreate the container. A plain
restart is not enough because the config template is read at start-up:

```bash
docker compose up -d --force-recreate web
```

## 5. Renewals

Add a cron entry (as root) so nginx picks up renewed certificates:

```
0 3 * * * certbot renew --quiet --webroot -w /path/to/repo/sadhaasivam-nithiya-deploy/certbot/www --deploy-hook "docker exec sadhaasivam-nithiya-web nginx -s reload"
```

## Guestbook

Messages are kept by the `api` container in the `guestbook-data` volume, and
nginx forwards `/api/` to it. To read or remove messages, see
`sadhaasivam-nithiya-api/README.md`. Back up by copying
`/data/guestbook.json` out of that volume, for example nightly from cron:

```
0 2 * * * docker cp sadhaasivam-nithiya-api:/data/guestbook.json $HOME/guestbook-$(date +\%F).json
```

Moderate with the admin key in a header, never in the URL:
`curl -H "X-Admin-Key: $KEY" https://yourdomain.com/api/guestbook/admin`.
Reads are limited to 300 per minute per address and posts to 10 per minute
(see the nginx templates), so a venue full of phones on one Wi-Fi is fine.
Test it after deploying: open the
site, post a message, then open the site in a private window and check it
appears there too.

## Updating the site

Edit locally, push to a feature branch, pull and test on the VPS, then merge
to main. Never edit files on the server.

- HTML, CSS, JS and image changes need only `git pull`.
- Changes to the guestbook service need `docker compose up -d --build api`.
- Changes to `.env` or the nginx templates need
  `docker compose up -d --force-recreate web`.

## Before sharing the link

1. `js/config.js`: names, reception date (IST, no timezone
   marker), venue, address, map embed URL and map link, `domain`.
2. Replace the placeholder photos in `assets/images/gallery` and update the
   `gallery` list. Use portrait photos (3:4 works best): the slideshow shows
   them as portrait cards, and the `focus` value keeps faces in frame when a
   photo is cropped.
3. Replace `assets/og/og-banner.png` (1200x630) and set `og:url` and an absolute
   `og:image` URL in `index.html`.
4. Pick the final font set (`font` in config.js) and delete the unused families
   from the Google Fonts link in `index.html`.
5. Guestbook: `guestbook.api` in `config.js` must be `"/api/guestbook"` on
   the server. Delete any test messages through the admin address first.
6. Music: only enable it with a track you are licensed to use.
7. Personalised links (optional): fill `js/guests.js`. `yourdomain.com/priya-and-family`
   then opens that guest's envelope.
8. Test on a real phone over HTTPS, including: an unknown slug, a wrong-case
   slug, a trailing slash, the bare domain, and the WhatsApp in-app browser.
