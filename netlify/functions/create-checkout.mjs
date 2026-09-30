// Netlify Serverless Function: Stripe Checkout Session Creator
// Maakt een eenmalige betaalsessie voor het ArtroCare founding member-programma.
//
// Beveiliging:
// - De gebruiker moet een geldig Supabase access token meesturen. Het user_id
//   komt uit dat token, NIET uit de request body. Zonder deze controle kon
//   iedereen een checkout voor een willekeurig account starten.
// - De success- en cancel-URL komen uit een allowlist van eigen domeinen.
//   Voorheen werd de Origin-header overgenomen, waardoor de redirect na
//   betaling naar een willekeurig domein kon wijzen.
// - De prijs komt uit een environment-variabele met een veilige default.
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const DEFAULT_ALLOWED_ORIGINS = ['https://artrocare.app', 'https://www.artrocare.app'];

function allowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS;
  if (!raw) return DEFAULT_ALLOWED_ORIGINS;
  return raw
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function resolveOrigin(req) {
  const list = allowedOrigins();
  const requestOrigin = (req.headers.get('origin') || '').replace(/\/$/, '');
  if (requestOrigin && list.includes(requestOrigin)) return requestOrigin;
  const siteUrl = (process.env.URL || '').replace(/\/$/, '');
  if (siteUrl && list.includes(siteUrl)) return siteUrl;
  return list[0];
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Verifieert het Supabase access token en geeft de gebruiker terug.
async function getAuthenticatedUser(req) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase-omgevingsvariabelen ontbreken (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)');
  }

  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;

  const user = await res.json();
  return user?.id ? user : null;
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return json({ error: 'Niet ingelogd' }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const { locale } = body;

    const origin = resolveOrigin(req);
    const unitAmount = Number(process.env.STRIPE_PRICE_FOUNDING_CENTS || 9700);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'ideal'],
      locale: locale === 'en' ? 'en' : 'nl',
      customer_email: user.email || undefined,
      client_reference_id: user.id,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: unitAmount,
            product_data: {
              name: locale === 'en'
                ? 'ArtroCare Founding Member — 12-week programme'
                : 'ArtroCare Founding Member — 12-weken programma',
              description: locale === 'en'
                ? '12-week guidance programme, 3 physio check-ins, recipes & shopping lists, supplements knowledge base'
                : '12-weken begeleidingsprogramma, 3 fysio check-ins, recepten & boodschappenlijsten, supplementen-kennisbank',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
      },
      success_url: `${origin}/dashboard?payment=success`,
      cancel_url: `${origin}/premium`,
    });

    return json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return json({ error: 'Checkout kon niet worden gestart' }, 500);
  }
}

export const config = {
  path: '/api/create-checkout',
};
