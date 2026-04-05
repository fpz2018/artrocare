// Netlify Serverless Function: Stripe Webhook Handler
// Processes checkout.session.completed → upgrades user to premium

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function supabaseRequest(path, method = 'GET', body = null) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const opts = {
    method,
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
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
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.user_id;

    if (!userId) {
      console.error('No user_id in session metadata');
      return new Response('No user_id in metadata', { status: 400 });
    }

    try {
      // Update profile: set premium + start programme
      await supabaseRequest(
        `/profiles?id=eq.${userId}`,
        'PATCH',
        {
          subscription_tier: 'premium',
          program_start_date: new Date().toISOString().split('T')[0],
        }
      );

      console.log(`User ${userId} upgraded to premium, programme started`);
    } catch (err) {
      console.error('Failed to update profile:', err);
      return new Response('Database update failed', { status: 500 });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const config = {
  path: '/api/stripe-webhook',
};
