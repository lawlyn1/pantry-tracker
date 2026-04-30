'use client';

import { useCallback, useMemo } from 'react';
import { usePantry } from '@/context/PantryContext';
import { expirationBadge } from '@/lib/dates';
import IngredientRow from './IngredientRow';

export default function IngredientList() {
  const { ingredients, loading, showMacros, removeIngredient } = usePantry();

  // Single Date.now() snapshot per render: O(n) once instead of O(n) Date allocations per item.
  const badges = useMemo(() => {
    const now = Date.now();
    return ingredients.map(i => expirationBadge(i.expiration_date, now));
  }, [ingredients]);

  const handleDelete = useCallback((id: string) => {
    removeIngredient(id).catch(err => console.error('[IngredientList] delete failed', err));
  }, [removeIngredient]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-200 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (ingredients.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 text-center">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p className="text-gray-500">No ingredients in your pantry yet</p>
        <p className="text-sm text-gray-400 mt-1">Add ingredients manually or import from CSV</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Inventory ({ingredients.length})</h2>
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {ingredients.map((ing, idx) => (
          <IngredientRow
            key={ing.id}
            ingredient={ing}
            badge={badges[idx]}
            showMacros={showMacros}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
