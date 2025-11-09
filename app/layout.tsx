import './globals.css';
export const metadata = {
  title: 'Плиточник — Владивосток/Артём',
  description: 'Плиточные работы: санузел под ключ, фартук, пол. Калькулятор и запись в один клик.',
  robots: { index: true, follow: true },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
