// Netlify Serverless Function: Stripe Checkout Session Creator
// Creates a one-time payment session for ArtroCare founding member (€97)

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { user_id, email, locale } = body;

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const origin = req.headers.get('origin') || process.env.URL || 'https://artrocare.nl';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'ideal'],
      locale: locale === 'en' ? 'en' : 'nl',
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: 9700, // €97 in cents
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
        user_id,
      },
      success_url: `${origin}/dashboard?payment=success`,
      cancel_url: `${origin}/premium`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const config = {
  path: '/api/create-checkout',
};
