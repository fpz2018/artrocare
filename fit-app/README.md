# Fit Worden op 61

Een zelfstandige, mobiel-first fitness- en lifestyle-tracker (PWA). Volledig
offline bruikbaar — alle data staat lokaal in `localStorage`, geen backend,
geen account, geen tracking.

> Dit is een **op zichzelf staand project**. Het deelt niets met de rest van
> de repo waarin het (tijdelijk) staat en kan zonder aanpassingen naar een
> eigen repository verhuisd worden: kopieer simpelweg de map `fit-app/`.

## Functies (7 tabbladen)

| Tab | Inhoud |
|-----|--------|
| **Dashboard** | KPI's, weekoverzicht, dagstatus, snelle navigatie |
| **Training** | Loggen met templates (Kracht D1-3, Plyometrie, KOT, Tennis/Cardio) |
| **Voeding** | 16:8 fasting-timer, macro's, water, maaltijden |
| **Supplementen** | Dagelijks protocol met dosering, timing en wetenschap |
| **Progressie** | Lichaamsmaten, gewichtsgrafiek, geschiedenis |
| **Intermittent Living** | Koude-expositie, sauna, meditatie met timers |
| **Cheat Sheet** | Alle protocollen op één referentiepagina |

## Lokaal draaien

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # productiebuild → dist/
npm run preview  # build lokaal bekijken
```

## Deployen als eigen site (Netlify)

1. Netlify → **Add new site → Import an existing project** → kies de repo.
2. **Base directory:** `fit-app`
3. **Build command:** `npm run build` · **Publish directory:** `dist`

`netlify.toml` in deze map zet deze waarden al goed. Je krijgt een eigen URL
(bijv. `fit-worden-op-61.netlify.app`). Open die op je telefoon en kies
**"Toevoegen aan beginscherm"** voor een eigen app-icoon.

## Naar een eigen repository verplaatsen

```bash
# vanuit de hoofdmap van de huidige repo
cp -r fit-app /pad/naar/nieuwe-lege-map
cd /pad/naar/nieuwe-lege-map
git init && git add . && git commit -m "Fit Worden op 61"
git remote add origin <jouw-nieuwe-repo-url>
git push -u origin main
```

## Tech

React 18 · Vite · Tailwind CSS · lucide-react · localStorage · PWA
(service worker + web manifest).
