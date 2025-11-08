// app/api/estimate/route.ts
import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

export const runtime = 'nodejs';

const DATA_DIR = path.join(process.cwd(), 'data');
const ESTIMATES_DIR = path.join(DATA_DIR, 'estimates');

function isAuthed(req: Request) {
  const header = req.headers.get('authorization') || '';
  if (!header.startsWith('Basic ')) return false;
  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const [login = '', pass = ''] = decoded.split(':');

  const ENV_LOGIN = (process.env.ADMIN_LOGIN ?? 'admin').trim();
  const ENV_PASSWORD = (process.env.ADMIN_PASSWORD ?? 'admin123').trim();

  return login.trim() === ENV_LOGIN && pass.trim() === ENV_PASSWORD;
}

async function ensureDir() {
  await fs.mkdir(ESTIMATES_DIR, { recursive: true });
}

export async function GET(req: Request) {
  if (!isAuthed(req)) return new NextResponse('Unauthorized', { status: 401 });

  const url = new URL(req.url);
  const file = url.searchParams.get('file');
  if (!file) return new NextResponse('Bad Request', { status: 400 });

  const full = path.join(ESTIMATES_DIR, path.basename(file));
  try {
    const buf = await fs.readFile(full); // Buffer
    const body = new Uint8Array(buf);    // BodyInit понимает Uint8Array
    return new NextResponse(body, {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename="${file}"`,
        'cache-control': 'no-store',
      },
    });
  } catch {
    return new NextResponse('Not Found', { status: 404 });
  }
}

export async function POST(req: Request) {
  if (!isAuthed(req)) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const body = await req.json();

    await ensureDir();

    // Шрифты с кириллицей
    const regularPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf');
    const boldPath    = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Bold.ttf');

    const regularBytes = await fs.readFile(regularPath).catch(() => null);
    const boldBytes    = await fs.readFile(boldPath).catch(() => null);

    if (!regularBytes || !boldBytes) {
      return new NextResponse(
        'Шрифты не найдены. Положите public/fonts/Roboto-Regular.ttf и Roboto-Bold.ttf',
        { status: 500 }
      );
    }

    const pdf = await PDFDocument.create();
    pdf.registerFontkit(fontkit);

    const fontRegular = await pdf.embedFont(new Uint8Array(regularBytes));
    const fontBold    = await pdf.embedFont(new Uint8Array(boldBytes));

    const page = pdf.addPage([595.28, 841.89]); // A4 (pt)
    const { width, height } = page.getSize();

    const margin = 40;
    let y = height - margin;

    const drawText = (text: string, size = 12, bold = false, color = rgb(0,0,0)) => {
      const font = bold ? fontBold : fontRegular;
      page.drawText(text, { x: margin, y, size, font, color });
      y -= size + 4;
    };

    // Заголовок
    drawText('Смета на плиточные работы', 18, true);

    // Метаданные
    drawText(`Дата: ${new Date().toLocaleString('ru-RU')}`, 11);
    drawText(`Объект: ${body?.meta?.object || '-'}`, 11);
    drawText(`Материал/размер: ${body?.meta?.material || '-'}, ${body?.meta?.tileSize || '-'}`, 11);
    drawText(`Площадь: ${body?.meta?.area || 0} м²`, 11);
    drawText(`Сложность: ${body?.meta?.complexity || '-'}`, 11);
    y -= 6;

    // Раздел "Расчёт"
    drawText('Расчёт:', 13, true);
    const items: Array<{ label: string; sumStr: string }> = body?.items || [];
    items.forEach((it) => {
      drawText(`${it.label}: ${it.sumStr}`, 11);
    });

    y -= 6;
    if (body?.totals?.discountStr) {
      drawText(`Скидка: ${body.totals.discountStr}`, 11);
    }

    y -= 6;
    drawText(`ИТОГО: ${body?.totals?.finalStr || '-'}`, 14, true);
    if (body?.totals?.minNote) {
      drawText(String(body.totals.minNote), 10);
    }

    if (body?.meta?.contacts) {
      y -= 10;
      drawText(`Контакты: ${body.meta.contacts}`, 11);
    }

    const pdfBytes = await pdf.save(); // Uint8Array

    const filename = `smeta_${Date.now()}.pdf`;
    const full = path.join(ESTIMATES_DIR, filename);
    await fs.writeFile(full, pdfBytes);

    return NextResponse.json({
      ok: true,
      file: filename,
      downloadUrl: `/api/estimate?file=${encodeURIComponent(filename)}`
    });

  } catch (e) {
    console.error(e);
    return new NextResponse('Bad Request', { status: 400 });
  }
}
