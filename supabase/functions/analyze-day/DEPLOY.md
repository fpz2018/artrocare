# Deploy: analyze-day Edge Function

Deze functie maakt het AI-advies voor de Kernsignalen-tracker. De Anthropic
API-key staat **alleen** als Supabase-secret — nooit in de frontend.

## 1. Supabase CLI (eenmalig)
```bash
npm install -g supabase
supabase login
supabase link --project-ref <jouw-project-ref>
```
Project-ref vind je in: Supabase dashboard → Settings → General → Reference ID.

## 2. Secret instellen
Ga naar: **Project → Settings → Edge Functions → Secrets** (of via CLI):

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

| Naam              | Waarde                              |
|-------------------|-------------------------------------|
| ANTHROPIC_API_KEY | `sk-ant-...` (jouw Claude API-key)  |

`SUPABASE_URL` en `SUPABASE_ANON_KEY` zijn automatisch beschikbaar in de
runtime — niet handmatig instellen.

## 3. Migratie draaien (eenmalig, vóór gebruik)
De functie schrijft naar de tabel `daily_entries` uit migratie 006:
```bash
supabase db push
# of plak supabase/migrations/006_kernsignalen.sql in de SQL Editor
```

## 4. Deployen
```bash
supabase functions deploy analyze-day
```

De functie draait met JWT-verificatie (standaard aan): de frontend stuurt het
access token van de ingelogde gebruiker mee, zodat RLS geldt en de functie weet
wie de aanvraag doet.

## 5. URL
```
https://<jouw-project-ref>.supabase.co/functions/v1/analyze-day
```
De frontend roept deze aan via `supabase.functions.invoke('analyze-day', ...)`,
dus er hoeft niets hardcoded te worden.

## 6. Testen met curl
Haal eerst een access token op (bijv. uit de browser: `localStorage` →
`sb-...-auth-token` → `access_token`, of via een test-login). Zorg dat er een
opgeslagen dag bestaat voor de datum.

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/analyze-day \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{ "date": "2026-07-04" }'
```

Verwacht antwoord:
```json
{ "analysis": "Je beweging zat vandaag goed op 12 minuten ..." }
```

## Model
`claude-sonnet-4-6`, `max_tokens: 400`. Advies is NL en max ~120 woorden.
