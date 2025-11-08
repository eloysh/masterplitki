'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Phone, MessageCircle, Image as ImageIcon,
  ChevronLeft, ChevronRight, Layers,
  Calculator, Lock, Save, Settings, FileDown, Info
} from 'lucide-react';

import {
  initialPrices,
  type Prices,
  type AreaType,
  type MaterialType,
  type Complexity,
  type TileSize
} from '@/lib/initialPrices';

const DOMAIN = 'masterplitkivl.ru';
const PHONE_DISPLAY = '+7\u00A0951\u00A0005-00-02';
const PHONE_TEL = '+79510050002';

// WhatsApp из env
const WA_PHONE = (process.env.NEXT_PUBLIC_WHATSAPP_PHONE as string) || '79510050002';
const WA_TEXT  = (process.env.NEXT_PUBLIC_WHATSAPP_TEXT as string)  || 'Привет! Хочу рассчитать стоимость укладки плитки.';
const WHATSAPP = `https://wa.me/${WA_PHONE}`;

const blueGridBg: React.CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(0deg, rgba(56,189,248,.10) 0 1px, transparent 1px 56px),' +
    'repeating-linear-gradient(90deg, rgba(56,189,248,.10) 0 1px, transparent 1px 56px)',
  backgroundSize: '56px 56px, 56px 56px',
};

const galleryImages: { src: string; alt: string }[] = [
  { src: '/images/photo1.jpg', alt: 'Санузел — керамогранит, ванна' },
  { src: '/images/photo2.jpg', alt: 'Открытая полка — керамогранит' },
  { src: '/images/photo3.jpg', alt: 'Открытая полка — керамогранит' },
  { src: '/images/photo4.jpg', alt: 'Открытая полка — керамогранит' },
  { src: '/images/photo5.jpg', alt: 'Санузел под ключ' },
  { src: '/images/photo6.jpg', alt: 'Санузел под ключ' },
  { src: '/images/photo7.jpg', alt: 'Ванная комната — керамогранит, ванна' },
  { src: '/images/photo8.jpg', alt: 'Ванная комната — керамогранит, душ' },
  { src: '/images/photo9.jpg', alt: 'Санузел — керамогранит, ванна' },
  { src: '/images/photo10.jpg', alt: 'Пол — крупный формат 60×120' },
  { src: '/images/photo12.jpg', alt: 'Скрытая ниша' },
  { src: '/images/photo13.jpg', alt: 'Фартук кухни — белый кабанчик' },
  { src: '/images/photo14.jpg', alt: 'Фартук кухни — белый кабанчик' },
  { src: '/images/photo15.jpg', alt: 'Декоративные швы и примыкания' },
  { src: '/images/photo16.jpg', alt: 'Фартук кухни — белый кабанчик' },
  { src: '/images/photo22.jpg', alt: 'Душ — линейный трап, стекло' },
];

const formatRub = (n: number) => `${Math.round(n).toLocaleString('ru-RU')} ₽`;

function sizeName(s: TileSize) {
  return s === 'small' ? 'мелкая <200×200'
       : s === 'medium' ? '200×200–600×600'
       : s === 'large60x120' ? '60×120'
       : '≥1200';
}
function areaName(a: AreaType) {
  return a === 'bathroom' ? 'Санузел' : a === 'backsplash' ? 'Фартук кухни' : 'Пол';
}
function complexityName(c: Complexity) {
  return c === 'normal' ? 'стандарт'
       : c === 'diagonal' ? 'диагональ'
       : c === 'largeFormat' ? 'крупный формат'
       : 'мозаика/рисунок';
}

// admin helpers: токен в localStorage
function getAdminToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('adminToken') || '';
}
function setAdminToken(t: string) {
  if (typeof window === 'undefined') return;
  t ? localStorage.setItem('adminToken', t) : localStorage.removeItem('adminToken');
}

// WhatsApp кнопка
function WhatsAppButton({ label, message }: { label?: string; message?: string }) {
  const href = useMemo(() => {
    const q = `?text=${encodeURIComponent(message || WA_TEXT)}`;
    return `${WHATSAPP}${q}`;
  }, [message]);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl shadow-lg hover:shadow-xl transition focus:outline-none focus:ring text-white bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
    >
      <MessageCircle className="w-5 h-5" />
      <span>{label ?? 'Написать в WhatsApp'}</span>
    </a>
  );
}

// универсальный numeric input: удобен на мобилках
function NumericInput(props: {
  value: number;
  onChange: (n: number) => void;
  step?: number;
  min?: number;
  className?: string;
}) {
  const { value, onChange, step = 1, min = 0, className = '' } = props;
  const [focused, setFocused] = useState(false);
  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      min={min}
      value={focused && (value === 0 || Number.isNaN(value)) ? '' : value}
      onFocus={(e) => { setFocused(true); e.currentTarget.select(); }}
      onBlur={() => setFocused(false)}
      onChange={(e) => onChange(Number(e.target.value || 0))}
      className={`w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-3 text-base ${className}`}
    />
  );
}

export default function Page() {
  // Лайтбокс
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Инструкция
  const [showHelp, setShowHelp] = useState(true);

  // Цены: публичные и черновик
  const [prices, setPrices] = useState<Prices>(initialPrices);
  const [draft, setDraft] = useState<Prices>(initialPrices);

  // Админка
  const [adminOpen, setAdminOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [login, setLogin] = useState('admin');
  const [password, setPassword] = useState('admin123');

  // Калькулятор
  const [areaType, setAreaType] = useState<AreaType>('bathroom');
  const [material, setMaterial] = useState<MaterialType>('tile');
  const [tileSize, setTileSize] = useState<TileSize>('medium');

  const [area, setArea] = useState<number>(6);
  const [complexity, setComplexity] = useState<Complexity>('normal');
  const [turnkey, setTurnkey] = useState<boolean>(true);
  const [withDemolition, setWithDemolition] = useState<boolean>(false);
  const [withPrep, setWithPrep] = useState<boolean>(true);
  const [withAdhesive, setWithAdhesive] = useState<boolean>(true);
  const [withGrout, setWithGrout] = useState<boolean>(true);
  const [withWaterproofing, setWithWaterproofing] = useState<boolean>(true);
  const [waterproofingArea, setWaterproofingArea] = useState<number>(6);
  const [linkWpToArea, setLinkWpToArea] = useState<boolean>(true);
  const [miterLm, setMiterLm] = useState<number>(0);
  const [siliconeLm, setSiliconeLm] = useState<number>(0);
  const [holes, setHoles] = useState<number>(0);
  const [gklBoxes, setGklBoxes] = useState<number>(0);

  // Помощник (погонные метры)
  const [helperOpen, setHelperOpen] = useState(true);
  const [hW, setHW] = useState(1.7);
  const [hD, setHD] = useState(1.7);
  const [hHeight, setHHeight] = useState(2.5);
  const [hExtCorners, setHExtCorners] = useState(0);
  const [hPerimeterOn, setHPerimeterOn] = useState(true);
  const [hBathEdge, setHBathEdge] = useState(0);
  const [hCustomSilicone, setHCustomSilicone] = useState(0);
  const [hCustomMiter, setHCustomMiter] = useState(0);

  // Горячие клавиши
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') setAdminOpen(v => !v);
      if (!lightboxOpen) return;
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') setLightboxIndex(i => (i + 1) % galleryImages.length);
      if (e.key === 'ArrowLeft') setLightboxIndex(i => (i - 1 + galleryImages.length) % galleryImages.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen]);

  // загрузка публичных цен
  useEffect(() => {
    fetch('/api/prices')
      .then(async (r) => r.ok ? r.json() : Promise.reject())
      .then((json) => {
        const migrated: Prices = {
          base: {
            bathroom:  { ...initialPrices.base.bathroom,  ...(json?.base?.bathroom||{}) },
            backsplash:{ ...initialPrices.base.backsplash, ...(json?.base?.backsplash||{}) },
            floor:     { ...initialPrices.base.floor,      ...(json?.base?.floor||{}) },
          },
          coefficients: { ...initialPrices.coefficients, ...(json?.coefficients||{}) },
          sizeMultipliers: { ...initialPrices.sizeMultipliers, ...(json?.sizeMultipliers||{}) },
          extras: { ...initialPrices.extras, ...(json?.extras||{}) },
        };
        setPrices(migrated);
        setDraft(migrated);
      })
      .catch(() => {
        setPrices(initialPrices);
        setDraft(initialPrices);
      });
  }, []);

  // синхронизация площади гидроизоляции
  useEffect(() => {
    if (linkWpToArea) setWaterproofingArea(area);
  }, [area, linkWpToArea]);

  // помощник
  const floorPerimeter = 2 * (Math.max(0, hW || 0) + Math.max(0, hD || 0));
  const siliconeFromHelper =
    (hPerimeterOn ? floorPerimeter : 0) +
    Math.max(0, hBathEdge || 0) +
    Math.max(0, hCustomSilicone || 0);
  const miterFromHelper =
    Math.max(0, hExtCorners || 0) * Math.max(0, hHeight || 0) * 2 +
    Math.max(0, hCustomMiter || 0);

  function applyHelper() {
    setSiliconeLm(Math.round(siliconeFromHelper * 100) / 100);
    setMiterLm(Math.round(miterFromHelper * 100) / 100);
  }

  // расчёт
  const baseRate = prices.base[areaType][material];
  const sizeMult = prices.sizeMultipliers?.[tileSize] ?? 1;
  const coeff = prices.coefficients[complexity];

  const safeArea = Math.max(0, area || 0);
  const baseCost = safeArea * baseRate * coeff * sizeMult;

  const demolitionCost = withDemolition ? safeArea * prices.extras.demolitionPerM2 : 0;
  const prepCost       = withPrep ? safeArea * prices.extras.prepPerM2 : 0;
  const adhesiveCost   = withAdhesive ? safeArea * prices.extras.adhesivePerM2 : 0;
  const groutCost      = withGrout ? safeArea * prices.extras.groutPerM2 : 0;

  const wpArea = withWaterproofing ? (linkWpToArea ? safeArea : Math.max(0, waterproofingArea || 0)) : 0;
  const waterproofingCost = wpArea * prices.extras.waterproofingPerM2;

  const miterCost    = Math.max(0, miterLm || 0) * prices.extras.miterPerLm;
  const siliconeCost = Math.max(0, siliconeLm || 0) * prices.extras.siliconePerLm;
  const holesCost    = Math.max(0, holes || 0)    * prices.extras.holePerEach;
  const gklCost      = Math.max(0, gklBoxes || 0) * prices.extras.gklBoxPerEach;

  const subtotal = baseCost + demolitionCost + prepCost + adhesiveCost + groutCost + waterproofingCost + miterCost + siliconeCost + holesCost + gklCost;
  const discount = turnkey ? Math.round((subtotal * prices.extras.packageDiscountPct) / 100) : 0;
  const total = Math.max(0, subtotal - discount);
  const finalTotal = Math.max(total, prices.extras.minJob);
  const minApplied = finalTotal > total;

  // Цена за 1 м² (только «площадные» статьи)
  const perM2AreaExtras =
    (withDemolition ? prices.extras.demolitionPerM2 : 0) +
    (withPrep ? prices.extras.prepPerM2 : 0) +
    (withAdhesive ? prices.extras.adhesivePerM2 : 0) +
    (withGrout ? prices.extras.groutPerM2 : 0) +
    (withWaterproofing && linkWpToArea ? prices.extras.waterproofingPerM2 : 0);
  const perM2Work =
    baseRate * coeff * sizeMult + perM2AreaExtras; // линейные/штучные сюда не входят

  const calcMsg =
    `Здравствуйте! Хочу рассчитать работы: ${areaName(areaType)}.\n` +
    `Материал: ${material === 'tile' ? 'кафель' : 'керамогранит'}; размер: ${sizeName(tileSize)}.\n` +
    `Площадь: ${safeArea} м². Сложность: ${complexityName(complexity)}.\n` +
    `${withDemolition ? `Демонтаж: да (≈${prices.extras.demolitionPerM2} ₽/м²).\n` : ''}` +
    `${withPrep ? `Подготовка: да (≈${prices.extras.prepPerM2} ₽/м²).\n` : ''}` +
    `${withAdhesive ? `Клей/расходники: да (≈${prices.extras.adhesivePerM2} ₽/м²).\n` : ''}` +
    `${withGrout ? `Затирка: да (≈${prices.extras.groutPerM2} ₽/м²).\n` : ''}` +
    `${withWaterproofing ? `Гидроизоляция: ${wpArea} м² (≈${prices.extras.waterproofingPerM2} ₽/м²).\n` : ''}` +
    `${miterLm ? `Заусовка 45°: ${miterLm} п.м (≈${prices.extras.miterPerLm} ₽/п.м).\n` : ''}` +
    `${siliconeLm ? `Силикон/примыкания: ${siliconeLm} п.м (≈${prices.extras.siliconePerLm} ₽/п.м).\n` : ''}` +
    `${holes ? `Отверстия: ${holes} шт (≈${prices.extras.holePerEach} ₽/шт).\n` : ''}` +
    `${gklBoxes ? `Короба/ниши ГКЛ: ${gklBoxes} шт (≈${prices.extras.gklBoxPerEach} ₽/шт).\n` : ''}` +
    `${turnkey ? `Пакет «под ключ»: скидка ${prices.extras.packageDiscountPct}%.\n` : ''}` +
    `Предварительно: ~${formatRub(finalTotal)} ${minApplied ? `(с учётом минималки ${formatRub(prices.extras.minJob)})` : ''}. Когда удобно замер?`;

  function openAdmin() { setDraft(prices); setAdminOpen(true); }
  function closeAdmin() { setDraft(prices); setAdminOpen(false); }

  async function adminLogin() {
    const token = 'Basic ' + btoa(`${login}:${password}`);
    const res = await fetch('/api/prices?mode=auth', { headers: { Authorization: token } });
    if (res.ok) {
      setIsAdmin(true);
      setAdminToken(token);
      const json: Prices = await res.json();
      const migrated: Prices = {
        base: {
          bathroom:  { ...initialPrices.base.bathroom,  ...(json?.base?.bathroom||{}) },
          backsplash:{ ...initialPrices.base.backsplash, ...(json?.base?.backsplash||{}) },
          floor:     { ...initialPrices.base.floor,      ...(json?.base?.floor||{}) },
        },
        coefficients: { ...initialPrices.coefficients, ...(json?.coefficients||{}) },
        sizeMultipliers: { ...initialPrices.sizeMultipliers, ...(json?.sizeMultipliers||{}) },
        extras: { ...initialPrices.extras, ...(json?.extras||{}) },
      };
      setDraft(migrated);
      alert('Вход выполнен');
    } else {
      alert('Неверный логин/пароль или не задан .env.local');
    }
  }

  async function savePrices() {
    const token = getAdminToken();
    if (!token) return alert('Нет доступа: войдите как админ');

    const r = await fetch('/api/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify(draft),
    });
    if (r.ok) {
      setPrices(draft);
      setAdminOpen(false);
      alert('Цены сохранены');
    } else {
      const msg = await r.text().catch(()=> '');
      alert(`Ошибка сохранения: ${msg || r.status}`);
    }
  }

  function logout() {
    setIsAdmin(false);
    setAdminToken('');
    setDraft(prices);
    setAdminOpen(false);
  }

  // серверный PDF
  async function createAndDownloadEstimate() {
    const token = getAdminToken();
    if (!token) return alert('Нет доступа: войдите как админ');

    const items = [
      { label: 'База (ставка×площадь×коэфф×размер)', sumStr: formatRub(baseCost) },
      ...(withDemolition   ? [{ label: 'Демонтаж', sumStr: formatRub(demolitionCost) }] : []),
      ...(withPrep         ? [{ label: 'Подготовка', sumStr: formatRub(prepCost) }] : []),
      ...(withAdhesive     ? [{ label: 'Клей/расходники', sumStr: formatRub(adhesiveCost) }] : []),
      ...(withGrout        ? [{ label: 'Затирка', sumStr: formatRub(groutCost) }] : []),
      ...(withWaterproofing? [{ label: `Гидроизоляция (${wpArea} м²)`, sumStr: formatRub(waterproofingCost) }] : []),
      ...(miterLm>0        ? [{ label: `Заусовка 45° (${miterLm} п.м)`, sumStr: formatRub(miterCost) }] : []),
      ...(siliconeLm>0     ? [{ label: `Силикон/примыкания (${siliconeLm} п.м)`, sumStr: formatRub(siliconeCost) }] : []),
      ...(holes>0          ? [{ label: `Отверстия (${holes} шт)`, sumStr: formatRub(holesCost) }] : []),
      ...(gklBoxes>0       ? [{ label: `Короба/ниши ГКЛ (${gklBoxes} шт)`, sumStr: formatRub(gklCost) }] : []),
    ];

    const res = await fetch('/api/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify({
        meta: {
          object: areaName(areaType),
          material: material === 'tile' ? 'кафель' : 'керамогранит',
          tileSize: sizeName(tileSize),
          area: safeArea,
          complexity: complexityName(complexity),
          contacts: `${DOMAIN}, ${PHONE_DISPLAY}`,
        },
        items,
        totals: {
          discountStr: discount>0 ? `−${formatRub(discount)}` : '',
          finalStr: formatRub(finalTotal),
          minNote: minApplied ? `Применена минималка заказа: ${formatRub(prices.extras.minJob)}` : '',
        },
      }),
    });

    if (!res.ok) {
      const t = await res.text().catch(()=> '');
      return alert(`Не удалось создать PDF: ${t || res.status}`);
    }

    const { file, downloadUrl } = await res.json();

    const r = await fetch(downloadUrl, { headers: { Authorization: token } });
    if (!r.ok) return alert(`Не удалось скачать PDF (${r.status})`);

    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file || 'smeta.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const helperHint =
    areaType === 'bathroom'
      ? 'Санузел: для силикона учти периметр пола (пол-стена), примыкания ванны/душа; для 45° — внешние углы × высота × 2.'
      : areaType === 'backsplash'
      ? 'Фартук: силикон — периметр примыканий столешницы/боков; 45° обычно на наружных углах открытых торцов.'
      : 'Пол: силикон только по примыканиям (если нужны), 45° редко применяется.';

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 text-slate-100">
      {/* фон — голубая сетка */}
<motion.div
  aria-hidden
  className="pointer-events-none fixed inset-0 -z-20"
  style={blueGridBg}
  animate={{ backgroundPosition: ['0px 0px, 0px 0px', '56px 56px, 56px 56px'] }}
  transition={{ duration: 38, repeat: Infinity, ease: 'linear' }}
/>
<motion.div
  aria-hidden
  className="pointer-events-none fixed inset-0 -z-30"
  initial={{ opacity: 0.14 }}
  animate={{ opacity: [0.14, 0.22, 0.14] }}
  transition={{ duration: 10, repeat: Infinity }}
  style={{
    background:
      'radial-gradient(800px 520px at 10% -10%, rgba(56,189,248,0.18), transparent 60%), radial-gradient(800px 520px at 110% 110%, rgba(56,189,248,0.12), transparent 60%)'
  }}
/>

{/* >>> добавь эту обёртку поверх всего остального контента */}
<div className="relative z-10">
  {/* header/hero/калькулятор/галерея/футер/админка */}
</div>
      {/* хедер */}
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80 bg-slate-950/90 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ rotate: -8, scale: 0.8, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 16 }}
              className="w-9 h-9 rounded-2xl bg-cyan-500/20 grid place-content-center shadow-inner"
            >
              <Layers className="w-5 h-5 text-cyan-300" />
            </motion.div>
            <div>
              <div className="text-[10px] sm:text-xs uppercase tracking-widest text-cyan-300">{DOMAIN}</div>
              <div className="font-semibold text-base sm:text-lg">Гуренко Евгений — плиточник</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href={`tel:${PHONE_TEL}`} className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 bg-slate-900">
              <Phone className="w-4 h-4" /> {PHONE_DISPLAY}
            </a>
            <button
              onClick={openAdmin}
              title="Админ"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 hover:border-white/30 bg-slate-900"
            >
              <Settings className="w-4 h-4" /> Админ
            </button>
          </div>
        </div>
      </header>

      {/* хиро + калькулятор */}
      <section className="relative pt-6 sm:pt-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-5"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow">
              Плиточные работы во Владивостоке и Артёме
              <span className="block text-cyan-300">качественно, в срок, под ключ</span>
            </h1>
            <p className="text-slate-200 text-base sm:text-lg">
              Укладка плитки и керамогранита: санузлы, фартуки кухонь, полы. Подготовка основания, гидроизоляция, затирка, запил 45°, аккуратные примыкания.
            </p>

            {/* Инструкция по калькулятору */}
            <div className="rounded-2xl border border-white/10 bg-slate-950/90">
              <button
                onClick={()=>setShowHelp(s=>!s)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3"
              >
                <span className="inline-flex items-center gap-2 text-sm sm:text-base">
                  <Info className="w-5 h-5 text-cyan-300" />
                  Как пользоваться калькулятором
                </span>
                <span className="text-sm">{showHelp ? 'Свернуть' : 'Развернуть'}</span>
              </button>
              {showHelp && (
                <div className="px-4 pb-4 text-sm text-slate-300 space-y-2">
                  <div>1) Выберите <b>зону</b> и <b>материал</b>, затем <b>размер плитки</b> и <b>сложность</b>.</div>
                  <div>2) Укажите <b>площадь в м²</b>. При необходимости отметьте дополнительные «площадные» работы (демонтаж, подготовка, клей, затирка, гидроизоляция) и прикиньте <b>погонные/штучные</b> (силикон, запил 45°, отверстия, ГКЛ).</div>
                  <div>3) Внизу вы увидите <b>цену за 1 м² (работы по площади)</b> и <b>итог за всю площадь</b>.</div>
                  <div>4) Нажмите «Отправить расчёт в WhatsApp», чтобы переслать сводку. Админ может сохранить PDF кнопкой «Смета (PDF)» в панели «Админ».</div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <WhatsAppButton label="Рассчитать и записаться" message={calcMsg} />
              <a href={`tel:${PHONE_TEL}`} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-white/15 hover:border-white/30 transition bg-slate-900 w-full sm:w-auto">
                <Phone className="w-5 h-5" /> Позвонить
              </a>
            </div>
            <div className="text-sm text-slate-300">
              Базовая цена укладки: <span className="text-white font-medium">от 900–1 400 ₽/м²</span>. Итог — после замера.
            </div>
          </motion.div>

          {/* калькулятор */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-3xl p-5 md:p-7 border border-white/10 shadow-xl bg-slate-950/95"
          >
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-cyan-300" />
              <h2 className="text-2xl font-bold">Калькулятор</h2>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              {/* зона */}
              <div className="grid grid-cols-3 gap-2">
                {(['bathroom', 'backsplash', 'floor'] as const).map(k => (
                  <button
                    key={k}
                    onClick={() => setAreaType(k)}
                    className={`px-3 py-2 rounded-xl border text-sm ${areaType === k ? 'border-cyan-300 bg-cyan-300/10' : 'border-white/15'}`}
                  >
                    {k==='bathroom'?'Санузел':k==='backsplash'?'Фартук':'Пол'}
                  </button>
                ))}
              </div>

              {/* материал */}
              <div className="grid grid-cols-2 gap-2">
                {(['tile','porcelain'] as const).map(k => (
                  <button
                    key={k}
                    onClick={() => setMaterial(k)}
                    className={`px-3 py-2 rounded-xl border text-sm ${material === k ? 'border-cyan-300 bg-cyan-300/10' : 'border-white/15'}`}
                  >
                    {k==='tile'?'Кафель':'Керамогранит'}
                  </button>
                ))}
              </div>

              {/* размер плитки */}
              <div>
                <div className="text-sm mb-1 text-slate-300">Размер плитки</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['small','medium','large60x120','xl120plus'] as TileSize[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setTileSize(s)}
                      className={`px-3 py-2 rounded-xl border text-sm ${tileSize === s ? 'border-cyan-300 bg-cyan-300/10' : 'border-white/15'}`}
                    >
                      {s==='small'?'Мелкая <200×200': s==='medium'?'200×200–600×600': s==='large60x120'?'60×120':'≥1200'}
                    </button>
                  ))}
                </div>
              </div>

              {/* площадь */}
              <label className="block text-sm">
                Площадь, м²
                <NumericInput value={area} onChange={setArea} step={0.1} min={0} className="mt-1" />
              </label>

              {/* сложность */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['normal','diagonal','largeFormat','mosaic'] as const).map(k => (
                  <button
                    key={k}
                    onClick={() => setComplexity(k)}
                    className={`px-3 py-2 rounded-xl border text-sm ${complexity === k ? 'border-cyan-300 bg-cyan-300/10' : 'border-white/15'}`}
                  >
                    {k==='normal'?'Стандарт':k==='diagonal'?'Диагональ':k==='largeFormat'?'Крупный формат':'Мозаика'}
                  </button>
                ))}
              </div>

              {/* чекбоксы */}
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="accent-cyan-400 w-4 h-4" checked={turnkey} onChange={e=>setTurnkey(e.target.checked)} />
                  <span>Санузел под ключ (скидка {prices.extras.packageDiscountPct}%)</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="accent-cyan-400 w-4 h-4" checked={withDemolition} onChange={e=>setWithDemolition(e.target.checked)} />
                  <span>Демонтаж</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="accent-cyan-400 w-4 h-4" checked={withPrep} onChange={e=>setWithPrep(e.target.checked)} />
                  <span>Подготовка/выравнивание</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="accent-cyan-400 w-4 h-4" checked={withAdhesive} onChange={e=>setWithAdhesive(e.target.checked)} />
                  <span>Клей и расходники</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="accent-cyan-400 w-4 h-4" checked={withGrout} onChange={e=>setWithGrout(e.target.checked)} />
                  <span>Затирка</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="accent-cyan-400 w-4 h-4" checked={withWaterproofing} onChange={e=>setWithWaterproofing(e.target.checked)} />
                  <span>Гидроизоляция</span>
                </label>
                {withWaterproofing && (
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" className="accent-cyan-400 w-4 h-4" checked={linkWpToArea} onChange={e=>setLinkWpToArea(e.target.checked)} />
                    <span>= площади</span>
                  </label>
                )}
              </div>

              {/* помощник */}
              <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-300" />
                    <div className="font-semibold">Помощник по погонным метрам</div>
                  </div>
                  <button onClick={()=>setHelperOpen(o=>!o)} className="text-sm underline decoration-dotted">
                    {helperOpen ? 'Свернуть' : 'Развернуть'}
                  </button>
                </div>
                <div className="text-xs text-slate-400 mt-1">{helperHint}</div>

                {helperOpen && (
                  <>
                    <div className="grid sm:grid-cols-2 gap-3 text-sm mt-3">
                      <label className="block">Ширина помещения, м<NumericInput value={hW} onChange={setHW} step={0.01} className="mt-1" /></label>
                      <label className="block">Глубина помещения, м<NumericInput value={hD} onChange={setHD} step={0.01} className="mt-1" /></label>
                      <label className="inline-flex items-center gap-2">
                        <input type="checkbox" className="accent-cyan-400 w-4 h-4" checked={hPerimeterOn} onChange={e=>setHPerimeterOn(e.target.checked)} />
                        <span>Добавить периметр пола (пол-стена)</span>
                      </label>
                      <label className="block">Ванна у стен, м (примыкание)<NumericInput value={hBathEdge} onChange={setHBathEdge} step={0.01} className="mt-1" /></label>
                      <label className="block">Внешних углов, шт<NumericInput value={hExtCorners} onChange={setHExtCorners} step={1} className="mt-1" /></label>
                      <label className="block">Высота облицовки, м (для углов)<NumericInput value={hHeight} onChange={setHHeight} step={0.01} className="mt-1" /></label>
                      <label className="block">Свои добавки (силикон), м<NumericInput value={hCustomSilicone} onChange={setHCustomSilicone} step={0.01} className="mt-1" /></label>
                      <label className="block">Свои добавки (запил 45°), м<NumericInput value={hCustomMiter} onChange={setHCustomMiter} step={0.01} className="mt-1" /></label>
                    </div>

                    <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-slate-900/60 border border-white/10 p-3">
                        <div className="text-slate-300">Итого для силикона</div>
                        <div className="text-2xl font-bold mt-1">{(Math.round(siliconeFromHelper*100)/100).toLocaleString('ru-RU')} м</div>
                      </div>
                      <div className="rounded-xl bg-slate-900/60 border border-white/10 p-3">
                        <div className="text-slate-300">Итого для заусовки 45°</div>
                        <div className="text-2xl font-bold mt-1">{(Math.round(miterFromHelper*100)/100).toLocaleString('ru-RU')} м</div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <button onClick={applyHelper} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700">
                        <Save className="w-4 h-4" /> Подставить в калькулятор
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* погонные и штучные */}
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block text-sm">Запил 45°, п.м<NumericInput value={miterLm} onChange={setMiterLm} step={0.1} className="mt-1" /></label>
                <label className="block text-sm">Силикон/примыкания, п.м<NumericInput value={siliconeLm} onChange={setSiliconeLm} step={0.1} className="mt-1" /></label>
                <label className="block text-sm">Отверстия в плитке, шт<NumericInput value={holes} onChange={setHoles} step={1} className="mt-1" /></label>
                <label className="block text-sm">Короба/ниши ГКЛ, шт<NumericInput value={gklBoxes} onChange={setGklBoxes} step={1} className="mt-1" /></label>
              </div>

              {/* гидроизоляция отдельной площадью */}
              {withWaterproofing && !linkWpToArea && (
                <label className="block text-sm">
                  Гидроизоляция — площадь, м²
                  <NumericInput value={waterproofingArea} onChange={setWaterproofingArea} step={0.1} className="mt-1" />
                </label>
              )}

              {/* итог */}
              <div className="mt-2 rounded-2xl border border-white/10 bg-slate-950 p-4">
                <div className="text-sm text-slate-300">Предварительный расчёт</div>

                {/* Цена за 1 м² */}
                <div className="mt-2 rounded-xl bg-slate-900/60 border border-white/10 p-3">
                  <div className="text-slate-300 text-sm">Цена за 1 м² (работы по площади)</div>
                  <div className="text-2xl font-bold mt-1">{formatRub(perM2Work)}/м²</div>
                  <div className="text-[11px] text-slate-400 mt-1">Линейные и штучные позиции (силикон, запил 45°, отверстия, ГКЛ) считаются отдельно и в цене за м² не показываются.</div>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <ul className="space-y-1">
                    <li className="flex justify-between gap-3"><span>База (ставка×площадь×коэфф×размер)</span><span>{formatRub(baseCost)}</span></li>
                    {withDemolition && <li className="flex justify-between gap-3"><span>Демонтаж</span><span>{formatRub(demolitionCost)}</span></li>}
                    {withPrep &&       <li className="flex justify-between gap-3"><span>Подготовка</span><span>{formatRub(prepCost)}</span></li>}
                    {withAdhesive &&   <li className="flex justify-between gap-3"><span>Клей/расходники</span><span>{formatRub(adhesiveCost)}</span></li>}
                  </ul>
                  <ul className="space-y-1">
                    {withGrout &&       <li className="flex justify-between gap-3"><span>Затирка</span><span>{formatRub(groutCost)}</span></li>}
                    {withWaterproofing && <li className="flex justify-between gap-3"><span>Гидроизоляция</span><span>{formatRub(waterproofingCost)}</span></li>}
                    {miterLm>0 &&      <li className="flex justify-between gap-3"><span>Заусовка 45°</span><span>{formatRub(miterCost)}</span></li>}
                    {siliconeLm>0 &&   <li className="flex justify-between gap-3"><span>Силикон/примыкания</span><span>{formatRub(siliconeCost)}</span></li>}
                    {holes>0 &&        <li className="flex justify-between gap-3"><span>Отверстия</span><span>{formatRub(holesCost)}</span></li>}
                    {gklBoxes>0 &&     <li className="flex justify-between gap-3"><span>Короба/ниши ГКЛ</span><span>{formatRub(gklCost)}</span></li>}
                  </ul>
                </div>

                {turnkey && discount>0 && (
                  <div className="flex justify-between gap-3 text-sm mt-2 text-cyan-300">
                    <span>Скидка «под ключ»</span><span>−{formatRub(discount)}</span>
                  </div>
                )}

                {/* Итог за всю площадь */}
                <div className="text-xl font-bold mt-2">Предварительно: {formatRub(total)}</div>
                <div className="text-3xl font-extrabold mt-1">Итого за {safeArea} м²: {formatRub(finalTotal)}</div>
                {minApplied && <div className="text-xs text-slate-400 mt-1">Применена минималка заказа {formatRub(prices.extras.minJob)}.</div>}

                <div className="mt-3 flex flex-col sm:flex-row gap-3">
                  <WhatsAppButton label="Отправить расчёт в WhatsApp" message={calcMsg} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* галерея */}
      <section className="py-10 md:py-14 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-5 h-5 text-cyan-300" />
            <h2 className="text-2xl sm:text-3xl font-bold drop-shadow">Галерея выполненных работ</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {galleryImages.map((img, i) => (
              <motion.button
                key={i}
                onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
                className="group relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900/50"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <img src={img.src} alt={img.alt} loading="lazy" className="aspect-[4/3] w-full h-full object-cover group-hover:scale-[1.03] transition" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent opacity-0 group-hover:opacity-100 transition" />
                <div className="absolute bottom-2 left-2 text-[11px] sm:text-xs text-slate-200 drop-shadow">{img.alt}</div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* лайтбокс */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-40 bg-black/80 grid place-items-center p-4" role="dialog" aria-modal="true">
          <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 focus:outline-none" aria-label="Закрыть">✕</button>
          <div className="relative max-w-5xl w-full">
            <img src={galleryImages[lightboxIndex].src} alt={galleryImages[lightboxIndex].alt} className="w-full h-auto rounded-2xl border border-white/10" />
            <div className="absolute inset-0 flex items-center justify-between px-2">
              <button onClick={() => setLightboxIndex(i => (i - 1 + galleryImages.length) % galleryImages.length)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20" aria-label="Назад">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={() => setLightboxIndex(i => (i + 1) % galleryImages.length)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20" aria-label="Вперёд">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* футер */}
      <footer className="border-t border-white/10 py-8 text-sm text-slate-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>© {new Date().getFullYear()} {DOMAIN}</div>
          <div className="flex items-center gap-3">
            <a href={`tel:${PHONE_TEL}`} className="inline-flex items-center gap-2 underline decoration-dotted">
              <Phone className="w-4 h-4" /> {PHONE_DISPLAY}
            </a>
            <WhatsAppButton label="WhatsApp" />
          </div>
        </div>
      </footer>

      {/* Адаптивная админка — полноэкранный слой, удобный на телефонах */}
      {adminOpen && (
        <div className="fixed inset-0 z-50 bg-black/80">
          <div className="absolute inset-0 bg-slate-950 rounded-none sm:rounded-2xl sm:inset-4 border border-white/15 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-300" />
                <div className="text-lg font-semibold">{isAdmin ? 'Настройка цен' : 'Вход администратора'}</div>
              </div>
              <button onClick={()=>setAdminOpen(false)} className="px-3 py-1 rounded-lg border border-white/20">Закрыть</button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {!isAdmin ? (
                <div className="grid sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                  <label className="block text-sm">Логин
                    <input className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-3 mt-1" value={login} onChange={e=>setLogin(e.target.value)} />
                  </label>
                  <label className="block text-sm">Пароль
                    <input type="password" className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-3 mt-1" value={password} onChange={e=>setPassword(e.target.value)} />
                  </label>
                  <button onClick={adminLogin} className="mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700">
                    <Lock className="w-4 h-4" /> Войти
                  </button>
                  <div className="text-xs text-slate-400 mt-2 sm:col-span-2">Подсказка: Ctrl+Shift+A открывает это окно</div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  {/* базовые ставки */}
                  <div className="rounded-xl border border-white/10 p-3 bg-slate-950">
                    <div className="font-medium mb-2">Базовые ставки ₽/м²</div>
                    {(['bathroom','backsplash','floor'] as const).map(k => (
                      <div key={k} className="grid grid-cols-2 gap-2 mb-2">
                        <div className="col-span-2 text-xs text-slate-400">{k==='bathroom'?'Санузел':k==='backsplash'?'Фартук кухни':'Пол'}</div>
                        <label>Кафель<NumericInput value={draft.base[k].tile} onChange={(v)=>setDraft(p=>({ ...p, base:{...p.base, [k]:{...p.base[k], tile:v} } }))} /></label>
                        <label>Керамогранит<NumericInput value={draft.base[k].porcelain} onChange={(v)=>setDraft(p=>({ ...p, base:{...p.base, [k]:{...p.base[k], porcelain:v} } }))} /></label>
                      </div>
                    ))}
                  </div>

                  {/* коэффициенты и размеры */}
                  <div className="rounded-xl border border-white/10 p-3 bg-slate-950">
                    <div className="font-medium mb-2">Коэффициенты сложности</div>
                    <label className="block mb-2">Стандарт<NumericInput value={draft.coefficients.normal} step={0.01} onChange={(v)=>setDraft(p=>({ ...p, coefficients:{...p.coefficients, normal:v} }))} /></label>
                    <label className="block mb-2">Диагональ/ёлочка<NumericInput value={draft.coefficients.diagonal} step={0.01} onChange={(v)=>setDraft(p=>({ ...p, coefficients:{...p.coefficients, diagonal:v} }))} /></label>
                    <label className="block mb-2">Крупный формат<NumericInput value={draft.coefficients.largeFormat} step={0.01} onChange={(v)=>setDraft(p=>({ ...p, coefficients:{...p.coefficients, largeFormat:v} }))} /></label>
                    <label className="block">Мозаика/рисунок<NumericInput value={draft.coefficients.mosaic} step={0.01} onChange={(v)=>setDraft(p=>({ ...p, coefficients:{...p.coefficients, mosaic:v} }))} /></label>

                    <div className="font-medium mt-4 mb-2">Множители размера плитки</div>
                    <label className="block mb-2">Мелкая &lt;200×200<NumericInput value={draft.sizeMultipliers.small} step={0.01} onChange={(v)=>setDraft(p=>({ ...p, sizeMultipliers:{...p.sizeMultipliers, small:v} }))} /></label>
                    <label className="block mb-2">200×200–600×600<NumericInput value={draft.sizeMultipliers.medium} step={0.01} onChange={(v)=>setDraft(p=>({ ...p, sizeMultipliers:{...p.sizeMultipliers, medium:v} }))} /></label>
                    <label className="block mb-2">60×120<NumericInput value={draft.sizeMultipliers.large60x120} step={0.01} onChange={(v)=>setDraft(p=>({ ...p, sizeMultipliers:{...p.sizeMultipliers, large60x120:v} }))} /></label>
                    <label className="block">≥1200 по стороне<NumericInput value={draft.sizeMultipliers.xl120plus} step={0.01} onChange={(v)=>setDraft(p=>({ ...p, sizeMultipliers:{...p.sizeMultipliers, xl120plus:v} }))} /></label>
                  </div>

                  {/* допы */}
                  <div className="rounded-xl border border-white/10 p-3 bg-slate-950 md:col-span-2">
                    <div className="font-medium mb-2">Дополнительные работы</div>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <label>Демонтаж ₽/м²<NumericInput value={draft.extras.demolitionPerM2} onChange={(v)=>setDraft(p=>({ ...p, extras:{...p.extras, demolitionPerM2:v} }))} /></label>
                      <label>Подготовка ₽/м²<NumericInput value={draft.extras.prepPerM2} onChange={(v)=>setDraft(p=>({ ...p, extras:{...p.extras, prepPerM2:v} }))} /></label>
                      <label>Клей/расходники ₽/м²<NumericInput value={draft.extras.adhesivePerM2} onChange={(v)=>setDraft(p=>({ ...p, extras:{...p.extras, adhesivePerM2:v} }))} /></label>
                      <label>Затирка ₽/м²<NumericInput value={draft.extras.groutPerM2} onChange={(v)=>setDraft(p=>({ ...p, extras:{...p.extras, groutPerM2:v} }))} /></label>
                      <label>Гидроизоляция ₽/м²<NumericInput value={draft.extras.waterproofingPerM2} onChange={(v)=>setDraft(p=>({ ...p, extras:{...p.extras, waterproofingPerM2:v} }))} /></label>

                      <label>Заусовка 45° ₽/п.м<NumericInput value={draft.extras.miterPerLm} onChange={(v)=>setDraft(p=>({ ...p, extras:{...p.extras, miterPerLm:v} }))} /></label>
                      <label>Силикон ₽/п.м<NumericInput value={draft.extras.siliconePerLm} onChange={(v)=>setDraft(p=>({ ...p, extras:{...p.extras, siliconePerLm:v} }))} /></label>
                      <label>Отверстия ₽/шт<NumericInput value={draft.extras.holePerEach} onChange={(v)=>setDraft(p=>({ ...p, extras:{...p.extras, holePerEach:v} }))} /></label>
                      <label>Ниша/короб ГКЛ ₽/шт<NumericInput value={draft.extras.gklBoxPerEach} onChange={(v)=>setDraft(p=>({ ...p, extras:{...p.extras, gklBoxPerEach:v} }))} /></label>

                      <label>Скидка “под ключ”, %<NumericInput value={draft.extras.packageDiscountPct} step={0.1} onChange={(v)=>setDraft(p=>({ ...p, extras:{...p.extras, packageDiscountPct:v} }))} /></label>
                      <label>Минималка заказа, ₽<NumericInput value={draft.extras.minJob} onChange={(v)=>setDraft(p=>({ ...p, extras:{...p.extras, minJob:v} }))} /></label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* action bar снизу — удобно на телефонах */}
            {isAdmin && (
              <div className="p-3 border-t border-white/10 flex flex-col sm:flex-row gap-2 sm:justify-end">
                <button onClick={createAndDownloadEstimate} className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/15 hover:border-white/30">
                  <FileDown className="w-4 h-4" /> Смета (PDF)
                </button>
                <button onClick={savePrices} className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700">
                  <Save className="w-4 h-4" /> Сохранить
                </button>
                <button onClick={logout} className="inline-flex items-center justify-center px-4 py-3 rounded-xl border border-white/15">
                  Выйти
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
