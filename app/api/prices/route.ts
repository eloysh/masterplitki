// app/api/prices/route.ts
import { NextResponse } from 'next/server';
import { initialPrices, type Prices } from '@/lib/initialPrices';
import { put, list } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KEY = 'prices.json';

function isAuthed(req: Request) {
  const header = req.headers.get('authorization') || '';
  if (!header.startsWith('Basic ')) return false;

  try {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const [login = '', pass = ''] = decoded.split(':');
    const ENV_LOGIN = (process.env.ADMIN_LOGIN ?? 'admin').trim();
    const ENV_PASSWORD = (process.env.ADMIN_PASSWORD ?? 'admin123').trim();
    return login.trim() === ENV_LOGIN && pass.trim() === ENV_PASSWORD;
  } catch {
    return false;
  }
}

async function readFromBlob(): Promise<Prices> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  try {
    const { blobs } = await list({ prefix: KEY, token });
    const file = blobs.find((b) => b.pathname === KEY);
    if (!file) throw new Error('not found');

    const res = await fetch(file.url, { cache: 'no-store' });
    if (!res.ok) throw new Error('fetch failed');

    return (await res.json()) as Prices;
  } catch {
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
  return NextResponse.json(p, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  if (!isAuthed(req)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return new NextResponse('Blob token is missing', { status: 500 });
  }

  try {
    const body = (await req.json()) as Prices;

    await put(KEY, JSON.stringify(body, null, 2), {
      access: 'public',
      contentType: 'application/json',
      token,
      addRandomSuffix: false,
    });

    return NextResponse.json(
      { ok: true },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e) {
    console.error('[prices POST error]', e);
    return new NextResponse('Bad Request', { status: 400 });
  }
}
