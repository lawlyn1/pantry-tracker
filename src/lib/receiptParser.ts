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
  'basket', 'offers', 'paid', 'order', 'delivery', 'track', 'update',
  'payment', 'card ending', 'expiry', 'substitutions', 'unavailable',
  'shorter life', 'use by', 'best before', 'fridge', 'freezer', 'cupboard',
  'was', 'now', 'minimum', 'charge', 'refund', 'difference', 'removed',
  'this is not a vat receipt', 'keep this receipt', 'electrical products',
  'non prescription medicines', 'groceries homepage', 'help centre',
  'contact us', 'pricing policy', 'company number', 'registered',
  'vat registration', 'neither tesco stores', 'read our privacy',
  'cookies policy', 'report suspicious', 'sent from my iphone',
  'begin forwarded message', 'from:', 'to:', 'subject:', 'date:',
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

    // Tesco format: Qty at start, then product, then prices
    // e.g., "4 Tesco Finest 6 Cumberland Pork Sausages 400g £3.00 £9.81"
    const qtyMatch = line.match(/^(\d+)\s+(.+)/);
    let quantity = 1;
    let name = line;

    if (qtyMatch) {
      quantity = parseInt(qtyMatch[1]);
      name = qtyMatch[2];
    }

    // Try to extract prices at end (Tesco has Unit Price and Total)
    const priceMatch = line.match(/(\d+\.\d{2})\s*$/);
    const price = priceMatch ? parseFloat(priceMatch[1]) : undefined;

    // Remove all prices from name (Tesco has two prices at end)
    name = name.replace(/\s+\d+\.\d{2}\s*$/g, '').trim();
    name = name.replace(/\s+£\s*/g, ' ').trim();
    name = name.replace(/\s*\*\s*$/, '').trim();

    // Skip if name is too short or still looks like a number
    if (name.length < 3) continue;
    if (/^\d+$/.test(name)) continue;

    // Detect unit from name (Tesco includes weight in product name)
    let unit = 'pcs';
    const unitMatch = name.match(/(\d+(?:\.\d+)?)\s*(g|kg|ml|l|cl|ltr|each|pack)\b/i);
    if (unitMatch) {
      unit = unitMatch[2].toLowerCase();
      if (unit === 'ltr') unit = 'l';
      if (unit === 'each') unit = 'pcs';
      if (unit === 'pack') unit = 'pcs';
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
