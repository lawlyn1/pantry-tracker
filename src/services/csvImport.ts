import Papa from 'papaparse';
import type { IngredientInsert, FoodLogInsert, MealType } from '@/types';
import { MEAL_TYPES } from '@/types';

export const parseCSV = <T = Record<string, string>>(file: File): Promise<T[]> =>
  new Promise((resolve, reject) => {
    Papa.parse<T>(file, {
      header: true,
      skipEmptyLines: true,
      complete: r => resolve(r.data),
      error: reject,
    });
  });

const numOrNull = (v: unknown): number | null => {
  if (v === undefined || v === null || v === '') return null;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
};

const num = (v: unknown, fallback = 0): number => numOrNull(v) ?? fallback;

export const csvToIngredientInserts = (
  rows: Record<string, string>[],
  userId?: string,
): IngredientInsert[] =>
  rows
    .filter(r => r.name && r.expiration_date)
    .map(r => ({
      user_id: userId,
      name: r.name,
      quantity: num(r.quantity, 1),
      unit: r.unit || 'pcs',
      expiration_date: r.expiration_date,
      calories_per_100g: numOrNull(r.calories_per_100g),
      protein_per_100g: numOrNull(r.protein_per_100g),
      carbs_per_100g: numOrNull(r.carbs_per_100g),
      fat_per_100g: numOrNull(r.fat_per_100g),
      fibre_per_100g: numOrNull(r.fibre_per_100g),
    }));

const isMealType = (v: string): v is MealType => (MEAL_TYPES as readonly string[]).includes(v);

export const csvToFoodLogInserts = (
  rows: Record<string, string>[],
  userId?: string,
): FoodLogInsert[] =>
  rows
    .filter(r => r.name && r.date && r.quantity)
    .map(r => ({
      user_id: userId,
      ingredient_id: null,
      ingredient_name: r.name,
      quantity_consumed: num(r.quantity, 1),
      unit: r.unit || 'g',
      log_date: r.date,
      meal_type: r.meal_type && isMealType(r.meal_type) ? r.meal_type : null,
    }));
