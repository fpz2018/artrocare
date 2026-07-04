// =============================================
// Supabase Edge Function: analyze-day
// Ontvangt een datum, leest de dag + trend (laatste 5 dagen) van de
// INGELOGDE gebruiker, laat Claude een kort NL-advies schrijven en slaat
// dat op bij de dag-entry.
//
// POST /functions/v1/analyze-day
// Header: Authorization: Bearer <supabase access token van de gebruiker>
// Body:   { "date": "YYYY-MM-DD" }
//
// De Anthropic API-key staat uitsluitend server-side (Supabase secret).
// De frontend krijgt hem nooit te zien.
// =============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalyzeRequest {
  date: string; // YYYY-MM-DD
}

interface Entry {
  date: string;
  beweeg: Record<string, unknown>;
  voed: Record<string, unknown>;
  herstel: Record<string, unknown>;
}

// ─── CORS ─────────────────────────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

// ─── Scoring (spiegelt src/lib/kernsignalen.js) ────────────────────────────────

const DREMPELS = { beweeg: 10, voed: 5, herstel: 4 };
const VOED_JANEE = ['volkoren', 'noten_peulvruchten', 'omega3', 'geen_suikerdrank', 'geen_bewerkt_vlees'];
const HERSTEL_VRAGEN = ['slaap_duur', 'ochtendlicht', 'vaste_waaktijd', 'laatste_hap', 'geen_alcohol'];

const num = (v: unknown) => Number(v) || 0;

function beweegTotaal(b: Record<string, unknown> = {}) {
  return num(b.ochtend) + num(b.middag) + num(b.avond);
}
function voedScore(v: Record<string, unknown> = {}) {
  let s = 0;
  if (num(v.groente) >= 5) s++;
  if (num(v.fruit) >= 4) s++;
  for (const k of VOED_JANEE) if (v[k]) s++;
  return s;
}
function herstelScore(h: Record<string, unknown> = {}) {
  let s = 0;
  for (const k of HERSTEL_VRAGEN) if (h[k]) s++;
  return s;
}

// ─── Prompt (hergebruikt de logica van analyzeDay uit het prototype) ───────────

function buildPrompt(vandaag: Entry, trend: Entry[]): string {
  const b = beweegTotaal(vandaag.beweeg);
  const v = voedScore(vandaag.voed);
  const h = herstelScore(vandaag.herstel);

  const trendRegels = trend
    .map((e) => {
      const bb = beweegTotaal(e.beweeg);
      const vv = voedScore(e.voed);
      const hh = herstelScore(e.herstel);
      const dots = (bb >= DREMPELS.beweeg ? 1 : 0) + (vv >= DREMPELS.voed ? 1 : 0) + (hh >= DREMPELS.herstel ? 1 : 0);
      return `- ${e.date}: beweeg ${bb} min, voed ${vv}/7, herstel ${hh}/5 → ${dots}/3 signalen`;
    })
    .join('\n');

  return `Je bent een warme, nuchtere leefstijlcoach in een Nederlandse artrose-zelfmanagementapp. Een gebruiker houdt dagelijks drie kernsignalen bij: BEWEEG (ademloze minuten, doel ≥10), VOED (groente/fruit + gezonde keuzes, doel ≥5/7) en HERSTEL (slaapgewoonten, doel ≥4/5).

## Dag van vandaag (${vandaag.date})
- BEWEEG: ${b} ademloze minuten (ochtend ${num(vandaag.beweeg.ochtend)}, middag ${num(vandaag.beweeg.middag)}, avond ${num(vandaag.beweeg.avond)}) — doel ≥10
- VOED: ${v}/7 (groente ${num(vandaag.voed.groente)}/5, fruit ${num(vandaag.voed.fruit)}/4; ja/nee: ${VOED_JANEE.map((k) => `${k}=${vandaag.voed[k] ? 'ja' : 'nee'}`).join(', ')}) — doel ≥5
- HERSTEL: ${h}/5 (${HERSTEL_VRAGEN.map((k) => `${k}=${vandaag.herstel[k] ? 'ja' : 'nee'}`).join(', ')}; uren geslapen: ${num(vandaag.herstel.uren)}) — doel ≥4

## Trend laatste dagen
${trendRegels || '(geen eerdere dagen)'}

## Opdracht
Schrijf een kort, persoonlijk advies in het Nederlands van MAXIMAAL 120 woorden. Benoem concreet: (1) welk signaal vandaag het sterkst was, (2) welk signaal het zwakst was, en (3) precies één kleine, haalbare aanpassing voor morgen. Spreek de gebruiker direct aan (je/jij), positief en zonder medisch jargon. Geef alleen de adviestekst terug, geen kopjes, opsomming of JSON.`;
}

// ─── Claude aanroepen ──────────────────────────────────────────────────────────

async function callClaude(prompt: string): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY niet ingesteld');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API fout (${response.status}): ${err}`);
  }

  const result = await response.json();
  return (result.content?.[0]?.text || '').trim();
}

// ─── Hoofdfunctie ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Alleen POST toegestaan' }, 405);

  // ── Auth: gebruik het access token van de ingelogde gebruiker zodat RLS
  //    geldt en we weten wie de aanvraag doet. ────────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Niet ingelogd (geen Authorization header)' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return json({ error: 'Ongeldige sessie' }, 401);

  try {
    const body: AnalyzeRequest = await req.json();
    if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return json({ error: 'Ongeldige of ontbrekende datum (YYYY-MM-DD)' }, 400);
    }

    // ── Dag + trend ophalen (RLS beperkt automatisch tot deze gebruiker) ──────
    const { data: rows, error: readError } = await supabase
      .from('daily_entries')
      .select('date, beweeg, voed, herstel')
      .lte('date', body.date)
      .order('date', { ascending: false })
      .limit(6); // vandaag + 5 dagen trend

    if (readError) throw new Error(`Dag ophalen mislukt: ${readError.message}`);

    const vandaag = (rows || []).find((r) => r.date === body.date) as Entry | undefined;
    if (!vandaag) {
      return json({ error: 'Sla eerst je dag op voordat je een analyse maakt.' }, 404);
    }
    // De 5 dagen vóór vandaag als trend (nieuw → oud).
    const trend = ((rows || []) as Entry[]).filter((r) => r.date !== body.date).slice(0, 5);

    // ── Claude ────────────────────────────────────────────────────────────────
    const analysis = await callClaude(buildPrompt(vandaag, trend));
    if (!analysis) throw new Error('Claude gaf een leeg antwoord');

    // ── Opslaan bij de dag-entry ──────────────────────────────────────────────
    const { error: saveError } = await supabase
      .from('daily_entries')
      .update({
        ai_analysis: analysis,
        ai_analysis_generated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('date', body.date);

    if (saveError) throw new Error(`Analyse opslaan mislukt: ${saveError.message}`);

    return json({ analysis });
  } catch (error) {
    console.error('analyze-day fout:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Onbekende fout' },
      500,
    );
  }
});
