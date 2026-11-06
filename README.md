# GREEN CITY 010 – sajt

Statičan sajt, spreman za GitHub Pages. Radi bez spoljnih servisa.

## Objavljivanje
1. Napravite novi repozitorijum na GitHubu i otpremite SVE fajlove iz ovog foldera u koren repozitorijuma, uključujući `.nojekyll` i `.gc-slots.state.json`.
2. Settings → Pages → Source: **Deploy from a branch**, Branch: **main**, folder **/ (root)** → Save.
3. Posle 1–2 minuta sajt je dostupan na `https://<korisnik>.github.io/<repozitorijum>/`.

## Fajlovi
- `index.html` – početna stranica
- `usluga.html` – stranica pojedinačne usluge (`usluga.html?u=...`)
- `site-boot.js` – pokretanje stranice i prelazi između stranica
- `support.js`, `image-slot.js`, `icons.js` – izvršni kod stranica i ikonice
- `assets/` – stilovi, fontovi, React, logo i fotografije
