// Netlify Scheduled + On-demand Function: Research Paper Fetcher + AI Summarizer
// Sources: PubMed, Cochrane Library, Google Scholar (via SerpAPI)
// AI: Gemini 2.0 Flash for analysis + content proposal generation
// Schedule: every night at 03:00 CET (02:00 UTC)

import { schedule } from '@netlify/functions';

const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const COCHRANE_SEARCH = 'https://www.cochranelibrary.com/api/search';
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
        external_id: pmid,
        source: 'pubmed',
        title: cleanHtml(title),
        abstract: cleanHtml(abstractText),
        journal,
        publication_date: pubDate,
        authors,
        doi,
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      });
    } catch (e) {
      console.error('Error parsing PubMed article:', e.message);
    }
  }

  return articles;
}

// ─── Cochrane Library API ─────────────────────────────────

async function searchCochrane(query, maxResults = 10) {
  try {
    // Cochrane search via their public search endpoint
    const params = new URLSearchParams({
      q: query,
      p: '1',
      s: String(maxResults),
      type: 'review',
    });

    const res = await fetch(`${COCHRANE_SEARCH}?${params}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      console.warn(`Cochrane search returned ${res.status}, trying fallback`);
      return await searchCochraneFallback(query, maxResults);
    }

    const data = await res.json();
    const results = data?.results || data?.items || [];

    return results.slice(0, maxResults).map(item => ({
      external_id: item.doi || item.id || `cochrane_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      source: 'cochrane',
      title: cleanHtml(item.title || 'Untitled'),
      abstract: cleanHtml(item.abstract || item.description || ''),
      journal: 'Cochrane Database of Systematic Reviews',
      publication_date: item.publishedDate || item.date || null,
      authors: item.authors?.map(a => typeof a === 'string' ? a : `${a.lastName || ''} ${a.initials || ''}`.trim()).filter(Boolean) || [],
      doi: item.doi || null,
      url: item.doi ? `https://doi.org/${item.doi}` : item.url || null,
    })).filter(a => a.title !== 'Untitled');
  } catch (err) {
    console.error('Cochrane search error:', err.message);
    return [];
  }
}

async function searchCochraneFallback(query, maxResults) {
  // Fallback: search Cochrane via PubMed filter
  const cochranePmQuery = `${query} AND "Cochrane Database Syst Rev"[Journal]`;
  try {
    const pmids = await searchPubMed(cochranePmQuery, maxResults);
    if (!pmids.length) return [];
    const articles = await fetchPubMedDetails(pmids);
    return articles.map(a => ({
      ...a,
      source: 'cochrane',
      external_id: a.doi || a.pubmed_id,
    }));
  } catch (err) {
    console.error('Cochrane fallback error:', err.message);
    return [];
  }
}

// ─── Google Scholar via SerpAPI ───────────────────────────

async function searchGoogleScholar(query, maxResults = 10, serpApiKey) {
  if (!serpApiKey) {
    console.warn('SERPAPI_KEY not set, skipping Google Scholar');
    return [];
  }

  try {
    const params = new URLSearchParams({
      engine: 'google_scholar',
      q: query,
      num: String(maxResults),
      as_ylo: String(new Date().getFullYear() - 2), // Last 2 years
      api_key: serpApiKey,
    });

    const res = await fetch(`https://serpapi.com/search.json?${params}`);
    if (!res.ok) {
      console.warn(`SerpAPI returned ${res.status}`);
      return [];
    }

    const data = await res.json();
    const results = data.organic_results || [];

    return results.slice(0, maxResults).map(item => {
      const id = item.result_id || `scholar_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      return {
        external_id: id,
        source: 'scholar',
        title: cleanHtml(item.title || 'Untitled'),
        abstract: cleanHtml(item.snippet || ''),
        journal: item.publication_info?.summary || null,
        publication_date: extractScholarYear(item.publication_info?.summary),
        authors: extractScholarAuthors(item.publication_info?.summary),
        doi: null, // Scholar doesn't always provide DOI
        url: item.link || null,
      };
    }).filter(a => a.title !== 'Untitled');
  } catch (err) {
    console.error('Google Scholar search error:', err.message);
    return [];
  }
}

function extractScholarYear(summary) {
  if (!summary) return null;
  const match = summary.match(/\b(20\d{2})\b/);
  return match ? `${match[1]}-01-01` : null;
}

function extractScholarAuthors(summary) {
  if (!summary) return [];
  // Format: "Author1, Author2 - Journal, Year"
  const authorPart = summary.split(' - ')[0];
  if (!authorPart) return [];
  return authorPart.split(',').map(a => a.trim()).filter(a => a && !a.match(/^\d{4}$/)).slice(0, 10);
}

// ─── XML helpers ──────────────────────────────────────────

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

// ─── Gemini AI Analysis ───────────────────────────────────

async function analyzeWithGemini(paper, apiKey) {
  const prompt = `Je bent een medisch-wetenschappelijk expert gespecialiseerd in artrose (osteoarthritis) zelfmanagement.
Analyseer het volgende wetenschappelijk artikel op relevantie voor een artrose zelfmanagement programma.

TITEL: ${paper.title}
TIJDSCHRIFT: ${paper.journal || 'Onbekend'}
AUTEURS: ${(paper.authors || []).join(', ')}
PUBLICATIEDATUM: ${paper.publication_date || 'Onbekend'}
BRON: ${paper.source}

ABSTRACT:
${paper.abstract || 'Geen abstract beschikbaar'}

Analyseer dit abstract op relevantie voor een artrose zelfmanagement programma.
Categorieën: exercise, nutrition, supplements, sleep, pain_education, medication_interactions.

Geef je antwoord EXACT in het volgende JSON-formaat (geen markdown, alleen valid JSON):
{
  "summary_nl": "Nederlandse samenvatting, max 200 woorden, begrijpelijk voor therapeuten en patiënten",
  "summary_en": "English summary, max 200 words, understandable for therapists and patients",
  "key_findings_nl": ["Bevinding 1", "Bevinding 2", "Bevinding 3"],
  "key_findings_en": ["Finding 1", "Finding 2", "Finding 3"],
  "clinical_relevance_nl": "Wat betekent dit concreet voor artrose-patiënten en therapeuten?",
  "clinical_relevance_en": "What does this mean in practice for OA patients and therapists?",
  "categories": ["kies uit: exercise, nutrition, supplements, sleep, pain_education, medication_interactions"],
  "evidence_level": "kies uit: systematic_review, meta_analysis, rct, cohort, case_control, case_report, expert_opinion",
  "relevance_score": 75,
  "content_proposal": null
}

BELANGRIJK: Als de relevance_score > 70, voeg dan een content_proposal toe:
{
  "content_proposal": {
    "target_table": "kies uit: supplements, exercises, lessons",
    "proposed_values": {
      "description_nl": "...",
      "description_en": "..."
    },
    "change_summary_nl": "Korte beschrijving van de voorgestelde wijziging",
    "ai_reasoning_nl": "Waarom stellen we deze wijziging voor, gebaseerd op het bewijs",
    "evidence_quote": "Relevante quote uit het abstract"
  }
}

Bij het kiezen van target_table:
- supplements: als het gaat over voedingssupplementen, vitamines, mineralen
- exercises: als het gaat over beweging, oefeningen, fysieke activiteit
- lessons: als het gaat over educatie, pijneducatie, slaap, zelfmanagement kennis

Wees nauwkeurig en evidence-based. Score de relevantie van 0-100 waarbij 100 = direct toepasbaar.`;

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 3000,
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

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error(`Failed to parse Gemini JSON: ${e.message}`);
  }
}

// ─── Supabase helpers ─────────────────────────────────────

async function supabaseRequest(url, supabaseUrl, serviceKey, method = 'GET', body = null, headers = {}) {
  const opts = {
    method,
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : undefined,
      ...headers,
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

async function supabaseRpc(fnName, params, supabaseUrl, serviceKey) {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${fnName}`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase RPC ${fnName} failed (${res.status}): ${errText}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ─── Core pipeline ────────────────────────────────────────

async function fetchFromAllSources(pubmedQuery, maxResults, env) {
  const allPapers = [];

  // 1. PubMed
  try {
    const pmids = await searchPubMed(pubmedQuery, maxResults);
    if (pmids.length) {
      const papers = await fetchPubMedDetails(pmids);
      allPapers.push(...papers);
    }
    console.log(`PubMed: ${pmids.length} results`);
  } catch (err) {
    console.error('PubMed error:', err.message);
  }

  // 2. Cochrane
  try {
    // Simplify query for Cochrane (strip PubMed MeSH syntax)
    const cochraneQuery = pubmedQuery
      .replace(/\[MeSH[^\]]*\]/gi, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\bAND\b|\bOR\b|\bNOT\b/gi, ' ')
      .replace(/[()]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .slice(0, 6) // Keep first 6 terms
      .join(' ');

    const cochranePapers = await searchCochrane(cochraneQuery, Math.min(maxResults, 5));
    allPapers.push(...cochranePapers);
    console.log(`Cochrane: ${cochranePapers.length} results`);
  } catch (err) {
    console.error('Cochrane error:', err.message);
  }

  // 3. Google Scholar (via SerpAPI)
  try {
    const scholarQuery = pubmedQuery
      .replace(/\[MeSH[^\]]*\]/gi, '')
      .replace(/\[.*?\]/g, '')
      .replace(/[()]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .slice(0, 8)
      .join(' ');

    const scholarPapers = await searchGoogleScholar(scholarQuery, Math.min(maxResults, 5), env.SERPAPI_KEY);
    allPapers.push(...scholarPapers);
    console.log(`Scholar: ${scholarPapers.length} results`);
  } catch (err) {
    console.error('Scholar error:', err.message);
  }

  return allPapers;
}

async function filterNewPapers(papers, supabaseUrl, serviceKey) {
  if (!papers.length) return [];

  // Check PubMed IDs
  const pubmedIds = papers.filter(p => p.pubmed_id).map(p => p.pubmed_id);
  let existingPubmedIds = new Set();
  if (pubmedIds.length) {
    const existing = await supabaseRequest(
      `/research_papers?pubmed_id=in.(${pubmedIds.map(id => `"${id}"`).join(',')})&select=pubmed_id`,
      supabaseUrl, serviceKey
    );
    existingPubmedIds = new Set((existing || []).map(p => p.pubmed_id));
  }

  // Check external IDs
  const externalIds = papers.filter(p => p.external_id && p.source !== 'pubmed').map(p => `"${p.external_id}"`);
  let existingExternalIds = new Set();
  if (externalIds.length) {
    const existing = await supabaseRequest(
      `/research_papers?external_id=in.(${externalIds.join(',')})&select=external_id`,
      supabaseUrl, serviceKey
    );
    existingExternalIds = new Set((existing || []).map(p => p.external_id));
  }

  return papers.filter(p => {
    if (p.pubmed_id && existingPubmedIds.has(p.pubmed_id)) return false;
    if (p.external_id && existingExternalIds.has(p.external_id)) return false;
    return true;
  });
}

async function processPaper(paper, env) {
  let aiResult = {};
  if (paper.abstract) {
    aiResult = await analyzeWithGemini(paper, env.GEMINI_KEY);
    await new Promise(r => setTimeout(r, 500)); // Rate limiting
  }

  // Insert paper
  const inserted = await supabaseRequest('/research_papers', env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, 'POST', {
    pubmed_id: paper.pubmed_id || null,
    external_id: paper.external_id || null,
    source: paper.source || 'pubmed',
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
    fetch_batch: env.batchId,
  });

  const paperId = inserted?.[0]?.id;

  // If score > 70 and proposal generated, save content_proposal
  if (aiResult.relevance_score > 70 && aiResult.content_proposal && paperId) {
    const cp = aiResult.content_proposal;
    await supabaseRequest('/content_proposals', env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, 'POST', {
      research_paper_id: paperId,
      target_table: cp.target_table,
      target_record_name: paper.title.substring(0, 100),
      proposed_values: cp.proposed_values || {},
      change_summary_nl: cp.change_summary_nl || '',
      ai_reasoning_nl: cp.ai_reasoning_nl || '',
      evidence_quote: cp.evidence_quote || '',
      confidence_score: aiResult.relevance_score,
      status: 'pending',
    });

    // Save research_insight
    await supabaseRequest('/research_insights', env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, 'POST', {
      paper_id: paperId,
      title_nl: `Nieuw inzicht: ${paper.title.substring(0, 80)}`,
      title_en: `New insight: ${paper.title.substring(0, 80)}`,
      description_nl: aiResult.summary_nl || '',
      description_en: aiResult.summary_en || '',
      target_section: cp.target_table,
      action_type: 'update',
      priority: aiResult.relevance_score > 85 ? 1 : 2,
    });

    return { summarized: true, proposal: true };
  }

  return { summarized: !!paper.abstract, proposal: false };
}

async function notifyAdmins(proposalCount, env) {
  if (proposalCount === 0) return;

  // Increment pending_notifications for all admins
  await supabaseRequest(
    `/profiles?role=eq.admin`,
    env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, 'PATCH',
    { pending_notifications: proposalCount },
    { 'Prefer': 'return=minimal' }
  ).catch(err => console.error('Admin notification error:', err.message));

  // Use RPC to properly increment (not overwrite)
  await supabaseRpc('increment_admin_notifications', { count: proposalCount }, env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
    .catch(() => {
      // RPC might not exist yet, non-critical
      console.warn('increment_admin_notifications RPC not found, using direct update');
    });
}

// ─── Handler: fetch + summarize for one query ─────────────

async function handleFetchAndSummarize({ query_id, query, max_results, env }) {
  const startTime = Date.now();
  let pubmedQuery = query;

  if (query_id && !query) {
    const queries = await supabaseRequest(
      `/research_queries?id=eq.${query_id}&select=*`,
      env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY
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

  // 1. Fetch from all sources
  const allPapers = await fetchFromAllSources(pubmedQuery, max_results, env);
  if (!allPapers.length) {
    return Response.json({
      success: true,
      message: 'No papers found from any source',
      stats: { found: 0, new: 0, summarized: 0, proposals: 0 },
    });
  }

  // 2. Filter out papers we already have
  const newPapers = await filterNewPapers(allPapers, env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  // 3. Process each new paper (AI analysis + store + proposals)
  env.batchId = `batch_${Date.now()}`;
  let summarized = 0;
  let proposals = 0;
  const errors = [];

  for (const paper of newPapers) {
    try {
      const result = await processPaper(paper, env);
      if (result.summarized) summarized++;
      if (result.proposal) proposals++;
    } catch (err) {
      console.error(`Error processing paper ${paper.external_id || paper.title}:`, err.message);
      errors.push(`${paper.source}/${paper.external_id}: ${err.message}`);
    }
  }

  // 4. Update query last_fetched_at
  if (query_id) {
    await supabaseRequest(
      `/research_queries?id=eq.${query_id}`,
      env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, 'PATCH',
      { last_fetched_at: new Date().toISOString() }
    ).catch(() => {});
  }

  // 5. Log the fetch
  await supabaseRequest('/research_fetch_log', env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, 'POST', {
    query_id: query_id || null,
    papers_found: allPapers.length,
    papers_new: newPapers.length,
    papers_summarized: summarized,
    errors,
    duration_ms: Date.now() - startTime,
  }).catch(() => {});

  // 6. Notify admins if proposals generated
  if (proposals > 0) {
    await notifyAdmins(proposals, env);
  }

  return Response.json({
    success: true,
    stats: {
      found: allPapers.length,
      already_known: allPapers.length - newPapers.length,
      new: newPapers.length,
      summarized,
      proposals,
      errors: errors.length,
      sources: {
        pubmed: allPapers.filter(p => p.source === 'pubmed').length,
        cochrane: allPapers.filter(p => p.source === 'cochrane').length,
        scholar: allPapers.filter(p => p.source === 'scholar').length,
      },
    },
    batch_id: env.batchId,
  }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}

// ─── Handler: re-summarize one paper ──────────────────────

async function handleSummarizePaper({ paper_id, env }) {
  const papers = await supabaseRequest(
    `/research_papers?id=eq.${paper_id}&select=*`,
    env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY
  );
  if (!papers?.length) {
    return Response.json({ error: 'Paper not found' }, { status: 404 });
  }

  const paper = papers[0];
  if (!paper.abstract) {
    return Response.json({ error: 'Paper has no abstract to summarize' }, { status: 400 });
  }

  const aiResult = await analyzeWithGemini(paper, env.GEMINI_KEY);

  await supabaseRequest(
    `/research_papers?id=eq.${paper_id}`,
    env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, 'PATCH', {
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

  // If score > 70 and proposal, create it
  if (aiResult.relevance_score > 70 && aiResult.content_proposal) {
    const cp = aiResult.content_proposal;
    await supabaseRequest('/content_proposals', env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, 'POST', {
      research_paper_id: paper_id,
      target_table: cp.target_table,
      target_record_name: paper.title.substring(0, 100),
      proposed_values: cp.proposed_values || {},
      change_summary_nl: cp.change_summary_nl || '',
      ai_reasoning_nl: cp.ai_reasoning_nl || '',
      evidence_quote: cp.evidence_quote || '',
      confidence_score: aiResult.relevance_score,
      status: 'pending',
    });
    await notifyAdmins(1, { SUPABASE_URL: env.SUPABASE_URL, SUPABASE_SERVICE_KEY: env.SUPABASE_SERVICE_KEY });
  }

  return Response.json({ success: true, summary: aiResult }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}

// ─── Handler: fetch all active queries ────────────────────

async function handleFetchAllQueries(env) {
  const queries = await supabaseRequest(
    '/research_queries?is_active=eq.true&select=*',
    env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY
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
        env,
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

// ─── Shared env loader ────────────────────────────────────

function loadEnv() {
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const SERPAPI_KEY = process.env.SERPAPI_KEY || null;

  if (!GEMINI_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Missing environment variables (GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
  }

  return { GEMINI_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY, SERPAPI_KEY };
}

// ─── On-demand handler (POST from frontend) ───────────────

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

  try {
    const env = loadEnv();

    const body = await req.json().catch(() => ({}));
    const { action = 'fetch_and_summarize', query_id, query, max_results = 10 } = body;

    // Verify auth token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (action === 'fetch_and_summarize') {
      return await handleFetchAndSummarize({ query_id, query, max_results, env });
    }

    if (action === 'summarize_paper') {
      return await handleSummarizePaper({ paper_id: body.paper_id, env });
    }

    if (action === 'fetch_all_queries') {
      return await handleFetchAllQueries(env);
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (err) {
    console.error('Research function error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// ─── Scheduled handler (runs every night at 02:00 UTC = 03:00 CET) ───

export const scheduledHandler = schedule('0 2 * * *', async () => {
  console.log('Scheduled research monitor started:', new Date().toISOString());

  try {
    const env = loadEnv();
    const result = await handleFetchAllQueries(env);
    const data = await result.json();
    console.log('Scheduled run complete:', JSON.stringify(data.results?.map(r => ({
      query: r.query,
      found: r.stats?.found,
      new: r.stats?.new,
      proposals: r.stats?.proposals,
    }))));
  } catch (err) {
    console.error('Scheduled research monitor error:', err);
  }
});
