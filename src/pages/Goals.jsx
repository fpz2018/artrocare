import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Plus,
  CheckCircle,
  Trophy,
  Flame,
  Award
} from "lucide-react";

const translations = {
  nl: {
    title: "Mijn Doelen",
    subtitle: "Stel persoonlijke doelen en volg je voortgang",
    addGoal: "Nieuw Doel Toevoegen",
    goalTitle: "Doel",
    targetValue: "Streefwaarde",
    currentValue: "Huidige waarde",
    deadline: "Streefdatum",
    category: "Categorie",
    save: "Opslaan",
    cancel: "Annuleren",
    edit: "Bewerken",
    complete: "Voltooid",
    inProgress: "Bezig",
    notStarted: "Nog niet gestart",
    progress: "Voortgang",
    streak: "Streak",
    days: "dagen",
    achievements: "Behaalde Prestaties",
    noGoals: "Nog geen doelen ingesteld",
    getStarted: "Stel je eerste doel in",
    categories: {
      pain: "Pijnvermindering",
      mobility: "Mobiliteit",
      exercise: "Beweging",
      weight: "Gewicht",
      nutrition: "Voeding",
      sleep: "Slaap",
      other: "Anders"
    },
    badges: {
      firstGoal: "Eerste Doel",
      weekStreak: "7 Dagen Streak",
      monthStreak: "30 Dagen Streak",
      goalCompleted: "Doel Behaald",
      fiveGoals: "5 Doelen Voltooid"
    }
  },
  en: {
    title: "My Goals",
    subtitle: "Set personal goals and track your progress",
    addGoal: "Add New Goal",
    goalTitle: "Goal",
    targetValue: "Target value",
    currentValue: "Current value",
    deadline: "Target date",
    category: "Category",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    complete: "Completed",
    inProgress: "In Progress",
    notStarted: "Not Started",
    progress: "Progress",
    streak: "Streak",
    days: "days",
    achievements: "Achievements Unlocked",
    noGoals: "No goals set yet",
    getStarted: "Set your first goal",
    categories: {
      pain: "Pain Reduction",
      mobility: "Mobility",
      exercise: "Exercise",
      weight: "Weight",
      nutrition: "Nutrition",
      sleep: "Sleep",
      other: "Other"
    },
    badges: {
      firstGoal: "First Goal",
      weekStreak: "7 Day Streak",
      monthStreak: "30 Day Streak",
      goalCompleted: "Goal Achieved",
      fiveGoals: "5 Goals Completed"
    }
  }
};

export default function Goals() {
  const [user, setUser] = useState(null);
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    targetValue: "",
    currentValue: "",
    deadline: "",
    category: "exercise"
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      setGoals(userData.goals || []);
    } catch (error) {
      console.error("Error loading goals:", error);
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    const newGoal = {
      id: editingGoal?.id || Date.now().toString(),
      ...formData,
      createdAt: editingGoal?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completed: false
    };

    const updatedGoals = editingGoal
      ? goals.map(g => g.id === editingGoal.id ? newGoal : g)
      : [...goals, newGoal];

    await User.updateMyUserData({ goals: updatedGoals });
    setGoals(updatedGoals);
    setShowForm(false);
    setEditingGoal(null);
    setFormData({ title: "", targetValue: "", currentValue: "", deadline: "", category: "exercise" });
  };

  const updateProgress = async (goalId, newValue) => {
    const updatedGoals = goals.map(g => {
      if (g.id === goalId) {
        const progress = (parseFloat(newValue) / parseFloat(g.targetValue)) * 100;
        return {
          ...g,
          currentValue: newValue,
          completed: progress >= 100,
          updatedAt: new Date().toISOString()
        };
      }
      return g;
    });

    await User.updateMyUserData({ goals: updatedGoals });
    setGoals(updatedGoals);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const lang = user?.language || "nl";
  const t = translations[lang];

  const completedGoals = goals.filter(g => g.completed).length;
  const streak = calculateStreak(goals);
  const badges = calculateBadges(goals, streak);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">{t.progress}</p>
                  <p className="text-3xl font-bold">{completedGoals}/{goals.length}</p>
                </div>
                <Target className="w-12 h-12 opacity-30" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">{t.streak}</p>
                  <p className="text-3xl font-bold">{streak}</p>
                  <p className="text-xs opacity-75">{t.days}</p>
                </div>
                <Flame className="w-12 h-12 opacity-30" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">{t.achievements}</p>
                  <p className="text-3xl font-bold">{badges.length}</p>
                </div>
                <Trophy className="w-12 h-12 opacity-30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <Card className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <Award className="w-5 h-5" />
                {t.achievements}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {badges.map((badge, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border-2 border-amber-300 shadow-md"
                  >
                    <span className="text-2xl">{badge.icon}</span>
                    <span className="font-medium text-gray-900">{t.badges[badge.id]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Goal Button */}
        <div className="mb-6">
          <Button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t.addGoal}
          </Button>
        </div>

        {/* Goal Form */}
        {showForm && (
          <Card className="mb-8 shadow-lg border-blue-200">
            <CardHeader>
              <CardTitle>{editingGoal ? t.edit : t.addGoal}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t.goalTitle}</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={lang === "nl" ? "Bijv. 10 minuten wandelen per dag" : "E.g. Walk 10 minutes daily"}
                  className="mt-2"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>{t.category}</Label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.entries(t.categories).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>{t.deadline}</Label>
                  <Input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>{t.targetValue}</Label>
                  <Input
                    type="number"
                    value={formData.targetValue}
                    onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                    placeholder="100"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>{t.currentValue}</Label>
                  <Input
                    type="number"
                    value={formData.currentValue}
                    onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                    placeholder="0"
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {t.save}
                </Button>
                <Button
                  onClick={() => {
                    setShowForm(false);
                    setEditingGoal(null);
                    setFormData({ title: "", targetValue: "", currentValue: "", deadline: "", category: "exercise" });
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  {t.cancel}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Goals List */}
        {goals.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Target className="w-20 h-20 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.noGoals}</h3>
              <p className="text-gray-600 mb-6">{t.getStarted}</p>
              <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-5 h-5 mr-2" />
                {t.addGoal}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {goals.map((goal) => {
              const progress = (parseFloat(goal.currentValue) / parseFloat(goal.targetValue)) * 100;
              const isCompleted = goal.completed || progress >= 100;

              return (
                <Card key={goal.id} className={`shadow-lg ${isCompleted ? 'border-green-300 bg-green-50' : 'border-blue-200'}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {goal.title}
                          {isCompleted && <CheckCircle className="w-5 h-5 text-green-600" />}
                        </CardTitle>
                        <Badge className="mt-2">{t.categories[goal.category]}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingGoal(goal);
                          setFormData(goal);
                          setShowForm(true);
                        }}
                      >
                        {t.edit}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">{t.progress}</span>
                        <span className="font-semibold text-blue-600">
                          {goal.currentValue} / {goal.targetValue}
                        </span>
                      </div>
                      <Progress value={Math.min(progress, 100)} className="h-3" />
                      <p className="text-xs text-gray-500 mt-1">{Math.round(progress)}%</p>
                    </div>

                    {goal.deadline && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{t.deadline}:</span> {new Date(goal.deadline).toLocaleDateString(lang)}
                      </div>
                    )}

                    {!isCompleted && (
                      <div>
                        <Label className="text-sm">{t.currentValue}</Label>
                        <div className="flex gap-2 mt-2">
                          <Input
                            type="number"
                            value={goal.currentValue}
                            onChange={(e) => updateProgress(goal.id, e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            onClick={() => updateProgress(goal.id, parseFloat(goal.currentValue) + 1)}
                            variant="outline"
                            size="icon"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function calculateStreak(goals) {
  if (goals.length === 0) return 0;
  const sortedGoals = [...goals].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (let goal of sortedGoals) {
    const goalDate = new Date(goal.updatedAt);
    goalDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((currentDate - goalDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === streak) {
      streak++;
    } else if (diffDays > streak) {
      break;
    }
  }
  
  return streak;
}

function calculateBadges(goals, streak) {
  const badges = [];
  
  if (goals.length >= 1) badges.push({ id: "firstGoal", icon: "🎯" });
  if (streak >= 7) badges.push({ id: "weekStreak", icon: "🔥" });
  if (streak >= 30) badges.push({ id: "monthStreak", icon: "⭐" });
  
  const completed = goals.filter(g => g.completed).length;
  if (completed >= 1) badges.push({ id: "goalCompleted", icon: "✅" });
  if (completed >= 5) badges.push({ id: "fiveGoals", icon: "🏆" });
  
  return badges;
}