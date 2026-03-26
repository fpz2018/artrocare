/**
 * Mollie Webhook Handler
 *
 * Verwerkt alle betalingsstatus-updates van Mollie:
 * - Eerste patiëntbetaling betaald → recurring subscription aanmaken
 * - Patiëntbetaling mislukt/verlopen → abonnement opschorten
 * - Eerste praktijkbetaling betaald → mandaat activeren
 * - Praktijkbetaling (maandelijks) betaald → betalingshistorie bijwerken
 *
 * POST /.netlify/functions/mollie-webhook
 * Body (form-encoded): id=<mollie-payment-id>
 */

const MOLLIE_API = 'https://api.mollie.com/v2';

// ─── Mollie helpers ───────────────────────────────────────────────────────────

async function mollieGet(path) {
  const res = await fetch(`${MOLLIE_API}${path}`, {
    headers: { Authorization: `Bearer ${process.env.MOLLIE_API_KEY}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || `Mollie error ${res.status}`);
  return data;
}

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

// ─── Supabase helpers ─────────────────────────────────────────────────────────

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
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  });
  return res.ok;
}

// ─── Verwerking per betalingstype ─────────────────────────────────────────────

async function handlePatientFirstPayment(payment, userId) {
  const customerId = payment.customerId;
  const mandateId = payment.mandateId;

  // Maak recurring subscription aan bij Mollie (maandelijks €2)
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const startDate = nextMonth.toISOString().split('T')[0]; // YYYY-MM-DD

  const subscription = await molliePost(`/customers/${customerId}/subscriptions`, {
    amount: { currency: 'EUR', value: '2.00' },
    interval: '1 month',
    startDate,
    description: 'Artrocare patiënt – maandelijks abonnement (€2)',
    mandateId,
    webhookUrl: `${process.env.URL}/.netlify/functions/mollie-webhook`,
    metadata: { supabase_user_id: userId, type: 'patient_subscription_recurring' },
  });

  // Update billing_subscriptions → actief
  await dbPatch('billing_subscriptions', { user_id: `eq.${userId}` }, {
    mollie_subscription_id: subscription.id,
    mollie_mandate_id: mandateId,
    status: 'active',
    started_at: new Date().toISOString(),
    next_payment_at: startDate,
    updated_at: new Date().toISOString(),
  });

  // Upgrade subscription_tier in profiles → premium
  await dbPatch('profiles', { id: `eq.${userId}` }, {
    subscription_tier: 'premium',
    updated_at: new Date().toISOString(),
  });

  // Sla betaling op in history
  await dbInsert('billing_payments', {
    user_id: userId,
    mollie_payment_id: payment.id,
    amount: parseFloat(payment.amount.value),
    description: payment.description,
    status: 'paid',
    paid_at: payment.paidAt || new Date().toISOString(),
  });

  console.log(`[webhook] Patiënt ${userId} abonnement actief, subscription ${subscription.id}`);
}

async function handlePatientRecurringPayment(payment, userId) {
  // Recurring betaling betaald → log in history
  await dbInsert('billing_payments', {
    user_id: userId,
    mollie_payment_id: payment.id,
    amount: parseFloat(payment.amount.value),
    description: payment.description,
    status: 'paid',
    paid_at: payment.paidAt || new Date().toISOString(),
  });

  // Zorg dat tier premium blijft (failsafe)
  await dbPatch('profiles', { id: `eq.${userId}` }, {
    subscription_tier: 'premium',
    updated_at: new Date().toISOString(),
  });

  // Update next_payment_at in subscription
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  await dbPatch('billing_subscriptions', { user_id: `eq.${userId}` }, {
    next_payment_at: nextMonth.toISOString(),
    status: 'active',
    updated_at: new Date().toISOString(),
  });

  console.log(`[webhook] Patiënt ${userId} recurring betaling geslaagd`);
}

async function handlePatientFailedPayment(payment, userId) {
  // Betaling mislukt → subscription opschorten, tier terug naar free
  await dbPatch('billing_subscriptions', { user_id: `eq.${userId}` }, {
    status: 'suspended',
    updated_at: new Date().toISOString(),
  });

  await dbPatch('profiles', { id: `eq.${userId}` }, {
    subscription_tier: 'free',
    updated_at: new Date().toISOString(),
  });

  await dbInsert('billing_payments', {
    user_id: userId,
    mollie_payment_id: payment.id,
    amount: parseFloat(payment.amount.value),
    description: payment.description,
    status: payment.status,
  });

  console.log(`[webhook] Patiënt ${userId} betaling mislukt → tier terug naar free`);
}

async function handlePracticeFirstPayment(payment, practiceId) {
  const mandateId = payment.mandateId;

  // Haal mandaat-details op bij Mollie
  let mandate = null;
  if (mandateId) {
    try {
      mandate = await mollieGet(`/customers/${payment.customerId}/mandates/${mandateId}`);
    } catch (e) {
      console.warn('[webhook] Kon mandaat niet ophalen:', e.message);
    }
  }

  // Update billing_mandates → geldig
  await dbPatch('billing_mandates', { practice_id: `eq.${practiceId}` }, {
    mollie_mandate_id: mandateId || null,
    method: mandate?.method || payment.method,
    status: 'valid',
    holder_name: mandate?.details?.consumerName || null,
    account_number: mandate?.details?.consumerAccount || null,
    updated_at: new Date().toISOString(),
  });

  // Log eerste betaling
  await dbInsert('billing_payments', {
    practice_id: practiceId,
    mollie_payment_id: payment.id,
    amount: parseFloat(payment.amount.value),
    description: payment.description,
    status: 'paid',
    paid_at: payment.paidAt || new Date().toISOString(),
  });

  console.log(`[webhook] Praktijk ${practiceId} mandaat actief`);
}

async function handlePracticeRecurringPayment(payment, practiceId) {
  // Maandelijkse incasso betaald
  await dbInsert('billing_payments', {
    practice_id: practiceId,
    mollie_payment_id: payment.id,
    amount: parseFloat(payment.amount.value),
    description: payment.description,
    status: 'paid',
    paid_at: payment.paidAt || new Date().toISOString(),
  });
  console.log(`[webhook] Praktijk ${practiceId} maandelijkse incasso betaald`);
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    // Mollie stuurt id als form-encoded body
    const params = new URLSearchParams(event.body || '');
    const paymentId = params.get('id');

    if (!paymentId) {
      return { statusCode: 400, body: 'Missing payment id' };
    }

    // Ophalen bij Mollie (verificatie dat het echt van Mollie komt)
    const payment = await mollieGet(`/payments/${paymentId}`);
    const meta = payment.metadata || {};
    const paymentType = meta.type || '';

    console.log(`[webhook] Betaling ${paymentId} status=${payment.status} type=${paymentType}`);

    // ── Patiënt flows ──
    if (meta.supabase_user_id) {
      const userId = meta.supabase_user_id;

      if (payment.status === 'paid') {
        if (paymentType === 'patient_subscription_first') {
          await handlePatientFirstPayment(payment, userId);
        } else {
          await handlePatientRecurringPayment(payment, userId);
        }
      } else if (['failed', 'expired', 'canceled'].includes(payment.status)) {
        await handlePatientFailedPayment(payment, userId);
      }
    }

    // ── Praktijk flows ──
    if (meta.supabase_practice_id) {
      const practiceId = meta.supabase_practice_id;

      if (payment.status === 'paid') {
        if (paymentType === 'practice_mandate_first') {
          await handlePracticeFirstPayment(payment, practiceId);
        } else {
          await handlePracticeRecurringPayment(payment, practiceId);
        }
      } else if (['failed', 'expired', 'canceled'].includes(payment.status)) {
        // Log mislukte praktijk-betaling
        await dbInsert('billing_payments', {
          practice_id: practiceId,
          mollie_payment_id: payment.id,
          amount: parseFloat(payment.amount.value),
          description: payment.description,
          status: payment.status,
        });
        console.warn(`[webhook] Praktijk ${practiceId} betaling mislukt: ${payment.status}`);
      }
    }

    // Mollie verwacht altijd HTTP 200
    return { statusCode: 200, body: 'OK' };

  } catch (err) {
    console.error('[mollie-webhook] Fout:', err);
    // Stuur 200 zodat Mollie niet blijft retry-en voor verwerkingsfouten
    return { statusCode: 200, body: 'Verwerking mislukt maar ontvangen' };
  }
};
