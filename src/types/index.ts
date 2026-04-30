import type { User } from '@supabase/supabase-js';

export interface Ingredient {
  id: string;
  user_id?: string;
  name: string;
  quantity: number;
  unit: string;
  expiration_date: string;
  calories_per_100g?: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  fibre_per_100g?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SimpleIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface CSVIngredient {
  user_id?: string;
  name: string;
  quantity: number;
  unit: string;
  expiration_date: string;
  calories_per_100g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  fibre_per_100g: number | null;
}

export interface FoodLog {
  id: string;
  user_id?: string;
  ingredient_id: string | null;
  ingredient_name: string;
  quantity_consumed: number;
  unit: string;
  log_date: string;
  meal_type: string | null;
  created_at?: string;
}

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

export type TabType = 'inventory' | 'recipes' | 'foodlog';

export const UNIT_OPTIONS = [
  'pcs', 'g', 'kg', 'ml', 'l', 'cups', 'tbsp', 'tsp', 'oz', 'lb'
] as const;

export const MEAL_TYPES = [
  'breakfast', 'lunch', 'dinner', 'snack'
] as const;
