import type { NutritionInfo, Recipe, MacroTargets } from '@/types';

const API_KEY = process.env.NEXT_PUBLIC_SPOONACULAR_API_KEY || process.env.SPOONACULAR_API_KEY || '';
const BASE = 'https://api.spoonacular.com';
const HEADERS = { 'Content-Type': 'application/json', 'x-api-key': API_KEY } as const;

async function api<T>(path: string): Promise<T> {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${BASE}${path}${sep}apiKey=${API_KEY}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`Spoonacular ${res.status}: ${res.statusText}`);
  return res.json();
}

interface RawNutrient { name: string; amount: number }
const NUTRIENT_KEYS: Record<string, keyof NutritionInfo> = {
  Calories: 'calories', Protein: 'protein', Carbohydrates: 'carbs', Fat: 'fat', Fiber: 'fibre',
};

function extractNutrition(nutrients: RawNutrient[] = []): NutritionInfo {
  const out: NutritionInfo = { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 };
  for (const n of nutrients) {
    const key = NUTRIENT_KEYS[n.name];
    if (key) out[key] = n.amount;
  }
  return out;
}

export async function getIngredientNutrition(name: string): Promise<NutritionInfo | null> {
  try {
    const search = await api<{ results: { id: number }[] }>(
      `/food/ingredients/search?query=${encodeURIComponent(name)}&number=1`,
    );
    const ing = search.results?.[0];
    if (!ing) return null;
    const info = await api<{ nutrition?: { nutrients: RawNutrient[] } }>(
      `/food/ingredients/${ing.id}/information?amount=100&unit=grams`,
    );
    return extractNutrition(info.nutrition?.nutrients);
  } catch (err) {
    console.error('[spoonacular] nutrition fetch failed', err);
    return null;
  }
}

export function searchRecipesByIngredients(ingredients: string[]): Promise<Recipe[]> {
  return api<Recipe[]>(
    `/recipes/findByIngredients?ingredients=${encodeURIComponent(ingredients.join(','))}&number=10&ranking=1`,
  );
}

export async function getRecipeInformation(recipeId: number): Promise<Recipe> {
  const data = await api<any>(`/recipes/${recipeId}/information?includeNutrition=true`);
  const n = extractNutrition(data.nutrition?.nutrients);
  return {
    id: data.id,
    title: data.title,
    image: data.image,
    usedIngredientCount: data.usedIngredientCount,
    missedIngredientCount: data.missedIngredientCount,
    likes: data.aggregateLikes,
    readyInMinutes: data.readyInMinutes,
    nutrition: { calories: n.calories, protein: n.protein, carbs: n.carbs, fat: n.fat },
  };
}

export function matchesMacros(recipe: Recipe, target: MacroTargets, tolerance = 0.3): boolean {
  const n = recipe.nutrition;
  if (!n) return false;
  const within = (a: number, t: number) => t === 0 || Math.abs(a - t) / t <= tolerance;
  return within(n.calories, target.calories) && within(n.protein, target.protein)
      && within(n.carbs, target.carbs)        && within(n.fat, target.fat);
}

export async function getRecipesByMacros(ingredients: string[], target: MacroTargets): Promise<Recipe[]> {
  const recipes = await searchRecipesByIngredients(ingredients);
  const detailed = await Promise.all(recipes.map(r => getRecipeInformation(r.id)));
  return detailed.filter(r => matchesMacros(r, target));
}
