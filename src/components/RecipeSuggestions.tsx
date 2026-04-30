'use client';

import { useState } from 'react';
import Image from 'next/image';
import { searchRecipesByIngredients, getRecipeInformation } from '@/lib/spoonacular';
import type { Recipe, MacroTargets, Ingredient } from '@/types';

export default function RecipeSuggestions({ ingredients }: { ingredients: Ingredient[] }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showMacroInput, setShowMacroInput] = useState(false);
  const [macroTargets, setMacroTargets] = useState<MacroTargets>({
    calories: 500,
    protein: 30,
    carbs: 50,
    fat: 20,
  });

  const ingredientNames = ingredients.map((i) => i.name);

  const handleSearch = async () => {
    if (ingredientNames.length === 0) {
      setError('Add ingredients to your pantry first');
      return;
    }

    setLoading(true);
    setError('');
    setSelectedRecipe(null);

    try {
      const results = await searchRecipesByIngredients(ingredientNames);
      setRecipes(results);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByMacros = async () => {
    if (ingredientNames.length === 0) {
      setError('Add ingredients to your pantry first');
      return;
    }

    setLoading(true);
    setError('');
    setSelectedRecipe(null);

    try {
      // For now, we'll search by ingredients first, then filter by macros
      const allRecipes = await searchRecipesByIngredients(ingredientNames);
      
      // Get detailed nutrition for each recipe
      const recipesWithNutrition = await Promise.all(
        allRecipes.slice(0, 10).map(async (recipe) => {
          try {
            return await getRecipeInformation(recipe.id);
          } catch {
            return recipe;
          }
        })
      );

      // Filter by macro targets (with 30% tolerance)
      const tolerance = 0.3;
      const filteredRecipes = recipesWithNutrition.filter((recipe) => {
        if (!recipe.nutrition) return false;
        
        const caloriesMatch =
          Math.abs(recipe.nutrition.calories - macroTargets.calories) / macroTargets.calories <=
          tolerance;
        const proteinMatch =
          Math.abs(recipe.nutrition.protein - macroTargets.protein) / macroTargets.protein <=
          tolerance;
        const carbsMatch =
          Math.abs(recipe.nutrition.carbs - macroTargets.carbs) / macroTargets.carbs <= tolerance;
        const fatMatch =
          Math.abs(recipe.nutrition.fat - macroTargets.fat) / macroTargets.fat <= tolerance;

        return caloriesMatch && proteinMatch && carbsMatch && fatMatch;
      });

      setRecipes(filteredRecipes.length > 0 ? filteredRecipes : recipesWithNutrition);
      setShowMacroInput(false);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleRecipeClick = async (recipe: Recipe) => {
    setLoading(true);
    try {
      const detailedRecipe = await getRecipeInformation(recipe.id);
      setSelectedRecipe(detailedRecipe);
    } catch (error) {
      console.error('Error fetching recipe details:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recipe Suggestions</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSearch}
            disabled={loading || ingredientNames.length === 0}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Find Recipes by Ingredients'}
          </button>
          <button
            onClick={() => setShowMacroInput(!showMacroInput)}
            className="px-6 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            {showMacroInput ? 'Hide' : 'Macro Targets'}
          </button>
        </div>

        {showMacroInput && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-3">Set Macro Targets</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Calories</label>
                <input
                  type="number"
                  value={macroTargets.calories}
                  onChange={(e) => setMacroTargets({ ...macroTargets, calories: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Protein (g)</label>
                <input
                  type="number"
                  value={macroTargets.protein}
                  onChange={(e) => setMacroTargets({ ...macroTargets, protein: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Carbs (g)</label>
                <input
                  type="number"
                  value={macroTargets.carbs}
                  onChange={(e) => setMacroTargets({ ...macroTargets, carbs: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Fat (g)</label>
                <input
                  type="number"
                  value={macroTargets.fat}
                  onChange={(e) => setMacroTargets({ ...macroTargets, fat: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleSearchByMacros}
              disabled={loading}
              className="mt-3 w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Find Recipes by Macros'}
            </button>
          </div>
        )}
      </div>

      {selectedRecipe && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-semibold text-gray-800">{selectedRecipe.title}</h3>
            <button
              onClick={() => setSelectedRecipe(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {selectedRecipe.image && (
            <div className="relative w-full h-48 mb-4">
              <Image src={selectedRecipe.image} alt={selectedRecipe.title} fill className="object-cover rounded-lg" unoptimized />
            </div>
          )}
          {selectedRecipe.nutrition && (
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{Math.round(selectedRecipe.nutrition.calories)}</p>
                <p className="text-xs text-gray-600">Calories</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{Math.round(selectedRecipe.nutrition.protein)}g</p>
                <p className="text-xs text-gray-600">Protein</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{Math.round(selectedRecipe.nutrition.carbs)}g</p>
                <p className="text-xs text-gray-600">Carbs</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{Math.round(selectedRecipe.nutrition.fat)}g</p>
                <p className="text-xs text-gray-600">Fat</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>⏱️ {selectedRecipe.readyInMinutes} min</span>
            <span>❤️ {selectedRecipe.likes} likes</span>
          </div>
        </div>
      )}

      {recipes.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Found {recipes.length} recipes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => handleRecipeClick(recipe)}
                className="cursor-pointer bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {recipe.image && (
                  <div className="relative w-full h-32">
                    <Image src={recipe.image} alt={recipe.title} fill className="object-cover" unoptimized />
                  </div>
                )}
                <div className="p-4">
                  <h4 className="font-medium text-gray-800 mb-2 line-clamp-2">{recipe.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      {recipe.usedIngredientCount} used
                    </span>
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                      {recipe.missedIngredientCount} missing
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
