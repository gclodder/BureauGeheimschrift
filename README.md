# Encryptiespel HV5 — zelf hosten

Dit is de zelfstandige versie van Bureau Geheimschrift. De docent kiest per ronde uit Caesar, Rozenkruisers, substitutie en Vigenère. Leerlingen spelen samen met een sessiecode; alleen de docent heeft een wachtwoord nodig.

GitHub bewaart de code en kan een container bouwen. [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) kan de volledige versie niet draaien: het spel heeft een server nodig voor aanmeldingen, rollen en gedeelde dossiers.

## Op GitHub zetten

1. Maak een lege repository aan op GitHub.
2. Pak het ZIP-bestand uit. Zet de **inhoud** van de map `encryptiespel-github` in de hoofdmap van je repository. Neem ook `.github`, `.gitignore`, `.dockerignore` en `.env.example` mee.
3. Commit en push de bestanden, bijvoorbeeld vanuit GitHub Desktop of met Git. De workflow **Bouw en test** controleert de code bij iedere push.

## Starten op je eigen server met Docker

Kloon de repository op de server, kopieer `.env.example` naar `.env` en vul een lang, willekeurig wachtwoord in bij `TEACHER_PASSWORD` (minstens 16 tekens). Bewaar `.env` alleen op de server.

Voer vanuit de projectmap uit:

```sh
docker compose up -d --build
```

De server luistert standaard op `127.0.0.1:3000`. Wil je dat leerlingen op andere apparaten kunnen meedoen? Laat je HTTPS-proxy, bijvoorbeeld Caddy of Nginx, doorsturen naar `127.0.0.1:3000`. Vul in `.env` het adres in dat leerlingen echt gebruiken, bijvoorbeeld `PUBLIC_ORIGIN=https://spel.voorbeeld.nl`, zonder pad. Start na die wijziging opnieuw met `docker compose up -d`. Open datzelfde adres met `/?teacher=1` voor de docent. De app gebruikt een beveiligde inlogcookie bij een HTTPS-adres.

Nieuwe versie installeren: haal de bijgewerkte code op en voer opnieuw `docker compose up -d --build` uit. De dossiers blijven in het Docker-volume `dossiers`. Verwijder dat volume niet bij een update. Voor een simpele back-up: stop het spel en maak een kopie van het volume. Draai één spelserver per database.

## Starten zonder Docker

Gebruik Node.js 24 (vanaf 24.15) met npm. Kopieer ook hier `.env.example` naar `.env` en stel het docentwachtwoord in. Voer uit:

```sh
npm ci
npm run build
npm start
```

Open [de lokale docentenpagina](http://127.0.0.1:3000/?teacher=1). Dossiers staan standaard in `data/sessions.sqlite`; die map hoort buiten Git te blijven. Met `DATABASE_PATH` kies je desgewenst een andere permanente opslaglocatie. Achter een HTTPS-proxy geldt dezelfde instelling voor `PUBLIC_ORIGIN` als bij Docker. Na het bouwen kun je de app testen met `npm test`.

## Optioneel: een container via GitHub publiceren

Kies in je repository **Actions → Publiceer container → Run workflow**. De workflow zet een image op `ghcr.io/<eigenaar>/<repository>:latest` en geeft die ook een tag met de commit-ID. Voor een privépackage moet de server eerst inloggen bij GitHub Container Registry. Wil je deze image gebruiken in Compose, vervang dan `build: .` door `image: ghcr.io/<eigenaar>/<repository>:latest` en voer `docker compose pull` en `docker compose up -d` uit. GitHub start hiermee geen server voor je.

De eerste installatie begint met een lege database. Dossiers en leerlingcodes van de bestaande ChatGPT-site zijn niet meegenomen. Zie [de docenthandleiding](DOCENTHANDLEIDING.md) voor de les.
