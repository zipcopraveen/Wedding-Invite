# Guestbook service

A tiny service with no dependencies. It stores guest messages in a JSON file
and serves them to the invitation site.

## Run it while building the site

```bash
cd sadhaasivam-nithiya-api
ADMIN_KEY=choose-a-long-random-key ALLOWED_ORIGINS=http://127.0.0.1:5500 node server.js
```

Then, in `sadhaasivam-nithiya/js/config.js`, point the site at it while you test:

```js
guestbook: { enabled: true, api: "http://localhost:3000/api/guestbook" }
```

Set it back to `"/api/guestbook"` before you commit: on the server, nginx
forwards `/api/` to this service, so no cross-site setting is needed.

## Rules

- Name up to 60 characters, message up to 500.
- Links are rejected, which stops most spam.
- One message per address every 8 seconds, and at most 6 per day per address.
  The daily limit is a backstop only, because many guests may share one
  Wi-Fi address at the venue.
- A hidden trap field catches simple bots.
- Addresses are stored only as salted hashes.

## Moderating

```bash
# list everything, newest first
curl "https://yourdomain.com/api/guestbook/admin?key=YOUR_ADMIN_KEY"

# remove message 12
curl -X DELETE "https://yourdomain.com/api/guestbook/12?key=YOUR_ADMIN_KEY"
```

A wrong or missing key gets a 404, as if the address did not exist.
Keep `ADMIN_KEY` and `IP_SALT` in `.env` on the server, never in git.

## Backups

Messages live in the `guestbook-data` Docker volume (`/data/guestbook.json`).
Copy that one file to back up everything.
