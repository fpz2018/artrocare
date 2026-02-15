import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { FullDisclaimer } from '@/components/legal/Disclaimer';

const stages = ['early', 'moderate', 'advanced', 'pre_op'];
const joints = ['knee', 'hip', 'hand', 'shoulder', 'ankle', 'spine'];
const goals = ['less_pain', 'more_mobility', 'better_sleep', 'more_active', 'weight', 'prepare_surgery'];

export default function DashboardOnboarding() {
  const { updateProfile } = useAuth();
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [disclaimerOpen, setDisclaimerOpen] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    arthrosis_stage: '',
    affected_joints: [],
    on_replacement_waitlist: false,
    goals: [],
    date_of_birth: '',
  });

  const toggleJoint = (joint) => {
    setFormData((prev) => ({
      ...prev,
      affected_joints: prev.affected_joints.includes(joint)
        ? prev.affected_joints.filter((j) => j !== joint)
        : [...prev.affected_joints, joint],
    }));
  };

  const toggleGoal = (goal) => {
    setFormData((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter((g) => g !== goal)
        : [...prev.goals, goal],
    }));
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await updateProfile({
        ...formData,
        onboarding_completed: true,
      });
      window.location.reload();
    } catch (err) {
      console.error('Onboarding error:', err);
    } finally {
      setSaving(false);
    }
  };

  const canNext = () => {
    if (step === 0) return formData.arthrosis_stage !== '';
    if (step === 1) return formData.affected_joints.length > 0;
    if (step === 2) return true;
    if (step === 3) return formData.goals.length > 0;
    return true;
  };

  const steps = [
    // Step 0: Stage
    <div key="stage" className="space-y-4">
      <h2 className="text-lg font-semibold">{t('onboard_stage')}</h2>
      <div className="grid grid-cols-2 gap-3">
        {stages.map((stage) => (
          <button
            key={stage}
            onClick={() => setFormData({ ...formData, arthrosis_stage: stage })}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              formData.arthrosis_stage === stage
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <p className="font-semibold text-sm">{t(`onboard_stage_${stage}`)}</p>
          </button>
        ))}
      </div>
    </div>,

    // Step 1: Joints
    <div key="joints" className="space-y-4">
      <h2 className="text-lg font-semibold">{t('onboard_joints')}</h2>
      <div className="grid grid-cols-2 gap-3">
        {joints.map((joint) => (
          <button
            key={joint}
            onClick={() => toggleJoint(joint)}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              formData.affected_joints.includes(joint)
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <p className="font-semibold text-sm">{t(`onboard_joint_${joint}`)}</p>
          </button>
        ))}
      </div>
    </div>,

    // Step 2: Replacement waitlist
    <div key="replacement" className="space-y-4">
      <h2 className="text-lg font-semibold">{t('onboard_replacement')}</h2>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setFormData({ ...formData, on_replacement_waitlist: true })}
          className={`p-6 rounded-lg border-2 text-center transition-all ${
            formData.on_replacement_waitlist
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <p className="font-semibold">{t('yes')}</p>
        </button>
        <button
          onClick={() => setFormData({ ...formData, on_replacement_waitlist: false })}
          className={`p-6 rounded-lg border-2 text-center transition-all ${
            !formData.on_replacement_waitlist
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <p className="font-semibold">{t('no')}</p>
        </button>
      </div>
    </div>,

    // Step 3: Goals + DOB
    <div key="goals" className="space-y-4">
      <h2 className="text-lg font-semibold">{t('onboard_goals')}</h2>
      <div className="grid grid-cols-2 gap-3">
        {goals.map((goal) => (
          <button
            key={goal}
            onClick={() => toggleGoal(goal)}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              formData.goals.includes(goal)
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <p className="font-semibold text-sm">{t(`onboard_goal_${goal}`)}</p>
          </button>
        ))}
      </div>
      <div className="pt-4">
        <label className="text-sm font-medium text-gray-700 block mb-2">{t('onboard_dob')}</label>
        <Input
          type="date"
          value={formData.date_of_birth}
          onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
        />
      </div>
    </div>,
  ];

  return (
    <div className="max-w-lg mx-auto py-8">
      <FullDisclaimer
        open={disclaimerOpen}
        onOpenChange={setDisclaimerOpen}
        onAgree={() => setDisclaimerOpen(false)}
      />

      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <Heart className="w-12 h-12 text-blue-600 mx-auto mb-2" />
          <CardTitle>{t('onboard_welcome')}</CardTitle>
          <div className="flex justify-center gap-2 mt-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-8 h-1.5 rounded-full transition-colors ${
                  i <= step ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {steps[step]}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t('back')}
            </Button>

            {step < steps.length - 1 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canNext()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {t('next')}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!canNext() || saving}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                {saving ? t('loading') : t('onboard_complete')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
