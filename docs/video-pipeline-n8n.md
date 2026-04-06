# ArtroCare Video Pipeline — n8n Workflow Setup

## Architectuur Overzicht

```
Netlify (generate-video)          n8n Workflow                    Netlify (video-webhook)
┌─────────────────────┐    ┌─────────────────────────────┐    ┌──────────────────────┐
│ 1. Claude prompt     │───▶│ 2. ImagineArt API call      │    │ 6. Upload → Supabase │
│    genereren         │    │ 3. Poll video status        │    │ 7. Update exercise   │
│                      │    │ 4. Download video           │───▶│                      │
│                      │    │ 5. FFmpeg overlays          │    │                      │
└─────────────────────┘    └─────────────────────────────┘    └──────────────────────┘
```

## Benodigde Environment Variables (Netlify Dashboard)

| Variabele | Beschrijving |
|-----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key (al geconfigureerd) |
| `N8N_VIDEO_WEBHOOK_URL` | n8n webhook trigger URL (bijv. `https://jouw-n8n.app/webhook/video-generate`) |
| `VIDEO_WEBHOOK_SECRET` | Gedeeld secret voor webhook authenticatie |

## n8n Workflow Nodes

### Node 1: Webhook Trigger
- **Type**: Webhook
- **Method**: POST
- **Path**: `/webhook/video-generate`
- **Authentication**: Header Auth (`x-webhook-secret`)
- **Output**: `job_id`, `exercise_id`, `prompt_en`, `negative_prompt`, `style_tags`, `overlay_config`

### Node 2: ImagineArt API — Video Genereren
- **Type**: HTTP Request
- **Method**: POST
- **URL**: `https://api.imagineart.ai/v1/video/generate` (pas aan naar actuele API URL)
- **Headers**:
  - `Authorization`: `Bearer {{$env.IMAGINEART_API_KEY}}`
  - `Content-Type`: `application/json`
- **Body**:
```json
{
  "prompt": "{{$json.prompt_en}}",
  "negative_prompt": "{{$json.negative_prompt}}",
  "duration": 10,
  "style": "realistic",
  "aspect_ratio": "16:9"
}
```
- **Output**: `generation_id` of `task_id`

### Node 3: Status Update → Netlify
- **Type**: HTTP Request
- **Method**: POST
- **URL**: `https://artrocare.app/.netlify/functions/video-webhook`
- **Headers**: `x-webhook-secret: {{$env.VIDEO_WEBHOOK_SECRET}}`
- **Body**:
```json
{
  "job_id": "{{$json.job_id}}",
  "status": "generating_video"
}
```

### Node 4: Wait / Poll Loop
- **Type**: Loop + Wait + HTTP Request
- **Interval**: 30 seconden
- **Max pogingen**: 60 (= 30 min timeout)
- **Poll URL**: `https://api.imagineart.ai/v1/video/status/{{$json.generation_id}}`
- **Stop conditie**: `status === 'completed'` of `status === 'failed'`

### Node 5: IF — Succes of Fout?
- **Type**: IF
- **Conditie**: Video generation succeeded?
- **True**: Ga naar Node 6 (FFmpeg)
- **False**: Ga naar Error Handler

### Node 6: Download Video
- **Type**: HTTP Request
- **Method**: GET
- **URL**: `{{$json.video_url}}` (van ImagineArt response)
- **Response**: Binary data opslaan

### Node 7: FFmpeg — Overlays Toevoegen
- **Type**: Execute Command (of FFmpeg node)
- **Commando**:
```bash
ffmpeg -i input.mp4 \
  -i /assets/artrocare-intro.mp4 \
  -i /assets/artrocare-outro.mp4 \
  -i /assets/artrocare-logo.png \
  -filter_complex "
    [0:v]drawtext=text='{{exercise_title_nl}}':fontsize=36:fontcolor=white:x=(w-text_w)/2:y=h-80:
      box=1:boxcolor=black@0.5:boxborderw=10:fontfile=/fonts/Inter-Bold.ttf,
    drawtext=text='{{exercise_sets}} sets × {{exercise_reps}}':fontsize=24:fontcolor=white:
      x=(w-text_w)/2:y=h-40:box=1:boxcolor=black@0.3:boxborderw=5:fontfile=/fonts/Inter-Regular.ttf
    [main];
    [1:v][main][2:v]concat=n=3:v=1:a=0[outv];
    [outv]overlay=W-w-20:20[final]
  " \
  -map "[final]" \
  -c:v libx264 -preset fast -crf 23 \
  output.mp4
```

**Overlay onderdelen:**
1. **Intro** (2-3s): ArtroCare branding animatie
2. **Hoofd-video**: AI-gegenereerde oefening met:
   - Oefening titel (onder in beeld)
   - Sets/herhalingen tekst
   - ArtroCare logo (rechts boven)
3. **Outro** (2-3s): ArtroCare logo + website URL

**Assets nodig:**
- `/assets/artrocare-intro.mp4` — Intro animatie (maak in Canva/After Effects)
- `/assets/artrocare-outro.mp4` — Outro animatie
- `/assets/artrocare-logo.png` — Logo met transparante achtergrond
- `/fonts/Inter-Bold.ttf` en `/fonts/Inter-Regular.ttf`

### Node 8: Status Update → Processing
- **Type**: HTTP Request
- **Body**: `{ "job_id": "...", "status": "processing_overlays" }`

### Node 9: Thumbnail Genereren
- **Type**: Execute Command
```bash
ffmpeg -i output.mp4 -ss 00:00:03 -vframes 1 -q:v 2 thumbnail.jpg
```

### Node 10: Upload Video Tijdelijk
- Sla de video op een tijdelijke locatie op (bijv. n8n static files, of een temp S3 bucket)
- De webhook zal het downloaden en naar Supabase Storage uploaden

### Node 11: Webhook → Netlify (Voltooiing)
- **Type**: HTTP Request
- **Method**: POST
- **URL**: `https://artrocare.app/.netlify/functions/video-webhook`
- **Headers**: `x-webhook-secret: {{$env.VIDEO_WEBHOOK_SECRET}}`
- **Body**:
```json
{
  "job_id": "{{$json.job_id}}",
  "status": "done",
  "video_url": "{{tijdelijke URL van verwerkte video}}",
  "thumbnail_url": "{{tijdelijke URL van thumbnail}}",
  "duration_seconds": 15,
  "file_size_bytes": 5242880
}
```

### Error Handler Node
- **Type**: HTTP Request
- **URL**: `https://artrocare.app/.netlify/functions/video-webhook`
- **Body**:
```json
{
  "job_id": "{{$json.job_id}}",
  "status": "failed",
  "error_message": "{{$json.error_description}}"
}
```

## n8n Environment Variables

Stel deze in via n8n Settings > Variables:

| Variabele | Waarde |
|-----------|--------|
| `IMAGINEART_API_KEY` | Je ImagineArt API key |
| `VIDEO_WEBHOOK_SECRET` | Zelfde waarde als in Netlify |
| `ARTROCARE_WEBHOOK_URL` | `https://artrocare.app/.netlify/functions/video-webhook` |

## Branded Overlay Specificaties

### Kleurenpalet
- Primair: `#0EA5E9` (sky-500)
- Tekst: `#FFFFFF` (wit op donkere achtergrond)
- Achtergrond overlay: `rgba(0, 0, 0, 0.5)`

### Lettertype
- Titels: Inter Bold, 36px
- Instructies: Inter Regular, 24px
- Ondertitels: Inter Medium, 18px

### Layout
```
┌────────────────────────────────────────┐
│                              [LOGO]    │  ← ArtroCare logo, 80x80px
│                                        │
│           AI-gegenereerde              │
│           oefening video               │
│                                        │
│   ┌──────────────────────────────┐     │
│   │  Zittend Knie-Extensie       │     │  ← Titel bar (semi-transparant)
│   │  3 sets × 10 herhalingen     │     │  ← Instructie tekst
│   └──────────────────────────────┘     │
└────────────────────────────────────────┘
```

## Testen

1. **Handmatig testen**: Ga naar `/admin/video-generator`, selecteer een oefening, klik "Genereren"
2. **Webhook testen**: Stuur een test POST naar `/.netlify/functions/video-webhook`:
```bash
curl -X POST https://artrocare.app/.netlify/functions/video-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: YOUR_SECRET" \
  -d '{
    "job_id": "test-job-id",
    "status": "done",
    "video_url": "https://example.com/test-video.mp4",
    "thumbnail_url": "https://example.com/test-thumb.jpg"
  }'
```

3. **Scheduled run**: De pipeline draait automatisch om 05:00 CET (04:00 UTC) voor alle oefeningen zonder video.

## Alternatieve Video Providers

Als ImagineArt niet voldoet, zijn dit alternatieven:

| Provider | API | Prijs | Kwaliteit |
|----------|-----|-------|-----------|
| **Runway ML** | REST API | ~$0.05/s | Zeer hoog |
| **Pika Labs** | REST API | ~$0.04/s | Hoog |
| **Stable Video** | REST API | ~$0.02/s | Gemiddeld |
| **Kling AI** | REST API | ~$0.03/s | Hoog |

Pas Node 2 en 4 aan voor de gekozen provider.
