import type { NutritionInfo, Recipe, MacroTargets } from '@/types';

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY || '';
const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com';

/**
 * Get nutrition information for an ingredient
 */
export async function getIngredientNutrition(ingredientName: string): Promise<NutritionInfo | null> {
  try {
    const response = await fetch(
      `${SPOONACULAR_BASE_URL}/food/ingredients/search?query=${encodeURIComponent(ingredientName)}&number=1&apiKey=${SPOONACULAR_API_KEY}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return null;
    }

    const ingredient = data.results[0];
    
    // Get detailed nutrition information
    const nutritionResponse = await fetch(
      `${SPOONACULAR_BASE_URL}/food/ingredients/${ingredient.id}/information?amount=100&unit=grams&apiKey=${SPOONACULAR_API_KEY}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!nutritionResponse.ok) {
      return null;
    }

    const nutritionData = await nutritionResponse.json();
    
    const nutrients = nutritionData.nutrition?.nutrients || [];
    
    const getNutrient = (name: string) => {
      const nutrient = nutrients.find((n: any) => n.name === name);
      return nutrient ? nutrient.amount : 0;
    };

    return {
      calories: getNutrient('Calories'),
      protein: getNutrient('Protein'),
      carbs: getNutrient('Carbohydrates'),
      fat: getNutrient('Fat'),
      fibre: getNutrient('Fiber'),
    };
  } catch (error) {
    console.error('Error fetching nutrition data:', error);
    return null;
  }
}

/**
 * Search for recipes by ingredients
 */
export async function searchRecipesByIngredients(ingredients: string[]): Promise<Recipe[]> {
  const ingredientsParam = ingredients.join(',');
  const response = await fetch(
    `${SPOONACULAR_BASE_URL}/recipes/findByIngredients?ingredients=${ingredientsParam}&number=10&ranking=1`,
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SPOONACULAR_API_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch recipes');
  }

  return response.json();
}

/**
 * Get recipe information including nutrition
 */
export async function getRecipeInformation(recipeId: number): Promise<Recipe> {
  const response = await fetch(
    `${SPOONACULAR_BASE_URL}/recipes/${recipeId}/information?includeNutrition=true`,
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SPOONACULAR_API_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch recipe information');
  }

  const data = await response.json();
  
  // Extract nutrition data
  const nutrition = data.nutrition?.nutrients?.reduce((acc: any, nutrient: any) => {
    if (nutrient.name === 'Calories') acc.calories = nutrient.amount;
    if (nutrient.name === 'Protein') acc.protein = nutrient.amount;
    if (nutrient.name === 'Carbohydrates') acc.carbs = nutrient.amount;
    if (nutrient.name === 'Fat') acc.fat = nutrient.amount;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  return {
    id: data.id,
    title: data.title,
    image: data.image,
    usedIngredientCount: data.usedIngredientCount,
    missedIngredientCount: data.missedIngredientCount,
    likes: data.aggregateLikes,
    readyInMinutes: data.readyInMinutes,
    nutrition,
  };
}

/**
 * Get recipes that match macro targets
 */
export async function getRecipesByMacros(
  ingredients: string[],
  targetMacros: MacroTargets
): Promise<Recipe[]> {
  const recipes = await searchRecipesByIngredients(ingredients);
  
  // Get detailed information for each recipe
  const recipesWithNutrition = await Promise.all(
    recipes.map(recipe => getRecipeInformation(recipe.id))
  );
  
  // Filter recipes that are close to macro targets
  return recipesWithNutrition.filter(recipe => {
    if (!recipe.nutrition) return false;
    
    const tolerance = 0.2; // 20% tolerance
    const caloriesMatch = Math.abs(recipe.nutrition.calories - targetMacros.calories) / targetMacros.calories <= tolerance;
    const proteinMatch = Math.abs(recipe.nutrition.protein - targetMacros.protein) / targetMacros.protein <= tolerance;
    const carbsMatch = Math.abs(recipe.nutrition.carbs - targetMacros.carbs) / targetMacros.carbs <= tolerance;
    const fatMatch = Math.abs(recipe.nutrition.fat - targetMacros.fat) / targetMacros.fat <= tolerance;
    
    return caloriesMatch && proteinMatch && carbsMatch && fatMatch;
  });
}
