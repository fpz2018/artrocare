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
netlify/
  functions/     - Netlify serverless functions (future)
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
