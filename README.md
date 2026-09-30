# Artrose Kompas

Jouw persoonlijke gids bij artrose. Een webapp voor mensen met artrose (van beginnend tot pre-operatief) met oefeningen, voeding, voorlichting en meer.

## Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS
- **UI**: Radix UI + shadcn/ui components
- **Backend**: Supabase (Auth, Database, Row Level Security)
- **Hosting**: Netlify (Static hosting + serverless functions)
- **Charts**: Recharts
- **i18n**: Custom centralized translation system (NL/EN)
- **Security**: DOMPurify, CSP headers, Supabase RLS, Zod validation

## Setup

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Run the database files in the order given in **[`db/INSTALLATIE.md`](db/INSTALLATIE.md)**.
   `supabase/schema.sql` is alleen het beginpunt; de migraties daarna zijn verplicht.
3. Run the check at the bottom of `db/INSTALLATIE.md`. It must return zero rows.
4. Copy your project URL and anon key

### 2. Environment Variables
```bash
cp .env.example .env.local
```
Edit `.env.local` with your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install & Run
```bash
npm install
npm run dev
```

### 4. Deploy to Netlify
1. Connect this repo to Netlify
2. Set environment variables in Netlify dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy! The `netlify.toml` handles all configuration.

## Kernsignalen (dagelijkse tracker)

Een mobiel-eerst dagscherm waarop een patiënt drie kernsignalen bijhoudt en
achteraf een kort AI-advies voor de volgende dag krijgt.

- **Beweeg** — ademloze minuten (ochtend/middag/avond, doel 3/3/4 = 10). Signaal
  behaald bij ≥10 min.
- **Voed** — groente (doel 5) en fruit (doel 4) als tellers + 5 ja/nee-items
  (volkoren, noten/peulvruchten, omega-3, geen suikerdrank, geen bewerkt vlees).
  Score /7; signaal behaald bij ≥5/7.
- **Herstel** — 5 slaapvragen + uren geslapen. Score /5; signaal behaald bij ≥4/5.

Verder: datum-navigatie (niet vooruit), drie signaal-dots, een reeks-teller
(streak van dagen met 3/3), en een **AI-analyse**-knop per dag.

**Route:** `/kernsignalen` (zichtbaar in de patiënt-navigatie).
**Frontend:** `src/pages/Kernsignalen.jsx` — scoring-logica in `src/lib/kernsignalen.js`.

### Datamodel — `daily_entries`

Eén rij per gebruiker per dag. Migratie: `supabase/migrations/006_kernsignalen.sql`.

| kolom | type | opmerking |
|-------|------|-----------|
| `id` | uuid | primary key |
| `user_id` | uuid → `profiles(id)` | **not null**, RLS op `auth.uid()` |
| `date` | date | uniek per `(user_id, date)` |
| `beweeg` / `voed` / `herstel` | jsonb | ruwe signaal-data |
| `ai_analysis` | text | opgeslagen AI-advies |
| `ai_analysis_generated_at` | timestamptz | wanneer gegenereerd |
| `created_at` / `updated_at` | timestamptz | `updated_at` via trigger |

**Waarom jsonb voor de signalen?** De drie signalen zijn kleine, genestelde
vragenlijsten die nog kunnen wijzigen (extra ja/nee-item, andere slaapvraag). Met
jsonb blijft het schema stabiel — een nieuwe vraag toevoegen vergt geen migratie
en breekt bestaande rijen niet. De velden waarop we filteren/sorteren (`user_id`,
`date`, timestamps) zijn wél echte, indexeerbare kolommen. Scores worden afgeleid
berekend uit de jsonb (in de frontend én in de Edge Function), zodat de bron van
waarheid enkelvoudig blijft.

### Migratie draaien
```bash
supabase db push
# of: plak supabase/migrations/006_kernsignalen.sql in de Supabase SQL Editor
```

### AI-analyse — Edge Function `analyze-day`

De AI-analyse loopt via een Supabase Edge Function zodat de **Anthropic API-key
uitsluitend server-side** staat (Supabase secret) en nooit in de frontend komt.
De functie verifieert het JWT van de ingelogde gebruiker (RLS geldt), leest de
dag + trend van de laatste 5 dagen, laat `claude-sonnet-4-6` (max_tokens 400) een
NL-advies van ~120 woorden schrijven, en slaat dat op bij de dag-entry.

Deployen + secret zetten: zie `supabase/functions/analyze-day/DEPLOY.md`. Kort:
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy analyze-day
```
De frontend roept de functie aan via `supabase.functions.invoke('analyze-day')`;
er hoeft niets hardcoded te worden.

### Multi-user & auth

De datalaag is al multi-user: elke rij hangt aan `user_id = auth.uid()` en is met
Row Level Security afgeschermd. Er is dus **geen herstructurering** nodig om meer
gebruikers te bedienen — dat werkt out of the box via de bestaande artrocare-auth.
Wil je Kernsignalen breder uitrollen, dan volstaat het nav-item (al aanwezig voor
de patiënt-rol in `src/Layout.jsx`).

## Project Structure

```
src/
  api/           - Supabase client
  components/
    dashboard/   - Dashboard sub-components
    legal/       - Disclaimer components
    ui/          - shadcn/ui base components
    utils/       - Sanitize, notifications
  i18n/          - Centralized translations (nl.js, en.js)
  lib/           - Auth context, query client, utils
  pages/         - All page components (lazy loaded)
  hooks/         - Custom React hooks
supabase/
  schema.sql     - Database schema + RLS + seed data. Beginpunt, niet de hele installatie
  migrations/    - Incremental SQL migrations, in volgorde te draaien (zie db/INSTALLATIE.md)
  tests/         - Aanvalstests: veertig aanvallen als anon en als ingelogde gebruiker
  functions/     - Supabase Edge Functions (analyze-day = Kernsignalen AI)
db/
  INSTALLATIE.md - De volledige installatievolgorde plus de controle
tests/
  installatie-volgorde.test.mjs - Bewaakt dat de installatielijst compleet blijft
netlify/
  functions/     - Netlify serverless functions
```

## Performance Optimizations

- **Code splitting**: All pages lazy loaded with `React.lazy()`
- **Manual chunks**: Vendor code split (react, ui, charts, supabase)
- **Centralized user state**: Single auth context, no duplicate API calls
- **Centralized i18n**: No per-component translation objects
- **React.memo**: Heavy list components memoized
- **Query caching**: React Query with 5-min stale time
- **Manual chunks**: three.js en Recharts staan bewust NIET in een vaste vendor-chunk.
  Daarmee werden ze in de entry-graaf getrokken en op elke eerste paginalading
  voorgeladen. Ze zitten nu in de lazy chunk van de pagina die ze gebruikt.

## Security Improvements

- **Supabase RLS**: Row Level Security on all tables
- **DOMPurify**: All user input sanitized before storage
- **CSP Headers**: Strict Content Security Policy via Netlify headers
- **Auth guards**: Server-side auth via Supabase, client-side route protection
- **Rate limiting**: Client-side cooldowns for email/message actions
- **Input validation**: Max lengths, type constraints, Zod schemas
- **HTTPS only**: Strict Transport Security headers
- **No localStorage tokens**: Supabase handles session securely

## Beveiligingswijzigingen (migratie 007)

**Bij een bestaande database:** draai `supabase/migrations/007_security_hardening.sql`
in de Supabase SQL-editor. De migratie is herhaalbaar en verwijdert geen gegevens.

**Bij een nieuwe installatie:** volg de volledige volgorde in
[`db/INSTALLATIE.md`](db/INSTALLATIE.md). `supabase/schema.sql` bevat sinds
30-09-2026 dezelfde veilige definities, maar de migraties daarna zijn verplicht.

### Automatische controle

```bash
npm test                    # installatievolgorde en bestaande testsuite
npm run test:security       # veertig aanvallen op een vers opgebouwde database
npm run test:security:schema # alleen supabase/schema.sql, zonder migraties
```

De aanvalstests bouwen de database opnieuw op en doen vervolgens wat een
aanvaller via PostgREST zou doen: met de publieke anon-sleutel of met een
gewone gebruikersaccount de grenzen opzoeken. Ze hebben een PostgreSQL nodig.
Op het schema van vóór 30-09-2026 falen 21 van de 40 controles; op de huidige
versie geen enkele.

| Onderdeel | Was | Is nu |
|---|---|---|
| Registratie | `register_as` uit clientmetadata bepaalde de rol, inclusief `admin` | alleen `patient` en `practice_admin`; therapeut alleen via geldige uitnodiging |
| Profielupdate | eigen rol en abonnement zelf te zetten via de REST-route | trigger bevriest `role`, `subscription_tier`, `practice_id`, `therapist_id`, `email` |
| Uitnodigingen | publiek leesbaar en door iedereen aan te maken | alleen uitnodiger en beheerder; uitlezen via `get_invitation_by_token` |
| Contentpijplijn | vier policies met `WITH CHECK (true)` | alleen beheerders; de functions werken met de service-role |
| Beheerfuncties | voor iedereen aanroepbaar via `/rest/v1/rpc/` | rolcheck in de functie plus `REVOKE` van `PUBLIC` |
| Boodschappenlijst | `user_uuid` als parameter, dus paywall te omzeilen | `auth.uid()` |
| Praktijkaanmelding | `WITH CHECK (true)`, ook met status `approved` | alleen status `pending` |
| Storage | uploads naar `recipe-images` en `exercise-media` door iedereen | alleen beheerders |
| Stripe-webhook | geen deduplicatie, geen UUID-controle | `stripe_events`-tabel, UUID-validatie, terugbetaling verwerkt |
| Checkout | `user_id` uit de request body | `user_id` uit het geverifieerde Supabase-token |
| Netlify functions | alleen een aanwezige `Authorization`-header volstond | token geverifieerd bij Supabase plus rolcheck |

### Nieuwe of gewijzigde omgevingsvariabelen

| Variabele | Verplicht | Toelichting |
|---|---|---|
| `STRIPE_PRICE_FOUNDING_CENTS` | nee | Prijs in centen, standaard `9700` |
| `ALLOWED_ORIGINS` | nee | Komma-gescheiden lijst voor de redirect na betaling; standaard de eigen domeinen |
| `WEBHOOK_SECRET` | ja | De Edge Function `process-content` weigert aanvragen als dit ontbreekt |

### Gewijzigde functiesignatuur

- `generate_shopping_list(p_week INT)` — de oude variant met `p_user_id` is verwijderd.
- `get_invitation_by_token(p_token TEXT)` — nieuw, vervangt de publieke SELECT op `invitations`.
