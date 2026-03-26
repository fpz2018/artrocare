/**
 * Mollie - Patiënt Checkout
 *
 * Start een Mollie-betalingssessie voor de patiënt (€2/mnd).
 * Stap 1: eerste betaling met sequenceType=first → mandaat aanmaken.
 * Na succesvolle betaling verwerkt de webhook de recurring subscription.
 *
 * POST /.netlify/functions/mollie-patient-checkout
 * Headers: Authorization: Bearer <supabase-jwt>
 * Body: { redirectUrl?: string }
 */

const MOLLIE_API = 'https://api.mollie.com/v2';

// ─── Supabase helpers (geen SDK nodig) ────────────────────────────────────────

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
  if (res.status === 406) return null; // no rows
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

async function mollieGet(path) {
  const res = await fetch(`${MOLLIE_API}${path}`, {
    headers: { Authorization: `Bearer ${process.env.MOLLIE_API_KEY}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || `Mollie error ${res.status}`);
  return data;
}

async function getOrCreateMollieCustomer(userId, email, name) {
  // Kijk of we al een mollie_customer_id hebben
  const profile = await dbGet('profiles', { id: `eq.${userId}`, select: 'mollie_customer_id' });
  if (profile?.mollie_customer_id) return profile.mollie_customer_id;

  // Aanmaken bij Mollie
  const customer = await molliePost('/customers', {
    name: name || email,
    email,
    metadata: { supabase_user_id: userId },
  });

  // Opslaan in profiles
  await dbPatch('profiles', { id: `eq.${userId}` }, {
    mollie_customer_id: customer.id,
    updated_at: new Date().toISOString(),
  });

  return customer.id;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const origin = event.headers.origin || event.headers.Origin || 'https://artrocare.nl';
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  try {
    // 1. Verificeer gebruiker
    const user = await verifyUser(event.headers.authorization || event.headers.Authorization);
    if (!user?.id) {
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Niet ingelogd' }) };
    }

    // 2. Controleer of er al een actief abonnement is
    const existing = await dbGet('billing_subscriptions', {
      user_id: `eq.${user.id}`,
      status: `eq.active`,
      select: 'id,status',
    });
    if (existing) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Abonnement is al actief' }),
      };
    }

    // 3. Lees profiel
    const profile = await dbGet('profiles', { id: `eq.${user.id}`, select: 'full_name,email,mollie_customer_id' });
    const email = profile?.email || user.email;
    const name = profile?.full_name || email;

    // 4. Mollie klant ophalen of aanmaken
    const customerId = await getOrCreateMollieCustomer(user.id, email, name);

    // 5. Body parsen
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch { /* default */ }

    const appUrl = process.env.URL || origin;
    const redirectUrl = body.redirectUrl || `${appUrl}/billing?checkout=success`;
    const webhookUrl = `${appUrl}/.netlify/functions/mollie-webhook`;

    // 6. Eerste betaling aanmaken (sequenceType=first → mandaat)
    const payment = await molliePost('/payments', {
      amount: { currency: 'EUR', value: '2.00' },
      description: 'Artrocare patiënt – eerste maand (€2/mnd)',
      sequenceType: 'first',
      customerId,
      redirectUrl,
      webhookUrl,
      locale: 'nl_NL',
      metadata: {
        supabase_user_id: user.id,
        type: 'patient_subscription_first',
      },
    });

    // 7. Pending abonnement aanmaken in database
    await dbInsert('billing_subscriptions', {
      user_id: user.id,
      mollie_customer_id: customerId,
      status: 'pending',
      amount: 2.00,
      interval: '1 month',
    });

    // 8. Checkout URL teruggeven
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ checkoutUrl: payment._links.checkout.href }),
    };

  } catch (err) {
    console.error('[mollie-patient-checkout] Fout:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Interne serverfout', detail: err.message }),
    };
  }
};
