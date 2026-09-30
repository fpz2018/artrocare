// Netlify Serverless Function: Stripe Webhook Handler
// Verwerkt checkout.session.completed  -> gebruiker naar premium
// Verwerkt charge.refunded (volledig)  -> gebruiker terug naar free
//
// Beveiliging en betrouwbaarheid:
// - De signature wordt geverifieerd met het webhook-secret (ongewijzigd).
// - Het user_id uit de metadata wordt op UUID-formaat gecontroleerd voordat
//   het in een PostgREST-filter terechtkomt. Zonder die controle kon een
//   waarde als "x&id=neq.0000..." de selectie van de update verruimen.
// - Events worden gededupliceerd op event.id. Stripe kan een event opnieuw
//   afleveren; zonder dedup werd program_start_date telkens opnieuw gezet.
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function supabaseConfig() {
  return {
    url: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

async function supabaseRequest(path, method = 'GET', body = null, extraHeaders = {}) {
  const { url: supabaseUrl, serviceKey } = supabaseConfig();
  const opts = {
    method,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...extraHeaders,
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${supabaseUrl}/rest/v1${path}`, opts);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase ${method} ${path} failed (${res.status}): ${errText}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// Registreert het event. Geeft terug of dit de eerste keer is dat we het zien.
// Als de tabel ontbreekt (migratie nog niet gedraaid) gaan we door en loggen we.
async function claimEvent(event) {
  try {
    const rows = await supabaseRequest('/stripe_events', 'POST', {
      id: event.id,
      type: event.type,
    }, { Prefer: 'resolution=ignore-duplicates,return=representation' });

    return { first: Array.isArray(rows) && rows.length > 0, checked: true };
  } catch (err) {
    console.warn('Kon event niet registreren (stripe_events ontbreekt?):', err.message);
    return { first: true, checked: false };
  }
}

async function upgradeToPremium(userId) {
  await supabaseRequest(`/profiles?id=eq.${userId}`, 'PATCH', {
    subscription_tier: 'premium',
    program_start_date: new Date().toISOString().split('T')[0],
  });
}

async function downgradeToFree(userId) {
  await supabaseRequest(`/profiles?id=eq.${userId}`, 'PATCH', {
    subscription_tier: 'free',
  });
}

// Zoekt het user_id dat bij een terugbetaling hoort via de checkout-sessie.
async function userIdForPaymentIntent(paymentIntentId) {
  if (!paymentIntentId) return null;
  const sessions = await stripe.checkout.sessions.list({
    payment_intent: paymentIntentId,
    limit: 1,
  });
  const userId = sessions.data?.[0]?.metadata?.user_id;
  return UUID_RE.test(userId || '') ? userId : null;
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !webhookSecret) {
    return new Response('Missing signature or webhook secret', { status: 400 });
  }

  let event;
  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response('Webhook Error', { status: 400 });
  }

  // Idempotentie: hetzelfde event nooit twee keer verwerken.
  const { first } = await claimEvent(event);
  if (!first) {
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata?.user_id;

      if (!UUID_RE.test(userId || '')) {
        console.error('checkout.session.completed zonder geldig user_id in metadata');
        return new Response('Invalid user_id in metadata', { status: 400 });
      }

      await upgradeToPremium(userId);
      console.log(`User ${userId} upgraded to premium, programme started`);
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object;
      const fullyRefunded =
        typeof charge.amount_refunded === 'number' &&
        typeof charge.amount === 'number' &&
        charge.amount_refunded >= charge.amount;

      if (fullyRefunded) {
        const userId = await userIdForPaymentIntent(charge.payment_intent);
        if (userId) {
          await downgradeToFree(userId);
          console.log(`User ${userId} teruggezet naar free na volledige terugbetaling`);
        } else {
          console.warn('Volledige terugbetaling zonder herleidbaar user_id');
        }
      }
    }
  } catch (err) {
    console.error(`Verwerken van ${event.type} mislukt:`, err);
    return new Response('Processing failed', { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const config = {
  path: '/api/stripe-webhook',
};
