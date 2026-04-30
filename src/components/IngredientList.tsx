'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Ingredient } from '@/types';

export default function IngredientList({
  ingredients,
  loading,
  onIngredientDeleted,
  showMacros = true,
}: {
  ingredients: Ingredient[];
  loading: boolean;
  onIngredientDeleted: () => void;
  showMacros?: boolean;
}) {
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('ingredients').delete().eq('id', id);
      if (error) throw error;
      onIngredientDeleted();
    } catch (error) {
      console.error('Error deleting ingredient:', error);
    }
  };

  const getExpirationStatus = (expirationDate: string) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: 'bg-red-100 text-red-800', label: 'Expired' };
    } else if (daysUntilExpiry <= 3) {
      return { status: 'expiring-soon', color: 'bg-orange-100 text-orange-800', label: 'Expiring Soon' };
    } else if (daysUntilExpiry <= 7) {
      return { status: 'expiring-week', color: 'bg-yellow-100 text-yellow-800', label: 'Expiring This Week' };
    } else {
      return { status: 'fresh', color: 'bg-green-100 text-green-800', label: 'Fresh' };
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (ingredients.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 text-center">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p className="text-gray-500">No ingredients in your pantry yet</p>
        <p className="text-sm text-gray-400 mt-1">Add ingredients manually or import from CSV</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Inventory ({ingredients.length})
      </h2>
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {ingredients.map((ingredient) => {
          const expirationStatus = getExpirationStatus(ingredient.expiration_date);
          return (
            <div
              key={ingredient.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">{ingredient.name}</h3>
                <p className="text-sm text-gray-600">
                  {ingredient.quantity} {ingredient.unit}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${expirationStatus.color}`}>
                    {expirationStatus.label}
                  </span>
                  <span className="text-xs text-gray-500">
                    Exp: {new Date(ingredient.expiration_date).toLocaleDateString()}
                  </span>
                </div>
                {showMacros && (ingredient.calories_per_100g || ingredient.protein_per_100g) && (
                  <div className="flex gap-3 mt-1">
                    {ingredient.calories_per_100g != null && (
                      <span className="text-xs text-gray-400">{ingredient.calories_per_100g} kcal</span>
                    )}
                    {ingredient.protein_per_100g != null && (
                      <span className="text-xs text-gray-400">P: {ingredient.protein_per_100g}g</span>
                    )}
                    {ingredient.carbs_per_100g != null && (
                      <span className="text-xs text-gray-400">C: {ingredient.carbs_per_100g}g</span>
                    )}
                    {ingredient.fat_per_100g != null && (
                      <span className="text-xs text-gray-400">F: {ingredient.fat_per_100g}g</span>
                    )}
                    {ingredient.fibre_per_100g != null && (
                      <span className="text-xs text-gray-400">Fi: {ingredient.fibre_per_100g}g</span>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDelete(ingredient.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete ingredient"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
