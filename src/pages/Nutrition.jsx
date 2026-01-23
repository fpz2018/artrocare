import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Apple,
  Clock,
  Users,
  Flame,
  ChefHat,
  RefreshCw,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Leaf
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const translations = {
  nl: {
    title: "Jouw Persoonlijke Voedingsplan",
    subtitle: "Anti-inflammatoire recepten op maat gemaakt door AI",
    generating: "Je voedingsplan wordt gegenereerd...",
    generatingDesc: "De AI analyseert je profiel en maakt recepten op maat",
    refresh: "Nieuw Plan Genereren",
    breakfast: "Ontbijt",
    lunch: "Lunch",
    dinner: "Avondeten",
    snack: "Tussendoortje",
    minutes: "min",
    servings: "porties",
    calories: "calorieën",
    protein: "Eiwit",
    carbs: "Koolhydraten",
    fat: "Vet",
    ingredients: "Ingrediënten",
    instructions: "Bereidingswijze",
    nutritionFacts: "Voedingswaarde",
    antiInflammatory: "Anti-inflammatoire Score",
    whyThisRecipe: "Waarom dit recept?",
    shoppingList: "Boodschappenlijst",
    generateList: "Genereer Lijst",
    close: "Sluiten",
    viewRecipe: "Bekijk Recept",
    weekMenu: "Weekmenu",
    todayMeals: "Maaltijden Voor Vandaag",
    programBased: "Dit plan is gebaseerd op",
    yourGoals: "Jouw doelen",
    yourStage: "Jouw stadium",
    yourNeeds: "Jouw behoeften",
    vegetarian: "Vegetarisch",
    vegan: "Veganistisch",
    prepTime: "Bereidingstijd",
    totalTime: "Totale tijd",
    difficulty: "Moeilijkheid",
    easy: "Makkelijk",
    medium: "Gemiddeld",
    hard: "Moeilijk",
    healthBenefits: "Gezondheidsvoordelen",
    tips: "Tips",
    errorGenerating: "Fout bij genereren plan",
    tryAgain: "Probeer opnieuw",
    today: "Vandaag",
    monday: "Maandag",
    tuesday: "Dinsdag",
    wednesday: "Woensdag",
    thursday: "Donderdag",
    friday: "Vrijdag",
    saturday: "Zaterdag",
    sunday: "Zondag"
  },
  en: {
    title: "Your Personal Nutrition Plan",
    subtitle: "Anti-inflammatory recipes AI-tailored for you",
    generating: "Generating your nutrition plan...",
    generatingDesc: "AI is analyzing your profile and creating tailored recipes",
    refresh: "Generate New Plan",
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
    snack: "Snack",
    minutes: "min",
    servings: "servings",
    calories: "calories",
    protein: "Protein",
    carbs: "Carbs",
    fat: "Fat",
    ingredients: "Ingredients",
    instructions: "Instructions",
    nutritionFacts: "Nutrition Facts",
    antiInflammatory: "Anti-inflammatory Score",
    whyThisRecipe: "Why this recipe?",
    shoppingList: "Shopping List",
    generateList: "Generate List",
    close: "Close",
    viewRecipe: "View Recipe",
    weekMenu: "Week Menu",
    todayMeals: "Today's Meals",
    programBased: "This plan is based on",
    yourGoals: "Your goals",
    yourStage: "Your stage",
    yourNeeds: "Your needs",
    vegetarian: "Vegetarian",
    vegan: "Vegan",
    prepTime: "Prep time",
    totalTime: "Total time",
    difficulty: "Difficulty",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    healthBenefits: "Health benefits",
    tips: "Tips",
    errorGenerating: "Error generating plan",
    tryAgain: "Try again",
    today: "Today",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday"
  }
};

export default function Nutrition() {
  const [user, setUser] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const userData = await base44.auth.me();
      if (!userData) {
        window.location.href = '/Home';
        return;
      }
      setUser(userData);
      
      if (userData.personalizedNutritionPlan && userData.personalizedNutritionPlan.recipes) {
        setRecipes(userData.personalizedNutritionPlan.recipes);
      } else {
        await generateNutritionPlan(userData);
      }
    } catch (error) {
      console.error("Error loading nutrition:", error);
      window.location.href = '/Home';
    }
    setIsLoading(false);
  };

  const generateNutritionPlan = async (userData = user) => {
    setIsGenerating(true);
    const lang = userData?.language || "nl";
    
    try {
      const recentMeasurements = await base44.entities.Measurement.filter({ 
        created_by: userData.email 
      }, "-date", 7);
      
      const avgPain = recentMeasurements.length > 0 
        ? recentMeasurements.reduce((sum, m) => sum + (m.painScore || 0), 0) / recentMeasurements.length 
        : 5;

      const prompt = lang === "nl" ? `
Je bent een expert voedingsdeskundige gespecialiseerd in anti-inflammatoire voeding voor artrose.
Maak een gepersonaliseerd weekmenu voor deze patiënt:

PATIËNT PROFIEL:
- Artrose stadium: ${userData.arthrosisStage || 'mild'}
- Aangedane gewrichten: ${userData.affectedJoints?.join(', ') || 'knie'}
- Doelen: ${userData.goals?.join(', ') || 'pijnvermindering'}
- Gemiddeld pijnniveau: ${avgPain.toFixed(1)}/10
- Leeftijd: ${userData.dateOfBirth ? new Date().getFullYear() - new Date(userData.dateOfBirth).getFullYear() : 'onbekend'}
- Gewicht: ${userData.weight || 'onbekend'} kg

INSTRUCTIES:
1. Maak 14 recepten (2 per dag voor 7 dagen: ontbijt, lunch, avondeten)
2. Focus op anti-inflammatoire ingrediënten (omega-3, groenten, fruit, kruiden)
3. Vermijd inflammatoire voedingsmiddelen (suiker, bewerkt voedsel, trans vetten)
4. Variatie in maaltijden
5. Praktisch en haalbaar
6. Neem allergenen in overweging (vraag niet, neem aan: geen speciale diëten)

Geef voor elk recept:
- title: Korte, aantrekkelijke naam
- description: Korte beschrijving (1-2 zinnen)
- mealType: breakfast/lunch/dinner/snack
- prepTime: Bereidingstijd in minuten (realistisch)
- cookTime: Kooktijd in minuten
- servings: Aantal porties (meestal 2)
- difficulty: easy/medium/hard
- ingredients: Array met ingrediënten (met hoeveelheden, bijv. "200g zalm")
- instructions: Array met stappen (duidelijk, genummerd)
- nutritionFacts: {calories: number, protein: number (g), carbs: number (g), fat: number (g)}
- antiInflammatoryScore: 1-10 (hoger = beter)
- healthBenefits: Array met 2-3 gezondheidsvoordelen specifiek voor artrose
- rationale: Waarom dit recept goed is voor deze patiënt (1-2 zinnen)
- tips: Array met 1-2 praktische tips
- dayRecommendation: Array met dagen ["monday", "tuesday", etc.]
- isVegetarian: boolean
- isVegan: boolean
` : `
You are an expert nutritionist specialized in anti-inflammatory nutrition for arthritis.
Create a personalized week menu for this patient:

PATIENT PROFILE:
- Arthritis stage: ${userData.arthrosisStage || 'mild'}
- Affected joints: ${userData.affectedJoints?.join(', ') || 'knee'}
- Goals: ${userData.goals?.join(', ') || 'pain reduction'}
- Average pain level: ${avgPain.toFixed(1)}/10
- Age: ${userData.dateOfBirth ? new Date().getFullYear() - new Date(userData.dateOfBirth).getFullYear() : 'unknown'}
- Weight: ${userData.weight || 'unknown'} kg

INSTRUCTIONS:
1. Create 14 recipes (2 per day for 7 days: breakfast, lunch, dinner)
2. Focus on anti-inflammatory ingredients (omega-3, vegetables, fruits, herbs)
3. Avoid inflammatory foods (sugar, processed food, trans fats)
4. Variety in meals
5. Practical and achievable
6. Consider allergens (don't ask, assume: no special diets)

For each recipe provide:
- title: Short, attractive name
- description: Brief description (1-2 sentences)
- mealType: breakfast/lunch/dinner/snack
- prepTime: Prep time in minutes (realistic)
- cookTime: Cook time in minutes
- servings: Number of servings (usually 2)
- difficulty: easy/medium/hard
- ingredients: Array with ingredients (with quantities, e.g. "200g salmon")
- instructions: Array with steps (clear, numbered)
- nutritionFacts: {calories: number, protein: number (g), carbs: number (g), fat: number (g)}
- antiInflammatoryScore: 1-10 (higher = better)
- healthBenefits: Array with 2-3 health benefits specific for arthritis
- rationale: Why this recipe is good for this patient (1-2 sentences)
- tips: Array with 1-2 practical tips
- dayRecommendation: Array with days ["monday", "tuesday", etc.]
- isVegetarian: boolean
- isVegan: boolean
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            recipes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  mealType: { type: "string" },
                  prepTime: { type: "number" },
                  cookTime: { type: "number" },
                  servings: { type: "number" },
                  difficulty: { type: "string" },
                  ingredients: { type: "array", items: { type: "string" } },
                  instructions: { type: "array", items: { type: "string" } },
                  nutritionFacts: {
                    type: "object",
                    properties: {
                      calories: { type: "number" },
                      protein: { type: "number" },
                      carbs: { type: "number" },
                      fat: { type: "number" }
                    }
                  },
                  antiInflammatoryScore: { type: "number" },
                  healthBenefits: { type: "array", items: { type: "string" } },
                  rationale: { type: "string" },
                  tips: { type: "array", items: { type: "string" } },
                  dayRecommendation: { type: "array", items: { type: "string" } },
                  isVegetarian: { type: "boolean" },
                  isVegan: { type: "boolean" }
                }
              }
            },
            planNotes: { type: "string" }
          }
        }
      });

      const recipesWithIds = response.recipes.map((recipe, idx) => ({
        ...recipe,
        id: `recipe_${Date.now()}_${idx}`
      }));

      await base44.auth.updateMe({
        personalizedNutritionPlan: {
          recipes: recipesWithIds,
          planNotes: response.planNotes,
          generatedAt: new Date().toISOString(),
          basedOn: {
            stage: userData.arthrosisStage,
            joints: userData.affectedJoints,
            goals: userData.goals,
            avgPain: avgPain.toFixed(1)
          }
        }
      });

      setRecipes(recipesWithIds);
    } catch (error) {
      console.error("Error generating nutrition plan:", error);
      alert(lang === "nl" ? "Fout bij genereren van plan. Probeer het opnieuw." : "Error generating plan. Please try again.");
    }
    setIsGenerating(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <ChefHat className="w-16 h-16 mx-auto mb-4 text-emerald-500 animate-pulse" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {translations[user?.language || "nl"].generating}
            </h2>
            <p className="text-gray-600 mb-4">
              {translations[user?.language || "nl"].generatingDesc}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full animate-pulse" style={{width: "70%"}}></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lang = user?.language || "nl";
  const t = translations[lang];

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const today = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  
  const todayRecipes = recipes.filter(r => 
    r.dayRecommendation && r.dayRecommendation.includes(today)
  );

  const recipesByMeal = {
    breakfast: recipes.filter(r => r.mealType === "breakfast"),
    lunch: recipes.filter(r => r.mealType === "lunch"),
    dinner: recipes.filter(r => r.mealType === "dinner"),
    snack: recipes.filter(r => r.mealType === "snack")
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-emerald-500" />
              {t.title}
            </h1>
            <p className="text-gray-600">{t.subtitle}</p>
          </div>
          <Button
            onClick={() => generateNutritionPlan()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {t.refresh}
          </Button>
        </div>

        {user?.personalizedNutritionPlan?.basedOn && (
          <Card className="mb-8 bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-gray-900 mb-3">{t.programBased}:</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">{t.yourGoals}:</p>
                  <div className="flex flex-wrap gap-1">
                    {user.personalizedNutritionPlan.basedOn.goals?.map((goal, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {lang === "nl" ? goal : goal}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">{t.yourStage}:</p>
                  <Badge variant="outline">{user.personalizedNutritionPlan.basedOn.stage}</Badge>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">{t.yourNeeds}:</p>
                  <Badge variant="outline">
                    {lang === "nl" ? "Anti-inflammatoire voeding" : "Anti-inflammatory nutrition"}
                  </Badge>
                </div>
              </div>
              {user.personalizedNutritionPlan.planNotes && (
                <div className="mt-4 p-3 bg-white rounded-lg">
                  <p className="text-sm text-gray-700">{user.personalizedNutritionPlan.planNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full max-w-xl grid-cols-5">
            <TabsTrigger value="today">{t.today}</TabsTrigger>
            <TabsTrigger value="breakfast">{t.breakfast}</TabsTrigger>
            <TabsTrigger value="lunch">{t.lunch}</TabsTrigger>
            <TabsTrigger value="dinner">{t.dinner}</TabsTrigger>
            <TabsTrigger value="week">{t.weekMenu}</TabsTrigger>
          </TabsList>

          <TabsContent value="today">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.todayMeals}</h2>
            {todayRecipes.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {todayRecipes.map(recipe => (
                  <RecipeCard key={recipe.id} recipe={recipe} t={t} onClick={() => setSelectedRecipe(recipe)} isToday={true} lang={lang} />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Apple className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">{lang === "nl" ? "Geen recepten voor vandaag" : "No recipes for today"}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="breakfast">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipesByMeal.breakfast.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} t={t} onClick={() => setSelectedRecipe(recipe)} lang={lang} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="lunch">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipesByMeal.lunch.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} t={t} onClick={() => setSelectedRecipe(recipe)} lang={lang} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="dinner">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipesByMeal.dinner.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} t={t} onClick={() => setSelectedRecipe(recipe)} lang={lang} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="week">
            <div className="space-y-8">
              {days.map(day => {
                const dayRecipes = recipes.filter(r => r.dayRecommendation && r.dayRecommendation.includes(day));
                if (dayRecipes.length === 0) return null;
                
                const dayNames = {
                  nl: ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"],
                  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
                };
                const dayIndex = days.indexOf(day);
                
                return (
                  <div key={day}>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{dayNames[lang][dayIndex]}</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {dayRecipes.map(recipe => (
                        <RecipeCard key={recipe.id} recipe={recipe} t={t} onClick={() => setSelectedRecipe(recipe)} lang={lang} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {selectedRecipe && (
          <RecipeDialog recipe={selectedRecipe} t={t} onClose={() => setSelectedRecipe(null)} lang={lang} />
        )}
      </div>
    </div>
  );
}

function RecipeCard({ recipe, t, onClick, isToday = false, lang }) {
  const difficultyLabels = {
    easy: t.easy,
    medium: t.medium,
    hard: t.hard
  };

  return (
    <Card className={`shadow-lg hover:shadow-xl transition-all cursor-pointer ${isToday ? "border-2 border-emerald-500" : ""}`} onClick={onClick}>
      <CardHeader>
        <div className="flex justify-between items-start gap-2 mb-2">
          <Badge variant="outline">{t[recipe.mealType]}</Badge>
          {isToday && (
            <Badge className="bg-emerald-600 text-white text-xs">
              {t.today}
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg">{recipe.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{recipe.description}</p>
        
        <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{recipe.prepTime + recipe.cookTime} {t.minutes}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Users className="w-4 h-4" />
            <span>{recipe.servings} {t.servings}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Flame className="w-4 h-4" />
            <span>{recipe.nutritionFacts.calories} {t.calories}</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-600">
            <Leaf className="w-4 h-4" />
            <span>{recipe.antiInflammatoryScore}/10</span>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mb-4">
          <Badge variant="secondary" className="text-xs">{difficultyLabels[recipe.difficulty] || recipe.difficulty}</Badge>
          {recipe.isVegetarian && <Badge className="bg-green-100 text-green-800 text-xs">{t.vegetarian}</Badge>}
          {recipe.isVegan && <Badge className="bg-green-200 text-green-900 text-xs">{t.vegan}</Badge>}
        </div>

        <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">
          {t.viewRecipe}
        </Button>
      </CardContent>
    </Card>
  );
}

function RecipeDialog({ recipe, t, onClose, lang }) {
  const difficultyLabels = {
    easy: t.easy,
    medium: t.medium,
    hard: t.hard
  };

  return (
    <Dialog open={!!recipe} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{recipe.title}</DialogTitle>
          <p className="text-gray-600">{recipe.description}</p>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <Clock className="w-4 h-4" />
                <p className="text-sm font-medium">{t.prepTime}</p>
              </div>
              <p className="text-lg font-bold text-blue-900">{recipe.prepTime} {t.minutes}</p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 text-purple-700 mb-1">
                <Clock className="w-4 h-4" />
                <p className="text-sm font-medium">{t.totalTime}</p>
              </div>
              <p className="text-lg font-bold text-purple-900">{recipe.prepTime + recipe.cookTime} {t.minutes}</p>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2 text-orange-700 mb-1">
                <Users className="w-4 h-4" />
                <p className="text-sm font-medium">{t.servings}</p>
              </div>
              <p className="text-lg font-bold text-orange-900">{recipe.servings}</p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-700 mb-1">
                <Leaf className="w-4 h-4" />
                <p className="text-sm font-medium">{t.antiInflammatory}</p>
              </div>
              <p className="text-lg font-bold text-emerald-900">{recipe.antiInflammatoryScore}/10</p>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <h3 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {t.whyThisRecipe}
            </h3>
            <p className="text-emerald-800 text-sm">{recipe.rationale}</p>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {t.healthBenefits}
            </h3>
            <ul className="space-y-1">
              {recipe.healthBenefits.map((benefit, idx) => (
                <li key={idx} className="text-blue-800 text-sm flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t.nutritionFacts}</h3>
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900">{recipe.nutritionFacts.calories}</p>
                <p className="text-xs text-gray-600">{t.calories}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900">{recipe.nutritionFacts.protein}g</p>
                <p className="text-xs text-gray-600">{t.protein}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900">{recipe.nutritionFacts.carbs}g</p>
                <p className="text-xs text-gray-600">{t.carbs}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900">{recipe.nutritionFacts.fat}g</p>
                <p className="text-xs text-gray-600">{t.fat}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t.ingredients}</h3>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t.instructions}</h3>
            <ol className="space-y-3">
              {recipe.instructions.map((instruction, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </span>
                  <span className="text-gray-700 pt-1">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>

          {recipe.tips && recipe.tips.length > 0 && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h3 className="font-semibold text-amber-900 mb-2">{t.tips}</h3>
              <ul className="space-y-1">
                {recipe.tips.map((tip, idx) => (
                  <li key={idx} className="text-amber-800 text-sm flex items-start gap-2">
                    <span>💡</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Badge>{difficultyLabels[recipe.difficulty] || recipe.difficulty}</Badge>
            <Badge>{t[recipe.mealType]}</Badge>
            {recipe.isVegetarian && <Badge className="bg-green-100 text-green-800">{t.vegetarian}</Badge>}
            {recipe.isVegan && <Badge className="bg-green-200 text-green-900">{t.vegan}</Badge>}
          </div>

          <Button onClick={onClose} className="w-full bg-emerald-600 hover:bg-emerald-700">
            {t.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}