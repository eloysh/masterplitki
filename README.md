# Masterplitkivl — Next.js + Vercel

## Быстрый старт локально
```bash
npm install
npm run dev
```

## Переменные окружения
Создайте `.env.local`:
```
ADMIN_USER=admin
ADMIN_PASS=supersecret
BLOB_READ_WRITE_TOKEN= # получите токен в Vercel → Storage → Blobs
```

## Деплой на Vercel
1. Import Project → Framework: Next.js  
2. Environment Variables: ADMIN_USER, ADMIN_PASS, BLOB_READ_WRITE_TOKEN  
3. Deploy.

## Админка
- На сайте нажмите Ctrl+Shift+A → введите логин/пароль → «Сохранить».  
- Цены хранятся в Vercel Blob (`masterplitkivl/prices.json`).
