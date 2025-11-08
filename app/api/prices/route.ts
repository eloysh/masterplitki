// app/api/prices/route.ts
import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { initialPrices, type Prices } from '@/lib/initialPrices';

export const runtime = 'nodejs';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'prices.json');

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
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readPrices(): Promise<Prices> {
  try {
    const buf = await fs.readFile(FILE, 'utf8');
    return JSON.parse(buf) as Prices;
  } catch {
    return initialPrices;
  }
}

// ПУБЛИЧНО: возвращаем цены (без авторизации)
// АДМИН-ПРОВЕРКА: если ?mode=auth — требуем Basic Auth
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('mode');
// app/api/prices/route.ts (в POST)
if (process.env.VERCEL === '1') {
  return new NextResponse('Persistent writes are disabled on Vercel', { status: 501 });
}

  if (mode === 'auth') {
    if (!isAuthed(req)) return new NextResponse('Unauthorized', { status: 401 });
    const p = await readPrices();
    return NextResponse.json(p);
  }

  const p = await readPrices();
  return NextResponse.json(p);
}

// АДМИН: сохранить цены
export async function POST(req: Request) {
  if (!isAuthed(req)) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const body = (await req.json()) as Prices;
    await ensureDir();
    await fs.writeFile(FILE, JSON.stringify(body, null, 2), 'utf8');
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return new NextResponse('Bad Request', { status: 400 });
  }
}
