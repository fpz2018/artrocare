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
2. Run the schema in `supabase/schema.sql` in the SQL Editor
3. Copy your project URL and anon key

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
  schema.sql     - Database schema + RLS + seed data
  migrations/    - Incremental SQL migrations (006 = Kernsignalen)
  functions/     - Supabase Edge Functions (analyze-day = Kernsignalen AI)
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
- **Optimized deps**: Removed unused libraries (three.js, moment, etc.)

## Security Improvements

- **Supabase RLS**: Row Level Security on all tables
- **DOMPurify**: All user input sanitized before storage
- **CSP Headers**: Strict Content Security Policy via Netlify headers
- **Auth guards**: Server-side auth via Supabase, client-side route protection
- **Rate limiting**: Client-side cooldowns for email/message actions
- **Input validation**: Max lengths, type constraints, Zod schemas
- **HTTPS only**: Strict Transport Security headers
- **No localStorage tokens**: Supabase handles session securely
