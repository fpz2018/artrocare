# Deploy: process-content Edge Function

## 1. Supabase CLI installeren (eenmalig)
```bash
npm install -g supabase
supabase login
supabase link --project-ref <jouw-project-ref>
```
Je project-ref vind je in: Supabase dashboard → Settings → General → Reference ID

## 2. Environment variables instellen in Supabase dashboard
Ga naar: **Project → Settings → Edge Functions → Secrets**

| Naam               | Waarde                          |
|--------------------|----------------------------------|
| ANTHROPIC_API_KEY  | sk-ant-...  (jouw Claude API key) |
| WEBHOOK_SECRET     | verzin een sterk wachtwoord (bijv. 32 random tekens) |

SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY zijn automatisch beschikbaar — niet handmatig instellen.

## 3. Deployen
```bash
cd C:/Users/marc/artrocare
supabase functions deploy process-content
```

## 4. URL van de functie
Na deployen is de functie bereikbaar op:
```
https://<jouw-project-ref>.supabase.co/functions/v1/process-content
```

## 5. Testen met curl
```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/process-content \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: <jouw-WEBHOOK_SECRET>" \
  -d '{
    "title": "Test document",
    "source_type": "manual",
    "extracted_text": "Nieuwe studie toont aan dat omega-3 dosering van 3000mg per dag significant beter werkt bij knie-artrose dan 2000mg.",
    "language": "nl"
  }'
```

Verwacht antwoord:
```json
{
  "success": true,
  "source_id": "...",
  "proposals_generated": 1,
  "message": "Verwerking klaar: 1 voorstel(len) aangemaakt"
}
```

## 6. n8n configuratie (Fase 4)
In n8n: gebruik een **HTTP Request** node met:
- Method: POST
- URL: `https://<project-ref>.supabase.co/functions/v1/process-content`
- Header: `x-webhook-secret` → waarde uit jouw secrets
- Body (JSON):
  ```json
  {
    "title": "{{ $json.name }}",
    "source_type": "pdf",
    "source_url": "{{ $json.webViewLink }}",
    "drive_file_id": "{{ $json.id }}",
    "extracted_text": "{{ $json.extractedText }}"
  }
  ```
