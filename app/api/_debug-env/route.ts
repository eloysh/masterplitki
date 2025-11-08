import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
const token = 'Basic ' + btoa('admin:admin123');

// проверяем доступ
fetch('/api/prices?mode=auth', { headers: { Authorization: token } })
  .then(r => r.status)  // должен быть 200
  .then(console.log);

// сохраняем токен как будто «вошли»
localStorage.setItem('adminToken', token);

export async function GET() {
  return NextResponse.json({
    ADMIN_LOGIN_seen: !!process.env.ADMIN_LOGIN,
    ADMIN_PASSWORD_seen: !!process.env.ADMIN_PASSWORD,
    ADMIN_LOGIN_value: process.env.ADMIN_LOGIN ?? null,
  });
}
