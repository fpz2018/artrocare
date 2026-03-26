// =============================================
// Supabase Edge Function: process-content
// Ontvangt webhook van n8n met geëxtraheerde tekst,
// analyseert via Claude, schrijft voorstellen naar Supabase.
//
// POST /functions/v1/process-content
// Header: x-webhook-secret: <WEBHOOK_SECRET>
// Body: zie ProcessContentRequest hieronder
// =============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProcessContentRequest {
  title: string;           // Titel van het document
  source_type: 'pdf' | 'youtube' | 'article' | 'url' | 'manual';
  source_url?: string;     // Google Drive URL, YouTube URL, etc.
  drive_file_id?: string;  // Google Drive bestand-ID (voor deduplicatie)
  extracted_text: string;  // Volledige tekst of transcript
  language?: 'nl' | 'en'; // Taal van de bron (standaard: nl)
}

interface ClauseProposal {
  target_table: 'supplements' | 'exercises' | 'lessons';
  target_record_id: string;
  target_record_name: string;
  change_summary_nl: string;
  current_values: Record<string, unknown>;
  proposed_values: Record<string, unknown>;
  ai_reasoning_nl: string;
  evidence_quote?: string;
  confidence_score: number;
}

interface ClaudeResponse {
  proposals: ClauseProposal[];
}

// ─── CORS headers ─────────────────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

// ─── Helper: Claude aanroepen ─────────────────────────────────────────────────

async function callClaude(prompt: string): Promise<ClaudeResponse> {
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
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API fout (${response.status}): ${err}`);
  }

  const result = await response.json();
  const text = result.content?.[0]?.text || '';

  // Extraheer JSON uit Claude's antwoord (Claude omsluit het soms met tekst)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Claude retourneerde geen geldige JSON');

  return JSON.parse(jsonMatch[0]) as ClaudeResponse;
}

// ─── Helper: Huidige databaseinhoud ophalen ───────────────────────────────────

async function fetchCurrentProtocols(supabase: ReturnType<typeof createClient>) {
  const [supplementsRes, exercisesRes, lessonsRes] = await Promise.all([
    supabase
      .from('supplements')
      .select('id, name_nl, description_nl, dosage_nl, timing_nl, evidence_level, benefits_nl, safety_notes_nl'),
    supabase
      .from('exercises')
      .select('id, title_nl, description_nl, instructions_nl, level, sets, reps, duration_minutes'),
    supabase
      .from('lessons')
      .select('id, title_nl, summary_nl, key_takeaways_nl, category'),
  ]);

  return {
    supplements: supplementsRes.data || [],
    exercises: exercisesRes.data || [],
    lessons: lessonsRes.data || [],
  };
}

// ─── De centrale Claude-prompt ────────────────────────────────────────────────
// Geeft Claude exacte instructies: wat analyseren, hoe rapporteren, in welk formaat.

function buildPrompt(
  extractedText: string,
  protocols: Awaited<ReturnType<typeof fetchCurrentProtocols>>
): string {
  // Beperk tekst tot ~40.000 tekens om tokenkosten te beheersen
  const text = extractedText.slice(0, 40_000);

  return `Je bent een medisch-inhoudelijk analist voor de Artrocare-app, een beweeggericht zelfmanagementplatform voor artrosepatiënten (knie/heup) in Nederland.

## Jouw taak
Analyseer de wetenschappelijke bron hieronder en vergelijk de bevindingen met de huidige protocollen in de app. Genereer alleen voorstellen voor wijzigingen die:
1. **Direct bruikbaar** zijn door een fysiotherapeut of orthomoleculair therapeut
2. **Onderbouwd** zijn door een duidelijk citaat of bevinding in de bron
3. **Realistisch** zijn: kleine, precieze aanpassingen (dosering, formulering, evidenceniveau)
4. Een **confidence score ≥ 60** hebben

Wees conservatief. Stel alleen voor wat de bron echt ondersteunt. Geen speculatie.

## Huidige app-inhoud

### Supplementen
${JSON.stringify(protocols.supplements, null, 2)}

### Oefeningen
${JSON.stringify(protocols.exercises, null, 2)}

### Lessen / Educatieve inhoud
${JSON.stringify(protocols.lessons, null, 2)}

## Nieuw wetenschappelijk document
${text}

## Instructies voor het antwoord
Geef je antwoord **uitsluitend** als geldige JSON in dit exacte formaat. Geen uitleg buiten de JSON.

{
  "proposals": [
    {
      "target_table": "supplements" | "exercises" | "lessons",
      "target_record_id": "<exacte UUID uit de lijsten hierboven>",
      "target_record_name": "<leesbare naam van het record>",
      "change_summary_nl": "<één zin: wat wijzigt er en waarom>",
      "current_values": {
        "<veldnaam>": "<huidige waarde>"
      },
      "proposed_values": {
        "<veldnaam>": "<nieuwe waarde>"
      },
      "ai_reasoning_nl": "<2-4 zinnen: waarom is deze wijziging wetenschappelijk gerechtvaardigd op basis van de bron?>",
      "evidence_quote": "<directe quote uit de bron die het voorstel onderbouwt>",
      "confidence_score": <getal 0-100>
    }
  ]
}

Als er geen relevante wijzigingen zijn, geef dan: { "proposals": [] }`;
}

// ─── Hoofdfunctie ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Alleen POST toegestaan
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Alleen POST toegestaan' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Authenticatie: webhook secret valideren ──────────────────────────────
  const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
  const incomingSecret = req.headers.get('x-webhook-secret');

  if (webhookSecret && incomingSecret !== webhookSecret) {
    return new Response(JSON.stringify({ error: 'Ongeldige webhook secret' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Supabase client (service role = bypast RLS) ───────────────────────────
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  let sourceId: string | null = null;

  try {
    // ── 1. Request body parsen ───────────────────────────────────────────────
    const body: ProcessContentRequest = await req.json();

    if (!body.title || !body.source_type || !body.extracted_text) {
      return new Response(
        JSON.stringify({ error: 'Verplichte velden ontbreken: title, source_type, extracted_text' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── 2. Deduplicatie: zelfde drive_file_id al verwerkt? ───────────────────
    if (body.drive_file_id) {
      const { data: existing } = await supabase
        .from('content_sources')
        .select('id, processing_status')
        .eq('drive_file_id', body.drive_file_id)
        .single();

      if (existing && existing.processing_status === 'done') {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Dit bestand is al eerder verwerkt',
            source_id: existing.id,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    // ── 3. Content source aanmaken in DB ─────────────────────────────────────
    const { data: source, error: sourceError } = await supabase
      .from('content_sources')
      .insert({
        title: body.title,
        source_type: body.source_type,
        source_url: body.source_url || null,
        drive_file_id: body.drive_file_id || null,
        extracted_text: body.extracted_text,
        word_count: body.extracted_text.split(/\s+/).length,
        language: body.language || 'nl',
        processing_status: 'analyzing',
      })
      .select('id')
      .single();

    if (sourceError || !source) throw new Error(`Source aanmaken mislukt: ${sourceError?.message}`);
    sourceId = source.id;

    // ── 4. Huidige protocollen ophalen ───────────────────────────────────────
    const protocols = await fetchCurrentProtocols(supabase);

    // ── 5. Claude aanroepen ──────────────────────────────────────────────────
    const prompt = buildPrompt(body.extracted_text, protocols);
    const claudeResult = await callClaude(prompt);
    const proposals = claudeResult.proposals || [];

    // ── 6. Voorstellen valideren en opslaan ──────────────────────────────────
    let insertedCount = 0;

    for (const proposal of proposals) {
      // Veiligheidscheck: target_table moet geldig zijn
      if (!['supplements', 'exercises', 'lessons'].includes(proposal.target_table)) continue;
      // confidence_score onder drempel? Overslaan.
      if ((proposal.confidence_score || 0) < 60) continue;
      // Leeg voorstel? Overslaan.
      if (!proposal.proposed_values || Object.keys(proposal.proposed_values).length === 0) continue;

      const { error: propError } = await supabase.from('content_proposals').insert({
        source_id: sourceId,
        target_table: proposal.target_table,
        target_record_id: proposal.target_record_id || null,
        target_record_name: proposal.target_record_name,
        change_summary_nl: proposal.change_summary_nl,
        current_values: proposal.current_values || {},
        proposed_values: proposal.proposed_values,
        ai_reasoning_nl: proposal.ai_reasoning_nl,
        evidence_quote: proposal.evidence_quote || null,
        confidence_score: proposal.confidence_score,
        status: 'pending',
      });

      if (!propError) insertedCount++;
    }

    // ── 7. Source markeren als klaar ─────────────────────────────────────────
    await supabase
      .from('content_sources')
      .update({
        processing_status: 'done',
        processed_at: new Date().toISOString(),
        proposals_generated: insertedCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sourceId);

    // ── 8. Klaar ─────────────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        source_id: sourceId,
        proposals_generated: insertedCount,
        message: `Verwerking klaar: ${insertedCount} voorstel(len) aangemaakt`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('process-content fout:', error);

    // Source markeren als mislukt
    if (sourceId) {
      await supabase
        .from('content_sources')
        .update({
          processing_status: 'error',
          error_message: error instanceof Error ? error.message : String(error),
          updated_at: new Date().toISOString(),
        })
        .eq('id', sourceId);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Onbekende fout',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
