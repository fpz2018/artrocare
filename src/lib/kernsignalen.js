// =============================================
// Kernsignalen — datamodel, defaults & scoring
// Eén bron van waarheid voor de drie kernsignalen. De Edge Function
// (analyze-day) herhaalt dezelfde scoring server-side in TypeScript;
// houd beide in sync bij wijzigingen.
// =============================================

// Doelen (uit het prototype / de spec)
export const DOELEN = {
  beweeg: { ochtend: 3, middag: 3, avond: 4, totaal: 10 }, // ademloze minuten
  voed: { groente: 5, fruit: 4, score: 7 },
  herstel: { score: 5 },
};

// Drempels waarbij een signaal als "behaald" telt (de signaal-dots).
export const DREMPELS = {
  beweeg: 10, // minuten
  voed: 5, //   /7
  herstel: 4, // /5
};

// Lege dag — gebruikt als een dag nog niet bestaat in de database.
export function legeDag() {
  return {
    beweeg: { ochtend: 0, middag: 0, avond: 0 },
    voed: {
      groente: 0,
      fruit: 0,
      volkoren: false,
      noten_peulvruchten: false,
      omega3: false,
      geen_suikerdrank: false,
      geen_bewerkt_vlees: false,
    },
    herstel: {
      slaap_duur: false,
      ochtendlicht: false,
      vaste_waaktijd: false,
      laatste_hap: false,
      geen_alcohol: false,
      uren: 0,
    },
  };
}

// Vult ontbrekende velden aan zodat oudere/partiële rijen veilig te
// renderen zijn (jsonb kan velden missen na een spec-wijziging).
export function normaliseer(entry) {
  const leeg = legeDag();
  return {
    beweeg: { ...leeg.beweeg, ...(entry?.beweeg || {}) },
    voed: { ...leeg.voed, ...(entry?.voed || {}) },
    herstel: { ...leeg.herstel, ...(entry?.herstel || {}) },
  };
}

// De 5 ja/nee-items van Voed (naast de porties-tellers).
export const VOED_JANEE = [
  'volkoren',
  'noten_peulvruchten',
  'omega3',
  'geen_suikerdrank',
  'geen_bewerkt_vlees',
];

// De 5 slaapvragen van Herstel.
export const HERSTEL_VRAGEN = [
  'slaap_duur',
  'ochtendlicht',
  'vaste_waaktijd',
  'laatste_hap',
  'geen_alcohol',
];

// ─── Scoring ────────────────────────────────────────────────────────────────

export function beweegTotaal(beweeg) {
  const b = beweeg || {};
  return (Number(b.ochtend) || 0) + (Number(b.middag) || 0) + (Number(b.avond) || 0);
}

export function voedScore(voed) {
  const v = voed || {};
  let score = 0;
  if ((Number(v.groente) || 0) >= DOELEN.voed.groente) score++;
  if ((Number(v.fruit) || 0) >= DOELEN.voed.fruit) score++;
  for (const key of VOED_JANEE) if (v[key]) score++;
  return score; // 0..7
}

export function herstelScore(herstel) {
  const h = herstel || {};
  let score = 0;
  for (const key of HERSTEL_VRAGEN) if (h[key]) score++;
  return score; // 0..5
}

// Welke van de drie signalen zijn behaald voor deze dag?
export function signalen(entry) {
  const e = normaliseer(entry);
  return {
    beweeg: beweegTotaal(e.beweeg) >= DREMPELS.beweeg,
    voed: voedScore(e.voed) >= DREMPELS.voed,
    herstel: herstelScore(e.herstel) >= DREMPELS.herstel,
  };
}

// Aantal behaalde signalen (0..3) — een dag is "compleet" bij 3/3.
export function aantalBehaald(entry) {
  const s = signalen(entry);
  return (s.beweeg ? 1 : 0) + (s.voed ? 1 : 0) + (s.herstel ? 1 : 0);
}

// ─── Reeks-teller (streak) ──────────────────────────────────────────────────
// Aantal aaneengesloten dagen met 3/3 signalen, terugtellend vanaf `tot`
// (standaard vandaag). `entriesByDate` is een map { 'YYYY-MM-DD': entry }.
export function berekenStreak(entriesByDate, tot = isoVandaag()) {
  let streak = 0;
  const d = new Date(tot + 'T00:00:00');
  // Als de laatste dag (bv. vandaag) nog niet 3/3 is, kijken we of de
  // reeks tot gisteren loopt — een nog niet afgemaakte dag breekt de reeks
  // niet zolang die niet negatief telt.
  for (let i = 0; i < 3660; i++) {
    const key = isoVanDatum(d);
    const entry = entriesByDate[key];
    const behaald = entry ? aantalBehaald(entry) === 3 : false;
    if (behaald) {
      streak++;
    } else if (i === 0) {
      // Vandaag nog niet compleet: sla over en tel vanaf gisteren.
    } else {
      break;
    }
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// ─── Datum-helpers (lokale tijd, geen UTC-verschuiving) ──────────────────────

export function isoVanDatum(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isoVandaag() {
  return isoVanDatum(new Date());
}

export function verschuifDag(iso, delta) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return isoVanDatum(d);
}

const WEEKDAGEN = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
const MAANDEN = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];

export function leesbareDatum(iso) {
  const d = new Date(iso + 'T00:00:00');
  const vandaag = isoVandaag();
  if (iso === vandaag) return 'Vandaag';
  if (iso === verschuifDag(vandaag, -1)) return 'Gisteren';
  return `${WEEKDAGEN[d.getDay()]} ${d.getDate()} ${MAANDEN[d.getMonth()]}`;
}
