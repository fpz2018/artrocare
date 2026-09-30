# Installatie van de ArtroCare-database

Dit is de volgorde. Sla er niets van over.

## Waarom deze bladzijde bestaat

Tot 30-09-2026 verwees de README voor een verse installatie alleen naar
`supabase/schema.sql`. Dat bestand zette op dat moment acht policies op
`WITH CHECK (true)` en nam de rol van een gebruiker over uit de
registratiemetadata. Wie de README volgde, kreeg daardoor een database die
openstond voor iedereen met de publieke anon-sleutel — en die sleutel staat
gewoon in de JavaScript van de app.

`supabase/schema.sql` is op 30-09-2026 veilig gemaakt: de definities in dat
bestand zijn nu dezelfde als die in de migraties. Maar het blijft het
**beginpunt**, niet de hele installatie. De migraties daarna voegen tabellen,
functies en rechten toe die de app nodig heeft.

## Volgorde

Draai deze bestanden in deze volgorde in de Supabase SQL-editor:

1. `supabase/schema.sql` — tabellen, rollen, policies, basisfuncties
2. `supabase/migrations/002_program_structure.sql`
3. `supabase/migrations/003_recipes.sql`
4. `supabase/migrations/004_fix_approve_recipe_import.sql`
5. `supabase/migrations/005_exercise_media_bucket.sql`
6. `supabase/migrations/006_kernsignalen.sql`
7. `supabase/migrations/007_security_hardening.sql`

Migratie 007 is herhaalbaar: hij gebruikt `DROP POLICY IF EXISTS` en
`CREATE OR REPLACE`, en verwijdert geen gegevens. Op een database die al
volgens deze lijst is opgebouwd, mag je hem opnieuw draaien.

## Nog niet klaar na stap 7

Na de database volgen nog:

- **Edge Function opnieuw deployen** — `supabase functions deploy process-content`.
  Zet `WEBHOOK_SECRET` in de secrets, anders weigert de functie alles.
- **Netlify deployen** — de frontend, de functions en de iconen.
- **Optioneel instellen** — `STRIPE_PRICE_FOUNDING_CENTS` en `ALLOWED_ORIGINS`
  hebben een veilige standaard.

## Controle na de installatie

Deze query hoort **nul rijen** te geven. Elke rij die je hier ziet, is een
policy die inserts of alle handelingen openzet voor iedereen:

```sql
SELECT tablename, policyname
  FROM pg_policies
 WHERE schemaname = 'public'
   AND qual = 'true'
   AND cmd IN ('INSERT', 'ALL');
```

De enige uitzondering die hoort te blijven bestaan is de wachtlijst
(`Iedereen mag zich aanmelden`). Die is bedoeld: een bezoeker mag zich
inschrijven zonder account.

## Automatische controle

Er zijn twee tests die dit bewaken:

| Test | Wat hij doet | Draaien |
|---|---|---|
| `tests/installatie-volgorde.test.mjs` | Controleert dat elk migratiebestand in deze lijst staat, dat de lijst op volgorde staat, dat het schema zijn waarschuwing draagt en dat de README hierheen verwijst | `npm test` |
| `supabase/tests/run-security.sh` | Bouwt de database opnieuw op en doet veertig aanvallen als `anon` en als ingelogde gebruiker | `npm run test:security` |

De tweede test heeft een PostgreSQL nodig. Lokaal:

```bash
bash supabase/tests/run-security.sh
```

Of alleen het schema, om te controleren wat een installatie zonder migraties
oplevert:

```bash
bash supabase/tests/run-security.sh --schema-only
```

## Beheerderrechten toekennen

Na migratie 007 kan een gebruiker zijn eigen rol niet meer wijzigen. Dat is de
bedoeling. Beheerderrechten ken je toe in de Supabase-tabeleditor:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'iemand@voorbeeld.nl';
```

Doe dat alleen vanaf een directe databaseverbinding of met de service-role.
Via de API kan het niet meer, en dat is precies de bedoeling.
