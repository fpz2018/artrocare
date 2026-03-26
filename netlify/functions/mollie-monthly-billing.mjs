/**
 * Mollie - Maandelijkse Praktijk Facturering
 *
 * Telt per praktijk het aantal actieve patiënten (≥1 meting in 30 dagen)
 * en incasseert €2 per actieve patiënt via het opgeslagen Mollie-mandaat.
 *
 * Uitvoering: 1e van elke maand (via Netlify Scheduled Function of externe cron).
 * Beschermd met BILLING_CRON_SECRET header.
 *
 * POST /.netlify/functions/mollie-monthly-billing
 * Headers: x-cron-secret: <BILLING_CRON_SECRET>
 *
 * Kan ook handmatig worden aangeroepen door een admin voor een specifieke praktijk:
 * Body: { practiceId?: string, dryRun?: boolean }
 */

const MOLLIE_API = 'https://api.mollie.com/v2';
const PATIENT_RATE = 2.00; // € per actieve patiënt per maand

// ─── Supabase helpers ─────────────────────────────────────────────────────────

async function dbQuery(path, filters = {}) {
  const params = new URLSearchParams(filters);
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}?${params}`, {
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
  if (!res.ok) return [];
  return res.json();
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

// ─── Actieve patiënten per praktijk tellen ────────────────────────────────────

async function countActivePatientsPerPractice(practiceId = null) {
  /**
   * Actieve patiënt = heeft ≥1 meting in de laatste 30 dagen.
   * Structuur: praktijk → therapeuten → patiënten → metingen.
   *
   * Supabase REST API ondersteunt geen complexe joins, dus we doen
   * dit in meerdere stappen.
   */

  // 1. Haal alle goedgekeurde praktijken op (of alleen de gevraagde)
  const practiceFilter = {
    status: 'eq.approved',
    select: 'id,name,mollie_customer_id',
  };
  if (practiceId) practiceFilter['id'] = `eq.${practiceId}`;

  const practices = await dbQuery('practices', practiceFilter);
  if (!practices.length) return [];

  const results = [];

  for (const practice of practices) {
    // 2. Haal therapeuten op van deze praktijk
    const therapists = await dbQuery('profiles', {
      practice_id: `eq.${practice.id}`,
      role: 'eq.therapist',
      select: 'id',
    });
    if (!therapists.length) {
      results.push({ ...practice, activePatientsCount: 0 });
      continue;
    }

    const therapistIds = therapists.map(t => t.id);

    // 3. Haal patiënten op van deze therapeuten
    const patients = await dbQuery('profiles', {
      therapist_id: `in.(${therapistIds.join(',')})`,
      role: 'eq.patient',
      select: 'id',
    });
    if (!patients.length) {
      results.push({ ...practice, activePatientsCount: 0 });
      continue;
    }

    const patientIds = patients.map(p => p.id);

    // 4. Tel patiënten met ≥1 meting in laatste 30 dagen
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoff = thirtyDaysAgo.toISOString().split('T')[0];

    // Haal unieke user_ids op uit measurements (last 30 days)
    const recentMeasurements = await dbQuery('measurements', {
      user_id: `in.(${patientIds.join(',')})`,
      date: `gte.${cutoff}`,
      select: 'user_id',
    });

    const activePatientIds = new Set(recentMeasurements.map(m => m.user_id));
    results.push({ ...practice, activePatientsCount: activePatientIds.size });
  }

  return results;
}

// ─── Incasso per praktijk ─────────────────────────────────────────────────────

async function billPractice(practice, activePatientsCount, periodStart, periodEnd, dryRun) {
  if (activePatientsCount === 0) {
    console.log(`[billing] Praktijk ${practice.name}: 0 actieve patiënten → geen incasso`);
    return { status: 'skipped', reason: 'no_active_patients' };
  }

  if (!practice.mollie_customer_id) {
    console.warn(`[billing] Praktijk ${practice.name}: geen Mollie klant-ID → overgeslagen`);
    return { status: 'skipped', reason: 'no_mollie_customer' };
  }

  const amount = (activePatientsCount * PATIENT_RATE).toFixed(2);
  const description = `Artrocare ${practice.name} – ${activePatientsCount} actieve patiënt${activePatientsCount !== 1 ? 'en' : ''} × €${PATIENT_RATE} (${periodStart})`;

  if (dryRun) {
    console.log(`[billing] DRY RUN – Praktijk ${practice.name}: €${amount} (${activePatientsCount} patiënten)`);
    return { status: 'dry_run', amount, activePatientsCount };
  }

  try {
    // Recurring betaling via opgeslagen mandaat
    const payment = await molliePost('/payments', {
      amount: { currency: 'EUR', value: amount },
      description,
      sequenceType: 'recurring',
      customerId: practice.mollie_customer_id,
      webhookUrl: `${process.env.URL}/.netlify/functions/mollie-webhook`,
      metadata: {
        supabase_practice_id: practice.id,
        type: 'practice_monthly_billing',
        active_patients: activePatientsCount,
        period_start: periodStart,
        period_end: periodEnd,
      },
    });

    // Sla op in billing_payments (status wordt bijgewerkt via webhook)
    await dbInsert('billing_payments', {
      practice_id: practice.id,
      mollie_payment_id: payment.id,
      amount: parseFloat(amount),
      description,
      status: payment.status,
      active_patients_count: activePatientsCount,
      billing_period_start: periodStart,
      billing_period_end: periodEnd,
    });

    console.log(`[billing] Praktijk ${practice.name}: €${amount} incasso gestart (${payment.id})`);
    return { status: 'charged', amount, activePatientsCount, paymentId: payment.id };

  } catch (err) {
    console.error(`[billing] Praktijk ${practice.name} incasso mislukt:`, err.message);
    return { status: 'error', error: err.message, activePatientsCount };
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export const handler = async (event) => {
  // Beveilig met cron-secret
  const secret = event.headers['x-cron-secret'] || event.headers['X-Cron-Secret'];
  if (secret !== process.env.BILLING_CRON_SECRET) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Ongeautoriseerd' }) };
  }

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch { /* default */ }

  const dryRun = body.dryRun === true;
  const specificPracticeId = body.practiceId || null;

  // Factureringsperiode: vorige maand
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
  const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

  console.log(`[billing] Start maandelijkse facturering ${periodStart} → ${periodEnd} (dryRun=${dryRun})`);

  try {
    const practices = await countActivePatientsPerPractice(specificPracticeId);

    const results = [];
    for (const practice of practices) {
      const result = await billPractice(
        practice,
        practice.activePatientsCount,
        periodStart,
        periodEnd,
        dryRun,
      );
      results.push({ practice: practice.name, practiceId: practice.id, ...result });
    }

    const summary = {
      period: `${periodStart} → ${periodEnd}`,
      dryRun,
      totalPractices: practices.length,
      charged: results.filter(r => r.status === 'charged').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      errors: results.filter(r => r.status === 'error').length,
      totalRevenue: results
        .filter(r => r.status === 'charged')
        .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0)
        .toFixed(2),
      results,
    };

    console.log('[billing] Klaar:', JSON.stringify(summary));
    return { statusCode: 200, body: JSON.stringify(summary) };

  } catch (err) {
    console.error('[mollie-monthly-billing] Fout:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
