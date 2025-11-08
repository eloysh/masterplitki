import React from 'react';

type Props = {
  phone?: string;
  text?: string;
  className?: string;
  children?: React.ReactNode;
};

export default function WhatsAppButton({
  phone,
  text,
  className,
  children,
}: Props) {
  const num = (phone ?? process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? '79841933792').replace(/\D/g, '');
  const msg = encodeURIComponent(
    text ??
      process.env.NEXT_PUBLIC_WHATSAPP_TEXT ??
      'Привет! Хочу рассчитать стоимость укладки плитки.'
  );
  const href = `https://wa.me/${num}?text=${msg}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        'inline-flex items-center justify-center rounded-xl px-4 py-2 font-medium text-white bg-green-600 hover:bg-green-700 transition'
      }
    >
      {children ?? 'Написать в WhatsApp'}
    </a>
  );
}
