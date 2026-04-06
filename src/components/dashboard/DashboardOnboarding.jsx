import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, ArrowLeft, CheckCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const JOINTS = [
  { id: 'knee', label: 'Knie', emoji: '🦵' },
  { id: 'hip', label: 'Heup', emoji: '🦴' },
  { id: 'hand', label: 'Hand', emoji: '✋' },
  { id: 'other', label: 'Anders', emoji: '🩹' },
];

const DURATION_OPTIONS = [
  { id: 'short', label: 'Kort (< 3 maanden)', stage: 'early' },
  { id: 'year', label: 'Ongeveer een jaar', stage: 'moderate' },
  { id: 'years', label: 'Meerdere jaren', stage: 'advanced' },
];

const ACTIVITY_OPTIONS = [
  { id: 'inactive', label: 'Nauwelijks actief', desc: 'Ik beweeg weinig door de dag' },
  { id: 'moderate', label: 'Matig actief', desc: 'Ik wandel of fiets regelmatig' },
  { id: 'active', label: 'Actief', desc: 'Ik sport of beweeg dagelijks' },
];

const GOALS = [
  { id: 'less_stiffness', label: 'Minder stijfheid', emoji: '🧘' },
  { id: 'better_movement', label: 'Beter bewegen', emoji: '🚶' },
  { id: 'better_sleep', label: 'Beter slapen', emoji: '😴' },
  { id: 'healthier_eating', label: 'Gezonder eten', emoji: '🥗' },
  { id: 'more_energy', label: 'Meer energie', emoji: '⚡' },
  { id: 'weight_loss', label: 'Gewicht verliezen', emoji: '⚖️' },
];

const TOTAL_STEPS = 5;

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

export default function DashboardOnboarding() {
  const { user, profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [name, setName] = useState(profile?.full_name || '');
  const [selectedJoints, setSelectedJoints] = useState([]);
  const [duration, setDuration] = useState(null);
  const [activity, setActivity] = useState(null);
  const [selectedGoals, setSelectedGoals] = useState([]);

  const toggleJoint = (id) => {
    setSelectedJoints((prev) =>
      prev.includes(id) ? prev.filter((j) => j !== id) : [...prev, id]
    );
  };

  const toggleGoal = (id) => {
    setSelectedGoals((prev) => {
      if (prev.includes(id)) return prev.filter((g) => g !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const canNext = () => {
    if (step === 1) return name.trim().length >= 2;
    if (step === 2) return selectedJoints.length > 0;
    if (step === 3) return duration !== null && activity !== null;
    if (step === 4) return selectedGoals.length >= 2;
    return true;
  };

  const goNext = () => { setDir(1); setStep((s) => s + 1); };
  const goBack = () => { setDir(-1); setStep((s) => s - 1); };

  const handleComplete = async () => {
    setSaving(true);
    setError(null);
    try {
      const stageMap = { short: 'early', year: 'moderate', years: 'advanced' };
      await updateProfile({
        full_name: name.trim(),
        affected_joints: selectedJoints,
        arthrosis_stage: stageMap[duration] || null,
        goals: selectedGoals,
        onboarding_completed: true,
        program_start_date: format(new Date(), 'yyyy-MM-dd'),
      });
      navigate('/dashboard');
      window.location.reload();
    } catch (err) {
      console.error('Onboarding error:', err);
      setError('Er ging iets mis. Probeer het opnieuw.');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex items-center gap-1.5 mb-8">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-100">
              <motion.div
                className="h-full bg-blue-600 rounded-full"
                initial={false}
                animate={{ width: step > i + 1 ? '100%' : step === i + 1 ? '50%' : '0%' }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center mb-6">Stap {step} van {TOTAL_STEPS}</p>

        {/* Step content */}
        <div className="relative overflow-hidden min-h-[380px]">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Welkom bij ArtroCare</h1>
                    <p className="text-gray-500 mt-2 leading-relaxed">
                      In 12 weken ga je aan de slag met bewegen, voeding en leefstijl. We beginnen rustig en bouwen stap voor stap op.
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Hoe mogen we je noemen?</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Je voornaam"
                      className="text-base"
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Je gewrichten</h2>
                    <p className="text-gray-500 mt-2">Welke gewrichten hebben aandacht nodig? Je kunt er meerdere kiezen.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {JOINTS.map((j) => {
                      const selected = selectedJoints.includes(j.id);
                      return (
                        <button
                          key={j.id}
                          onClick={() => toggleJoint(j.id)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            selected
                              ? 'border-blue-500 bg-blue-50 shadow-sm'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <span className="text-2xl">{j.emoji}</span>
                          <p className="font-semibold text-sm mt-1.5">{j.label}</p>
                          {selected && <CheckCircle className="w-4 h-4 text-blue-600 mt-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Je situatie</h2>
                    <p className="text-gray-500 mt-2">Dit helpt ons het programma op jouw tempo af te stemmen.</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Hoe lang heb je al klachten?</label>
                    <div className="space-y-2">
                      {DURATION_OPTIONS.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => setDuration(d.id)}
                          className={`w-full p-3.5 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                            duration === d.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Hoe actief ben je nu?</label>
                    <div className="space-y-2">
                      {ACTIVITY_OPTIONS.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => setActivity(a.id)}
                          className={`w-full p-3.5 rounded-xl border-2 text-left transition-all ${
                            activity === a.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <p className="text-sm font-medium">{a.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{a.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Je doelen</h2>
                    <p className="text-gray-500 mt-2">Kies 2 of 3 doelen waar je aan wilt werken.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {GOALS.map((g) => {
                      const selected = selectedGoals.includes(g.id);
                      const disabled = !selected && selectedGoals.length >= 3;
                      return (
                        <button
                          key={g.id}
                          onClick={() => toggleGoal(g.id)}
                          disabled={disabled}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            selected
                              ? 'border-blue-500 bg-blue-50 shadow-sm'
                              : disabled
                                ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                                : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <span className="text-xl">{g.emoji}</span>
                          <p className="font-medium text-sm mt-1.5">{g.label}</p>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 text-center">{selectedGoals.length} / 3 gekozen</p>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                  >
                    <Sparkles className="w-14 h-14 text-blue-600 mx-auto" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Klaar, {name.trim().split(' ')[0]}!
                    </h2>
                    <p className="text-gray-500 mt-3 leading-relaxed">
                      Je programma start vandaag. Week 1 staat klaar met oefeningen, educatie en leefstijltips.
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 text-left space-y-2">
                    <p className="text-sm text-blue-800">
                      <strong>Gewrichten:</strong> {selectedJoints.map((j) => JOINTS.find((x) => x.id === j)?.label).join(', ')}
                    </p>
                    <p className="text-sm text-blue-800">
                      <strong>Doelen:</strong> {selectedGoals.map((g) => GOALS.find((x) => x.id === g)?.label).join(', ')}
                    </p>
                  </div>
                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          {step > 1 ? (
            <Button variant="ghost" onClick={goBack} disabled={saving}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Terug
            </Button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <Button
              onClick={goNext}
              disabled={!canNext()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Volgende <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? 'Even geduld...' : 'Start mijn programma'}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
