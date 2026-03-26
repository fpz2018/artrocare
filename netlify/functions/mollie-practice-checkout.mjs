/**
 * Mollie - Praktijk Mandaat Setup
 *
 * Praktijkbeheerder stelt een betaalmethode in (SEPA/creditcard/iDEAL).
 * Na de eerste symbolische betaling heeft Mollie een mandaat voor
 * de maandelijkse variabele incasso (€2 × actieve patiënten).
 *
 * POST /.netlify/functions/mollie-practice-checkout
 * Headers: Authorization: Bearer <supabase-jwt>
 * Body: { redirectUrl?: string }
 */

const MOLLIE_API = 'https://api.mollie.com/v2';

// ─── Supabase helpers ─────────────────────────────────────────────────────────

async function verifyUser(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: authHeader,
      apikey: process.env.SUPABASE_ANON_KEY,
    },
  });
  if (!res.ok) return null;
  return res.json();
}

async function dbGet(table, filters) {
  const params = new URLSearchParams(filters);
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${table}?${params}&limit=1`, {
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Accept: 'application/vnd.pgrst.object+json',
    },
  });
  if (res.status === 406) return null;
  if (!res.ok) return null;
  return res.json();
}

async function dbPatch(table, filters, body) {
  const params = new URLSearchParams(filters);
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${table}?${params}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  });
  return res.ok;
}

async function dbInsert(table, body) {
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) ? rows[0] : rows;
}

// ─── Mollie helpers ───────────────────────────────────────────────────────────

async function molliePost(path, body) {
  const res = await fetch(`${MOLLIE_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MOLLIE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || `Mollie error ${res.status}`);
  return data;
}

async function getOrCreateMolliePracticeCustomer(practiceId, practiceName, email) {
  const practice = await dbGet('practices', { id: `eq.${practiceId}`, select: 'mollie_customer_id,name,email' });
  if (practice?.mollie_customer_id) return practice.mollie_customer_id;

  const customer = await molliePost('/customers', {
    name: practiceName || practice?.name || 'Artrocare Praktijk',
    email: email || practice?.email,
    metadata: { supabase_practice_id: practiceId },
  });

  await dbPatch('practices', { id: `eq.${practiceId}` }, {
    mollie_customer_id: customer.id,
    updated_at: new Date().toISOString(),
  });

  return customer.id;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const origin = event.headers.origin || event.headers.Origin || 'https://artrocare.nl';
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    // 1. Verificeer gebruiker en controleer rol
    const user = await verifyUser(event.headers.authorization || event.headers.Authorization);
    if (!user?.id) {
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Niet ingelogd' }) };
    }

    const profile = await dbGet('profiles', {
      id: `eq.${user.id}`,
      select: 'role,practice_id,full_name,email',
    });

    if (profile?.role !== 'practice_admin') {
      return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'Alleen praktijkbeheerders' }) };
    }

    const practiceId = profile.practice_id;
    if (!practiceId) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Geen praktijk gevonden' }) };
    }

    // 2. Controleer of er al een geldig mandaat is
    const existingMandate = await dbGet('billing_mandates', {
      practice_id: `eq.${practiceId}`,
      status: `eq.valid`,
      select: 'id',
    });
    if (existingMandate) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Betaalmethode is al ingesteld' }),
      };
    }

    // 3. Praktijk ophalen
    const practice = await dbGet('practices', { id: `eq.${practiceId}`, select: 'name,email,mollie_customer_id' });

    // 4. Mollie klant ophalen of aanmaken
    const customerId = await getOrCreateMolliePracticeCustomer(
      practiceId,
      practice?.name,
      profile.email || practice?.email,
    );

    // 5. Body parsen
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch { /* default */ }

    const appUrl = process.env.URL || origin;
    const redirectUrl = body.redirectUrl || `${appUrl}/practice?checkout=success`;
    const webhookUrl = `${appUrl}/.netlify/functions/mollie-webhook`;

    // 6. Eerste betaling aanmaken voor mandaat (€2 = eerste maand estimate)
    const payment = await molliePost('/payments', {
      amount: { currency: 'EUR', value: '2.00' },
      description: `Artrocare praktijk – mandaat instelling (${practice?.name || 'Praktijk'})`,
      sequenceType: 'first',
      customerId,
      redirectUrl,
      webhookUrl,
      locale: 'nl_NL',
      metadata: {
        supabase_practice_id: practiceId,
        type: 'practice_mandate_first',
      },
    });

    // 7. Pending mandaat aanmaken in database
    await dbInsert('billing_mandates', {
      practice_id: practiceId,
      mollie_customer_id: customerId,
      status: 'pending',
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ checkoutUrl: payment._links.checkout.href }),
    };

  } catch (err) {
    console.error('[mollie-practice-checkout] Fout:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Interne serverfout', detail: err.message }),
    };
  }
};
