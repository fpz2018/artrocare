// Staat elk databasebestand in de installatielijst, en klopt de lijst?
//
// Aanleiding: een externe code-analyse (30-09-2026) wees erop dat
// supabase/schema.sql de rechten wijd open zette en dat de README een verse
// installatie juist daarheen stuurde. Het afschermen gebeurde pas in de
// migraties erna. Wie er één overslaat — of er één toevoegt zonder hem in de
// lijst te zetten — houdt oude rechten.
//
// Deze test bewaakt dus geen gedrag maar een belofte: db/INSTALLATIE.md is
// compleet, het schema draagt zijn waarschuwing, en de README verwijst naar
// de volledige volgorde in plaats van naar het schema alleen.
//
// Draait mee in `npm test`. De inhoudelijke aanvalstests staan in
// supabase/tests/run-security.sh en hebben een PostgreSQL nodig.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const hier = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(hier, '..');

const lees = (p) => fs.readFileSync(path.join(repo, p), 'utf8');
const bestaat = (p) => fs.existsSync(path.join(repo, p));

describe('installatievolgorde van de database', () => {
  const lijstPad = 'db/INSTALLATIE.md';

  it('heeft een installatielijst', () => {
    expect(bestaat(lijstPad), `${lijstPad} ontbreekt`).toBe(true);
  });

  it('noemt elk databasebestand in de installatielijst', () => {
    const lijst = lees(lijstPad);
    const bestanden = fs
      .readdirSync(path.join(repo, 'supabase/migrations'))
      .filter((f) => f.endsWith('.sql'));

    expect(bestanden.length).toBeGreaterThan(0);

    const ontbreekt = bestanden.filter((f) => !lijst.includes(f));
    expect(ontbreekt, `niet genoemd in ${lijstPad}: ${ontbreekt.join(', ')}`).toEqual([]);
  });

  it('noemt geen bestanden die niet bestaan', () => {
    const lijst = lees(lijstPad);
    const genoemd = [
      ...new Set(
        (lijst.match(/supabase\/(?:migrations\/)?[A-Za-z0-9._-]+\.sql/g) || []).map((s) =>
          s.replace(/^supabase\//, ''),
        ),
      ),
    ];
    expect(genoemd.length).toBeGreaterThan(0);

    const verdwenen = genoemd.filter((f) => !bestaat(`supabase/${f}`));
    expect(verdwenen, `bestaat niet: ${verdwenen.join(', ')}`).toEqual([]);
  });

  it('zet de migraties op oplopend versienummer', () => {
    const lijst = lees(lijstPad);
    const inLijst = (lijst.match(/supabase\/migrations\/(\d+)[A-Za-z0-9._-]*\.sql/g) || []).map(
      (s) => Number(s.match(/(\d+)/)[1]),
    );
    expect(inLijst.length).toBeGreaterThan(0);
    expect(inLijst).toEqual([...inLijst].sort((a, b) => a - b));
  });

  it('laat het basisschema waarschuwen dat het het beginpunt is', () => {
    const kop = lees('supabase/schema.sql').slice(0, 3000);
    expect(kop).toMatch(/LET OP/i);
    expect(kop).toMatch(/INSTALLATIE\.md/);
  });

  it('laat de README naar de volledige installatievolgorde verwijzen', () => {
    expect(lees('README.md')).toMatch(/INSTALLATIE\.md/);
  });

  it('houdt het basisschema vrij van open insert-policies', () => {
    // De wachtlijst is de enige uitzondering: een bezoeker mag zich inschrijven.
    const sql = lees('supabase/schema.sql');
    const open = [...sql.matchAll(/CREATE POLICY\s+"([^"]+)"[^;]*?WITH CHECK \(true\)/gs)].map(
      (m) => m[1],
    );
    expect(open, `open insert-policies gevonden: ${open.join(', ')}`).toEqual([
      'Iedereen mag zich aanmelden',
    ]);
  });

  it('neemt de rol niet meer over uit registratiemetadata', () => {
    const sql = lees('supabase/schema.sql');
    // 'admin' mag niet in de lijst met toegestane rollen uit clientmetadata staan.
    expect(sql).not.toMatch(/WHEN v_role IN \([^)]*'admin'/);
    expect(sql).toMatch(/WHEN v_requested IN \('patient', 'practice_admin'\)/);
  });

  it('bevriest bevoorrechte profielkolommen', () => {
    const sql = lees('supabase/schema.sql');
    expect(sql).toMatch(/protect_profile_privileged_columns/);
    expect(sql).toMatch(/BEFORE UPDATE ON public\.profiles/);
  });

  it('filtert het uitnodigingstoken op status en vervaldatum', () => {
    // In het schema én in migratie 007: de laatste overschrijft de eerste.
    for (const bestand of ['supabase/schema.sql', 'supabase/migrations/007_security_hardening.sql']) {
      const sql = lees(bestand);
      const marker = 'FUNCTION public.get_invitation_by_token';
      const start = sql.indexOf(marker);
      expect(start, `${bestand}: functie niet gevonden`).toBeGreaterThan(-1);
      const body = sql.slice(start, sql.indexOf('$$;', start));
      expect(body, `${bestand}: filtert niet op status`).toMatch(/i\.status = 'pending'/);
      expect(body, `${bestand}: filtert niet op vervaldatum`).toMatch(/i\.expires_at > NOW\(\)/);
    }
  });
});
