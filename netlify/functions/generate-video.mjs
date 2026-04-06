// Netlify Scheduled + On-demand Function: Video Generation Pipeline
// Generates AI prompts for exercise videos and triggers n8n workflow
// Schedule: every night at 04:00 CET (03:00 UTC)
// On-demand: POST with exercise_id or batch mode

import { schedule } from '@netlify/functions';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// ─── Claude prompt generation ─────────────────────────────

async function generateVideoPrompt(exercise, apiKey) {
  const prompt = `Je bent een expert in het maken van medisch-accurate video prompts voor AI video generatie.
Maak een gedetailleerde video prompt voor de volgende artrose-oefening.

OEFENING:
- Titel (NL): ${exercise.title_nl}
- Titel (EN): ${exercise.title_en}
- Beschrijving: ${exercise.description_nl || 'Geen beschrijving'}
- Instructies: ${exercise.instructions_nl || 'Geen instructies'}
- Focus punten: ${(exercise.focus_points_nl || []).join(', ') || 'Geen'}
- Cirkel: ${exercise.circle || 'Onbekend'}
- Level: ${exercise.level || 1}
- Sets: ${exercise.sets || 3}
- Herhalingen: ${exercise.reps || 'Onbekend'}
- Duur: ${exercise.duration_minutes || 5} minuten
- Is NEMEX: ${exercise.is_nemex ? 'Ja' : 'Nee'}

VEREISTEN voor de video prompt:
1. De video moet een persoon laten zien die de oefening correct uitvoert
2. Rustige, klinische setting (fysiopraktijk of lichte woonkamer)
3. Duidelijk zichtbare lichaamspositie en gewrichten
4. Langzame, gecontroleerde bewegingen
5. Neutrale achtergrond, goede belichting
6. De persoon moet er fit maar niet te atletisch uitzien (herkenbaar voor artrose-patiënten)
7. Kleding: sportkleding, neutrale kleuren

Geef je antwoord EXACT in het volgende JSON-formaat (geen markdown, alleen valid JSON):
{
  "prompt_en": "Detailed English prompt for the AI video generator (ImagineArt). Include scene description, camera angle, lighting, subject appearance, movement details. Max 500 characters.",
  "negative_prompt": "Things to avoid in the video generation",
  "style_tags": ["list", "of", "style", "keywords"],
  "recommended_duration_seconds": 10,
  "camera_angle": "front/side/45-degree"
}`;

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      temperature: 0.4,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in Claude response');

  return JSON.parse(jsonMatch[0]);
}

// ─── Supabase helpers ─────────────────────────────────────

async function supabaseRequest(path, supabaseUrl, serviceKey, method = 'GET', body = null, extraHeaders = {}) {
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  if (method === 'POST') headers.Prefer = 'return=representation';
  if (method === 'PATCH') headers.Prefer = 'return=representation';

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${supabaseUrl}/rest/v1${path}`, opts);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase ${method} ${path} failed (${res.status}): ${errText}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ─── n8n webhook trigger ──────────────────────────────────

async function triggerN8nWorkflow(jobData, n8nWebhookUrl, webhookSecret) {
  const res = await fetch(n8nWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': webhookSecret,
    },
    body: JSON.stringify(jobData),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`n8n webhook failed (${res.status}): ${errText}`);
  }

  return res.json().catch(() => ({ ok: true }));
}

// ─── Process single exercise ──────────────────────────────

async function processExercise(exercise, env, triggeredBy, triggerType) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, N8N_VIDEO_WEBHOOK_URL, VIDEO_WEBHOOK_SECRET } = env;

  // Create job record
  const [job] = await supabaseRequest('/video_jobs', SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, 'POST', {
    exercise_id: exercise.id,
    status: 'generating_prompt',
    triggered_by: triggeredBy,
    trigger_type: triggerType,
    started_at: new Date().toISOString(),
  });

  try {
    // Step 1: Generate prompt with Claude
    console.log(`Generating prompt for exercise: ${exercise.title_nl}`);
    const promptData = await generateVideoPrompt(exercise, ANTHROPIC_API_KEY);

    // Update job with prompt
    await supabaseRequest(
      `/video_jobs?id=eq.${job.id}`,
      SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, 'PATCH',
      {
        status: 'sending_to_ai',
        prompt_text: promptData.prompt_en,
        updated_at: new Date().toISOString(),
      }
    );

    // Step 2: Trigger n8n workflow (handles ImagineArt, FFmpeg, upload)
    if (N8N_VIDEO_WEBHOOK_URL) {
      await triggerN8nWorkflow({
        job_id: job.id,
        exercise_id: exercise.id,
        exercise_title_nl: exercise.title_nl,
        exercise_title_en: exercise.title_en,
        exercise_sets: exercise.sets,
        exercise_reps: exercise.reps,
        exercise_duration: exercise.duration_minutes,
        exercise_instructions_nl: exercise.instructions_nl,
        prompt_en: promptData.prompt_en,
        negative_prompt: promptData.negative_prompt,
        style_tags: promptData.style_tags,
        recommended_duration: promptData.recommended_duration_seconds,
        camera_angle: promptData.camera_angle,
        overlay_config: job.overlay_config || {
          show_intro: true,
          show_outro: true,
          show_logo: true,
          show_title: true,
          show_instructions: true,
          brand_color: '#0EA5E9',
        },
      }, N8N_VIDEO_WEBHOOK_URL, VIDEO_WEBHOOK_SECRET);

      await supabaseRequest(
        `/video_jobs?id=eq.${job.id}`,
        SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, 'PATCH',
        { status: 'generating_video', updated_at: new Date().toISOString() }
      );
    } else {
      // No n8n configured — store prompt and mark as pending external processing
      await supabaseRequest(
        `/video_jobs?id=eq.${job.id}`,
        SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, 'PATCH',
        {
          status: 'generating_video',
          error_message: 'N8N_VIDEO_WEBHOOK_URL niet geconfigureerd — prompt gegenereerd, wacht op handmatige verwerking',
          updated_at: new Date().toISOString(),
        }
      );
    }

    return { success: true, job_id: job.id, exercise: exercise.title_nl };
  } catch (err) {
    console.error(`Error processing ${exercise.title_nl}:`, err.message);

    await supabaseRequest(
      `/video_jobs?id=eq.${job.id}`,
      SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, 'PATCH',
      {
        status: 'failed',
        error_message: err.message,
        updated_at: new Date().toISOString(),
      }
    );

    return { success: false, job_id: job.id, exercise: exercise.title_nl, error: err.message };
  }
}

// ─── Core handler ─────────────────────────────────────────

async function handler(event) {
  const env = {
    SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    N8N_VIDEO_WEBHOOK_URL: process.env.N8N_VIDEO_WEBHOOK_URL,
    VIDEO_WEBHOOK_SECRET: process.env.VIDEO_WEBHOOK_SECRET,
  };

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.ANTHROPIC_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing required environment variables' }) };
  }

  // Determine mode: scheduled (auto-batch) or on-demand
  const isScheduled = !event.body;
  let exerciseIds = [];
  let triggeredBy = null;
  let triggerType = 'scheduled';

  if (!isScheduled) {
    try {
      const body = JSON.parse(event.body);
      exerciseIds = body.exercise_ids || (body.exercise_id ? [body.exercise_id] : []);
      triggeredBy = body.triggered_by || null;
      triggerType = exerciseIds.length > 1 ? 'batch' : 'manual';
    } catch {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }
  }

  try {
    let exercises;

    if (exerciseIds.length > 0) {
      // On-demand: specific exercises
      exercises = await supabaseRequest(
        `/exercises?id=in.(${exerciseIds.join(',')})&select=*`,
        env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY
      );
    } else {
      // Scheduled/batch: all exercises without video
      exercises = await supabaseRequest(
        '/exercises?has_video=eq.false&select=*&order=sort_order',
        env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Filter out exercises that already have a pending/in-progress job
      const activeJobs = await supabaseRequest(
        '/video_jobs?status=not.in.(done,failed)&select=exercise_id',
        env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY
      );
      const activeExerciseIds = new Set((activeJobs || []).map(j => j.exercise_id));
      exercises = (exercises || []).filter(e => !activeExerciseIds.has(e.id));
    }

    if (!exercises || exercises.length === 0) {
      console.log('No exercises need video generation');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No exercises need video generation', processed: 0 }),
      };
    }

    // Limit batch size to prevent timeout (15 min max)
    const maxBatch = isScheduled ? 5 : 10;
    const batch = exercises.slice(0, maxBatch);

    console.log(`Processing ${batch.length} exercises for video generation`);

    const results = [];
    for (const exercise of batch) {
      const result = await processExercise(exercise, env, triggeredBy, triggerType);
      results.push(result);
    }

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Video generation triggered: ${succeeded} succeeded, ${failed} failed`,
        processed: results.length,
        succeeded,
        failed,
        results,
      }),
    };
  } catch (err) {
    console.error('Generate-video error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}

// ─── Export: schedule + on-demand ──────────────────────────

const scheduledHandler = schedule('0 3 * * *', handler);

export { scheduledHandler as handler };
export default handler;
