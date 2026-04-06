import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @netlify/functions before import
vi.mock('@netlify/functions', () => ({
  schedule: (cron, fn) => fn,
}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const mod = await import('../import-recipes.mjs');
const { parseCsvLine, fetchSheetUrls, fetchPageHtml, extractRecipeSection, extractRecipeWithGemini } = mod;
const handler = mod.default;

beforeEach(() => {
  mockFetch.mockReset();
});

// ─── parseCsvLine ────────────────────────────────────────

describe('parseCsvLine', () => {
  it('parses simple CSV line', () => {
    expect(parseCsvLine('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('handles quoted fields with commas', () => {
    expect(parseCsvLine('"hello, world",foo,bar')).toEqual(['hello, world', 'foo', 'bar']);
  });

  it('handles empty fields', () => {
    expect(parseCsvLine('url,,extra')).toEqual(['url', '', 'extra']);
  });

  it('handles single column', () => {
    expect(parseCsvLine('https://example.com')).toEqual(['https://example.com']);
  });

  it('handles quoted fields without commas', () => {
    expect(parseCsvLine('"url","status"')).toEqual(['url', 'status']);
  });

  it('handles empty line', () => {
    expect(parseCsvLine('')).toEqual(['']);
  });
});

// ─── fetchSheetUrls ──────────────────────────────────────

describe('fetchSheetUrls', () => {
  it('fetches and parses URLs from Google Sheet CSV', async () => {
    const csv = 'URL,Status\nhttps://recipe1.com,new\nhttps://recipe2.com,\nhttps://recipe3.com,processed';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(csv),
    });

    const urls = await fetchSheetUrls('test-sheet-id');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://docs.google.com/spreadsheets/d/test-sheet-id/export?format=csv'
    );
    // Only 'new' and empty status should be included
    expect(urls).toEqual(['https://recipe1.com', 'https://recipe2.com']);
  });

  it('returns empty array when sheet has only header', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('URL,Status'),
    });

    const urls = await fetchSheetUrls('test-id');
    expect(urls).toEqual([]);
  });

  it('skips non-URL entries', async () => {
    const csv = 'URL,Status\nnot-a-url,new\nhttps://valid.com,new';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(csv),
    });

    const urls = await fetchSheetUrls('test-id');
    expect(urls).toEqual(['https://valid.com']);
  });

  it('throws on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403 });

    await expect(fetchSheetUrls('bad-id')).rejects.toThrow('Google Sheet fetch failed: 403');
  });

  it('returns empty for completely empty sheet', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(''),
    });

    const urls = await fetchSheetUrls('test-id');
    expect(urls).toEqual([]);
  });

  it('handles URLs with quoted fields in CSV', async () => {
    const csv = 'URL,Status\n"https://example.com/recipe?id=1&lang=nl",new';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(csv),
    });

    const urls = await fetchSheetUrls('test-id');
    expect(urls).toEqual(['https://example.com/recipe?id=1&lang=nl']);
  });
});

// ─── fetchPageHtml ───────────────────────────────────────

describe('fetchPageHtml', () => {
  it('fetches HTML from URL', async () => {
    const html = '<html><body><h1>Recipe</h1></body></html>';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(html),
    });

    const result = await fetchPageHtml('https://example.com/recipe');

    expect(mockFetch).toHaveBeenCalledWith('https://example.com/recipe', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ArtrocareBot/1.0)',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    expect(result).toBe(html);
  });

  it('throws on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

    await expect(fetchPageHtml('https://example.com/404'))
      .rejects.toThrow('Page fetch failed: 404');
  });

  it('truncates very large pages', async () => {
    const largeHtml = '<html><head></head><body>' + 'x'.repeat(250000) + '</body></html>';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(largeHtml),
    });

    const result = await fetchPageHtml('https://example.com/big-page');
    // Should be truncated (extractRecipeSection or substring)
    expect(result.length).toBeLessThanOrEqual(200000);
  });
});

// ─── extractRecipeSection ────────────────────────────────

describe('extractRecipeSection', () => {
  it('extracts JSON-LD recipe schema', () => {
    const html = `
      <html>
        <head><meta property="og:title" content="Test"></head>
        <body>
          <script type="application/ld+json">{"@type":"Recipe","name":"Test Recipe"}</script>
          <p>Content</p>
        </body>
      </html>
    `;

    const result = extractRecipeSection(html);
    expect(result).toContain('Recipe');
    expect(result).toContain('JSON-LD');
  });

  it('falls back to head + truncated body when no JSON-LD', () => {
    const html = `<html><head><title>Page</title></head><body>${'x'.repeat(200000)}</body></html>`;

    const result = extractRecipeSection(html);
    expect(result).toContain('<title>Page</title>');
    expect(result.length).toBeLessThanOrEqual(200000);
  });

  it('ignores non-recipe JSON-LD (no "Recipe" keyword)', () => {
    const html = `
      <html>
        <head><title>Page</title></head>
        <body>
          <script type="application/ld+json">{"@type":"WebPage","name":"Not a food item"}</script>
          ${'x'.repeat(200000)}
        </body>
      </html>
    `;

    const result = extractRecipeSection(html);
    // Falls back to head + truncated body because JSON-LD doesn't contain "Recipe"
    expect(result).not.toContain('JSON-LD');
  });
});

// ─── extractRecipeWithGemini ─────────────────────────────

describe('extractRecipeWithGemini', () => {
  it('sends HTML to Gemini and parses JSON response', async () => {
    const recipeJson = {
      title_nl: 'Zalm met broccoli',
      title_en: 'Salmon with broccoli',
      description_nl: 'Gezond recept',
      description_en: 'Healthy recipe',
      ingredients: [{ name_nl: 'zalm', name_en: 'salmon', amount: 200, unit: 'g', category: 'vis' }],
      instructions_nl: 'Stap 1: Bak de zalm',
      instructions_en: 'Step 1: Cook the salmon',
      prep_time_minutes: 10,
      cook_time_minutes: 20,
      servings: 2,
      image_url: 'https://example.com/image.jpg',
      calories: 400,
      protein_g: 35,
      tags: ['anti-inflammatoir', 'omega-3'],
      difficulty: 'easy',
      season: 'all',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          content: {
            parts: [{ text: JSON.stringify(recipeJson) }],
          },
        }],
      }),
    });

    const result = await extractRecipeWithGemini('<html>recipe page</html>', 'https://example.com', 'fake-key');

    expect(result.title_nl).toBe('Zalm met broccoli');
    expect(result.ingredients).toHaveLength(1);
    expect(result.tags).toContain('omega-3');

    // Verify Gemini API was called correctly
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('generativelanguage.googleapis.com');
    expect(url).toContain('key=fake-key');
    expect(opts.method).toBe('POST');
  });

  it('handles Gemini response with markdown code block', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          content: {
            parts: [{ text: '```json\n{"title_nl":"Test","title_en":"Test"}\n```' }],
          },
        }],
      }),
    });

    const result = await extractRecipeWithGemini('<html></html>', 'https://x.com', 'key');
    expect(result.title_nl).toBe('Test');
  });

  it('throws on Gemini API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: () => Promise.resolve('Rate limited'),
    });

    await expect(extractRecipeWithGemini('<html></html>', 'https://x.com', 'key'))
      .rejects.toThrow('Gemini API error 429');
  });

  it('throws when no JSON in response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          content: {
            parts: [{ text: 'Sorry, I could not find a recipe on this page.' }],
          },
        }],
      }),
    });

    await expect(extractRecipeWithGemini('<html></html>', 'https://x.com', 'key'))
      .rejects.toThrow('No JSON found in Gemini response');
  });

  it('throws when candidates are empty', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ candidates: [] }),
    });

    await expect(extractRecipeWithGemini('<html></html>', 'https://x.com', 'key'))
      .rejects.toThrow('No JSON found');
  });
});

// ─── handler (on-demand) ─────────────────────────────────

describe('handler', () => {
  it('returns 405 for non-POST methods', async () => {
    const req = { method: 'GET', headers: new Map() };
    const res = await handler(req);
    expect(res.status).toBe(405);
  });

  it('returns CORS headers for OPTIONS', async () => {
    const req = { method: 'OPTIONS', headers: new Map() };
    const res = await handler(req);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('returns 401 without auth header', async () => {
    const headers = new Map();
    headers.set = headers.set || function (k, v) { this[k] = v; };
    const req = {
      method: 'POST',
      headers: { get: (key) => null },
    };
    const res = await handler(req);
    expect(res.status).toBe(401);
  });
});
