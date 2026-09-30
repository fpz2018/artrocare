#!/usr/bin/env bash
# ============================================================
# Aanvalstests voor ArtroCare
# ============================================================
# Deze tests doen wat een aanvaller via PostgREST zou doen: met de publieke
# anon-sleutel, of met een gewoon gebruikersaccount, de grenzen opzoeken.
#
# Ze draaien tegen een echte PostgreSQL. De Supabase-onderdelen zijn nagebouwd
# in supabase-shim.sql, inclusief de standaardrechten van anon en authenticated.
# Row Level Security is daardoor de enige grens — precies zoals in productie.
#
# Gebruik:
#     bash supabase/tests/run-security.sh
#
# Standaard wordt de database opnieuw opgebouwd: eerst het schema, daarna alle
# migraties op volgorde. Zo test je dus precies wat een verse installatie
# oplevert.
#
#   --schema-only    stop na supabase/schema.sql en test alleen dat bestand
#
# Vereist een PostgreSQL die je als beheerder kunt benaderen:
#   lokaal : sudo -u postgres (standaard)
#   CI     : zet PGHOST, PGUSER, PGPASSWORD en PGDATABASE
# ============================================================
set -uo pipefail

DB="${PGDATABASE:-artrocare_test}"
SCHEMA_ONLY=0
for arg in "$@"; do
  [ "$arg" = "--schema-only" ] && SCHEMA_ONLY=1
done

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
TESTS="$REPO/supabase/tests"

if [ -n "${PGHOST:-}" ]; then
  PSQL=(psql)
else
  PSQL=(sudo -u postgres psql)
fi

# ─── Hulpmiddelen ───────────────────────────────────────────

q()  { "${PSQL[@]}" -q -t -A -v ON_ERROR_STOP=1 -d "$DB" -c "$1" 2>&1; }
x()  { "${PSQL[@]}" -q -v ON_ERROR_STOP=1 -d "$DB" -c "$1" 2>&1; }

# Voert SQL uit als een rol, met de JWT-claims die PostgREST zou zetten.
probe() { # rol claims sql
  "${PSQL[@]}" -q -t -A -v ON_ERROR_STOP=1 -d "$DB" <<SQL 2>&1
SET ROLE $1;
SET request.jwt.claims = '$2';
$3
SQL
}

FOUTEN=0
TOTAAL=0

rapport() { # label gelukt(1/0)
  TOTAAL=$((TOTAAL + 1))
  if [ "$2" = "1" ]; then
    printf 'ok    %s\n' "$1"
  else
    printf 'FOUT  %s\n' "$1"
    FOUTEN=$((FOUTEN + 1))
  fi
}

# Moet een fout opleveren: de aanval is geblokkeerd.
blok() { # label rol claims sql
  local uit
  uit="$(probe "$2" "$3" "$4")"
  if printf '%s' "$uit" | grep -q 'ERROR:'; then rapport "$1" 1; else rapport "$1" 0; fi
}

# Moet nul rijen opleveren. De SQL hoort een count(*) terug te geven.
leeg() { # label rol claims sql
  local uit
  uit="$(probe "$2" "$3" "$4" | tr -d '[:space:]')"
  if [ "$uit" = "0" ]; then rapport "$1" 1; else rapport "$1" 0; fi
}

# Moet een bepaalde waarde opleveren.
verwacht() { # label waarde rol claims sql
  local uit
  uit="$(probe "$3" "$4" "$5" | tr -d '[:space:]')"
  if [ "$uit" = "$2" ]; then rapport "$1" 1; else rapport "$1" 0; fi
}

# Moet dicht zijn: ofwel een fout, ofwel nul rijen. Beide is goed.
# Moet een bepaalde waarde opleveren, gelezen als beheerder. Nodig voor
# controles op rijen die een gewone gebruiker niet mag zien, zoals het
# resulterende rolveld na een registratiepoging.
verwacht_admin() { # label waarde sql
  local uit
  uit="$(q "$3" | tr -d '[:space:]')"
  if [ "$uit" = "$2" ]; then rapport "$1" 1; else rapport "$1" 0; fi
}

dicht() { # label rol claims sql
  local uit
  uit="$(probe "$2" "$3" "$4")"
  if printf '%s' "$uit" | grep -q 'ERROR:' || [ "$(printf '%s' "$uit" | tr -d '[:space:]')" = "0" ]; then
    rapport "$1" 1
  else
    rapport "$1" 0
  fi
}

# ─── Testdata ───────────────────────────────────────────────

ADMIN='00000000-0000-0000-0000-000000000001'
THERAPEUT='00000000-0000-0000-0000-000000000002'
PATIENT='00000000-0000-0000-0000-000000000003'
PREMIUM='00000000-0000-0000-0000-000000000004'
PRAKTIJK='00000000-0000-0000-0000-000000000005'
NIEUW='00000000-0000-0000-0000-000000000006'

TOKEN_GELDIG="$(printf 'a%.0s' $(seq 1 64))"
TOKEN_VERLOPEN="$(printf 'b%.0s' $(seq 1 64))"
TOKEN_GEACCEPTEERD="$(printf 'c%.0s' $(seq 1 64))"
TOKEN_ONZIN="$(printf 'd%.0s' $(seq 1 64))"
TOKEN_OPEN="$(printf 'f%.0s' $(seq 1 64))"

CLAIMS_ANON='{"role":"anon"}'
CLAIMS_ADMIN="{\"role\":\"authenticated\",\"sub\":\"$ADMIN\"}"
CLAIMS_THERAPEUT="{\"role\":\"authenticated\",\"sub\":\"$THERAPEUT\"}"
CLAIMS_PATIENT="{\"role\":\"authenticated\",\"sub\":\"$PATIENT\"}"
CLAIMS_PREMIUM="{\"role\":\"authenticated\",\"sub\":\"$PREMIUM\"}"
CLAIMS_PRAKTIJK="{\"role\":\"authenticated\",\"sub\":\"$PRAKTIJK\"}"

bouw_fixtures() {
  "${PSQL[@]}" -q -v ON_ERROR_STOP=1 -d "$DB" <<SQL
-- Beheerder: registreert zich als patiënt en krijgt daarna de rol via de
-- database zelf. Dat is de enige route naar beheerderschap.
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('$ADMIN',   'admin@test.nl',    '{"register_as":"patient","full_name":"Beheerder"}'::jsonb),
  ('$PATIENT', 'patient@test.nl',  '{"register_as":"patient","full_name":"Patiënt"}'::jsonb),
  ('$PREMIUM', 'premium@test.nl',  '{"register_as":"patient","full_name":"Premium"}'::jsonb),
  ('$PRAKTIJK','praktijk@test.nl', '{"register_as":"practice_admin","practice_name":"Testpraktijk Zeist"}'::jsonb);

UPDATE public.profiles SET role = 'admin' WHERE id = '$ADMIN';
UPDATE public.practices  SET status = 'approved'
  WHERE id = (SELECT practice_id FROM public.profiles WHERE id = '$PRAKTIJK');
UPDATE public.profiles   SET subscription_tier = 'premium' WHERE id = '$PREMIUM';

-- Uitnodiging voor een therapeut, en registratie daarmee.
INSERT INTO public.invitations (email, role, token, status, expires_at, invited_by, practice_id)
SELECT 'therapeut@test.nl', 'therapist', '$TOKEN_GELDIG', 'pending',
       NOW() + INTERVAL '7 days', '$ADMIN',
       (SELECT practice_id FROM public.profiles WHERE id = '$PRAKTIJK');

INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES ('$THERAPEUT', 'therapeut@test.nl',
        jsonb_build_object('register_as','patient','full_name','Therapeut','invitation_token','$TOKEN_GELDIG'));

-- Een tweede praktijk, om te testen dat een therapeut niet buiten zijn eigen
-- praktijk kan uitnodigen.
INSERT INTO public.practices (id, name, city, status)
VALUES ('00000000-0000-0000-0000-0000000000f1', 'Andere praktijk', 'Utrecht', 'approved');

-- Een verlopen en een al geaccepteerde uitnodiging.
INSERT INTO public.invitations (email, role, token, status, expires_at, invited_by) VALUES
  ('verlopen@test.nl',  'therapist', '$TOKEN_VERLOPEN',      'pending',  NOW() - INTERVAL '1 day', '$ADMIN'),
  ('algedaan@test.nl',  'therapist', '$TOKEN_GEACCEPTEERD',  'accepted', NOW() + INTERVAL '7 days', '$ADMIN');

-- Een uitnodiging die nog openstaat, voor het acceptatiescherm.
INSERT INTO public.invitations (email, role, token, status, expires_at, invited_by) VALUES
  ('open@test.nl', 'patient', '$TOKEN_OPEN', 'pending', NOW() + INTERVAL '7 days', '$ADMIN');

-- Recepten: één gratis, één premium, allebei in week 1.
INSERT INTO public.recipes (title_nl, title_en, servings, difficulty, season, week_number, is_premium)
VALUES ('Gratis soep','Free soup',2,'easy','all',1,false),
       ('Premium stoof','Premium stew',2,'easy','all',1,true);

INSERT INTO public.recipe_ingredients (recipe_id, name_nl, name_en, amount, unit, category)
SELECT id, 'Wortel', 'Carrot', 500, 'g', 'groente' FROM public.recipes WHERE is_premium = false;
INSERT INTO public.recipe_ingredients (recipe_id, name_nl, name_en, amount, unit, category)
SELECT id, 'Duur vlees', 'Expensive meat', 300, 'g', 'vlees' FROM public.recipes WHERE is_premium = true;

-- Een goedgekeurd voorstel, zodat de beheerfunctie iets te doen heeft.
INSERT INTO public.content_proposals
  (target_table, target_record_name, proposed_values, change_summary_nl, ai_reasoning_nl, status)
VALUES ('lessons', 'Testles', '{"title_nl":"Nieuwe titel"}'::jsonb, 'Test', 'Test', 'approved');
SQL
}

registreer() { # id email metadata-json
  x "INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ('$1','$2','$3'::jsonb);" >/dev/null 2>&1
}

rol_van() { q "SELECT role FROM public.profiles WHERE id = '$1';" | tr -d '[:space:]'; }

# ─── Database opbouwen ──────────────────────────────────────

STAGE="/tmp/artrocare-security-stage"
rm -rf "$STAGE" && mkdir -p "$STAGE"
cp "$TESTS/supabase-shim.sql" "$STAGE/_shim.sql"
cp "$REPO/supabase/schema.sql" "$STAGE/_schema.sql"
for f in "$REPO"/supabase/migrations/*.sql; do [ -e "$f" ] && cp "$f" "$STAGE/"; done
chmod -R a+rX "$STAGE"

echo "── database $DB opbouwen ──"
# Verbind met de onderhoudsdatabase: je kunt een database niet droppen terwijl
# je er zelf mee verbonden bent.
MAINT="${PGMAINTENANCE_DB:-postgres}"
"${PSQL[@]}" -q -v ON_ERROR_STOP=1 -d "$MAINT" -c "DROP DATABASE IF EXISTS $DB;" >/dev/null 2>&1 || true
if ! "${PSQL[@]}" -q -v ON_ERROR_STOP=1 -d "$MAINT" -c "CREATE DATABASE $DB;" >/dev/null 2>&1; then
  echo "   Kan database $DB niet aanmaken. Draait PostgreSQL, en mag deze gebruiker databases maken?"
  exit 1
fi

run_file() {
  if "${PSQL[@]}" -q -v ON_ERROR_STOP=1 -d "$DB" -f "$2" >/tmp/artrocare-test-out.txt 2>&1; then
    echo "   ok   $1"
  else
    echo "   FOUT $1"
    grep -vE 'NOTICE|skipping' /tmp/artrocare-test-out.txt | tail -15
    exit 1
  fi
}

run_file "supabase-shim.sql"      "$STAGE/_shim.sql"
run_file "supabase/schema.sql"    "$STAGE/_schema.sql"
if [ "$SCHEMA_ONLY" = "0" ]; then
  for f in $(ls "$STAGE"/[0-9]*.sql | sort); do
    run_file "supabase/migrations/$(basename "$f")" "$f"
  done
fi

bouw_fixtures

echo
echo "── aanvalstests ──"

# ── A. Registratie en rollen ────────────────────────────────
registreer '00000000-0000-0000-0000-0000000000a1' 'a1@test.nl' '{"register_as":"admin"}'
verwacht_admin "registratie met register_as=admin levert patient op" "patient" \
  "SELECT role FROM public.profiles WHERE id='00000000-0000-0000-0000-0000000000a1';"

registreer '00000000-0000-0000-0000-0000000000a2' 'a2@test.nl' '{"register_as":"therapist"}'
verwacht_admin "registratie als therapeut zonder uitnodiging levert patient op" "patient" \
  "SELECT role FROM public.profiles WHERE id='00000000-0000-0000-0000-0000000000a2';"

registreer '00000000-0000-0000-0000-0000000000a3' 'a3@test.nl' "{\"register_as\":\"patient\",\"invitation_token\":\"$TOKEN_VERLOPEN\"}"
verwacht_admin "registratie met een verlopen uitnodiging levert patient op" "patient" \
  "SELECT role FROM public.profiles WHERE id='00000000-0000-0000-0000-0000000000a3';"

registreer '00000000-0000-0000-0000-0000000000a4' 'a4@test.nl' "{\"register_as\":\"patient\",\"invitation_token\":\"$TOKEN_GEACCEPTEERD\"}"
verwacht_admin "registratie met een al geaccepteerde uitnodiging levert patient op" "patient" \
  "SELECT role FROM public.profiles WHERE id='00000000-0000-0000-0000-0000000000a4';"

registreer '00000000-0000-0000-0000-0000000000a5' 'a5@test.nl' "{\"register_as\":\"therapist\",\"invitation_token\":\"$TOKEN_ONZIN\"}"
verwacht_admin "registratie met een verzonnen token levert patient op" "patient" \
  "SELECT role FROM public.profiles WHERE id='00000000-0000-0000-0000-0000000000a5';"

verwacht_admin "registratie met een geldige uitnodiging levert therapeut op" "therapist" \
  "SELECT role FROM public.profiles WHERE id='$THERAPEUT';"

verwacht_admin "de uitnodiging staat na acceptatie op accepted" "accepted" \
  "SELECT status FROM public.invitations WHERE token='$TOKEN_GELDIG';"

# ── B. Eigen profiel ────────────────────────────────────────
verwacht "patiënt kan de eigen rol niet op admin zetten" "patient" authenticated "$CLAIMS_PATIENT" \
  "WITH u AS (UPDATE public.profiles SET role='admin' WHERE id='$PATIENT' RETURNING role)
   SELECT role FROM u UNION ALL SELECT role FROM public.profiles WHERE id='$PATIENT' LIMIT 1;"

verwacht "patiënt kan het eigen abonnement niet op premium zetten" "free" authenticated "$CLAIMS_PATIENT" \
  "WITH u AS (UPDATE public.profiles SET subscription_tier='premium' WHERE id='$PATIENT' RETURNING subscription_tier)
   SELECT subscription_tier FROM u UNION ALL SELECT subscription_tier FROM public.profiles WHERE id='$PATIENT' LIMIT 1;"

verwacht "patiënt kan de eigen praktijkkoppeling niet zetten" "" authenticated "$CLAIMS_PATIENT" \
  "WITH u AS (UPDATE public.profiles SET practice_id=(SELECT practice_id FROM public.profiles WHERE id='$PRAKTIJK') WHERE id='$PATIENT' RETURNING practice_id)
   SELECT COALESCE(practice_id::text,'') FROM u UNION ALL SELECT COALESCE(practice_id::text,'') FROM public.profiles WHERE id='$PATIENT' LIMIT 1;"

verwacht "patiënt kan de eigen naam wel aanpassen" "Naam2" authenticated "$CLAIMS_PATIENT" \
  "WITH u AS (UPDATE public.profiles SET full_name='Naam2' WHERE id='$PATIENT' RETURNING full_name)
   SELECT full_name FROM u UNION ALL SELECT full_name FROM public.profiles WHERE id='$PATIENT' LIMIT 1;"

# ── C. Uitnodigingen ────────────────────────────────────────
leeg "anon kan geen uitnodigingen lezen" anon "$CLAIMS_ANON" "SELECT count(*) FROM public.invitations;"
leeg "anon kan geen tokens lezen" anon "$CLAIMS_ANON" "SELECT count(*) FROM public.invitations WHERE token IS NOT NULL;"

blok "anon kan geen uitnodiging aanmaken" anon "$CLAIMS_ANON" \
  "INSERT INTO public.invitations (email, role, token, status, expires_at, invited_by)
   VALUES ('kwaad@test.nl','therapist','$TOKEN_ONZIN','pending',NOW()+INTERVAL '7 days','$ADMIN');"

blok "patiënt kan geen uitnodiging met rol therapeut aanmaken" authenticated "$CLAIMS_PATIENT" \
  "INSERT INTO public.invitations (email, role, token, status, expires_at, invited_by)
   VALUES ('kwaad@test.nl','therapist','$TOKEN_ONZIN','pending',NOW()+INTERVAL '7 days','$PATIENT');"

blok "therapeut kan geen therapeut uitnodigen" authenticated "$CLAIMS_THERAPEUT" \
  "INSERT INTO public.invitations (email, role, token, status, expires_at, invited_by)
   VALUES ('kwaad@test.nl','therapist','$TOKEN_ONZIN','pending',NOW()+INTERVAL '7 days','$THERAPEUT');"

blok "therapeut kan geen uitnodiging voor een andere praktijk maken" authenticated "$CLAIMS_THERAPEUT" \
  "INSERT INTO public.invitations (email, role, token, status, expires_at, invited_by, practice_id)
   VALUES ('kwaad@test.nl','patient','$TOKEN_ONZIN','pending',NOW()+INTERVAL '7 days','$THERAPEUT',
           '00000000-0000-0000-0000-0000000000f1');"

verwacht "therapeut kan wel een patiënt in de eigen praktijk uitnodigen" "1" authenticated "$CLAIMS_THERAPEUT" \
  "WITH i AS (
     INSERT INTO public.invitations (email, role, token, status, expires_at, invited_by, practice_id)
     VALUES ('nieuw@test.nl','patient', repeat('e',64),'pending',NOW()+INTERVAL '7 days','$THERAPEUT',
             (SELECT practice_id FROM public.profiles WHERE id='$THERAPEUT'))
     RETURNING 1)
   SELECT count(*) FROM i;"

verwacht "acceptatiescherm vindt een openstaande uitnodiging" "1" anon "$CLAIMS_ANON" \
  "SELECT count(*) FROM public.get_invitation_by_token('$TOKEN_OPEN');"

leeg "acceptatiescherm vindt een verlopen uitnodiging niet" anon "$CLAIMS_ANON" \
  "SELECT count(*) FROM public.get_invitation_by_token('$TOKEN_VERLOPEN');"

leeg "acceptatiescherm vindt een geaccepteerde uitnodiging niet" anon "$CLAIMS_ANON" \
  "SELECT count(*) FROM public.get_invitation_by_token('$TOKEN_GEACCEPTEERD');"

leeg "acceptatiescherm vindt een onzin-token niet" anon "$CLAIMS_ANON" \
  "SELECT count(*) FROM public.get_invitation_by_token('$TOKEN_ONZIN');"

# ── D. Contentpijplijn ──────────────────────────────────────
blok "anon kan geen voorstel in de redactiewachtrij zetten" anon "$CLAIMS_ANON" \
  "INSERT INTO public.content_proposals (target_table, target_record_name, proposed_values, change_summary_nl, ai_reasoning_nl)
   VALUES ('lessons','Kwaad','{}'::jsonb,'x','x');"

blok "anon kan geen onderzoekspaper toevoegen" anon "$CLAIMS_ANON" \
  "INSERT INTO public.research_papers (title, source, status) VALUES ('Kwaad','Kwaad','pending');"

blok "anon kan geen contentbron toevoegen" anon "$CLAIMS_ANON" \
  "INSERT INTO public.content_sources (name, url, type) VALUES ('Kwaad','https://kwaad.test','richtlijn');"

blok "anon kan geen fetchlog schrijven" anon "$CLAIMS_ANON" \
  "INSERT INTO public.research_fetch_log (query_text, status) VALUES ('Kwaad','ok');"

# ── E. Beheerfuncties ───────────────────────────────────────
blok "anon kan apply_content_proposal niet aanroepen" anon "$CLAIMS_ANON" \
  "SELECT public.apply_content_proposal((SELECT id FROM public.content_proposals LIMIT 1));"

blok "patiënt kan apply_content_proposal niet aanroepen" authenticated "$CLAIMS_PATIENT" \
  "SELECT public.apply_content_proposal((SELECT id FROM public.content_proposals LIMIT 1));"

blok "patiënt kan approve_recipe_import niet aanroepen" authenticated "$CLAIMS_PATIENT" \
  "SELECT public.approve_recipe_import('00000000-0000-0000-0000-0000000000ff','$PATIENT',NULL);"

blok "anon kan generate_shopping_list niet aanroepen" anon "$CLAIMS_ANON" \
  "SELECT public.generate_shopping_list(1);"

# ── F. Praktijken en patiëntverzoeken ───────────────────────
blok "anon kan geen al goedgekeurde praktijk aanmelden" anon "$CLAIMS_ANON" \
  "INSERT INTO public.practices (name, city, status) VALUES ('Nepkliniek','Zeist','approved');"

blok "anon kan geen patiëntverzoek met status approved indienen" anon "$CLAIMS_ANON" \
  "INSERT INTO public.patient_requests (full_name, email, status) VALUES ('Kwaad','kwaad@test.nl','approved');"

blok "anon kan zichzelf niet als therapeut aan een verzoek koppelen" anon "$CLAIMS_ANON" \
  "INSERT INTO public.patient_requests (full_name, email, status, therapist_id)
   VALUES ('Kwaad','kwaad@test.nl','pending','$THERAPEUT');"

# ── G. Paywall ──────────────────────────────────────────────
leeg "gratis gebruiker krijgt geen premium-ingrediënten" authenticated "$CLAIMS_PATIENT" \
  "SELECT count(*) FROM jsonb_array_elements(public.generate_shopping_list(1)) AS item
    WHERE item->>'name' = 'Duur vlees';"

verwacht "premium gebruiker krijgt premium-ingrediënten wel" "1" authenticated "$CLAIMS_PREMIUM" \
  "SELECT count(*) FROM jsonb_array_elements(public.generate_shopping_list(1)) AS item
    WHERE item->>'name' = 'Duur vlees';"

# ── H. Storage ──────────────────────────────────────────────
blok "anon kan niet uploaden naar exercise-media" anon "$CLAIMS_ANON" \
  "INSERT INTO storage.objects (bucket_id, name) VALUES ('exercise-media','kwaad.mp4');"

blok "patiënt kan niet uploaden naar exercise-media" authenticated "$CLAIMS_PATIENT" \
  "INSERT INTO storage.objects (bucket_id, name) VALUES ('exercise-media','kwaad.mp4');"

blok "anon kan niet uploaden naar recipe-images" anon "$CLAIMS_ANON" \
  "INSERT INTO storage.objects (bucket_id, name) VALUES ('recipe-images','kwaad.jpg');"

# ── I. Overig ───────────────────────────────────────────────
dicht "anon kan de Stripe-eventtabel niet lezen" anon "$CLAIMS_ANON" "SELECT count(*) FROM public.stripe_events;"
dicht "patiënt kan de Stripe-eventtabel niet lezen" authenticated "$CLAIMS_PATIENT" "SELECT count(*) FROM public.stripe_events;"

# ─── Uitslag ────────────────────────────────────────────────
echo
if [ "$FOUTEN" -eq 0 ]; then
  echo "Alle $TOTAAL controles geslaagd."
  exit 0
else
  echo "$FOUTEN van $TOTAAL controles mislukt."
  exit 1
fi
