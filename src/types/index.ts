export interface Ingredient {
  id: string;
  user_id?: string;
  name: string;
  quantity: number;
  unit: string;
  expiration_date: string;
  calories_per_100g?: number | null;
  protein_per_100g?: number | null;
  carbs_per_100g?: number | null;
  fat_per_100g?: number | null;
  fibre_per_100g?: number | null;
  created_at?: string;
  updated_at?: string;
}

export type SimpleIngredient = Pick<Ingredient, 'id' | 'name' | 'quantity' | 'unit'>;

export type IngredientInsert = Omit<Ingredient, 'id' | 'created_at' | 'updated_at'>;

export interface FoodLogEntry {
  id: string;
  user_id?: string;
  ingredient_id: string | null;
  ingredient_name: string;
  quantity_consumed: number;
  unit: string;
  log_date: string;
  meal_type: MealType | null;
  created_at?: string;
}

export type FoodLogInsert = Omit<FoodLogEntry, 'id' | 'created_at'>;

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
}

export interface Recipe {
  id: number;
  title: string;
  image: string;
  usedIngredientCount: number;
  missedIngredientCount: number;
  likes: number;
  readyInMinutes: number;
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type TabType = 'inventory' | 'recipes' | 'foodlog' | 'receipt';

export const UNIT_OPTIONS = [
  'pcs', 'g', 'kg', 'ml', 'l', 'cups', 'tbsp', 'tsp', 'oz', 'lb',
] as const;
export type Unit = typeof UNIT_OPTIONS[number];

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type MealType = typeof MEAL_TYPES[number];

export type ExpirationStatus = 'expired' | 'expiring-soon' | 'expiring-week' | 'fresh';
