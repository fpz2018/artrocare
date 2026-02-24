// Netlify Serverless Function: Research Paper Fetcher + AI Summarizer
// Fetches papers from PubMed and summarizes them with Gemini AI

const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// ─── PubMed API ───────────────────────────────────────────

async function searchPubMed(query, maxResults = 10) {
  const params = new URLSearchParams({
    db: 'pubmed',
    term: query,
    retmax: String(maxResults),
    sort: 'date',
    retmode: 'json',
  });

  const res = await fetch(`${PUBMED_BASE}/esearch.fcgi?${params}`);
  if (!res.ok) throw new Error(`PubMed search failed: ${res.status}`);
  const data = await res.json();
  return data.esearchresult?.idlist || [];
}

async function fetchPubMedDetails(ids) {
  if (!ids.length) return [];

  const params = new URLSearchParams({
    db: 'pubmed',
    id: ids.join(','),
    retmode: 'xml',
    rettype: 'abstract',
  });

  const res = await fetch(`${PUBMED_BASE}/efetch.fcgi?${params}`);
  if (!res.ok) throw new Error(`PubMed fetch failed: ${res.status}`);
  const xml = await res.text();

  // Parse XML to extract paper details
  return parseArticlesFromXml(xml);
}

function parseArticlesFromXml(xml) {
  const articles = [];
  const articleBlocks = xml.split('<PubmedArticle>').slice(1);

  for (const block of articleBlocks) {
    try {
      const pmid = extractTag(block, 'PMID');
      const title = extractTag(block, 'ArticleTitle') || 'Untitled';
      const abstractText = extractAbstract(block);
      const journal = extractTag(block, 'Title') || extractTag(block, 'ISOAbbreviation');
      const year = extractTag(block, 'Year');
      const month = extractTag(block, 'Month') || '01';
      const day = extractTag(block, 'Day') || '01';
      const authors = extractAuthors(block);
      const doi = extractDoi(block);

      let pubDate = null;
      if (year) {
        const monthNum = isNaN(month) ? monthToNum(month) : month.padStart(2, '0');
        pubDate = `${year}-${monthNum}-${day.padStart(2, '0')}`;
      }

      articles.push({
        pubmed_id: pmid,
        title: cleanHtml(title),
        abstract: cleanHtml(abstractText),
        journal,
        publication_date: pubDate,
        authors,
        doi,
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      });
    } catch (e) {
      console.error('Error parsing article:', e.message);
    }
  }

  return articles;
}

function extractTag(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

function extractAbstract(block) {
  const abstractSection = block.match(/<Abstract>([\s\S]*?)<\/Abstract>/i);
  if (!abstractSection) return '';
  const texts = abstractSection[1].match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/gi) || [];
  return texts.map(t => {
    const label = t.match(/Label="([^"]+)"/i);
    const content = t.replace(/<[^>]+>/g, '').trim();
    return label ? `${label[1]}: ${content}` : content;
  }).join('\n\n');
}

function extractAuthors(block) {
  const authorList = block.match(/<AuthorList[\s\S]*?<\/AuthorList>/i);
  if (!authorList) return [];
  const authors = [];
  const authorBlocks = authorList[0].match(/<Author[\s\S]*?<\/Author>/gi) || [];
  for (const a of authorBlocks.slice(0, 10)) {
    const last = extractTag(a, 'LastName');
    const initials = extractTag(a, 'Initials');
    if (last) authors.push(`${last} ${initials}`.trim());
  }
  return authors;
}

function extractDoi(block) {
  const doiMatch = block.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/i);
  return doiMatch ? doiMatch[1] : null;
}

function cleanHtml(text) {
  return text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function monthToNum(m) {
  const months = { jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12' };
  return months[m.toLowerCase().substring(0, 3)] || '01';
}

// ─── Gemini AI Summarization ──────────────────────────────

async function summarizeWithGemini(paper, apiKey) {
  const prompt = `Je bent een medisch-wetenschappelijk expert gespecialiseerd in artrose (osteoarthritis). 
Analyseer het volgende wetenschappelijk artikel en geef een gestructureerde samenvatting.

TITEL: ${paper.title}
TIJDSCHRIFT: ${paper.journal || 'Onbekend'}
AUTEURS: ${(paper.authors || []).join(', ')}
PUBLICATIEDATUM: ${paper.publication_date || 'Onbekend'}

ABSTRACT:
${paper.abstract || 'Geen abstract beschikbaar'}

Geef je antwoord EXACT in het volgende JSON-formaat (geen markdown, alleen valid JSON):
{
  "summary_nl": "Een duidelijke Nederlandse samenvatting van 2-3 alinea's, begrijpelijk voor zowel therapeuten als patiënten. Leg uit wat het onderzoek heeft gevonden en waarom het relevant is.",
  "summary_en": "A clear English summary of 2-3 paragraphs, understandable for both therapists and patients.",
  "key_findings_nl": ["Bevinding 1 in het Nederlands", "Bevinding 2", "Bevinding 3"],
  "key_findings_en": ["Finding 1 in English", "Finding 2", "Finding 3"],
  "clinical_relevance_nl": "Wat betekent dit voor de dagelijkse praktijk van artrose-patiënten en therapeuten? Concrete aanbevelingen.",
  "clinical_relevance_en": "What does this mean for daily practice of osteoarthritis patients and therapists?",
  "categories": ["kies uit: exercise, nutrition, supplements, pain_management, surgery, rehabilitation, diagnosis, prevention, treatment"],
  "evidence_level": "kies uit: systematic_review, meta_analysis, rct, cohort, case_control, case_report, expert_opinion",
  "relevance_score": 75
}

Wees nauwkeurig en evidence-based. Score de relevantie van 0-100 waarbij 100 = direct toepasbaar in een artrose-app.`;

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in Gemini response');

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error(`Failed to parse Gemini JSON: ${e.message}`);
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

  // Remove undefined headers
  Object.keys(opts.headers).forEach(k => opts.headers[k] === undefined && delete opts.headers[k]);

  const res = await fetch(`${supabaseUrl}/rest/v1${url}`, opts);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase ${method} ${url} failed (${res.status}): ${errText}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ─── Main Handler ─────────────────────────────────────────

export default async function handler(req) {
  // CORS
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

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!GEMINI_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return Response.json(
      { error: 'Missing environment variables (GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action = 'fetch_and_summarize', query_id, query, max_results = 10 } = body;

    // Verify auth token from request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (action === 'fetch_and_summarize') {
      return await handleFetchAndSummarize({ query_id, query, max_results, GEMINI_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY });
    }

    if (action === 'summarize_paper') {
      const { paper_id } = body;
      return await handleSummarizePaper({ paper_id, GEMINI_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY });
    }

    if (action === 'fetch_all_queries') {
      return await handleFetchAllQueries({ GEMINI_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY, authHeader });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (err) {
    console.error('Research function error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

async function handleFetchAndSummarize({ query_id, query, max_results, GEMINI_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY }) {
  const startTime = Date.now();
  let pubmedQuery = query;

  // If query_id provided, fetch the query from DB
  if (query_id && !query) {
    const queries = await supabaseRequest(
      `/research_queries?id=eq.${query_id}&select=*`,
      SUPABASE_URL, SUPABASE_SERVICE_KEY
    );
    if (!queries?.length) {
      return Response.json({ error: 'Query not found' }, { status: 404 });
    }
    pubmedQuery = queries[0].pubmed_query;
    max_results = queries[0].max_results || max_results;
  }

  if (!pubmedQuery) {
    return Response.json({ error: 'No query provided' }, { status: 400 });
  }

  // 1. Search PubMed
  const pmids = await searchPubMed(pubmedQuery, max_results);
  if (!pmids.length) {
    return Response.json({
      success: true,
      message: 'No papers found',
      stats: { found: 0, new: 0, summarized: 0 },
    });
  }

  // 2. Check which papers we already have
  const existingPapers = await supabaseRequest(
    `/research_papers?pubmed_id=in.(${pmids.map(id => `"${id}"`).join(',')})&select=pubmed_id`,
    SUPABASE_URL, SUPABASE_SERVICE_KEY
  );
  const existingIds = new Set((existingPapers || []).map(p => p.pubmed_id));
  const newPmids = pmids.filter(id => !existingIds.has(id));

  // 3. Fetch details for new papers
  let papers = [];
  if (newPmids.length) {
    papers = await fetchPubMedDetails(newPmids);
  }

  // 4. Summarize each paper with Gemini and store
  const batchId = `batch_${Date.now()}`;
  let summarized = 0;
  const errors = [];

  for (const paper of papers) {
    try {
      // Summarize with AI
      let aiResult = {};
      if (paper.abstract) {
        aiResult = await summarizeWithGemini(paper, GEMINI_KEY);
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      }

      // Insert into database
      await supabaseRequest('/research_papers', SUPABASE_URL, SUPABASE_SERVICE_KEY, 'POST', {
        pubmed_id: paper.pubmed_id,
        doi: paper.doi,
        title: paper.title,
        authors: paper.authors,
        journal: paper.journal,
        publication_date: paper.publication_date,
        abstract: paper.abstract,
        url: paper.url,
        summary_nl: aiResult.summary_nl || null,
        summary_en: aiResult.summary_en || null,
        key_findings_nl: aiResult.key_findings_nl || [],
        key_findings_en: aiResult.key_findings_en || [],
        clinical_relevance_nl: aiResult.clinical_relevance_nl || null,
        clinical_relevance_en: aiResult.clinical_relevance_en || null,
        categories: aiResult.categories || [],
        relevance_score: aiResult.relevance_score || 0,
        evidence_level: aiResult.evidence_level || null,
        status: paper.abstract ? 'ready_for_review' : 'pending',
        fetch_batch: batchId,
      });

      summarized++;
    } catch (err) {
      console.error(`Error processing paper ${paper.pubmed_id}:`, err.message);
      errors.push(`${paper.pubmed_id}: ${err.message}`);
    }
  }

  // 5. Update query last_fetched_at
  if (query_id) {
    await supabaseRequest(
      `/research_queries?id=eq.${query_id}`,
      SUPABASE_URL, SUPABASE_SERVICE_KEY, 'PATCH',
      { last_fetched_at: new Date().toISOString() }
    ).catch(() => {}); // non-critical
  }

  // 6. Log the fetch
  await supabaseRequest('/research_fetch_log', SUPABASE_URL, SUPABASE_SERVICE_KEY, 'POST', {
    query_id: query_id || null,
    papers_found: pmids.length,
    papers_new: papers.length,
    papers_summarized: summarized,
    errors,
    duration_ms: Date.now() - startTime,
  }).catch(() => {}); // non-critical

  return Response.json({
    success: true,
    stats: {
      found: pmids.length,
      already_known: existingIds.size,
      new: papers.length,
      summarized,
      errors: errors.length,
    },
    batch_id: batchId,
  }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}

async function handleSummarizePaper({ paper_id, GEMINI_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY }) {
  // Fetch paper from DB
  const papers = await supabaseRequest(
    `/research_papers?id=eq.${paper_id}&select=*`,
    SUPABASE_URL, SUPABASE_SERVICE_KEY
  );
  if (!papers?.length) {
    return Response.json({ error: 'Paper not found' }, { status: 404 });
  }

  const paper = papers[0];
  if (!paper.abstract) {
    return Response.json({ error: 'Paper has no abstract to summarize' }, { status: 400 });
  }

  // Summarize
  const aiResult = await summarizeWithGemini(paper, GEMINI_KEY);

  // Update paper
  await supabaseRequest(
    `/research_papers?id=eq.${paper_id}`,
    SUPABASE_URL, SUPABASE_SERVICE_KEY, 'PATCH', {
      summary_nl: aiResult.summary_nl,
      summary_en: aiResult.summary_en,
      key_findings_nl: aiResult.key_findings_nl || [],
      key_findings_en: aiResult.key_findings_en || [],
      clinical_relevance_nl: aiResult.clinical_relevance_nl,
      clinical_relevance_en: aiResult.clinical_relevance_en,
      categories: aiResult.categories || [],
      relevance_score: aiResult.relevance_score || 0,
      evidence_level: aiResult.evidence_level || null,
      status: 'ready_for_review',
      updated_at: new Date().toISOString(),
    }
  );

  return Response.json({ success: true, summary: aiResult }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}

async function handleFetchAllQueries({ GEMINI_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY }) {
  // Fetch all active queries
  const queries = await supabaseRequest(
    '/research_queries?is_active=eq.true&select=*',
    SUPABASE_URL, SUPABASE_SERVICE_KEY
  );

  if (!queries?.length) {
    return Response.json({ success: true, message: 'No active queries', results: [] });
  }

  const results = [];
  for (const q of queries) {
    try {
      const result = await handleFetchAndSummarize({
        query_id: q.id,
        query: q.pubmed_query,
        max_results: q.max_results || 10,
        GEMINI_KEY,
        SUPABASE_URL,
        SUPABASE_SERVICE_KEY,
      });
      const data = await result.json();
      results.push({ query: q.query_name, ...data });
    } catch (err) {
      results.push({ query: q.query_name, error: err.message });
    }
  }

  return Response.json({ success: true, results }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
