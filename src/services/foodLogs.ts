import { supabase } from '@/lib/supabase';
import type { FoodLogEntry, FoodLogInsert, Ingredient } from '@/types';

export const fetchRecentLogs = async (days = 7): Promise<FoodLogEntry[]> => {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await supabase
    .from('food_logs')
    .select('*')
    .gte('log_date', since.toISOString().slice(0, 10))
    .order('log_date', { ascending: false });
  if (error) throw error;
  return data ?? [];
};

export const insertFoodLogs = async (rows: FoodLogInsert[]): Promise<void> => {
  if (rows.length === 0) return;
  const { error } = await supabase.from('food_logs').insert(rows);
  if (error) throw error;
};

/**
 * Aggregates consumption deltas by ingredient name (case-insensitive),
 * fetches all matching ingredients in ONE query, applies updates in parallel.
 * Replaces the previous N+1 select-then-update loop.
 */
export const applyConsumptionToInventory = async (
  logs: Pick<FoodLogInsert, 'ingredient_name' | 'quantity_consumed'>[],
): Promise<void> => {
  if (logs.length === 0) return;

  const deltas = new Map<string, number>();
  for (const l of logs) {
    const key = l.ingredient_name.toLowerCase();
    deltas.set(key, (deltas.get(key) ?? 0) + l.quantity_consumed);
  }

  const { data: matches, error } = await supabase
    .from('ingredients')
    .select('id, name, quantity')
    .in('name', Array.from(deltas.keys()).map(k => k));
  if (error) throw error;

  // Fallback for case-insensitive matches not caught by .in()
  const byLower = new Map<string, Pick<Ingredient, 'id' | 'quantity'>>();
  (matches ?? []).forEach(m => byLower.set(m.name.toLowerCase(), m));

  const updates: Array<PromiseLike<unknown>> = [];
  for (const [name, delta] of deltas) {
    const ing = byLower.get(name);
    if (!ing) continue;
    updates.push(
      supabase
        .from('ingredients')
        .update({ quantity: Math.max(0, ing.quantity - delta) })
        .eq('id', ing.id),
    );
  }
  await Promise.all(updates);
};
