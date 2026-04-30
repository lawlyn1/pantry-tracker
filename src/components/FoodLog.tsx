'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import FoodLogCSVUpload from '@/components/FoodLogCSVUpload';
import type { User } from '@supabase/supabase-js';

interface FoodLog {
  id: string;
  ingredient_id: string | null;
  ingredient_name: string;
  quantity_consumed: number;
  unit: string;
  log_date: string;
  meal_type: string | null;
}

interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export default function FoodLog({ onConsumption, user }: { onConsumption: () => void; user: User | null }) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('g');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [mealType, setMealType] = useState('lunch');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchIngredients();
    fetchRecentLogs();
  }, []);

  const fetchIngredients = async () => {
    const { data } = await supabase
      .from('ingredients')
      .select('id, name, quantity, unit')
      .order('name');
    if (data) setIngredients(data);
  };

  const fetchRecentLogs = async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data } = await supabase
      .from('food_logs')
      .select('*')
      .gte('log_date', sevenDaysAgo.toISOString().split('T')[0])
      .order('log_date', { ascending: false });
    
    if (data) setFoodLogs(data);
  };

  const handleLogFood = async () => {
    if (!selectedIngredient) {
      setError('Please select an ingredient');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const ingredient = ingredients.find(i => i.id === selectedIngredient);
      if (!ingredient) throw new Error('Ingredient not found');

      // Log the food consumption
      const { error: logError } = await supabase.from('food_logs').insert([
        {
          user_id: user?.id,
          ingredient_id: selectedIngredient,
          ingredient_name: ingredient.name,
          quantity_consumed: quantity,
          unit: unit,
          log_date: logDate,
          meal_type: mealType,
        },
      ]);

      if (logError) throw logError;

      // Update ingredient quantity
      const newQuantity = Math.max(0, ingredient.quantity - quantity);
      const { error: updateError } = await supabase
        .from('ingredients')
        .update({ quantity: newQuantity })
        .eq('id', selectedIngredient);

      if (updateError) throw updateError;

      // Reset form
      setSelectedIngredient('');
      setQuantity(1);
      setUnit('g');
      setLogDate(new Date().toISOString().split('T')[0]);

      // Refresh data
      await fetchIngredients();
      await fetchRecentLogs();
      onConsumption();
    } catch (error: any) {
      setError(error.message || 'Failed to log food');
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
                value={selectedIngredient}
                onChange={(e) => setSelectedIngredient(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select ingredient...</option>
                {ingredients.map((ingredient) => (
                  <option key={ingredient.id} value={ingredient.id}>
                    {ingredient.name} ({ingredient.quantity} {ingredient.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Consumed *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="ml">ml</option>
                  <option value="l">l</option>
                  <option value="pcs">pcs</option>
                  <option value="cups">cups</option>
                  <option value="tbsp">tbsp</option>
                  <option value="tsp">tsp</option>
                  <option value="oz">oz</option>
                  <option value="lb">lb</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleLogFood}
              disabled={loading || !selectedIngredient}
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
              {foodLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <p className="font-medium text-gray-800">{log.ingredient_name}</p>
                    <p className="text-gray-600">
                      {log.quantity_consumed} {log.unit} - {log.meal_type || 'meal'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(log.log_date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <FoodLogCSVUpload onUpload={() => { fetchIngredients(); fetchRecentLogs(); onConsumption(); }} user={user} />
      </div>
    </div>
  );
}
