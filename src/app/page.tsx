'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AddIngredientForm from '@/components/AddIngredientForm';
import CSVUpload from '@/components/CSVUpload';
import IngredientList from '@/components/IngredientList';
import RecipeSuggestions from '@/components/RecipeSuggestions';
import FoodLog from '@/components/FoodLog';
import Auth from '@/components/Auth';
import { Ingredient } from '@/lib/spoonacular';
import type { User } from '@supabase/supabase-js';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'recipes' | 'foodlog'>('inventory');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchIngredients();
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchIngredients();
      } else {
        setIngredients([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const fetchIngredients = async () => {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('expiration_date', { ascending: true });

      if (error) throw error;
      setIngredients(data || []);
    } catch (error: any) {
      console.error('Error fetching ingredients:', error);
      setError(error?.message || JSON.stringify(error));
    } finally {
      setLoading(false);
    }
  };

  const handleIngredientAdded = () => {
    fetchIngredients();
  };

  const handleIngredientDeleted = () => {
    fetchIngredients();
  };

  const handleCSVUpload = (uploadedIngredients: any[]) => {
    setIngredients(prev => [...prev, ...uploadedIngredients]);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {!user ? (
        <Auth />
      ) : (
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">🥫 Pantry Tracker</h1>
              <p className="text-gray-600">Track your inventory and discover recipes</p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Sign Out
            </button>
          </header>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-medium text-red-800">Error:</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

        <div className="mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'inventory'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Inventory
            </button>
            <button
              onClick={() => setActiveTab('foodlog')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'foodlog'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Food Log
            </button>
            <button
              onClick={() => setActiveTab('recipes')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'recipes'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Recipe Suggestions
            </button>
          </div>
        </div>

        {activeTab === 'inventory' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <AddIngredientForm onIngredientAdded={handleIngredientAdded} user={user} />
              <CSVUpload onUpload={handleCSVUpload} user={user} />
            </div>
            <div>
              <IngredientList
                ingredients={ingredients}
                loading={loading}
                onIngredientDeleted={handleIngredientDeleted}
              />
            </div>
          </div>
        ) : activeTab === 'foodlog' ? (
          <FoodLog onConsumption={fetchIngredients} user={user} />
        ) : (
          <RecipeSuggestions ingredients={ingredients} />
        )}
      </div>
      )}
    </main>
  );
}
