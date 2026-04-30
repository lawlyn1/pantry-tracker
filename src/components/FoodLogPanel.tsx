'use client';

import { useEffect, useState, useCallback } from 'react';
import FoodLogCSVUpload from './FoodLogCSVUpload';
import { usePantry } from '@/context/PantryContext';
import { fetchRecentLogs, insertFoodLogs } from '@/services/foodLogs';
import { todayISO, formatDate } from '@/lib/dates';
import { UNIT_OPTIONS, MEAL_TYPES, type FoodLogEntry, type MealType } from '@/types';

export default function FoodLogPanel() {
  const { user, ingredients, consumeIngredient } = usePantry();
  const [foodLogs, setFoodLogs] = useState<FoodLogEntry[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('g');
  const [logDate, setLogDate] = useState(todayISO);
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadLogs = useCallback(async () => {
    try { setFoodLogs(await fetchRecentLogs()); }
    catch (e: any) { setError(e?.message ?? 'Failed to load logs'); }
  }, []);

  useEffect(() => {
    let active = true;
    fetchRecentLogs()
      .then(rows => { if (active) setFoodLogs(rows); })
      .catch(e => { if (active) setError(e?.message ?? 'Failed to load logs'); });
    return () => { active = false; };
  }, []);

  const handleLogFood = async () => {
    if (!selectedId) return setError('Please select an ingredient');
    const ing = ingredients.find(i => i.id === selectedId);
    if (!ing) return setError('Ingredient not found');

    setLoading(true);
    setError('');
    try {
      await insertFoodLogs([{
        user_id: user?.id,
        ingredient_id: selectedId,
        ingredient_name: ing.name,
        quantity_consumed: quantity,
        unit,
        log_date: logDate,
        meal_type: mealType,
      }]);
      await consumeIngredient(selectedId, quantity);

      setSelectedId('');
      setQuantity(1);
      setUnit('g');
      setLogDate(todayISO());
      await loadLogs();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to log food');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Log Food Manually</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ingredient *</label>
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select ingredient...</option>
                {ingredients.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.quantity} {i.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Consumed *</label>
                <input
                  type="number" step="0.01" min="0"
                  value={quantity}
                  onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                <select
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={logDate}
                  onChange={e => setLogDate(e.target.value)}
                  max={todayISO()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
                <select
                  value={mealType}
                  onChange={e => setMealType(e.target.value as MealType)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {MEAL_TYPES.map(m => (
                    <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleLogFood}
              disabled={loading || !selectedId}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging...' : 'Log Food & Remove from Inventory'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Logs (Last 7 Days)</h3>
          {foodLogs.length === 0 ? (
            <p className="text-sm text-gray-500">No food logs yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {foodLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <p className="font-medium text-gray-800">{log.ingredient_name}</p>
                    <p className="text-gray-600">
                      {log.quantity_consumed} {log.unit} - {log.meal_type ?? 'meal'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(log.log_date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <FoodLogCSVUpload onComplete={loadLogs} />
    </div>
  );
}
