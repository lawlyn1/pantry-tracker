'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AddIngredientForm from '@/components/AddIngredientForm';
import CSVUpload from '@/components/CSVUpload';
import IngredientList from '@/components/IngredientList';
import RecipeSuggestions from '@/components/RecipeSuggestions';
import FoodLog from '@/components/FoodLog';
import Auth from '@/components/Auth';
import ReceiptImport from '@/components/ReceiptImport';
import type { Ingredient, CSVIngredient } from '@/types';
import type { User } from '@supabase/supabase-js';

type TabType = 'inventory' | 'recipes' | 'foodlog' | 'receipt';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('inventory');
  const [error, setError] = useState<string>('');
  const [showMacros, setShowMacros] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('showMacros') !== 'false';
    }
    return true;
  });

  const toggleMacros = () => {
    setShowMacros(prev => {
      const next = !prev;
      localStorage.setItem('showMacros', String(next));
      return next;
    });
  };

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

  const handleCSVUpload = () => {
    fetchIngredients();
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
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMacros}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showMacros ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-500'
                }`}
                title="Toggle macro details"
              >
                {showMacros ? '📊 Macros On' : '📊 Macros Off'}
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </header>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-medium text-red-800">Error:</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {([
              { key: 'inventory', label: 'Inventory' },
              { key: 'receipt', label: '🧾 Import Receipt' },
              { key: 'foodlog', label: 'Food Log' },
              { key: 'recipes', label: 'Recipes' },
            ] as { key: TabType; label: string }[]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
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
                showMacros={showMacros}
              />
            </div>
          </div>
        ) : activeTab === 'receipt' ? (
          <ReceiptImport onImport={fetchIngredients} user={user} />
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
