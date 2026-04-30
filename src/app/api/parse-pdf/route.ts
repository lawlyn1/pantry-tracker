import { NextRequest, NextResponse } from 'next/server';

// Polyfill DOMMatrix for Node.js
if (typeof global.DOMMatrix === 'undefined') {
  (global as any).DOMMatrix = class DOMMatrix {
    constructor() {}
    multiply() { return this; }
    translate() { return this; }
    scale() { return this; }
    rotate() { return this; }
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Limit file size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    
    // Use pdfjs-dist on server-side without worker
    const pdfjsLib = await import('pdfjs-dist');
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useWorkerFetch: false,
    }).promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    if (!fullText || fullText.trim().length === 0) {
      return NextResponse.json({ error: 'No text found in PDF' }, { status: 400 });
    }
    
    return NextResponse.json({ text: fullText });
  } catch (error: any) {
    console.error('PDF parse error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to parse PDF' },
      { status: 500 }
    );
  }
}
