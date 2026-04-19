// Netlify Scheduled + On-demand Function: Recipe Import Pipeline
// Google Sheet → fetch HTML → Gemini extract → Supabase storage
// Schedule: every night at 04:00 CET (03:00 UTC)

import { schedule } from '@netlify/functions';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Per-request timeouts (ms). Prevents the function from hanging on a slow
// upstream and hitting Netlify's inactivity timeout.
const TIMEOUT_SHEET_MS = 8000;
const TIMEOUT_PAGE_MS = 8000;
const TIMEOUT_GEMINI_MS = 20000;
const TIMEOUT_IMAGE_FETCH_MS = 8000;
const TIMEOUT_IMAGE_UPLOAD_MS = 12000;
const TIMEOUT_SUPABASE_MS = 10000;

async function fetchWithTimeout(url, options = {}, timeoutMs = 10000, label = 'request') {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error(`${label} timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Google Sheet CSV reader ──────────────────────────────

async function fetchSheetUrls(sheetId) {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  const res = await fetchWithTimeout(csvUrl, {}, TIMEOUT_SHEET_MS, 'Google Sheet fetch');
  if (!res.ok) throw new Error(`Google Sheet fetch failed: ${res.status}`);

  const csv = await res.text();
  const lines = csv.split('\n').map(line => line.trim()).filter(Boolean);

  // Skip header row
  if (lines.length < 2) return [];

  const urls = [];
  for (let i = 1; i < lines.length; i++) {
    // Parse CSV: handle quoted fields
    const cols = parseCsvLine(lines[i]);
    const url = (cols[0] || '').trim();
    const status = (cols[1] || '').trim().toLowerCase();

    // Only process URLs with empty status or 'new'
    if (url && url.startsWith('http') && (!status || status === 'new')) {
      urls.push(url);
    }
  }

  return urls;
}

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─── HTML fetcher ─────────────────────────────────────────

async function fetchPageHtml(url) {
  const res = await fetchWithTimeout(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ArtrocareBot/1.0)',
      'Accept': 'text/html',
    },
    redirect: 'follow',
  }, TIMEOUT_PAGE_MS, `Page fetch ${url}`);

  if (!res.ok) throw new Error(`Page fetch failed: ${res.status} for ${url}`);

  const html = await res.text();

  // Truncate very large pages (Gemini has token limits)
  if (html.length > 200000) {
    // Try to extract just the recipe-relevant portion
    const recipeSection = extractRecipeSection(html);
    return recipeSection || html.substring(0, 200000);
  }

  return html;
}

function extractRecipeSection(html) {
  // Try to find JSON-LD recipe schema first
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      const content = match.replace(/<\/?script[^>]*>/gi, '');
      if (content.includes('Recipe')) {
        // Return JSON-LD + head (for og tags) + truncated body
        const head = html.match(/<head[\s\S]*?<\/head>/i)?.[0] || '';
        return head + '\n<!-- JSON-LD -->\n' + content + '\n<!-- /JSON-LD -->\n' +
          html.substring(0, 100000);
      }
    }
  }

  // Fallback: return head + first 150KB
  const head = html.match(/<head[\s\S]*?<\/head>/i)?.[0] || '';
  return head + '\n' + html.substring(0, 150000);
}

// ─── Gemini recipe extraction ─────────────────────────────

async function extractRecipeWithGemini(html, sourceUrl, apiKey) {
  const prompt = `Extraheer het recept uit deze HTML pagina. Dit is voor een Nederlandse gezondheidsapp voor artrose-patiënten.

URL: ${sourceUrl}

Zoek ook de hoofdafbeelding — check in deze volgorde:
1. Open Graph meta tags (og:image)
2. JSON-LD schema (image veld)
3. Grote img tags binnen het recept-artikel

Geef terug als JSON (geen markdown, alleen valid JSON):
{
  "title_nl": "Nederlandse titel",
  "title_en": "English title",
  "description_nl": "Korte beschrijving in het Nederlands (1-2 zinnen, focus op gezondheidsvoordelen voor artrose)",
  "description_en": "Short description in English",
  "ingredients": [
    {"name_nl": "ingrediënt in NL", "name_en": "ingredient in EN", "amount": 200, "unit": "g", "category": "groente/fruit/vlees/vis/zuivel/granen/kruiden/overig"}
  ],
  "instructions_nl": "Stap 1: ...\\nStap 2: ...\\nStap 3: ...",
  "instructions_en": "Step 1: ...\\nStep 2: ...\\nStep 3: ...",
  "prep_time_minutes": 15,
  "cook_time_minutes": 30,
  "servings": 4,
  "image_url": "https://...",
  "calories": 350,
  "protein_g": 25,
  "tags": ["anti-inflammatoir", "omega-3", "vezel", "etc"],
  "difficulty": "easy/medium/hard",
  "season": "all/spring/summer/autumn/winter"
}

Richtlijnen:
- Vertaal ALLES naar zowel NL als EN
- Focus op anti-inflammatoire en gewrichtsvriendelijke eigenschappen bij beschrijving en tags
- Gebruik UITSLUITEND deze eenheden voor unit: g, ml, stuks, el, tl, snuf, plak, teen, tak, blik, zakje — GEEN andere waarden (bijv. kg → converteer naar g, liter → ml, eetlepel → el, theelepel → tl, stuk → stuks)
- Categoriseer ingrediënten met ALLEEN: groente, fruit, vlees, vis, zuivel, granen, kruiden, overig
- Als er geen afbeelding gevonden kan worden, zet image_url op null
- Antwoord ALLEEN in valid JSON

HTML:
${html}`;

  const res = await fetchWithTimeout(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4000,
      },
    }),
  }, TIMEOUT_GEMINI_MS, 'Gemini extract');

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in Gemini response');

  return JSON.parse(jsonMatch[0]);
}

// ─── Image upload to Supabase Storage ─────────────────────

async function uploadImageToStorage(imageUrl, importId, supabaseUrl, serviceKey) {
  if (!imageUrl) return null;

  try {
    const imgRes = await fetchWithTimeout(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ArtrocareBot/1.0)' },
      redirect: 'follow',
    }, TIMEOUT_IMAGE_FETCH_MS, 'Image fetch');

    if (!imgRes.ok) {
      console.warn(`Image fetch failed: ${imgRes.status} for ${imageUrl}`);
      return null;
    }

    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' :
                contentType.includes('webp') ? 'webp' :
                contentType.includes('gif') ? 'gif' : 'jpg';

    const arrayBuffer = await imgRes.arrayBuffer();
    const fileName = `${importId}.${ext}`;

    const uploadRes = await fetchWithTimeout(
      `${supabaseUrl}/storage/v1/object/recipe-images/${fileName}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': contentType,
          'x-upsert': 'true',
        },
        body: arrayBuffer,
      },
      TIMEOUT_IMAGE_UPLOAD_MS,
      'Image upload'
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.warn(`Image upload failed: ${err}`);
      return null;
    }

    return `${supabaseUrl}/storage/v1/object/public/recipe-images/${fileName}`;
  } catch (err) {
    console.warn(`Image processing error: ${err.message}`);
    return null;
  }
}

// ─── Supabase helpers ─────────────────────────────────────

async function supabaseRequest(url, supabaseUrl, serviceKey, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : undefined,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  Object.keys(opts.headers).forEach(k => opts.headers[k] === undefined && delete opts.headers[k]);

  const res = await fetchWithTimeout(`${supabaseUrl}/rest/v1${url}`, opts, TIMEOUT_SUPABASE_MS, `Supabase ${method} ${url}`);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase ${method} ${url} failed (${res.status}): ${errText}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ─── Core pipeline ────────────────────────────────────────

// Build a PostgREST query string using URLSearchParams so quotes, parens
// and commas inside values are encoded consistently.
function buildQuery(params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) sp.set(k, v);
  return sp.toString();
}

async function processImports(env) {
  console.log('Recipe import pipeline started:', new Date().toISOString());

  // 1. Read URLs from Google Sheet
  const urls = await fetchSheetUrls(env.SHEET_ID);
  console.log(`Found ${urls.length} URLs in sheet`);

  if (!urls.length) {
    return { sheet_urls: 0, already_done: 0, processed: 0, extracted: 0, errors: 0, error_details: [] };
  }

  // 2. Fetch existing imports so we know which URLs to skip or retry.
  //    Skip only URLs that reached a terminal state (extracted/approved/rejected);
  //    URLs in 'pending', 'fetching' or 'error' status should be retried.
  const inClause = urls.map(u => `"${u.replace(/"/g, '\\"')}"`).join(',');
  const existingQs = buildQuery({
    source_url: `in.(${inClause})`,
    select: 'id,source_url,status',
  });
  const existing = await supabaseRequest(
    `/recipe_imports?${existingQs}`,
    env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY
  );

  const TERMINAL = new Set(['extracted', 'approved', 'rejected']);
  const existingById = new Map();
  const alreadyDone = new Set();
  for (const row of existing || []) {
    if (TERMINAL.has(row.status)) {
      alreadyDone.add(row.source_url);
    } else {
      existingById.set(row.source_url, row.id);
    }
  }

  const toProcess = urls.filter(u => !alreadyDone.has(u));
  console.log(`${alreadyDone.size} already done, ${toProcess.length} to (re)process`);

  let extracted = 0;
  let errors = 0;
  const errorDetails = [];

  for (const url of toProcess) {
    let importId = existingById.get(url) || null;
    try {
      if (importId) {
        // Retry an existing failed/stuck import: reset to 'fetching'
        await supabaseRequest(
          `/recipe_imports?id=eq.${importId}`,
          env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, 'PATCH',
          { status: 'fetching', error_message: null, updated_at: new Date().toISOString() }
        );
      } else {
        const inserted = await supabaseRequest(
          '/recipe_imports', env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, 'POST',
          { source_url: url, status: 'fetching' }
        );
        importId = inserted?.[0]?.id;
        if (!importId) throw new Error('Failed to insert import record');
      }

      // Fetch page HTML
      console.log(`Fetching: ${url}`);
      const html = await fetchPageHtml(url);

      // Extract recipe with Gemini
      console.log(`Extracting recipe from: ${url}`);
      const recipeData = await extractRecipeWithGemini(html, url, env.GEMINI_KEY);
      await new Promise(r => setTimeout(r, 500)); // Rate limit

      // Upload image to Supabase Storage
      if (recipeData.image_url) {
        const storedImageUrl = await uploadImageToStorage(
          recipeData.image_url, importId, env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY
        );
        if (storedImageUrl) {
          recipeData.image_url = storedImageUrl;
        }
      }

      // Update import record with extracted data
      await supabaseRequest(
        `/recipe_imports?id=eq.${importId}`,
        env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, 'PATCH',
        {
          status: 'extracted',
          title: recipeData.title_nl || recipeData.title_en || 'Onbekend recept',
          extracted_data: recipeData,
          error_message: null,
          updated_at: new Date().toISOString(),
        }
      );

      extracted++;
      console.log(`Extracted: ${recipeData.title_nl || url}`);
    } catch (err) {
      console.error(`Error processing ${url}:`, err.message);
      errors++;
      errorDetails.push({ url, message: err.message.substring(0, 300) });

      // Try to mark the record as errored. If we have an id use that,
      // otherwise fall back to matching on source_url.
      const errorUpdate = {
        status: 'error',
        error_message: err.message.substring(0, 500),
        updated_at: new Date().toISOString(),
      };
      const errorPatchPath = importId
        ? `/recipe_imports?id=eq.${importId}`
        : `/recipe_imports?${buildQuery({ source_url: `eq.${url}` })}`;
      try {
        await supabaseRequest(errorPatchPath, env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, 'PATCH', errorUpdate);
      } catch (patchErr) {
        console.error(`Failed to write error status for ${url}:`, patchErr.message);
      }
    }
  }

  // Notify admin if new recipes extracted
  if (extracted > 0) {
    await supabaseRequest(
      `/profiles?role=eq.admin`,
      env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, 'PATCH',
      { pending_notifications: extracted }
    ).catch(err => console.warn('Admin notification update failed:', err.message));
  }

  return {
    sheet_urls: urls.length,
    already_done: alreadyDone.size,
    processed: toProcess.length,
    extracted,
    errors,
    error_details: errorDetails,
  };
}

// ─── Env loader ───────────────────────────────────────────

function loadEnv({ requireSheetId = false } = {}) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const SHEET_ID = process.env.RECIPE_SHEET_ID;

  if (!GEMINI_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Missing env vars (GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
  }
  if (requireSheetId && !SHEET_ID) {
    throw new Error('Missing RECIPE_SHEET_ID environment variable');
  }

  return { GEMINI_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY, SHEET_ID };
}

// ─── On-demand handler (POST from frontend) ───────────────

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response('', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));

    if (body.action === 'generate_exercise') {
      const env = loadEnv({ requireSheetId: false });
      const { joint = 'knie', level = 1 } = body;
      const prompt = `Maak een fysiotherapie-oefening voor artrose. Gewricht: ${joint}. Level: ${level} (1=licht, 2=gemiddeld, 3=intensief).

Geef terug als JSON (geen markdown, alleen valid JSON):
{
  "title_nl": "Nederlandse titel",
  "title_en": "English title",
  "description_nl": "Korte beschrijving in het Nederlands",
  "description_en": "Short description in English",
  "instructions_nl": "Stap 1: ...\\nStap 2: ...\\nStap 3: ...",
  "instructions_en": "Step 1: ...\\nStep 2: ...\\nStep 3: ...",
  "focus_points_nl": ["focuspunt 1", "focuspunt 2"],
  "focus_points_en": ["focus point 1", "focus point 2"],
  "sets": 3,
  "reps": 10,
  "duration_minutes": 5
}

Richtlijnen:
- Geschikt voor artrose-patiënten met ${joint}klachten
- Level ${level}: ${level === 1 ? 'zachte, eenvoudige bewegingen' : level === 2 ? 'gemiddelde belasting, meer herhalingen' : 'intensievere oefeningen voor gevorderden'}
- Duidelijke, stapsgewijze instructies
- Focus op pijnvermindering, mobiliteit en krachtsopbouw
- Antwoord ALLEEN in valid JSON`;

      const res = await fetchWithTimeout(`${GEMINI_API_URL}?key=${env.GEMINI_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2000 },
        }),
      }, TIMEOUT_GEMINI_MS, 'Gemini exercise');

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API error ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in Gemini response');

      return Response.json({ success: true, data: JSON.parse(jsonMatch[0]) }, {
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (body.action === 'process_single') {
      const env = loadEnv({ requireSheetId: false });
      // Process a single URL on-demand
      const { url } = body;
      if (!url) return Response.json({ error: 'URL required' }, { status: 400 });

      const html = await fetchPageHtml(url);
      const recipeData = await extractRecipeWithGemini(html, url, env.GEMINI_KEY);

      // Upload image
      if (recipeData.image_url) {
        const tempId = `manual_${Date.now()}`;
        const storedUrl = await uploadImageToStorage(
          recipeData.image_url, tempId, env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY
        );
        if (storedUrl) recipeData.image_url = storedUrl;
      }

      // Upsert into recipe_imports
      await supabaseRequest(
        '/recipe_imports', env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, 'POST',
        {
          source_url: url,
          status: 'extracted',
          title: recipeData.title_nl || 'Onbekend',
          extracted_data: recipeData,
        }
      ).catch(async () => {
        // Might already exist, try update
        await supabaseRequest(
          `/recipe_imports?source_url=eq.${encodeURIComponent(url)}`,
          env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, 'PATCH',
          {
            status: 'extracted',
            title: recipeData.title_nl || 'Onbekend',
            extracted_data: recipeData,
            error_message: null,
            updated_at: new Date().toISOString(),
          }
        );
      });

      return Response.json({ success: true, data: recipeData }, {
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Default: run full pipeline
    const env = loadEnv({ requireSheetId: true });
    const result = await processImports(env);
    return Response.json({ success: true, ...result }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    console.error('Import recipes error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// ─── Exported for testing ────────────────────────────────

export { parseCsvLine, fetchSheetUrls, fetchPageHtml, extractRecipeSection, extractRecipeWithGemini };

// ─── Scheduled handler (04:00 CET = 03:00 UTC) ───────────

export const scheduledHandler = schedule('0 3 * * *', async () => {
  console.log('Scheduled recipe import started:', new Date().toISOString());
  try {
    const env = loadEnv({ requireSheetId: true });
    const result = await processImports(env);
    console.log('Scheduled recipe import complete:', JSON.stringify(result));
  } catch (err) {
    console.error('Scheduled recipe import error:', err);
  }
});
