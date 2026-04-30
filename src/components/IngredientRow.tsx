'use client';

import { memo } from 'react';
import type { Ingredient } from '@/types';
import { type ExpirationBadge, formatDate } from '@/lib/dates';

interface Props {
  ingredient: Ingredient;
  badge: ExpirationBadge;
  showMacros: boolean;
  onDelete: (id: string) => void;
}

function IngredientRow({ ingredient: ing, badge, showMacros, onDelete }: Props) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-1">
        <h3 className="font-medium text-gray-800">{ing.name}</h3>
        <p className="text-sm text-gray-600">{ing.quantity} {ing.unit}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs px-2 py-1 rounded-full ${badge.className}`}>{badge.label}</span>
          <span className="text-xs text-gray-500">Exp: {formatDate(ing.expiration_date)}</span>
        </div>
        {showMacros && (ing.calories_per_100g != null || ing.protein_per_100g != null) && (
          <div className="flex gap-3 mt-1">
            {ing.calories_per_100g != null && <span className="text-xs text-gray-400">{ing.calories_per_100g} kcal</span>}
            {ing.protein_per_100g  != null && <span className="text-xs text-gray-400">P: {ing.protein_per_100g}g</span>}
            {ing.carbs_per_100g    != null && <span className="text-xs text-gray-400">C: {ing.carbs_per_100g}g</span>}
            {ing.fat_per_100g      != null && <span className="text-xs text-gray-400">F: {ing.fat_per_100g}g</span>}
            {ing.fibre_per_100g    != null && <span className="text-xs text-gray-400">Fi: {ing.fibre_per_100g}g</span>}
          </div>
        )}
      </div>
      <button
        onClick={() => onDelete(ing.id)}
        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        title="Delete ingredient"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}

export default memo(IngredientRow);
