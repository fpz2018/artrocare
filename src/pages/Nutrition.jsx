import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Apple, Clock, Users, Flame, Lock, ChefHat } from 'lucide-react';
import { InlineDisclaimer } from '@/components/legal/Disclaimer';

const RecipeCard = React.memo(function RecipeCard({ recipe, lang, onSelect }) {
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => onSelect(recipe)}>
      <CardContent className="p-4 space-y-2">
        <h3 className="font-semibold text-sm">{lang === 'nl' ? recipe.title_nl : recipe.title_en}</h3>
        <p className="text-xs text-gray-500 line-clamp-2">{lang === 'nl' ? recipe.description_nl : recipe.description_en}</p>
        <div className="flex gap-2 flex-wrap">
          {recipe.prep_time && (
            <Badge variant="secondary" className="text-xs"><Clock className="w-3 h-3 mr-1" />{recipe.prep_time} min</Badge>
          )}
          {recipe.calories && (
            <Badge variant="secondary" className="text-xs"><Flame className="w-3 h-3 mr-1" />{recipe.calories} kcal</Badge>
          )}
          {recipe.anti_inflammatory_score && (
            <Badge className="bg-green-100 text-green-700 text-xs">Anti-inflammatoir: {recipe.anti_inflammatory_score}/10</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

// Sample nutrition data (would normally come from an AI endpoint or Supabase)
const sampleRecipes = [
  {
    id: '1', title_nl: 'Zalm met Kurkuma Groenten', title_en: 'Salmon with Turmeric Vegetables',
    description_nl: 'Omega-3 rijke zalm met ontstekingsremmende kurkuma groenten.', description_en: 'Omega-3 rich salmon with anti-inflammatory turmeric vegetables.',
    meal_type: 'dinner', day: 1, prep_time: 15, cook_time: 25, servings: 2, calories: 450, anti_inflammatory_score: 9, difficulty: 'easy',
    ingredients_nl: ['200g zalm', '1 tl kurkuma', 'Broccoli', 'Zoete aardappel', 'Olijfolie', 'Knoflook'],
    ingredients_en: ['200g salmon', '1 tsp turmeric', 'Broccoli', 'Sweet potato', 'Olive oil', 'Garlic'],
    instructions_nl: ['Verwarm oven op 200C', 'Snijd groenten', 'Bak zalm 4 min per kant', 'Rooster groenten met kurkuma 20 min', 'Serveer samen'],
    instructions_en: ['Preheat oven to 200C', 'Cut vegetables', 'Sear salmon 4 min per side', 'Roast vegetables with turmeric 20 min', 'Serve together'],
    health_benefits_nl: ['Rijk aan omega-3 vetzuren', 'Ontstekingsremmend door kurkuma', 'Goede bron van vitamine D'],
    health_benefits_en: ['Rich in omega-3 fatty acids', 'Anti-inflammatory from turmeric', 'Good source of vitamin D'],
  },
  {
    id: '2', title_nl: 'Havermout met Blauwe Bessen', title_en: 'Oatmeal with Blueberries',
    description_nl: 'Antioxidant-rijke ontbijtbowl met anti-inflammatoire bessen.', description_en: 'Antioxidant-rich breakfast bowl with anti-inflammatory berries.',
    meal_type: 'breakfast', day: 1, prep_time: 5, cook_time: 10, servings: 1, calories: 320, anti_inflammatory_score: 8, difficulty: 'easy',
    ingredients_nl: ['50g havermout', '200ml amandelmelk', 'Handvol blauwe bessen', '1 el walnoten', '1 tl honing', 'Kaneel'],
    ingredients_en: ['50g oats', '200ml almond milk', 'Handful blueberries', '1 tbsp walnuts', '1 tsp honey', 'Cinnamon'],
    instructions_nl: ['Kook havermout met amandelmelk', 'Voeg kaneel toe', 'Top met bessen en walnoten', 'Druppel honing erover'],
    instructions_en: ['Cook oats with almond milk', 'Add cinnamon', 'Top with berries and walnuts', 'Drizzle honey on top'],
    health_benefits_nl: ['Rijk aan antioxidanten', 'Omega-3 uit walnoten', 'Vezelrijk voor darmgezondheid'],
    health_benefits_en: ['Rich in antioxidants', 'Omega-3 from walnuts', 'Fiber-rich for gut health'],
  },
  {
    id: '3', title_nl: 'Linzensoep met Gember', title_en: 'Lentil Soup with Ginger',
    description_nl: 'Verwarmende soep met ontstekingsremmende gember en kurkuma.', description_en: 'Warming soup with anti-inflammatory ginger and turmeric.',
    meal_type: 'lunch', day: 1, prep_time: 10, cook_time: 30, servings: 4, calories: 280, anti_inflammatory_score: 9, difficulty: 'easy',
    ingredients_nl: ['200g rode linzen', 'Ui', 'Knoflook', 'Verse gember', 'Kurkuma', 'Kokosmelk', 'Groentebouillon'],
    ingredients_en: ['200g red lentils', 'Onion', 'Garlic', 'Fresh ginger', 'Turmeric', 'Coconut milk', 'Vegetable broth'],
    instructions_nl: ['Fruit ui en knoflook', 'Voeg gember en kurkuma toe', 'Voeg linzen en bouillon toe', 'Kook 25 min', 'Blend en voeg kokosmelk toe'],
    instructions_en: ['Saute onion and garlic', 'Add ginger and turmeric', 'Add lentils and broth', 'Cook 25 min', 'Blend and add coconut milk'],
    health_benefits_nl: ['Gember remt ontstekingen', 'Plantaardig eiwit', 'Vezelrijk'],
    health_benefits_en: ['Ginger reduces inflammation', 'Plant-based protein', 'Fiber-rich'],
  },
];

export default function Nutrition() {
  const { profile } = useAuth();
  const { t, language } = useI18n();
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const coreLessonsComplete = (profile?.completed_core_lessons || []).length >= 3;

  const recipes = sampleRecipes;

  if (!coreLessonsComplete) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Apple className="w-7 h-7 text-green-600" />
          {t('nutr_title')}
        </h1>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-6 flex items-start gap-3">
            <Lock className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <p className="font-semibold text-amber-900">{t('nutr_locked')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Apple className="w-7 h-7 text-green-600" />
        {t('nutr_title')}
      </h1>

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">{t('nutr_today')}</TabsTrigger>
          <TabsTrigger value="breakfast">{t('nutr_breakfast')}</TabsTrigger>
          <TabsTrigger value="lunch">{t('nutr_lunch')}</TabsTrigger>
          <TabsTrigger value="dinner">{t('nutr_dinner')}</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} lang={language} onSelect={setSelectedRecipe} />
            ))}
          </div>
        </TabsContent>

        {['breakfast', 'lunch', 'dinner'].map((meal) => (
          <TabsContent key={meal} value={meal} className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recipes.filter((r) => r.meal_type === meal).map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} lang={language} onSelect={setSelectedRecipe} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Recipe Detail Dialog */}
      <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
        {selectedRecipe && (
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{language === 'nl' ? selectedRecipe.title_nl : selectedRecipe.title_en}</DialogTitle>
              <DialogDescription>{language === 'nl' ? selectedRecipe.description_nl : selectedRecipe.description_en}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />{selectedRecipe.prep_time + selectedRecipe.cook_time} min</Badge>
                <Badge variant="secondary"><Users className="w-3 h-3 mr-1" />{selectedRecipe.servings}</Badge>
                <Badge variant="secondary"><Flame className="w-3 h-3 mr-1" />{selectedRecipe.calories} kcal</Badge>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">{t('nutr_ingredients')}</h4>
                <ul className="text-sm space-y-1">
                  {(language === 'nl' ? selectedRecipe.ingredients_nl : selectedRecipe.ingredients_en).map((ing, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">{t('nutr_instructions')}</h4>
                <ol className="text-sm space-y-2">
                  {(language === 'nl' ? selectedRecipe.instructions_nl : selectedRecipe.instructions_en).map((step, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">{t('nutr_health_benefits')}</h4>
                <ul className="text-sm space-y-1">
                  {(language === 'nl' ? selectedRecipe.health_benefits_nl : selectedRecipe.health_benefits_en).map((b, i) => (
                    <li key={i} className="text-green-700">✓ {b}</li>
                  ))}
                </ul>
              </div>

              <InlineDisclaimer type="nutrition" />
            </div>
          </DialogContent>
        )}
      </Dialog>

      <InlineDisclaimer type="nutrition" />
    </div>
  );
}
