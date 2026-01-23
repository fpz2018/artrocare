import { base44 } from "@/api/base44Client";

export default async function generatePersonalizedNutritionPlan({ language }) {
  // Get current user from context
  const user = await base44.auth.me();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  // Fetch user's recent measurements (last 7 days)
  const recentMeasurements = await base44.entities.Measurement.filter({ 
    created_by: user.email 
  }, "-date", 7);
  
  // Calculate average pain level
  const avgPain = recentMeasurements.length > 0 
    ? recentMeasurements.reduce((sum, m) => sum + (m.painScore || 0), 0) / recentMeasurements.length 
    : 5;

  // Build AI prompt (server-side)
  const prompt = language === "nl" ? `
Je bent een expert voedingsdeskundige gespecialiseerd in anti-inflammatoire voeding voor artrose.
Maak een gepersonaliseerd weekmenu voor deze patiënt:

PATIËNT PROFIEL:
- Artrose stadium: ${user.arthrosisStage || 'mild'}
- Aangedane gewrichten: ${user.affectedJoints?.join(', ') || 'knie'}
- Doelen: ${user.goals?.join(', ') || 'pijnvermindering'}
- Gemiddeld pijnniveau: ${avgPain.toFixed(1)}/10
- Leeftijd: ${user.dateOfBirth ? new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear() : 'onbekend'}
- Gewicht: ${user.weight || 'onbekend'} kg

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
- Arthritis stage: ${user.arthrosisStage || 'mild'}
- Affected joints: ${user.affectedJoints?.join(', ') || 'knee'}
- Goals: ${user.goals?.join(', ') || 'pain reduction'}
- Average pain level: ${avgPain.toFixed(1)}/10
- Age: ${user.dateOfBirth ? new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear() : 'unknown'}
- Weight: ${user.weight || 'unknown'} kg

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

  // Execute AI call
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

  // Add IDs to recipes
  const recipesWithIds = response.recipes.map((recipe, idx) => ({
    ...recipe,
    id: `recipe_${Date.now()}_${idx}`
  }));

  // Save result to user.personalizedNutritionPlan
  await base44.auth.updateMe({
    personalizedNutritionPlan: {
      recipes: recipesWithIds,
      planNotes: response.planNotes,
      generatedAt: new Date().toISOString(),
      basedOn: {
        stage: user.arthrosisStage,
        joints: user.affectedJoints,
        goals: user.goals,
        avgPain: avgPain.toFixed(1)
      }
    }
  });

  // Return result
  return {
    recipes: recipesWithIds,
    planNotes: response.planNotes,
    basedOn: {
      stage: user.arthrosisStage,
      joints: user.affectedJoints,
      goals: user.goals,
      avgPain: avgPain.toFixed(1)
    }
  };
}