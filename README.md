# Pantry Tracker

A modern pantry inventory tracker web application built with Next.js, Tailwind CSS, Supabase, and Spoonacular API.

## Features

- **Ingredient Management**: Add ingredients with expiration dates, quantities, and units
- **Expiration Tracking**: Visual indicators for expired, expiring soon, and fresh ingredients
- **CSV Import**: Import ingredients from CSV files (simulating MacroFactor export format)
- **Recipe Suggestions**: Get recipe suggestions based on your pantry inventory
- **Macro-Based Recipes**: Find recipes that match your target macro goals (calories, protein, carbs, fat)
- **Nutrition Tracking**: Store and display nutritional information per 100g for each ingredient

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **CSV Parsing**: PapaParse
- **Recipe API**: Spoonacular API

## Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- A Spoonacular API key (free tier available at https://spoonacular.com/food-api)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to your project settings → API
3. Copy your project URL and anon key
4. Run the SQL schema from `DATABASE_SCHEMA.md` in your Supabase SQL editor

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SPOONACULAR_API_KEY=your_spoonacular_api_key
```

You can copy the example file:

```bash
cp .env.example .env.local
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses a single `ingredients` table with the following structure:

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

See `DATABASE_SCHEMA.md` for the complete schema including indexes and RLS policies.

## CSV Import Format

The CSV import feature supports the following columns:

- `name` (required): Ingredient name
- `quantity` (required): Amount
- `unit` (required): Unit of measurement (g, ml, pcs, cups, etc.)
- `expiration_date` (required): Date in YYYY-MM-DD format
- `calories_per_100g` (optional): Calories per 100g
- `protein_per_100g` (optional): Protein in grams per 100g
- `carbs_per_100g` (optional): Carbohydrates in grams per 100g
- `fat_per_100g` (optional): Fat in grams per 100g

Example CSV:
```csv
name,quantity,unit,expiration_date,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g
Chicken Breast,500,g,2024-05-15,165,31,0,3.6
Brown Rice,1000,g,2024-12-01,362,7.8,76,2.9
Broccoli,300,g,2024-05-20,34,2.8,7,0.4
```

## Usage

### Adding Ingredients

1. Fill out the form with ingredient details
2. Include optional nutritional information for better recipe matching
3. Click "Add Ingredient"

### Importing from CSV

1. Click the upload area in the CSV Import section
2. Select your CSV file
3. The system will parse and import valid ingredients

### Finding Recipes

1. Click the "Recipe Suggestions" tab
2. Click "Find Recipes by Ingredients" to get recipes based on your pantry
3. Or set macro targets and click "Find Recipes by Macros" for personalized suggestions
4. Click on any recipe to view detailed nutritional information

## Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── globals.css       # Global styles with Tailwind
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/
│   ├── AddIngredientForm.tsx    # Form to add ingredients
│   ├── CSVUpload.tsx             # CSV file upload component
│   ├── IngredientList.tsx       # Display inventory list
│   └── RecipeSuggestions.tsx    # Recipe search and display
└── lib/
    ├── supabase.ts        # Supabase client configuration
    └── spoonacular.ts     # Spoonacular API integration
```

## License

MIT
