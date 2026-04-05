import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger,
} from '@/components/ui/drawer';
import {
  ChefHat, Clock, Flame, Users, ShoppingCart, Plus, Minus, Copy, Check, Image,
} from 'lucide-react';
import { InlineDisclaimer } from '@/components/legal/Disclaimer';
import { toast } from 'sonner';

// ─── Constants ──────────────────────────────────────────────────────────────

const SEASONS = ['all', 'spring', 'summer', 'autumn', 'winter'];
const ALL_TAGS = ['omega-3', 'anti-oxidant', 'vitamine-d', 'vezelrijk', 'eiwitrijk', 'zuivelvrij', 'glutenvrij'];
const CATEGORY_ORDER = ['groente', 'fruit', 'vis', 'vlees', 'zuivel', 'granen', 'kruiden', 'overig'];

// ─── Recipe Card ────────────────────────────────────────────────────────────

const RecipeCard = React.memo(function RecipeCard({ recipe, lang, t, onSelect, onAddToList }) {
  const title = lang === 'nl' ? recipe.title_nl : recipe.title_en;
  const desc = lang === 'nl' ? recipe.description_nl : recipe.description_en;
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => onSelect(recipe)}>
      <CardContent className="p-4 space-y-3">
        {recipe.image_url ? (
          <img src={recipe.image_url} alt={title} className="w-full h-36 object-cover rounded-lg" />
        ) : (
          <div className="w-full h-36 bg-gray-100 rounded-lg flex items-center justify-center">
            <Image className="w-10 h-10 text-gray-300" />
          </div>
        )}
        <h3 className="font-semibold text-sm">{title}</h3>
        {desc && <p className="text-xs text-gray-500 line-clamp-2">{desc}</p>}
        <div className="flex gap-2 flex-wrap">
          {totalTime > 0 && (
            <Badge variant="secondary" className="text-xs"><Clock className="w-3 h-3 mr-1" />{totalTime} min</Badge>
          )}
          {recipe.calories_per_serving && (
            <Badge variant="secondary" className="text-xs"><Flame className="w-3 h-3 mr-1" />{recipe.calories_per_serving} kcal</Badge>
          )}
          {recipe.difficulty && (
            <Badge variant="outline" className="text-xs">{t(`rec_${recipe.difficulty}`)}</Badge>
          )}
        </div>
        {recipe.tags?.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {recipe.tags.slice(0, 3).map(tag => (
              <Badge key={tag} className="bg-green-50 text-green-700 text-[10px] border-green-200">{tag}</Badge>
            ))}
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={(e) => { e.stopPropagation(); onAddToList(recipe); }}
        >
          <ShoppingCart className="w-3 h-3 mr-1" />{t('rec_add_to_list')}
        </Button>
      </CardContent>
    </Card>
  );
});

// ─── Servings Adjuster ──────────────────────────────────────────────────────

function ServingsAdjuster({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onChange(Math.max(1, value - 1))} disabled={value <= 1}>
        <Minus className="w-3 h-3" />
      </Button>
      <span className="text-sm font-semibold w-6 text-center">{value}</span>
      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onChange(Math.min(4, value + 1))} disabled={value >= 4}>
        <Plus className="w-3 h-3" />
      </Button>
    </div>
  );
}

// ─── Shopping List Drawer ───────────────────────────────────────────────────

function ShoppingListDrawer({ items, onToggle, onClear, onSave, onCopy, t, saving }) {
  const grouped = useMemo(() => {
    const groups = {};
    for (const item of items) {
      const cat = item.category || 'overig';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    return CATEGORY_ORDER.filter(c => groups[c]).map(c => ({ category: c, items: groups[c] }));
  }, [items]);

  const checkedCount = items.filter(i => i.checked).length;

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" className="fixed bottom-4 right-4 z-30 shadow-lg gap-2">
          <ShoppingCart className="w-4 h-4" />
          {t('rec_shopping_list')}
          {items.length > 0 && (
            <Badge className="bg-blue-600 text-white ml-1">{items.length}</Badge>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            {t('rec_shopping_list')} ({checkedCount}/{items.length})
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4 overflow-y-auto space-y-4">
          {items.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">{t('rec_list_empty')}</p>
          ) : (
            <>
              {grouped.map(({ category, items: catItems }) => (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">{t(`rec_cat_${category}`)}</h4>
                  <div className="space-y-1.5">
                    {catItems.map((item, idx) => (
                      <label key={`${item.name}-${item.unit}-${idx}`} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={() => onToggle(item)}
                        />
                        <span className={item.checked ? 'line-through text-gray-400' : ''}>
                          {item.amount != null && <span className="font-medium">{item.amount} {item.unit} </span>}
                          {item.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={onSave} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {t('save')}
                </Button>
                <Button size="sm" variant="outline" onClick={onCopy}>
                  <Copy className="w-3 h-3 mr-1" />{t('rec_copy')}
                </Button>
                <Button size="sm" variant="ghost" className="text-red-600" onClick={onClear}>
                  {t('rec_clear_list')}
                </Button>
              </div>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function Recipes() {
  const { profile } = useAuth();
  const { t, language } = useI18n();
  const queryClient = useQueryClient();

  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [servings, setServings] = useState(2);
  const [weekFilter, setWeekFilter] = useState('all');
  const [seasonFilter, setSeasonFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [shoppingItems, setShoppingItems] = useState([]);

  // Fetch recipes with ingredients
  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*, recipe_ingredients(*)')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Load existing shopping list for current week
  const weekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1); // Monday
    return d.toISOString().split('T')[0];
  }, []);

  const { data: savedList } = useQuery({
    queryKey: ['shopping_list', weekStart],
    queryFn: async () => {
      const { data } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('user_id', profile.id)
        .eq('week_start', weekStart)
        .single();
      return data;
    },
    enabled: !!profile?.id,
    onSuccess: (data) => {
      if (data?.items && shoppingItems.length === 0) {
        setShoppingItems(data.items);
      }
    },
  });

  // Save shopping list
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('shopping_lists')
        .upsert({
          user_id: profile.id,
          week_start: weekStart,
          items: shoppingItems,
        }, { onConflict: 'user_id,week_start' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t('saved'));
      queryClient.invalidateQueries({ queryKey: ['shopping_list'] });
    },
  });

  // Filter recipes
  const filtered = useMemo(() => {
    return recipes.filter(r => {
      if (weekFilter !== 'all' && r.week_number !== parseInt(weekFilter)) return false;
      if (seasonFilter !== 'all' && r.season !== seasonFilter && r.season !== 'all') return false;
      if (tagFilter !== 'all' && !(r.tags || []).includes(tagFilter)) return false;
      return true;
    });
  }, [recipes, weekFilter, seasonFilter, tagFilter]);

  // Add recipe ingredients to shopping list
  const addToShoppingList = useCallback((recipe) => {
    const ingredients = (recipe.recipe_ingredients || []).map(ri => ({
      name: language === 'nl' ? ri.name_nl : ri.name_en,
      amount: ri.amount,
      unit: ri.unit,
      category: ri.category,
      checked: false,
    }));

    setShoppingItems(prev => {
      const merged = [...prev];
      for (const ing of ingredients) {
        const existing = merged.find(m => m.name === ing.name && m.unit === ing.unit && !m.checked);
        if (existing && existing.amount != null && ing.amount != null) {
          existing.amount = Number(existing.amount) + Number(ing.amount);
        } else {
          merged.push({ ...ing });
        }
      }
      return merged;
    });
    toast.success(t('rec_added_to_list'));
  }, [language, t]);

  const toggleItem = useCallback((item) => {
    setShoppingItems(prev => prev.map(i =>
      i.name === item.name && i.unit === item.unit ? { ...i, checked: !i.checked } : i
    ));
  }, []);

  const copyToClipboard = useCallback(() => {
    const text = shoppingItems
      .filter(i => !i.checked)
      .map(i => `${i.amount != null ? `${i.amount} ${i.unit || ''} ` : ''}${i.name}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    toast.success(t('rec_copied'));
  }, [shoppingItems, t]);

  // Scale ingredient amount based on servings
  const scaleAmount = (amount, baseServings) => {
    if (amount == null || baseServings == null || baseServings === 0) return amount;
    return Math.round((amount / baseServings) * servings * 10) / 10;
  };

  // Reset servings when opening a new recipe
  const openRecipe = (recipe) => {
    setServings(recipe.servings || 2);
    setSelectedRecipe(recipe);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <ChefHat className="w-7 h-7 text-orange-600" />
        {t('rec_title')}
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={weekFilter} onValueChange={setWeekFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t('rec_filter_week')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('rec_all_weeks')}</SelectItem>
            {Array.from({ length: 12 }, (_, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>{t('rec_week')} {i + 1}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={seasonFilter} onValueChange={setSeasonFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t('rec_filter_season')} />
          </SelectTrigger>
          <SelectContent>
            {SEASONS.map(s => (
              <SelectItem key={s} value={s}>{t(`rec_season_${s}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t('rec_filter_tag')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('rec_all_tags')}</SelectItem>
            {ALL_TAGS.map(tag => (
              <SelectItem key={tag} value={tag}>{tag}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Recipe Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <ChefHat className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">{t('rec_no_results')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              lang={language}
              t={t}
              onSelect={openRecipe}
              onAddToList={addToShoppingList}
            />
          ))}
        </div>
      )}

      {/* Recipe Detail Dialog */}
      <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
        {selectedRecipe && (
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{language === 'nl' ? selectedRecipe.title_nl : selectedRecipe.title_en}</DialogTitle>
              <DialogDescription>
                {language === 'nl' ? selectedRecipe.description_nl : selectedRecipe.description_en}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Meta badges */}
              <div className="flex gap-2 flex-wrap">
                {(selectedRecipe.prep_time_minutes || selectedRecipe.cook_time_minutes) && (
                  <Badge variant="secondary">
                    <Clock className="w-3 h-3 mr-1" />
                    {(selectedRecipe.prep_time_minutes || 0) + (selectedRecipe.cook_time_minutes || 0)} min
                  </Badge>
                )}
                <Badge variant="secondary">
                  <Flame className="w-3 h-3 mr-1" />
                  {selectedRecipe.calories_per_serving} kcal
                </Badge>
                {selectedRecipe.protein_g && (
                  <Badge variant="secondary">{selectedRecipe.protein_g}g {t('rec_protein')}</Badge>
                )}
              </div>

              {/* Servings adjuster */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-sm font-medium flex items-center gap-1">
                  <Users className="w-4 h-4" /> {t('nutr_servings')}
                </span>
                <ServingsAdjuster value={servings} onChange={setServings} />
              </div>

              {/* Ingredients */}
              <div>
                <h4 className="font-semibold text-sm mb-2">{t('nutr_ingredients')}</h4>
                <ul className="text-sm space-y-1">
                  {(selectedRecipe.recipe_ingredients || []).map((ri, i) => (
                    <li key={ri.id || i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {ri.amount != null && (
                        <span className="font-medium">
                          {scaleAmount(ri.amount, selectedRecipe.servings)} {ri.unit}
                        </span>
                      )}
                      <span>{language === 'nl' ? ri.name_nl : ri.name_en}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div>
                <h4 className="font-semibold text-sm mb-2">{t('nutr_instructions')}</h4>
                <ol className="text-sm space-y-2">
                  {(language === 'nl' ? selectedRecipe.instructions_nl : selectedRecipe.instructions_en || '')
                    .split('\n')
                    .filter(Boolean)
                    .map((step, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                </ol>
              </div>

              {/* Tags */}
              {selectedRecipe.tags?.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {selectedRecipe.tags.map(tag => (
                    <Badge key={tag} className="bg-green-50 text-green-700 text-xs border-green-200">{tag}</Badge>
                  ))}
                </div>
              )}

              {/* Add to list */}
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => { addToShoppingList(selectedRecipe); setSelectedRecipe(null); }}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />{t('rec_add_to_list')}
              </Button>

              <InlineDisclaimer type="nutrition" />
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Shopping List Drawer (floating button) */}
      <ShoppingListDrawer
        items={shoppingItems}
        onToggle={toggleItem}
        onClear={() => setShoppingItems([])}
        onSave={() => saveMutation.mutate()}
        onCopy={copyToClipboard}
        t={t}
        saving={saveMutation.isLoading}
      />

      <InlineDisclaimer type="nutrition" />
    </div>
  );
}
