# Database Schema for Pantry Tracker

## Table: ingredients

```sql
CREATE TABLE ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  unit TEXT NOT NULL DEFAULT 'pcs',
  expiration_date DATE NOT NULL CHECK (expiration_date >= CURRENT_DATE),
  calories_per_100g NUMERIC CHECK (calories_per_100g >= 0),
  protein_per_100g NUMERIC CHECK (protein_per_100g >= 0),
  carbs_per_100g NUMERIC CHECK (carbs_per_100g >= 0),
  fat_per_100g NUMERIC CHECK (fat_per_100g >= 0),
  fibre_per_100g NUMERIC CHECK (fibre_per_100g >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

-- Create user-specific policies
CREATE POLICY "Users can view their own ingredients" ON ingredients
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ingredients" ON ingredients
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ingredients" ON ingredients
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ingredients" ON ingredients
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_ingredients_user_id ON ingredients(user_id); -- Critical for RLS
CREATE INDEX idx_ingredients_expiration_date ON ingredients(expiration_date);
CREATE INDEX idx_ingredients_name ON ingredients(name);
CREATE INDEX idx_ingredients_user_expiration ON ingredients(user_id, expiration_date); -- Composite for user's expiring items

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ingredients_updated_at
    BEFORE UPDATE ON ingredients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## Table: food_logs

```sql
CREATE TABLE food_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  quantity_consumed NUMERIC NOT NULL CHECK (quantity_consumed > 0),
  unit TEXT NOT NULL,
  log_date DATE NOT NULL CHECK (log_date <= CURRENT_DATE),
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;

-- Create user-specific policies
CREATE POLICY "Users can view their own food logs" ON food_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own food logs" ON food_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food logs" ON food_logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_food_logs_user_id ON food_logs(user_id); -- Critical for RLS
CREATE INDEX idx_food_logs_log_date ON food_logs(log_date);
CREATE INDEX idx_food_logs_ingredient_id ON food_logs(ingredient_id);
CREATE INDEX idx_food_logs_user_date ON food_logs(user_id, log_date); -- Composite for user's recent logs
CREATE INDEX idx_food_logs_user_ingredient ON food_logs(user_id, ingredient_id); -- Composite for user's ingredient consumption
```

## CSV Import Format (MacroFactor Export Simulation)

The CSV file should have the following columns:
- name: Ingredient name
- quantity: Amount (number)
- unit: Unit of measurement (e.g., g, ml, pcs, cups)
- expiration_date: Date in YYYY-MM-DD format
- calories_per_100g: Optional - Calories per 100g
- protein_per_100g: Optional - Protein in grams per 100g
- carbs_per_100g: Optional - Carbohydrates in grams per 100g
- fat_per_100g: Optional - Fat in grams per 100g
- fibre_per_100g: Optional - Fibre in grams per 100g

Example CSV:
```csv
name,quantity,unit,expiration_date,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,fibre_per_100g
Chicken Breast,500,g,2024-05-15,165,31,0,3.6,0
Brown Rice,1000,g,2024-12-01,362,7.8,76,2.9,3.5
Broccoli,300,g,2024-05-20,34,2.8,7,0.4,2.6
```

## Food Log CSV Format (MacroFactor Export)

The food log CSV file should have the following columns:
- name: Ingredient name
- quantity: Amount consumed
- unit: Unit of measurement
- date: Date of consumption in YYYY-MM-DD format
- meal_type: Optional - breakfast, lunch, dinner, snack

Example CSV:
```csv
name,quantity,unit,date,meal_type
Chicken Breast,150,g,2024-04-28,lunch
Brown Rice,200,g,2024-04-28,lunch
Greek Yogurt,200,g,2024-04-29,breakfast
```

**Note:** When importing food logs, the system will automatically subtract the consumed quantities from your pantry inventory.
