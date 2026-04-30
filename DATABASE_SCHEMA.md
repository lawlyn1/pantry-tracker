# Database Schema for Pantry Tracker

## Table: ingredients

```sql
CREATE TABLE ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'pcs',
  expiration_date DATE NOT NULL,
  calories_per_100g NUMERIC,
  protein_per_100g NUMERIC,
  carbs_per_100g NUMERIC,
  fat_per_100g NUMERIC,
  fibre_per_100g NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed for production)
CREATE POLICY "Allow all operations on ingredients" ON ingredients
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index on expiration date for easy querying of expiring items
CREATE INDEX idx_ingredients_expiration_date ON ingredients(expiration_date);

-- Create index on name for search
CREATE INDEX idx_ingredients_name ON ingredients(name);
```

## Table: food_logs

```sql
CREATE TABLE food_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  quantity_consumed NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  log_date DATE NOT NULL,
  meal_type TEXT, -- breakfast, lunch, dinner, snack
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations on food logs
CREATE POLICY "Allow all operations on food_logs" ON food_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index on log date for querying recent logs
CREATE INDEX idx_food_logs_log_date ON food_logs(log_date);

-- Create index on ingredient_id for fast lookups
CREATE INDEX idx_food_logs_ingredient_id ON food_logs(ingredient_id);
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
