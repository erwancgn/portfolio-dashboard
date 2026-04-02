import { createHash } from 'crypto'
import { parseTradeRepublicText } from '@/lib/trade-republic'

export async function parseTradeRepublicPdf(buffer: Buffer) {
  const pdfParseModule = eval('require')('pdf-parse') as {
    PDFParse: new (options: { data: Buffer }) => {
      getText: () => Promise<{ text: string }>
      destroy: () => Promise<void>
    }
  }

  const parser = new pdfParseModule.PDFParse({ data: buffer })
  const fileHash = createHash('sha256').update(buffer).digest('hex')

  try {
    const pdfData = await parser.getText()
    return parseTradeRepublicText(pdfData.text, fileHash)
  } finally {
    await parser.destroy()
  }
}
