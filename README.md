# IPTV Companion

Static web page for building an m3u playlist on a phone, then getting it into the in-car IPTV app.

## Running locally

Just open `index.html` in a browser. No build step, no backend.

## Deploying to GitHub Pages

1. Create a repo (e.g. `iptv-auto-companion`).
2. Push the contents of this folder to the repo root.
3. In the repo settings, enable Pages, deploy from branch `main` / `/`.
4. Done. The page will be at `https://<username>.github.io/<repo>/`.

## Flow

- **Builder tab**: add channels one at a time (name + HLS URL + optional logo URL + optional group).
- **Paste M3U tab**: paste a raw extended m3u or fetch one from a URL; parses tvg-logo and group-title.
- **Export**:
  - If you got here by scanning the car's QR (URL contains `?code=XXXXXX`), tap **Send to car** — the playlist is uploaded to `api.aaos-iptv.com` and the car polls for it automatically.
  - Otherwise, download the `.m3u` file or copy the text and share it however you like.

Logos are always referenced by URL, so the playlist file stays small enough to host on a gist or pastebin.
