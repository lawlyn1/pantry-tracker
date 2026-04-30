import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Use pdf2json for Node.js-compatible PDF parsing
    const PDFParser = (await import('pdf2json')).default;
    
    const text = await new Promise<string>((resolve, reject) => {
      const pdfParser = new PDFParser();
      
      pdfParser.on('pdfParser_dataError', (errData: any) => {
        console.error('PDF parse error:', errData);
        reject(new Error(errData.parserError || 'Failed to parse PDF'));
      });
      
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        let fullText = '';
        
        if (pdfData.Pages) {
          for (const page of pdfData.Pages) {
            if (page.Texts) {
              for (const textItem of page.Texts) {
                if (textItem.R) {
                  for (const r of textItem.R) {
                    fullText += r.T + ' ';
                  }
                }
              }
            }
            fullText += '\n';
          }
        }
        
        if (!fullText || fullText.trim().length === 0) {
          reject(new Error('No text found in PDF'));
          return;
        }
        
        // Decode URL-encoded text
        fullText = decodeURIComponent(fullText);
        
        resolve(fullText);
      });
      
      pdfParser.parseBuffer(buffer);
    });
    
    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('PDF parse error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to parse PDF' },
      { status: 500 }
    );
  }
}
