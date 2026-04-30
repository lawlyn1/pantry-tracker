'use client';

import {
  createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import {
  fetchAllIngredients, deleteIngredient as svcDelete, updateIngredientQuantity,
} from '@/services/ingredients';
import type { Ingredient } from '@/types';

interface PantryState {
  user: User | null;
  ingredients: Ingredient[];
  loading: boolean;
  error: string | null;
  showMacros: boolean;
}

type Action =
  | { type: 'SET_USER'; user: User | null }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_INGREDIENTS'; ingredients: Ingredient[] }
  | { type: 'REMOVE_INGREDIENT'; id: string }
  | { type: 'PATCH_INGREDIENT'; id: string; patch: Partial<Ingredient> }
  | { type: 'TOGGLE_MACROS' };

const initial: PantryState = {
  user: null, ingredients: [], loading: true, error: null,
  showMacros: typeof window !== 'undefined' ? localStorage.getItem('showMacros') !== 'false' : true,
};

function reducer(state: PantryState, a: Action): PantryState {
  switch (a.type) {
    case 'SET_USER':         return { ...state, user: a.user };
    case 'SET_LOADING':      return { ...state, loading: a.loading };
    case 'SET_ERROR':        return { ...state, error: a.error };
    case 'SET_INGREDIENTS':  return { ...state, ingredients: a.ingredients, loading: false, error: null };
    case 'REMOVE_INGREDIENT':return { ...state, ingredients: state.ingredients.filter(i => i.id !== a.id) };
    case 'PATCH_INGREDIENT':
      return { ...state, ingredients: state.ingredients.map(i => i.id === a.id ? { ...i, ...a.patch } : i) };
    case 'TOGGLE_MACROS': {
      const next = !state.showMacros;
      if (typeof window !== 'undefined') localStorage.setItem('showMacros', String(next));
      return { ...state, showMacros: next };
    }
  }
}

interface PantryContextValue extends PantryState {
  refresh: () => Promise<void>;
  removeIngredient: (id: string) => Promise<void>;
  consumeIngredient: (id: string, quantity: number) => Promise<void>;
  toggleMacros: () => void;
  signOut: () => Promise<void>;
}

const Ctx = createContext<PantryContextValue | null>(null);

export function PantryProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchAllIngredients();
      if (mounted.current) dispatch({ type: 'SET_INGREDIENTS', ingredients: data });
    } catch (e: any) {
      if (mounted.current) dispatch({ type: 'SET_ERROR', error: e?.message ?? 'Failed to load' });
    }
  }, []);

  // Auth bootstrap + listener (cancellable to prevent leaks on unmount)
  useEffect(() => {
    mounted.current = true;
    let active = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      dispatch({ type: 'SET_USER', user: session?.user ?? null });
      if (session?.user) refresh();
      else dispatch({ type: 'SET_LOADING', loading: false });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!active) return;
      dispatch({ type: 'SET_USER', user: session?.user ?? null });
      if (session?.user) refresh();
      else dispatch({ type: 'SET_INGREDIENTS', ingredients: [] });
    });

    return () => {
      active = false;
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, [refresh]);

  const removeIngredient = useCallback(async (id: string) => {
    const snapshot = state.ingredients;
    dispatch({ type: 'REMOVE_INGREDIENT', id }); // optimistic
    try {
      await svcDelete(id);
    } catch (e) {
      dispatch({ type: 'SET_INGREDIENTS', ingredients: snapshot }); // rollback
      throw e;
    }
  }, [state.ingredients]);

  const consumeIngredient = useCallback(async (id: string, quantity: number) => {
    const ing = state.ingredients.find(i => i.id === id);
    if (!ing) return;
    const next = Math.max(0, ing.quantity - quantity);
    dispatch({ type: 'PATCH_INGREDIENT', id, patch: { quantity: next } });
    try {
      await updateIngredientQuantity(id, next);
    } catch (e) {
      dispatch({ type: 'PATCH_INGREDIENT', id, patch: { quantity: ing.quantity } });
      throw e;
    }
  }, [state.ingredients]);

  const toggleMacros = useCallback(() => dispatch({ type: 'TOGGLE_MACROS' }), []);
  const signOut = useCallback(async () => { await supabase.auth.signOut(); }, []);

  const value = useMemo<PantryContextValue>(
    () => ({ ...state, refresh, removeIngredient, consumeIngredient, toggleMacros, signOut }),
    [state, refresh, removeIngredient, consumeIngredient, toggleMacros, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePantry(): PantryContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePantry must be used inside <PantryProvider>');
  return ctx;
}
