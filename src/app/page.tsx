'use client';

import { useState } from 'react';
import { usePantry } from '@/context/PantryContext';
import AddIngredientForm from '@/components/AddIngredientForm';
import CSVUpload from '@/components/CSVUpload';
import IngredientList from '@/components/IngredientList';
import RecipeSuggestions from '@/components/RecipeSuggestions';
import FoodLogPanel from '@/components/FoodLogPanel';
import Auth from '@/components/Auth';
import ReceiptImport from '@/components/ReceiptImport';
import type { TabType } from '@/types';

const TABS: ReadonlyArray<{ key: TabType; label: string }> = [
  { key: 'inventory', label: 'Inventory' },
  { key: 'receipt',   label: '🧾 Import Receipt' },
  { key: 'foodlog',   label: 'Food Log' },
  { key: 'recipes',   label: 'Recipes' },
];

export default function Home() {
  const { user, error, showMacros, toggleMacros, signOut } = usePantry();
  const [tab, setTab] = useState<TabType>('inventory');

  if (!user) return <Auth />;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
              onClick={signOut}
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

        <nav className="mb-6 flex flex-wrap gap-2">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                tab === t.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === 'inventory' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <AddIngredientForm />
              <CSVUpload />
            </div>
            <IngredientList />
          </div>
        )}
        {tab === 'receipt' && <ReceiptImport />}
        {tab === 'foodlog' && <FoodLogPanel />}
        {tab === 'recipes' && <RecipeSuggestions />}
      </div>
    </main>
  );
}
