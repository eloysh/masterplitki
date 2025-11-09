// app/api/estimate/route.ts
import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthed(req: Request) {
  const header = req.headers.get('authorization') || '';
  if (!header.startsWith('Basic ')) return false;
  const [login = '', pass = ''] = Buffer.from(header.slice(6), 'base64').toString('utf8').split(':');
  const ENV_LOGIN = (process.env.ADMIN_LOGIN ?? 'admin').trim();
  const ENV_PASSWORD = (process.env.ADMIN_PASSWORD ?? 'admin123').trim();
  return login.trim() === ENV_LOGIN && pass.trim() === ENV_PASSWORD;
}

export async function POST(req: Request) {
  if (!isAuthed(req)) return new NextResponse('Unauthorized', { status: 401 });

  const body = await req.json();

  // шрифты с кириллицей из public/fonts
  const regularPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf');
  const boldPath    = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Bold.ttf');
  const regularBytes = await fs.readFile(regularPath).catch(() => null);
  const boldBytes    = await fs.readFile(boldPath).catch(() => null);
  if (!regularBytes || !boldBytes) {
    return new NextResponse('Шрифты не найдены в public/fonts', { status: 500 });
  }

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const fontRegular = await pdf.embedFont(new Uint8Array(regularBytes));
  const fontBold    = await pdf.embedFont(new Uint8Array(boldBytes));

  const page = pdf.addPage([595.28, 841.89]); // A4
  const { height } = page.getSize();
  const margin = 40;
  let y = height - margin;
  const draw = (text: string, size = 12, bold = false) => {
    page.drawText(text, { x: margin, y, size, font: bold ? fontBold : fontRegular, color: rgb(0,0,0) });
    y -= size + 4;
  };

  draw('Смета на плиточные работы', 18, true);
  draw(`Дата: ${new Date().toLocaleString('ru-RU')}`, 11);
  draw(`Объект: ${body?.meta?.object || '-'}`, 11);
  draw(`Материал/размер: ${body?.meta?.material || '-'}, ${body?.meta?.tileSize || '-'}`, 11);
  draw(`Площадь: ${body?.meta?.area || 0} м²`, 11);
  draw(`Сложность: ${body?.meta?.complexity || '-'}`, 11);
  y -= 6;

  draw('Расчёт:', 13, true);
  (body?.items || []).forEach((it: {label: string; sumStr: string}) => draw(`${it.label}: ${it.sumStr}`, 11));
  y -= 6;
  if (body?.totals?.discountStr) draw(`Скидка: ${body.totals.discountStr}`, 11);
  y -= 6;
  draw(`ИТОГО: ${body?.totals?.finalStr || '-'}`, 14, true);
  if (body?.totals?.minNote) draw(String(body.totals.minNote), 10);
  if (body?.meta?.contacts) { y -= 10; draw(`Контакты: ${body.meta.contacts}`, 11); }

  const pdfBytes = await pdf.save();
  const filename = `smeta_${Date.now()}.pdf`;

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
    },
  });
}
