import { supabase } from '@/lib/supabase';
import type { Ingredient, IngredientInsert, SimpleIngredient } from '@/types';

export const fetchAllIngredients = async (): Promise<Ingredient[]> => {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('expiration_date', { ascending: true });
  if (error) throw error;
  return data ?? [];
};

export const fetchSimpleIngredients = async (): Promise<SimpleIngredient[]> => {
  const { data, error } = await supabase
    .from('ingredients')
    .select('id, name, quantity, unit')
    .order('name');
  if (error) throw error;
  return data ?? [];
};

export const insertIngredients = async (rows: IngredientInsert[]): Promise<Ingredient[]> => {
  const { data, error } = await supabase.from('ingredients').insert(rows).select();
  if (error) throw error;
  return data ?? [];
};

export const deleteIngredient = async (id: string): Promise<void> => {
  const { error } = await supabase.from('ingredients').delete().eq('id', id);
  if (error) throw error;
};

export const updateIngredientQuantity = async (id: string, quantity: number): Promise<void> => {
  const { error } = await supabase
    .from('ingredients')
    .update({ quantity: Math.max(0, quantity) })
    .eq('id', id);
  if (error) throw error;
};
