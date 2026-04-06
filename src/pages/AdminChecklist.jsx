import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle, XCircle, Loader2, RefreshCw, ClipboardCheck, Database, Globe,
} from 'lucide-react';

const STATUS = { pending: 'pending', pass: 'pass', fail: 'fail' };

function CheckRow({ label, status, detail }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className="mt-0.5">
        {status === STATUS.pending && <Loader2 className="w-4.5 h-4.5 text-gray-400 animate-spin" />}
        {status === STATUS.pass && <CheckCircle className="w-4.5 h-4.5 text-green-600" />}
        {status === STATUS.fail && <XCircle className="w-4.5 h-4.5 text-red-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${status === STATUS.fail ? 'text-red-700' : 'text-gray-900'}`}>{label}</p>
        {detail && <p className="text-xs text-gray-500 mt-0.5">{detail}</p>}
      </div>
    </div>
  );
}

async function countTable(table, filter) {
  let q = supabase.from(table).select('id', { count: 'exact', head: true });
  if (filter) q = filter(q);
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

export default function AdminChecklist() {
  const [checks, setChecks] = useState([]);
  const [running, setRunning] = useState(false);

  const runChecks = async () => {
    setRunning(true);

    const definitions = [
      // ── Database ──
      {
        id: 'program_weeks',
        category: 'database',
        label: 'program_weeks: 12 weken aanwezig',
        run: async () => {
          const n = await countTable('program_weeks');
          return { pass: n >= 12, detail: `${n} weken gevonden` };
        },
      },
      {
        id: 'program_modules',
        category: 'database',
        label: 'program_modules: modules voor week 1-8',
        run: async () => {
          const n = await countTable('program_modules', (q) => q.lte('week_number', 8));
          return { pass: n >= 16, detail: `${n} modules voor week 1-8` };
        },
      },
      {
        id: 'recipes',
        category: 'database',
        label: 'recipes: minimaal 20 recepten',
        run: async () => {
          const n = await countTable('recipes');
          return { pass: n >= 20, detail: `${n} recepten gevonden` };
        },
      },
      {
        id: 'recipe_ingredients',
        category: 'database',
        label: 'recipe_ingredients: elk recept heeft ingrediënten',
        run: async () => {
          const { data, error } = await supabase
            .from('recipes')
            .select('id, title_nl, recipe_ingredients(id)')
            .limit(200);
          if (error) throw error;
          const empty = (data || []).filter((r) => !r.recipe_ingredients || r.recipe_ingredients.length === 0);
          return {
            pass: empty.length === 0 && (data || []).length > 0,
            detail: empty.length > 0
              ? `${empty.length} recept(en) zonder ingrediënten: ${empty.slice(0, 3).map((r) => r.title_nl).join(', ')}`
              : `Alle ${(data || []).length} recepten hebben ingrediënten`,
          };
        },
      },
      {
        id: 'supplements',
        category: 'database',
        label: 'supplements: minimaal 5 supplementen',
        run: async () => {
          const n = await countTable('supplements');
          return { pass: n >= 5, detail: `${n} supplementen gevonden` };
        },
      },
      {
        id: 'exercises',
        category: 'database',
        label: 'exercises: minimaal 10 oefeningen',
        run: async () => {
          const n = await countTable('exercises');
          return { pass: n >= 10, detail: `${n} oefeningen gevonden` };
        },
      },
      {
        id: 'lessons',
        category: 'database',
        label: 'lessons: educatie-lessen aanwezig',
        run: async () => {
          const n = await countTable('lessons');
          return { pass: n >= 1, detail: `${n} lessen gevonden` };
        },
      },
      // ── Frontend ──
      {
        id: 'onboarding',
        category: 'frontend',
        label: 'Onboarding flow component',
        run: async () => {
          try {
            const mod = await import('@/components/dashboard/DashboardOnboarding');
            return { pass: typeof mod.default === 'function', detail: 'Component laadt correct' };
          } catch (e) {
            return { pass: false, detail: e.message };
          }
        },
      },
      {
        id: 'recipes_page',
        category: 'frontend',
        label: 'Receptenpagina component',
        run: async () => {
          try {
            const mod = await import('@/pages/Recipes');
            return { pass: typeof mod.default === 'function', detail: 'Component laadt correct' };
          } catch (e) {
            return { pass: false, detail: e.message };
          }
        },
      },
      {
        id: 'shopping_list_fn',
        category: 'frontend',
        label: 'Boodschappenlijst functie (generate_shopping_list)',
        run: async () => {
          const { data, error } = await supabase.rpc('generate_shopping_list', {
            p_user_id: '00000000-0000-0000-0000-000000000000',
            p_week: 1,
          });
          // We expect either data or an RPC error — not a "function not found" error
          if (error && error.message?.includes('does not exist')) {
            return { pass: false, detail: 'RPC functie niet gevonden' };
          }
          return { pass: true, detail: 'RPC functie bestaat en is aanroepbaar' };
        },
      },
      {
        id: 'manifest',
        category: 'frontend',
        label: 'PWA manifest.json aanwezig',
        run: async () => {
          try {
            const res = await fetch('/manifest.json');
            if (!res.ok) return { pass: false, detail: `HTTP ${res.status}` };
            const json = await res.json();
            return { pass: !!json.name && !!json.start_url, detail: `name: "${json.name}", display: "${json.display}"` };
          } catch (e) {
            return { pass: false, detail: e.message };
          }
        },
      },
      {
        id: 'sw',
        category: 'frontend',
        label: 'Service worker geregistreerd',
        run: async () => {
          if (!('serviceWorker' in navigator)) {
            return { pass: false, detail: 'Service workers niet ondersteund in deze browser' };
          }
          const registrations = await navigator.serviceWorker.getRegistrations();
          return {
            pass: registrations.length > 0,
            detail: registrations.length > 0
              ? `${registrations.length} service worker(s) actief`
              : 'Geen service worker geregistreerd (normaal in dev)',
          };
        },
      },
      {
        id: 'lead_magnet',
        category: 'frontend',
        label: 'Lead magnet PDF beschikbaar',
        run: async () => {
          try {
            const res = await fetch('/downloads/7-dagen-beweegplan.pdf', { method: 'HEAD' });
            if (!res.ok) return { pass: false, detail: `HTTP ${res.status}` };
            const size = res.headers.get('content-length');
            return { pass: true, detail: size ? `${Math.round(size / 1024)} KB` : 'Beschikbaar' };
          } catch (e) {
            return { pass: false, detail: e.message };
          }
        },
      },
    ];

    // Init all as pending
    setChecks(definitions.map((d) => ({ ...d, status: STATUS.pending, detail: null })));

    // Run all in parallel
    const results = await Promise.allSettled(
      definitions.map(async (d) => {
        try {
          const result = await d.run();
          return { id: d.id, status: result.pass ? STATUS.pass : STATUS.fail, detail: result.detail };
        } catch (err) {
          return { id: d.id, status: STATUS.fail, detail: `Error: ${err.message}` };
        }
      })
    );

    setChecks(
      definitions.map((d, i) => {
        const r = results[i];
        const val = r.status === 'fulfilled' ? r.value : { status: STATUS.fail, detail: 'Unexpected error' };
        return { ...d, status: val.status, detail: val.detail };
      })
    );

    setRunning(false);
  };

  useEffect(() => { runChecks(); }, []);

  const dbChecks = checks.filter((c) => c.category === 'database');
  const feChecks = checks.filter((c) => c.category === 'frontend');
  const passCount = checks.filter((c) => c.status === STATUS.pass).length;
  const total = checks.length;
  const allDone = checks.every((c) => c.status !== STATUS.pending);
  const allPass = allDone && passCount === total;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-blue-600" />
            MVP Checklist
          </h1>
          <p className="text-sm text-gray-500 mt-1">Automatische controle van alle MVP-onderdelen</p>
        </div>
        <Button variant="outline" size="sm" onClick={runChecks} disabled={running}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${running ? 'animate-spin' : ''}`} />
          Opnieuw
        </Button>
      </div>

      {/* Database checks */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-4 h-4 text-gray-500" />
            Database ({dbChecks.filter((c) => c.status === STATUS.pass).length}/{dbChecks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dbChecks.map((c) => (
            <CheckRow key={c.id} label={c.label} status={c.status} detail={c.detail} />
          ))}
        </CardContent>
      </Card>

      {/* Frontend checks */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-500" />
            Frontend ({feChecks.filter((c) => c.status === STATUS.pass).length}/{feChecks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feChecks.map((c) => (
            <CheckRow key={c.id} label={c.label} status={c.status} detail={c.detail} />
          ))}
        </CardContent>
      </Card>

      {/* Summary */}
      {allDone && (
        <Card className={allPass ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}>
          <CardContent className="p-5 flex items-center gap-3">
            {allPass
              ? <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              : <XCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            }
            <div>
              <p className="font-semibold text-gray-900">
                {passCount} van {total} checks geslaagd
              </p>
              <p className={`text-sm ${allPass ? 'text-green-700' : 'text-amber-700'}`}>
                MVP is {allPass ? 'klaar' : 'niet klaar'} voor lancering
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
