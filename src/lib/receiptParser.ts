export interface ParsedReceiptItem {
  name: string;
  quantity: number;
  unit: string;
  price?: number;
  rawText: string;
}

const SKIP_KEYWORDS = [
  'total', 'subtotal', 'vat', 'change', 'cash', 'card', 'visa', 'mastercard',
  'thank', 'welcome', 'store', 'receipt', 'date', 'time', 'till', 'operator',
  'clubcard', 'loyalty', 'points', 'savings', 'discount', 'offer', 'deal',
  'member', 'price', 'each', 'item', 'qty', 'barcode', 'tel:', 'www.',
  'aldi', 'tesco', 'sainsbury', 'asda', 'morrisons', 'lidl', 'waitrose',
  'address', 'street', 'road', 'postcode', 'telephone', 'opening',
  '£', 'balance', 'approved', 'auth', 'ref:', 'transaction', 'terminal',
];

const NON_FOOD_KEYWORDS = [
  'bag', 'carrier', 'plastic', 'paper', 'magazine', 'lottery', 'ticket',
  'battery', 'batteries', 'cleaning', 'detergent', 'washing', 'bleach',
  'toilet', 'tissue', 'kitchen roll', 'bin bag', 'foil', 'cling',
];

export function parseReceiptText(rawText: string): ParsedReceiptItem[] {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const items: ParsedReceiptItem[] = [];

  for (const line of lines) {
    // Skip lines with keywords we don't care about
    const lower = line.toLowerCase();
    if (SKIP_KEYWORDS.some(kw => lower.includes(kw))) continue;
    if (NON_FOOD_KEYWORDS.some(kw => lower.includes(kw))) continue;

    // Skip lines that are purely numbers, prices, or very short
    if (/^[\d\s£€$.,\-*]+$/.test(line)) continue;
    if (line.length < 3) continue;

    // Try to extract a price at end of line (e.g. "Chicken Breast 3.49")
    const priceMatch = line.match(/(\d+\.\d{2})\s*[A-Z]?\s*$/);
    const price = priceMatch ? parseFloat(priceMatch[1]) : undefined;

    // Try to extract quantity at start (e.g. "2x Bananas" or "2 Bananas")
    const qtyMatch = line.match(/^(\d+)\s*[xX]?\s+(.+)/);
    let quantity = 1;
    let name = line;

    if (qtyMatch) {
      quantity = parseInt(qtyMatch[1]);
      name = qtyMatch[2];
    }

    // Remove price from name
    name = name.replace(/\s+\d+\.\d{2}\s*[A-Z]?\s*$/, '').trim();
    name = name.replace(/\s+\*\s*$/, '').trim();

    // Skip if name is too short or still looks like a number
    if (name.length < 3) continue;
    if (/^\d+$/.test(name)) continue;

    // Detect unit from name
    let unit = 'pcs';
    const unitMatch = name.match(/(\d+(?:\.\d+)?)\s*(g|kg|ml|l|cl)\b/i);
    if (unitMatch) {
      unit = unitMatch[2].toLowerCase();
    }

    items.push({
      name: capitalise(name),
      quantity,
      unit,
      price,
      rawText: line,
    });
  }

  return items;
}

function capitalise(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
