'use client';

import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { parseReceiptText, ParsedReceiptItem } from '@/lib/receiptParser';
import { estimateExpiryDate, estimateShelfLife } from '@/lib/shelfLife';
import type { User } from '@supabase/supabase-js';
import { UNIT_OPTIONS } from '@/types';

interface ReviewItem extends ParsedReceiptItem {
  expiration_date: string;
  include: boolean;
}

type InputMode = 'photo' | 'pdf' | 'text';

export default function ReceiptImport({ onImport, user }: { onImport: () => void; user: User | null }) {
  const [mode, setMode] = useState<InputMode>('photo');
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ocrProgress, setOcrProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processText = useCallback((text: string) => {
    const parsed = parseReceiptText(text);
    const review: ReviewItem[] = parsed.map(item => ({
      ...item,
      expiration_date: estimateExpiryDate(item.name),
      include: true,
    }));
    setReviewItems(review);
    setStep('review');
  }, []);

  const handlePhotoUpload = async (file: File) => {
    setLoading(true);
    setError('');
    setOcrProgress(0);
    try {
      const Tesseract = (await import('tesseract.js')).default;
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });
      processText(result.data.text);
    } catch (err: any) {
      setError('Failed to read image. Please try a clearer photo.');
    } finally {
      setLoading(false);
      setOcrProgress(0);
    }
  };

  const handlePdfUpload = async (file: File) => {
    setLoading(true);
    setError('');
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map((item: any) => item.str).join('\n');
      }
      processText(fullText);
    } catch (err: any) {
      setError('Failed to read PDF. Please try a different file.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (mode === 'photo') handlePhotoUpload(file);
    else if (mode === 'pdf') handlePdfUpload(file);
  };

  const handleTextSubmit = () => {
    if (!rawText.trim()) {
      setError('Please paste your receipt text');
      return;
    }
    processText(rawText);
  };

  const handleSave = async () => {
    const toSave = reviewItems.filter(i => i.include);
    if (toSave.length === 0) {
      setError('Please select at least one item to add');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const rows = toSave.map(item => ({
        user_id: user?.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        expiration_date: item.expiration_date,
      }));
      const { error } = await supabase.from('ingredients').insert(rows);
      if (error) throw error;
      setSuccess(`Added ${toSave.length} items to your pantry!`);
      setStep('input');
      setReviewItems([]);
      setRawText('');
      onImport();
    } catch (err: any) {
      setError(err.message || 'Failed to save items');
    } finally {
      setSaving(false);
    }
  };

  const updateItem = (index: number, field: keyof ReviewItem, value: any) => {
    setReviewItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  if (step === 'review') {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Review Receipt Items</h2>
          <button onClick={() => setStep('input')} className="text-sm text-gray-500 hover:text-gray-700">
            ← Back
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">{success}</div>
        )}

        {reviewItems.length === 0 ? (
          <p className="text-gray-500 text-sm">No food items were detected. Try a clearer photo or paste the text manually.</p>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {reviewItems.filter(i => i.include).length} of {reviewItems.length} items selected. Edit names, quantities, and expiry dates before adding.
            </p>

            <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
              {reviewItems.map((item, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${item.include ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={item.include}
                      onChange={e => updateItem(index, 'include', e.target.checked)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => updateItem(index, 'name', e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 ml-6">
                    <div>
                      <label className="text-xs text-gray-500">Qty</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={e => updateItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Unit</label>
                      <select
                        value={item.unit}
                        onChange={e => updateItem(index, 'unit', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      >
                        {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 flex items-center gap-1">
                        Expiry
                        <span className="text-blue-500" title={`Estimated: ${estimateShelfLife(item.name).label}`}>~</span>
                      </label>
                      <input
                        type="date"
                        value={item.expiration_date}
                        onChange={e => updateItem(index, 'expiration_date', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setReviewItems(prev => prev.map(i => ({ ...i, include: true })))}
                className="text-sm text-blue-600 hover:underline"
              >
                Select all
              </button>
              <button
                onClick={() => setReviewItems(prev => prev.map(i => ({ ...i, include: false })))}
                className="text-sm text-gray-500 hover:underline"
              >
                Deselect all
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Adding...' : `Add ${reviewItems.filter(i => i.include).length} Items to Pantry`}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Import Receipt</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">{success}</div>
      )}

      <div className="flex gap-2 mb-6">
        {(['photo', 'pdf', 'text'] as InputMode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === m ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {m === 'photo' ? '📷 Photo' : m === 'pdf' ? '📄 PDF' : '📝 Paste Text'}
          </button>
        ))}
      </div>

      {(mode === 'photo' || mode === 'pdf') && (
        <div>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            {loading ? (
              <div>
                <div className="text-gray-600 mb-2">
                  {mode === 'photo' ? `Reading receipt... ${ocrProgress}%` : 'Extracting text from PDF...'}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${mode === 'photo' ? ocrProgress : 60}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <p className="text-4xl mb-2">{mode === 'photo' ? '📷' : '📄'}</p>
                <p className="text-gray-600 font-medium">
                  {mode === 'photo' ? 'Upload receipt photo' : 'Upload receipt PDF'}
                </p>
                <p className="text-gray-400 text-sm mt-1">Click to browse or drag & drop</p>
                {mode === 'photo' && (
                  <p className="text-xs text-gray-400 mt-2">Works best with clear, well-lit photos. Supports Aldi, Tesco, Sainsbury's, etc.</p>
                )}
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={mode === 'photo' ? 'image/*' : 'application/pdf'}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {mode === 'text' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Paste your receipt text below
          </label>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            placeholder={`Paste receipt text here e.g.\n\nChicken Breast 500g    3.49\nWhole Milk 2L         1.29\nCheddar Cheese        2.50\nBananas 6pk           0.89`}
            className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-mono resize-none"
          />
          <button
            onClick={handleTextSubmit}
            className="mt-3 w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Parse Receipt
          </button>
        </div>
      )}
    </div>
  );
}
