import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Target, Plus, Edit3, CheckCircle, Flame, Award, Trophy } from 'lucide-react';

export default function Goals() {
  const { profile, updateProfile } = useAuth();
  const { t } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [form, setForm] = useState({ title: '', category: 'health', targetValue: 100, currentValue: 0, deadline: '' });

  const goals = profile?.user_goals || [];

  const handleSubmit = async () => {
    const newGoal = {
      ...form,
      id: editingGoal?.id || crypto.randomUUID(),
      progress: Math.round((form.currentValue / form.targetValue) * 100),
      completed: form.currentValue >= form.targetValue,
      updatedAt: new Date().toISOString(),
    };

    let updated;
    if (editingGoal) {
      updated = goals.map((g) => (g.id === editingGoal.id ? newGoal : g));
    } else {
      updated = [...goals, newGoal];
    }

    await updateProfile({ user_goals: updated });
    setShowForm(false);
    setEditingGoal(null);
    setForm({ title: '', category: 'health', targetValue: 100, currentValue: 0, deadline: '' });
  };

  const updateGoalProgress = async (goalId, newCurrent) => {
    const updated = goals.map((g) => {
      if (g.id === goalId) {
        const progress = Math.round((newCurrent / g.targetValue) * 100);
        return { ...g, currentValue: newCurrent, progress, completed: progress >= 100, updatedAt: new Date().toISOString() };
      }
      return g;
    });
    await updateProfile({ user_goals: updated });
  };

  const stats = useMemo(() => {
    const completed = goals.filter((g) => g.completed).length;
    return { total: goals.length, completed };
  }, [goals]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Target className="w-7 h-7 text-blue-600" />
          {t('goals_title')}
        </h1>
        <Button onClick={() => { setShowForm(true); setEditingGoal(null); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-1" /> {t('goals_add')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.completed}/{stats.total}</p>
            <p className="text-xs text-gray-500">{t('goals_completed')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Flame className="w-6 h-6 text-orange-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-gray-500">{t('goals_streak')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="w-6 h-6 text-purple-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.completed}</p>
            <p className="text-xs text-gray-500">{t('goals_badges')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Goals Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {goals.map((goal) => (
          <Card key={goal.id} className={goal.completed ? 'bg-green-50 border-green-200' : ''}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{goal.title}</h3>
                  <Badge variant="secondary" className="text-xs mt-1">{goal.category}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setEditingGoal(goal); setForm(goal); setShowForm(true); }}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{t('goals_progress')}</span>
                  <span className="font-semibold">{goal.progress || 0}%</span>
                </div>
                <Progress value={goal.progress || 0} />
              </div>
              {goal.deadline && (
                <p className="text-xs text-gray-500">{t('goals_deadline')}: {goal.deadline}</p>
              )}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateGoalProgress(goal.id, Math.max(0, (goal.currentValue || 0) - 1))}
                >-</Button>
                <span className="text-sm font-medium">{goal.currentValue || 0} / {goal.targetValue}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateGoalProgress(goal.id, (goal.currentValue || 0) + 1)}
                >+</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {goals.length === 0 && (
        <Card className="bg-gray-50">
          <CardContent className="p-8 text-center text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>{t('language') === 'nl' ? 'Nog geen doelen ingesteld. Voeg je eerste doel toe!' : 'No goals set yet. Add your first goal!'}</p>
          </CardContent>
        </Card>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGoal ? t('edit') : t('goals_add')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={t('language') === 'nl' ? 'Doel titel' : 'Goal title'}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Input
              type="number"
              placeholder={t('goals_target')}
              value={form.targetValue}
              onChange={(e) => setForm({ ...form, targetValue: parseInt(e.target.value) || 0 })}
            />
            <Input
              type="number"
              placeholder={t('goals_current')}
              value={form.currentValue}
              onChange={(e) => setForm({ ...form, currentValue: parseInt(e.target.value) || 0 })}
            />
            <Input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
            <Button onClick={handleSubmit} disabled={!form.title} className="w-full bg-blue-600 hover:bg-blue-700">
              {t('save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
