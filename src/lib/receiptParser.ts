export interface ParsedReceiptItem {
  id: string;
  name: string;
  qty: number;
  category: string;
  unitPrice?: number;
  totalPrice?: number;
  rawText: string;
}

const EXCLUDE_PATTERNS = [
  /iCloud Mail/i,
  /Was\s*£/i,
  /Clubcard Price/i,
  /Substituted with/i,
  /https:\/\/www\.icloud\.com\/mail/i,
  /\d{2}\/\d{2}\/\d{4},?\s*\d{1,2}:\d{2}/,
  /Page \d+\/\d+/i,
  /Payment summary/i,
  /Basket value/i,
  /Total basket/i,
  /Min basket charge/i,
  /Refund/i,
  /Any \d+ for £/i,
];

const NON_FOOD_KEYWORDS = [
  'bag', 'carrier', 'plastic', 'paper', 'magazine', 'lottery', 'ticket',
  'battery', 'batteries', 'cleaning', 'detergent', 'washing', 'bleach',
  'toilet', 'tissue', 'kitchen roll', 'bin bag', 'foil', 'cling',
  'dishcloth', 'port', 'wine', 'madeira', 'chardonnay', 'merlot',
];

const CATEGORY_MAP: Record<string, string> = {
  'sausage': 'Meat', 'bacon': 'Meat', 'pork': 'Meat', 'beef': 'Meat',
  'chicken': 'Meat', 'salmon': 'Fish', 'prawns': 'Fish', 'fish': 'Fish',
  'milk': 'Dairy', 'cream': 'Dairy', 'cheese': 'Dairy', 'yogurt': 'Dairy', 'yoghurt': 'Dairy', 'eggs': 'Dairy',
  'butter': 'Dairy',
  'spinach': 'Vegetables', 'broccoli': 'Vegetables', 'asparagus': 'Vegetables', 'leeks': 'Vegetables',
  'peas': 'Vegetables', 'mushrooms': 'Vegetables', 'cauliflower': 'Vegetables',
  'onions': 'Vegetables', 'garlic': 'Vegetables', 'parsnips': 'Vegetables', 'squash': 'Vegetables',
  'carrots': 'Vegetables', 'tomatoes': 'Vegetables', 'potatoes': 'Vegetables',
  'strawberries': 'Fruit', 'raspberries': 'Fruit', 'blueberries': 'Fruit', 'blackberries': 'Fruit',
  'grapes': 'Fruit', 'lemons': 'Fruit', 'mango': 'Fruit',
  'bread': 'Bakery', 'loaf': 'Bakery', 'rolls': 'Bakery', 'buns': 'Bakery',
  'puff pastry': 'Bakery', 'shortcrust': 'Bakery', 'meringue': 'Bakery',
  'ice cream': 'Frozen', 'frozen': 'Frozen',
  'beans': 'Cupboard', 'tuna': 'Cupboard', 'soup': 'Cupboard',
  'water': 'Drinks', 'juice': 'Drinks',
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Pre-compiled keyword regex - O(1) match instead of O(K) iteration per call.
const CATEGORY_REGEX = new RegExp(`(${Object.keys(CATEGORY_MAP).join('|')})`, 'i');
const categoryCache = new Map<string, string>();

function detectCategory(name: string): string {
  const lower = name.toLowerCase();
  const cached = categoryCache.get(lower);
  if (cached) return cached;
  const match = lower.match(CATEGORY_REGEX);
  const result = match ? CATEGORY_MAP[match[1].toLowerCase()] ?? 'Other' : 'Other';
  categoryCache.set(lower, result);
  return result;
}

function normalisePrice(priceStr: string): number {
  // Handle OCR issues: "£2 00" -> "£2.00"
  const cleaned = priceStr.replace(/[£\s]/g, '').replace(/(\d+)\s+(\d{2})/, '$1.$2');
  return parseFloat(cleaned);
}

function shouldExclude(text: string): boolean {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(text));
}

export function parseReceiptText(rawText: string): ParsedReceiptItem[] {
  // Pre-process: normalise OCR artifacts
  let text = rawText
    .replace(/[†‡]/g, '')
    .replace(/(\d+)\s+(\d{2})(?=\s*£|\s*\d)/g, '$1.$2') // Fix "2 00" -> "2.00"
    .replace(/\s+/g, ' ')
    .trim();

  const items: ParsedReceiptItem[] = [];
  const seen = new Set<string>();

  // Primary pattern: Qty Name £UnitPrice £TotalPrice
  // Handles: "4 Tesco Finest 6 Cumberland Pork Sausages 400g £3.00 £9.81"
  const itemRegex = /(\d{1,3})\s+((?:[A-Z][a-z]*(?:\s+\d*[A-Za-z]+)*\s*){2,20}?)£?([\d\s\.]+)\s*£([\d\s\.]+)/gi;

  let match;
  while ((match = itemRegex.exec(text)) !== null) {
    const rawMatch = match[0];
    
    // Skip excluded patterns
    if (shouldExclude(rawMatch)) continue;

    const qty = parseInt(match[1], 10);
    let name = match[2].trim();
    const unitPriceStr = match[3];
    const totalPriceStr = match[4];

    // Clean up name
    name = name
      .replace(/\s+/g, ' ')
      .replace(/^(Fridge|Freezer|Cupboard|Grocery)\s+/i, '')
      .trim();

    // Skip if name looks like metadata
    if (name.length < 3 || /^\d+$/.test(name)) continue;
    if (NON_FOOD_KEYWORDS.some(kw => name.toLowerCase().includes(kw))) continue;

    const unitPrice = normalisePrice(unitPriceStr);
    const totalPrice = normalisePrice(totalPriceStr);

    // Dedupe by name + qty
    const key = `${name.toLowerCase()}|${qty}`;
    if (seen.has(key)) continue;
    seen.add(key);

    items.push({
      id: generateId(),
      name: name.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()),
      qty,
      category: detectCategory(name),
      unitPrice,
      totalPrice,
      rawText: rawMatch.trim(),
    });
  }

  return items;
}
