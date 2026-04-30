export interface ShelfLife {
  days: number;
  unit: 'days' | 'weeks' | 'months' | 'years';
  label: string;
}

const SHELF_LIFE_MAP: Record<string, ShelfLife> = {
  // Meat & Fish
  chicken: { days: 3, unit: 'days', label: 'Fresh chicken' },
  beef: { days: 4, unit: 'days', label: 'Fresh beef' },
  pork: { days: 4, unit: 'days', label: 'Fresh pork' },
  lamb: { days: 4, unit: 'days', label: 'Fresh lamb' },
  mince: { days: 2, unit: 'days', label: 'Mince' },
  salmon: { days: 2, unit: 'days', label: 'Fresh salmon' },
  fish: { days: 2, unit: 'days', label: 'Fresh fish' },
  prawns: { days: 2, unit: 'days', label: 'Fresh prawns' },
  bacon: { days: 7, unit: 'days', label: 'Bacon' },
  sausage: { days: 3, unit: 'days', label: 'Fresh sausages' },
  ham: { days: 5, unit: 'days', label: 'Cooked ham' },
  turkey: { days: 3, unit: 'days', label: 'Fresh turkey' },

  // Dairy
  milk: { days: 7, unit: 'days', label: 'Milk' },
  cream: { days: 7, unit: 'days', label: 'Cream' },
  butter: { days: 30, unit: 'days', label: 'Butter' },
  cheese: { days: 14, unit: 'days', label: 'Hard cheese' },
  yogurt: { days: 14, unit: 'days', label: 'Yogurt' },
  eggs: { days: 28, unit: 'days', label: 'Eggs' },

  // Fruit & Veg
  apple: { days: 14, unit: 'days', label: 'Apples' },
  banana: { days: 5, unit: 'days', label: 'Bananas' },
  strawberr: { days: 4, unit: 'days', label: 'Strawberries' },
  berr: { days: 4, unit: 'days', label: 'Berries' },
  tomato: { days: 7, unit: 'days', label: 'Tomatoes' },
  lettuce: { days: 7, unit: 'days', label: 'Lettuce' },
  salad: { days: 5, unit: 'days', label: 'Salad leaves' },
  carrot: { days: 21, unit: 'days', label: 'Carrots' },
  potato: { days: 30, unit: 'days', label: 'Potatoes' },
  onion: { days: 30, unit: 'days', label: 'Onions' },
  garlic: { days: 30, unit: 'days', label: 'Garlic' },
  broccoli: { days: 5, unit: 'days', label: 'Broccoli' },
  spinach: { days: 5, unit: 'days', label: 'Spinach' },
  pepper: { days: 10, unit: 'days', label: 'Bell peppers' },
  cucumber: { days: 7, unit: 'days', label: 'Cucumber' },
  avocado: { days: 5, unit: 'days', label: 'Avocado' },
  lemon: { days: 21, unit: 'days', label: 'Lemons' },
  orange: { days: 21, unit: 'days', label: 'Oranges' },
  grape: { days: 7, unit: 'days', label: 'Grapes' },
  mushroom: { days: 7, unit: 'days', label: 'Mushrooms' },
  courgette: { days: 7, unit: 'days', label: 'Courgette' },
  celery: { days: 14, unit: 'days', label: 'Celery' },

  // Bread & Bakery
  bread: { days: 5, unit: 'days', label: 'Bread' },
  loaf: { days: 5, unit: 'days', label: 'Bread loaf' },
  roll: { days: 3, unit: 'days', label: 'Bread rolls' },
  bagel: { days: 5, unit: 'days', label: 'Bagels' },
  wrap: { days: 7, unit: 'days', label: 'Wraps' },
  tortilla: { days: 7, unit: 'days', label: 'Tortillas' },
  pitta: { days: 5, unit: 'days', label: 'Pitta bread' },
  croissant: { days: 2, unit: 'days', label: 'Croissants' },

  // Pantry / Dry Goods
  pasta: { days: 730, unit: 'years', label: 'Dried pasta' },
  rice: { days: 730, unit: 'years', label: 'Rice' },
  flour: { days: 365, unit: 'years', label: 'Flour' },
  sugar: { days: 730, unit: 'years', label: 'Sugar' },
  oat: { days: 365, unit: 'years', label: 'Oats' },
  cereal: { days: 180, unit: 'months', label: 'Cereal' },
  noodle: { days: 730, unit: 'years', label: 'Noodles' },
  lentil: { days: 730, unit: 'years', label: 'Lentils' },
  bean: { days: 730, unit: 'years', label: 'Dried beans' },
  chickpea: { days: 730, unit: 'years', label: 'Chickpeas' },

  // Canned / Tinned
  tin: { days: 730, unit: 'years', label: 'Tinned goods' },
  can: { days: 730, unit: 'years', label: 'Canned goods' },
  tuna: { days: 730, unit: 'years', label: 'Tinned tuna' },
  soup: { days: 730, unit: 'years', label: 'Tinned soup' },
  tomatoes: { days: 730, unit: 'years', label: 'Tinned tomatoes' },

  // Sauces & Condiments
  sauce: { days: 180, unit: 'months', label: 'Sauce' },
  ketchup: { days: 180, unit: 'months', label: 'Ketchup' },
  mayo: { days: 60, unit: 'months', label: 'Mayonnaise' },
  mustard: { days: 180, unit: 'months', label: 'Mustard' },
  oil: { days: 365, unit: 'years', label: 'Oil' },
  vinegar: { days: 730, unit: 'years', label: 'Vinegar' },
  soy: { days: 365, unit: 'years', label: 'Soy sauce' },

  // Frozen (if mentioned)
  frozen: { days: 90, unit: 'months', label: 'Frozen goods' },
};

const DEFAULT_SHELF_LIFE: ShelfLife = { days: 7, unit: 'days', label: 'Unknown item' };

export function estimateShelfLife(itemName: string): ShelfLife {
  const lower = itemName.toLowerCase();
  for (const [keyword, shelfLife] of Object.entries(SHELF_LIFE_MAP)) {
    if (lower.includes(keyword)) {
      return shelfLife;
    }
  }
  return DEFAULT_SHELF_LIFE;
}

export function estimateExpiryDate(itemName: string, purchaseDate = new Date()): string {
  const { days } = estimateShelfLife(itemName);
  const expiry = new Date(purchaseDate);
  expiry.setDate(expiry.getDate() + days);
  return expiry.toISOString().split('T')[0];
}
