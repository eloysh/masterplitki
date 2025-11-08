// app/api/prices/route.ts
import { NextResponse } from 'next/server';
import { initialPrices, type Prices } from '@/lib/initialPrices';
import { put, list } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // на Vercel нужен динамический рут

const KEY = 'prices.json';

function isAuthed(req: Request) {
  const header = req.headers.get('authorization') || '';
  if (!header.startsWith('Basic ')) return false;

  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const [login = '', pass = ''] = decoded.split(':');

  const ENV_LOGIN = (process.env.ADMIN_LOGIN ?? 'admin').trim();
  const ENV_PASSWORD = (process.env.ADMIN_PASSWORD ?? 'admin123').trim();

  return login.trim() === ENV_LOGIN && pass.trim() === ENV_PASSWORD;
}

async function readFromBlob(): Promise<Prices> {
  try {
    // Ищем объект с точным именем
    const { blobs } = await list({ prefix: KEY });
    const file = blobs.find(b => b.pathname === KEY);
    if (!file) throw new Error('no blob yet');

    const res = await fetch(file.url, { cache: 'no-store' });
    return (await res.json()) as Prices;
  } catch {
    // нет блоба? отдадим дефолтные цены
    return initialPrices;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('mode');

  if (mode === 'auth' && !isAuthed(req)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const p = await readFromBlob();
  return NextResponse.json(p);
}

export async function POST(req: Request) {
  if (!isAuthed(req)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = (await req.json()) as Prices;

    // Сохраняем JSON в Blob (публично читаемый URL)
    await put(
      KEY,
      JSON.stringify(body, null, 2),
      { access: 'public', contentType: 'application/json' }
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return new NextResponse('Bad Request', { status: 400 });
  }
}
