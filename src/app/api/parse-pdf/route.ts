import { NextRequest, NextResponse } from 'next/server';
import { extractText, getDocumentProxy } from 'unpdf';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const result = await Promise.race([
      (async () => {
        const pdf = await getDocumentProxy(uint8Array);
        const { text } = await extractText(pdf, { mergePages: true });
        return { text };
      })(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('PDF parsing timed out (30s)')), 30000)
      ),
    ]);

    if (!result.text || result.text.trim().length === 0) {
      return NextResponse.json({ error: 'No text found in PDF' }, { status: 400 });
    }

    return NextResponse.json({ text: result.text });
  } catch (error: any) {
    console.error('PDF parse error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to parse PDF. Try pasting the text directly.' },
      { status: 500 }
    );
  }
}
