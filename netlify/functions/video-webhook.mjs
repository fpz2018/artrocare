// Netlify Function: Video Webhook Receiver
// Receives completed video data from n8n after processing
// POST with job_id, video_url, thumbnail_url, etc.

// ─── Supabase helpers ─────────────────────────────────────

async function supabaseRequest(path, supabaseUrl, serviceKey, method = 'GET', body = null, extraHeaders = {}) {
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  if (method === 'POST' || method === 'PATCH') headers.Prefer = 'return=representation';

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${supabaseUrl}/rest/v1${path}`, opts);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase ${method} ${path} failed (${res.status}): ${errText}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ─── Upload video to Supabase Storage ─────────────────────

async function uploadVideoToStorage(videoUrl, exerciseId, supabaseUrl, serviceKey) {
  // Download video from n8n/temporary URL
  const res = await fetch(videoUrl);
  if (!res.ok) throw new Error(`Failed to download video: ${res.status}`);

  const contentType = res.headers.get('content-type') || 'video/mp4';
  const ext = contentType.includes('webm') ? 'webm' : 'mp4';
  const videoBuffer = await res.arrayBuffer();
  const filePath = `${exerciseId}/video.${ext}`;

  // Upload to Supabase Storage
  const uploadRes = await fetch(
    `${supabaseUrl}/storage/v1/object/exercise-media/${filePath}`,
    {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body: videoBuffer,
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Storage upload failed (${uploadRes.status}): ${errText}`);
  }

  // Return public URL
  return `${supabaseUrl}/storage/v1/object/public/exercise-media/${filePath}`;
}

// ─── Upload thumbnail to Supabase Storage ─────────────────

async function uploadThumbnailToStorage(thumbnailUrl, exerciseId, supabaseUrl, serviceKey) {
  const res = await fetch(thumbnailUrl);
  if (!res.ok) throw new Error(`Failed to download thumbnail: ${res.status}`);

  const contentType = res.headers.get('content-type') || 'image/jpeg';
  const ext = contentType.includes('png') ? 'png' : 'jpg';
  const imageBuffer = await res.arrayBuffer();
  const filePath = `${exerciseId}/thumbnail.${ext}`;

  const uploadRes = await fetch(
    `${supabaseUrl}/storage/v1/object/exercise-media/${filePath}`,
    {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body: imageBuffer,
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Thumbnail upload failed (${uploadRes.status}): ${errText}`);
  }

  return `${supabaseUrl}/storage/v1/object/public/exercise-media/${filePath}`;
}

// ─── Main handler ─────────────────────────────────────────

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type, x-webhook-secret' } };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const env = {
    SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    VIDEO_WEBHOOK_SECRET: process.env.VIDEO_WEBHOOK_SECRET,
  };

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing environment variables' }) };
  }

  // Verify webhook secret
  if (env.VIDEO_WEBHOOK_SECRET) {
    const receivedSecret = event.headers['x-webhook-secret'];
    if (receivedSecret !== env.VIDEO_WEBHOOK_SECRET) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid webhook secret' }) };
    }
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { job_id, status, video_url, thumbnail_url, error_message, duration_seconds, file_size_bytes } = body;

  if (!job_id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'job_id is required' }) };
  }

  try {
    // Fetch the job
    const jobs = await supabaseRequest(
      `/video_jobs?id=eq.${job_id}&select=*`,
      env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (!jobs || jobs.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Job not found' }) };
    }

    const job = jobs[0];

    // Handle failure
    if (status === 'failed') {
      await supabaseRequest(
        `/video_jobs?id=eq.${job_id}`,
        env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, 'PATCH',
        {
          status: 'failed',
          error_message: error_message || 'Unknown error from n8n',
          retry_count: (job.retry_count || 0) + 1,
          updated_at: new Date().toISOString(),
        }
      );
      return { statusCode: 200, body: JSON.stringify({ message: 'Job marked as failed' }) };
    }

    // Handle intermediate status updates
    if (status && status !== 'done' && !video_url) {
      await supabaseRequest(
        `/video_jobs?id=eq.${job_id}`,
        env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, 'PATCH',
        { status, updated_at: new Date().toISOString() }
      );
      return { statusCode: 200, body: JSON.stringify({ message: `Job status updated to ${status}` }) };
    }

    // Handle completion with video URL
    if (!video_url) {
      return { statusCode: 400, body: JSON.stringify({ error: 'video_url is required for completion' }) };
    }

    // Upload video to Supabase Storage
    console.log(`Uploading video for job ${job_id} to Supabase Storage`);
    await supabaseRequest(
      `/video_jobs?id=eq.${job_id}`,
      env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, 'PATCH',
      { status: 'uploading', updated_at: new Date().toISOString() }
    );

    const publicVideoUrl = await uploadVideoToStorage(
      video_url, job.exercise_id, env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Upload thumbnail if provided
    let publicThumbnailUrl = null;
    if (thumbnail_url) {
      publicThumbnailUrl = await uploadThumbnailToStorage(
        thumbnail_url, job.exercise_id, env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY
      );
    }

    // Update exercise record
    const exerciseUpdate = {
      has_video: true,
      video_url: publicVideoUrl,
      updated_at: new Date().toISOString(),
    };
    if (publicThumbnailUrl) {
      exerciseUpdate.image_url = publicThumbnailUrl;
    }

    await supabaseRequest(
      `/exercises?id=eq.${job.exercise_id}`,
      env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, 'PATCH',
      exerciseUpdate
    );

    // Update job as done
    await supabaseRequest(
      `/video_jobs?id=eq.${job_id}`,
      env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, 'PATCH',
      {
        status: 'done',
        raw_video_url: video_url,
        final_video_url: publicVideoUrl,
        thumbnail_url: publicThumbnailUrl,
        duration_seconds: duration_seconds || null,
        file_size_bytes: file_size_bytes || null,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    );

    console.log(`Video job ${job_id} completed successfully`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Video uploaded and exercise updated',
        job_id,
        exercise_id: job.exercise_id,
        video_url: publicVideoUrl,
        thumbnail_url: publicThumbnailUrl,
      }),
    };
  } catch (err) {
    console.error('Video webhook error:', err);

    // Try to mark job as failed
    try {
      await supabaseRequest(
        `/video_jobs?id=eq.${job_id}`,
        env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, 'PATCH',
        {
          status: 'failed',
          error_message: `Webhook processing error: ${err.message}`,
          updated_at: new Date().toISOString(),
        }
      );
    } catch { /* ignore */ }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
