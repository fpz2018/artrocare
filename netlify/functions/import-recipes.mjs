// Netlify Scheduled + On-demand Function: Recipe Import Pipeline
// Google Sheet → fetch HTML → Gemini extract → Supabase storage
// Schedule: every night at 04:00 CET (03:00 UTC)

import { schedule } from '@netlify/functions';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// ─── Google Sheet CSV reader ──────────────────────────────

async function fetchSheetUrls(sheetId) {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  const res = await fetch(csvUrl);
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
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ArtrocareBot/1.0)',
      'Accept': 'text/html',
    },
    redirect: 'follow',
  });

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

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4000,
      },
    }),
  });

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
    const imgRes = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ArtrocareBot/1.0)' },
      redirect: 'follow',
    });

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

    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/recipe-images/${fileName}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': contentType,
          'x-upsert': 'true',
        },
        body: arrayBuffer,
      }
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

  const res = await fetch(`${supabaseUrl}/rest/v1${url}`, opts);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase ${method} ${url} failed (${res.status}): ${errText}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ─── Core pipeline ────────────────────────────────────────

async function processImports(env) {
  console.log('Recipe import pipeline started:', new Date().toISOString());

  // 1. Read URLs from Google Sheet
  const urls = await fetchSheetUrls(env.SHEET_ID);
  console.log(`Found ${urls.length} new URLs in sheet`);

  if (!urls.length) {
    return { processed: 0, extracted: 0, errors: 0 };
  }

  // 2. Check which URLs we already have
  const existing = await supabaseRequest(
    `/recipe_imports?source_url=in.(${urls.map(u => `"${encodeURIComponent(u)}"`).join(',')})&select=source_url`,
    env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY
  );
  const existingUrls = new Set((existing || []).map(r => r.source_url));
  const newUrls = urls.filter(u => !existingUrls.has(u));
  console.log(`${newUrls.length} new URLs to process`);

  let extracted = 0;
  let errors = 0;

  for (const url of newUrls) {
    try {
      // Insert as 'fetching'
      const inserted = await supabaseRequest(
        '/recipe_imports', env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, 'POST',
        { source_url: url, status: 'fetching' }
      );
      const importId = inserted?.[0]?.id;
      if (!importId) throw new Error('Failed to insert import record');

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
          updated_at: new Date().toISOString(),
        }
      );

      extracted++;
      console.log(`Extracted: ${recipeData.title_nl || url}`);
    } catch (err) {
      console.error(`Error processing ${url}:`, err.message);
      errors++;

      // Try to update the record with error status
      await supabaseRequest(
        `/recipe_imports?source_url=eq.${encodeURIComponent(url)}`,
        env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, 'PATCH',
        {
          status: 'error',
          error_message: err.message.substring(0, 500),
          updated_at: new Date().toISOString(),
        }
      ).catch(() => {}); // non-critical
    }
  }

  // Notify admin if new recipes extracted
  if (extracted > 0) {
    await supabaseRequest(
      `/profiles?role=eq.admin`,
      env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, 'PATCH',
      { pending_notifications: extracted }
    ).catch(() => {});
  }

  return { processed: newUrls.length, extracted, errors };
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
