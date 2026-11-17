import {useMemo, useState} from 'react';

const LAYOUT_OPTIONS = [
  {
    id: 'straight',
    label: 'Прямая',
    shortLabel: 'Прямая',
    subtitle: 'Линейная вдоль одной стены',
    multiplier: 1.0,
  },
  {
    id: 'l-shaped',
    label: 'Угловая (Г-образная)',
    shortLabel: 'Угловая',
    subtitle: 'Эргономичный рабочий треугольник',
    multiplier: 1.12,
  },
  {
    id: 'u-shaped',
    label: 'П-образная',
    shortLabel: 'П-образная',
    subtitle: 'Панорамная вдоль трёх стен',
    multiplier: 1.24,
  },
  {
    id: 'island',
    label: 'С островом',
    shortLabel: 'С островом',
    subtitle: 'Архитектурный центр и барная зона',
    multiplier: 1.38,
  },
];

const METER_PRESETS = [
  {value: 3.0, min: 2.0, max: 3.5, label: '2.0–3.5 м', tag: 'Компакт'},
  {value: 4.5, min: 3.5, max: 5.0, label: '3.5–5.0 м', tag: 'Стандарт'},
  {value: 6.0, min: 5.0, max: 6.5, label: '5.0–6.5 м', tag: 'Просторная'},
  {value: 7.5, min: 6.5, max: 9.0, label: '6.5–9.0 м', tag: 'Вилла'},
];

const STYLE_OPTIONS = [
  {
    id: 'modern',
    label: 'Модерн / Минимализм',
    shortLabel: 'Модерн',
    detail: 'Профили Gola без ручек и чистая геометрия',
    ratePerMeter: 245000,
    swatch: 'linear-gradient(135deg, #1e293b 0%, #334155 55%, #e5c17d 100%)',
  },
  {
    id: 'neoclassic',
    label: 'Неоклассика',
    shortLabel: 'Неоклассика',
    detail: 'Фрезерованные рамки, пилястры и латунные акценты',
    ratePerMeter: 295000,
    swatch: 'linear-gradient(135deg, #2b2620 0%, #5c4d3c 60%, #e5c17d 100%)',
  },
  {
    id: 'loft',
    label: 'Лофт',
    shortLabel: 'Лофт',
    detail: 'Фактура дерева, матовый металл и тонированное стекло',
    ratePerMeter: 265000,
    swatch: 'linear-gradient(135deg, #1c1917 0%, #44403c 55%, #b45309 100%)',
  },
];

const FACADE_OPTIONS = [
  {
    id: 'matte',
    label: 'Матовые Soft-Touch',
    shortLabel: 'Матовые',
    detail: 'Антипальчиковый Fenix / бархатный МДФ',
    multiplier: 1.0,
  },
  {
    id: 'glossy',
    label: 'Глянцевый акрил',
    shortLabel: 'Глянец',
    detail: 'Зеркальный UV-лак и кромка в цвет',
    multiplier: 1.08,
  },
];

const TOTAL_STEPS = 4;

/**
 * Автоформатирование номера телефона в казахстанский формат +7 (XXX) XXX-XX-XX.
 * Преобразует начальную "8" в "7" и корректно обрабатывает вставку 10 цифр.
 * @param {string} raw
 */
function formatKazakhPhone(raw) {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '+' || trimmed === '+7') return '';

  let digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';

  const hasCountryPrefix = trimmed.startsWith('+7') || trimmed.startsWith('+8');

  if (digits.startsWith('8')) {
    digits = '7' + digits.slice(1);
  } else if (!hasCountryPrefix && digits.length === 10 && digits.startsWith('7')) {
    digits = '7' + digits;
  } else if (!digits.startsWith('7')) {
    digits = '7' + digits;
  }
  digits = digits.slice(0, 11);

  const p1 = digits.slice(1, 4);
  const p2 = digits.slice(4, 7);
  const p3 = digits.slice(7, 9);
  const p4 = digits.slice(9, 11);

  let formatted = '+7';
  if (p1) formatted += ` (${p1}`;
  if (p2) formatted += `) ${p2}`;
  if (p3) formatted += `-${p3}`;
  if (p4) formatted += `-${p4}`;
  return formatted;
}

/**
 * Валидация казахстанского номера +7 (7XX) XXX-XX-XX.
 * @param {string} formatted
 */
function validateKazakhPhone(formatted) {
  const digits = formatted.replace(/\D/g, '');
  if (!digits) {
    return 'Введите номер WhatsApp, чтобы получить расчёт стоимости.';
  }
  if (digits.length < 11) {
    return 'Введите все 10 цифр после +7 (например, +7 701 555-24-88).';
  }
  if (!/^77\d{9}$/.test(digits)) {
    return 'Укажите корректный казахстанский номер формата +7 (7XX).';
  }
  return null;
}

/**
 * Форматирование суммы в тенге (₸) с округлением до 10 000 ₸.
 * @param {number} amount
 */
function formatKzt(amount) {
  return `${new Intl.NumberFormat('ru-RU').format(Math.round(amount / 10000) * 10000)} ₸`;
}

/**
 * Архитектурная схема-иконка планировки кухни.
 * @param {{type: string, active: boolean}}
 */
function LayoutBlueprint({type, active}) {
  const stroke = active ? '#e5c17d' : '#94a3b8';
  const fill = active ? 'rgba(229, 193, 125, 0.16)' : 'rgba(148, 163, 184, 0.09)';

  return (
    <svg
      viewBox="0 0 80 54"
      className="h-12 w-20 shrink-0"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="2"
        y="2"
        width="76"
        height="50"
        rx="6"
        stroke="rgba(255,255,255,0.08)"
        strokeDasharray="3 3"
      />
      {type === 'straight' && (
        <>
          <rect
            x="12"
            y="14"
            width="56"
            height="14"
            rx="2"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.6"
          />
          <circle cx="28" cy="21" r="2.5" stroke={stroke} strokeWidth="1.2" />
          <rect
            x="44"
            y="17.5"
            width="12"
            height="7"
            rx="1"
            stroke={stroke}
            strokeWidth="1.2"
          />
        </>
      )}
      {type === 'l-shaped' && (
        <>
          <path
            d="M14 12 H66 V25 H28 V42 H14 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <circle cx="48" cy="18.5" r="2.5" stroke={stroke} strokeWidth="1.2" />
          <rect
            x="17.5"
            y="29"
            width="7"
            height="9"
            rx="1"
            stroke={stroke}
            strokeWidth="1.2"
          />
        </>
      )}
      {type === 'u-shaped' && (
        <>
          <path
            d="M14 12 H66 V42 H53 V24 H27 V42 H14 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <rect
            x="34"
            y="15"
            width="12"
            height="6"
            rx="1"
            stroke={stroke}
            strokeWidth="1.2"
          />
        </>
      )}
      {type === 'island' && (
        <>
          <rect
            x="12"
            y="10"
            width="56"
            height="12"
            rx="2"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.6"
          />
          <rect
            x="22"
            y="30"
            width="36"
            height="12"
            rx="2"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.6"
          />
          <circle cx="40" cy="36" r="2.2" stroke={stroke} strokeWidth="1.2" />
        </>
      )}
    </svg>
  );
}

/**
 * Интерактивный квиз-лендинг Top1Mebel Krg для Hydrogen/Remix.
 * @param {{
 *   heroImage?: string,
 *   whatsappBusinessNumber?: string,
 *   onLeadSubmit?: (payload: Record<string, unknown>) => void | Promise<void>
 * }} props
 */
export function QuizLanding({
  heroImage = '/images/kitchen-hero.jpg',
  whatsappBusinessNumber = '77000000000',
  onLeadSubmit,
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    layout: 'l-shaped',
    meters: 4.5,
    style: 'modern',
    facade: 'matte',
    phone: '',
  });
  const [phoneError, setPhoneError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const selectedLayout = useMemo(
    () =>
      LAYOUT_OPTIONS.find((item) => item.id === formData.layout) ??
      LAYOUT_OPTIONS[1],
    [formData.layout],
  );
  const selectedStyle = useMemo(
    () =>
      STYLE_OPTIONS.find((item) => item.id === formData.style) ??
      STYLE_OPTIONS[0],
    [formData.style],
  );
  const selectedFacade = useMemo(
    () =>
      FACADE_OPTIONS.find((item) => item.id === formData.facade) ??
      FACADE_OPTIONS[0],
    [formData.facade],
  );

  const estimate = useMemo(() => {
    const base =
      formData.meters *
      selectedStyle.ratePerMeter *
      selectedLayout.multiplier *
      selectedFacade.multiplier;
    const min = Math.round(base * 0.92);
    const max = Math.round(base * 1.12);
    return {
      min,
      max,
      formattedRange: `${formatKzt(min)} – ${formatKzt(max)}`,
    };
  }, [formData.meters, selectedStyle, selectedLayout, selectedFacade]);

  const progressPercent = isSubmitted
    ? 100
    : Math.round((currentStep / TOTAL_STEPS) * 100);
  const sliderPercent = ((formData.meters - 2) / (9 - 2)) * 100;

  const updateField = (key, value) => {
    setFormData((prev) => ({...prev, [key]: value}));
  };

  const handlePhoneChange = (event) => {
    const formatted = formatKazakhPhone(event.target.value);
    updateField('phone', formatted);
    if (phoneError) setPhoneError(null);
  };

  const goNext = () => {
    setCurrentStep((prev) => Math.min(TOTAL_STEPS, prev + 1));
  };

  const goBack = () => {
    setPhoneError(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const error = validateKazakhPhone(formData.phone);
    if (error) {
      setPhoneError(error);
      return;
    }

    setIsSubmitting(true);
    try {
      if (onLeadSubmit) {
        await onLeadSubmit({...formData, estimate});
      } else {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setPhoneError(null);
    setCurrentStep(1);
  };

  const whatsappDeepLink = useMemo(() => {
    const text = encodeURIComponent(
      `Здравствуйте, Top1Mebel Krg! Параметры моей кухни: ${selectedLayout.label}, ${formData.meters.toFixed(1)} м, стиль ${selectedStyle.label}, фасады ${selectedFacade.label}. Предварительный расчёт: ${estimate.formattedRange}. Отправьте, пожалуйста, точную смету и бесплатный 3D-дизайн.`,
    );
    return `https://wa.me/${whatsappBusinessNumber}?text=${text}`;
  }, [
    selectedLayout,
    formData.meters,
    selectedStyle,
    selectedFacade,
    estimate,
    whatsappBusinessNumber,
  ]);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0f172a] font-sans text-slate-100 selection:bg-amber-300/30 selection:text-amber-100">
      {/* Мягкое архитектурное освещение */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 right-[-10%] h-[420px] w-[420px] rounded-full bg-amber-400/10 blur-[120px]" />
        <div className="absolute bottom-[-120px] left-[-10%] h-[360px] w-[360px] rounded-full bg-slate-500/10 blur-[120px]" />
      </div>

      {/* Компактная шапка бренда */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-300/30 bg-slate-900/80 text-xs font-semibold tracking-widest text-[#e5c17d]">
            T1
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[0.16em] text-slate-100 uppercase">
              Top1Mebel Krg
            </p>
            <p className="text-[11px] tracking-wider text-slate-400">
              Караганда · Кухни на заказ
            </p>
          </div>
        </div>
        <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1.5 text-[11px] font-medium text-slate-300 backdrop-blur-md">
          3D-проект бесплатно
        </span>
      </header>

      {/* Основная сетка: mobile-first столбец, на десктопе 12 колонок */}
      <main className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 pt-3 pb-12 sm:px-6 lg:grid-cols-12 lg:items-center lg:gap-10 lg:py-10">
        {/* Левый редакционный блок */}
        <section className="space-y-4 p-0! lg:col-span-5 lg:space-y-6">
          <div className="space-y-2.5">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[#e5c17d] uppercase">
              Студия мебели · Расчёт за 60 сек
            </p>
            <h1 className="m-0! font-display text-3xl leading-[1.08]! font-semibold tracking-tight text-slate-50 sm:text-4xl lg:text-[2.75rem]">
              Архитектурные кухни с точностью до миллиметра
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-slate-300 sm:text-base">
              Узнайте стоимость вашей будущей кухни за 4 простых шага и получите
              персональный{' '}
              <span className="font-medium text-[#e5c17d]">3D-дизайн проект</span>{' '}
              на WhatsApp.
            </p>
          </div>

          {/* Витрина */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 shadow-2xl">
            <img
              src={heroImage}
              alt="Премиальная тёмная кухня от Top1Mebel Krg с тёплой подсветкой"
              className="h-40 w-full rounded-none! object-cover object-center sm:h-52 lg:h-64"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-4 py-3 text-xs">
              <span className="font-medium text-slate-200">
                Фурнитура Blum и Hettich
              </span>
              <span className="font-semibold text-[#e5c17d]">
                Срок 21–28 дней
              </span>
            </div>
          </div>

          <dl className="hidden grid-cols-3 gap-3 border-t border-white/10 pt-4 text-left lg:grid">
            <div>
              <dt className="text-[11px] tracking-wider text-slate-400 uppercase">
                Гарантия
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-100">
                5 лет
              </dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-wider text-slate-400 uppercase">
                Замер
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-100">
                Лазер · 0 ₸
              </dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-wider text-slate-400 uppercase">
                Производство
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-100">
                Караганда
              </dd>
            </div>
          </dl>
        </section>

        {/* Правая интерактивная карточка квиза */}
        <section className="p-0! lg:col-span-7">
          <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-slate-900/70 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-8">
            {/* Прогресс-бар */}
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="tracking-wider text-[#e5c17d] uppercase">
                  {isSubmitted
                    ? 'Расчёт сформирован'
                    : `Шаг ${currentStep} из ${TOTAL_STEPS}`}
                </span>
                <span className="tabular-nums text-slate-400">
                  {progressPercent}% готово
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-[#e5c17d] transition-all duration-300 ease-out"
                  style={{width: `${progressPercent}%`}}
                />
              </div>
            </div>

            {isSubmitted ? (
              /* Экран подтверждения с расчётом */
              <div className="animate-quiz-step space-y-6">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-300/35 bg-amber-300/10 text-[#e5c17d]">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="m-0! text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
                      Расчёт вашей кухни готов
                    </h2>
                    <p className="mt-1 text-sm text-slate-300">
                      Точная смета в PDF и бесплатный 3D-дизайн закреплены за номером{' '}
                      <span className="font-semibold text-slate-100 tabular-nums">
                        {formData.phone}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Итоговая вилка стоимости */}
                <div className="rounded-2xl border border-amber-300/25 bg-slate-950/75 p-5">
                  <p className="text-[11px] font-semibold tracking-[0.18em] text-[#e5c17d] uppercase">
                    Ориентировочный бюджет
                  </p>
                  <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-50 tabular-nums sm:text-4xl">
                    {estimate.formattedRange}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Включает корпус и фасады на заказ, фурнитуру с доводчиками и
                    профессиональный монтаж в Караганде.
                  </p>
                </div>

                {/* Выбранные параметры */}
                <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                  <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
                    <span className="block text-slate-400">Планировка</span>
                    <span className="mt-1 block font-semibold text-slate-100">
                      {selectedLayout.shortLabel}
                    </span>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
                    <span className="block text-slate-400">Длина</span>
                    <span className="mt-1 block font-semibold text-slate-100 tabular-nums">
                      {formData.meters.toFixed(1)} м
                    </span>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
                    <span className="block text-slate-400">Стиль</span>
                    <span className="mt-1 block font-semibold text-slate-100">
                      {selectedStyle.shortLabel}
                    </span>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
                    <span className="block text-slate-400">Фасады</span>
                    <span className="mt-1 block font-semibold text-slate-100">
                      {selectedFacade.shortLabel}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <a
                    href={whatsappDeepLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#e5c17d] px-5 py-3 text-sm font-semibold text-slate-950 no-underline! transition hover:bg-[#f0d196]"
                  >
                    Открыть в WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="min-h-[50px] rounded-xl border border-white/15 bg-slate-800/60 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                  >
                    Пересчитать
                  </button>
                </div>
              </div>
            ) : (
              /* Форма шагов квиза */
              <form
                onSubmit={handleSubmit}
                noValidate
                className="w-full max-w-none!"
              >
                <div key={currentStep} className="animate-quiz-step space-y-5">
                  {currentStep === 1 && (
                    <>
                      <div>
                        <h2 className="m-0! text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
                          Выберите планировку кухни
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                          Укажите геометрию гарнитура под ваше помещение.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {LAYOUT_OPTIONS.map((option) => {
                          const active = formData.layout === option.id;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              aria-pressed={active}
                              onClick={() => updateField('layout', option.id)}
                              className={`group flex min-h-[86px] items-center gap-3.5 rounded-2xl border p-3.5 text-left transition-all duration-200 ${
                                active
                                  ? 'border-[#e5c17d]/70 bg-amber-300/10 shadow-[0_0_0_1px_rgba(229,193,125,0.25)]'
                                  : 'border-white/10 bg-slate-950/45 hover:border-white/25 hover:bg-slate-900/80'
                              }`}
                            >
                              <LayoutBlueprint type={option.id} active={active} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-semibold text-slate-100">
                                    {option.label}
                                  </span>
                                  <span
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                                      active
                                        ? 'border-[#e5c17d] bg-[#e5c17d] text-slate-950'
                                        : 'border-slate-600'
                                    }`}
                                  >
                                    {active && (
                                      <svg
                                        viewBox="0 0 16 16"
                                        className="h-3 w-3"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.4"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M3.5 8.5l3 3 6-6"
                                        />
                                      </svg>
                                    )}
                                  </span>
                                </div>
                                <p className="mt-0.5 text-xs text-slate-400">
                                  {option.subtitle}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {currentStep === 2 && (
                    <>
                      <div>
                        <h2 className="m-0! text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
                          Примерная длина кухни
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                          Передвиньте ползунок или выберите диапазон в погонных метрах.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs font-medium tracking-wider text-slate-400 uppercase">
                            Общая длина
                          </span>
                          <output
                            htmlFor="kitchen-meters-range"
                            className="font-display text-4xl font-semibold text-[#e5c17d] tabular-nums"
                          >
                            {formData.meters.toFixed(1)} м
                          </output>
                        </div>

                        <div className="mt-5">
                          <input
                            id="kitchen-meters-range"
                            type="range"
                            min="2"
                            max="9"
                            step="0.5"
                            aria-label="Длина кухни в погонных метрах"
                            value={formData.meters}
                            onChange={(e) =>
                              updateField('meters', parseFloat(e.target.value))
                            }
                            className="quiz-range m-0! w-full border-0! p-0! accent-[#e5c17d]"
                            style={{
                              background: `linear-gradient(to right, #e5c17d 0%, #e5c17d ${sliderPercent}%, #1e293b ${sliderPercent}%, #1e293b 100%)`,
                              borderRadius: '9999px',
                              height: '6px',
                            }}
                          />
                          <div className="mt-2 flex justify-between text-[11px] tabular-nums text-slate-500">
                            <span>2.0 м</span>
                            <span>5.5 м</span>
                            <span>9.0 м</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                        {METER_PRESETS.map((preset) => {
                          const active =
                            preset.min === 2.0
                              ? formData.meters <= preset.max
                              : formData.meters > preset.min &&
                                formData.meters <= preset.max;
                          return (
                            <button
                              key={preset.value}
                              type="button"
                              aria-pressed={active}
                              onClick={() => updateField('meters', preset.value)}
                              className={`min-h-[60px] rounded-xl border px-3 py-2.5 text-left transition ${
                                active
                                  ? 'border-[#e5c17d]/70 bg-amber-300/10 text-slate-50'
                                  : 'border-white/10 bg-slate-950/40 text-slate-300 hover:border-white/25'
                              }`}
                            >
                              <span className="block text-[11px] font-medium text-[#e5c17d]">
                                {preset.tag}
                              </span>
                              <span className="mt-0.5 block text-sm font-semibold tabular-nums">
                                {preset.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {currentStep === 3 && (
                    <>
                      <div>
                        <h2 className="m-0! text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
                          Стиль и материал фасадов
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                          Совместите архитектурное направление с фактурой покрытия.
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        {STYLE_OPTIONS.map((option) => {
                          const active = formData.style === option.id;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              aria-pressed={active}
                              onClick={() => updateField('style', option.id)}
                              className={`flex min-h-[64px] w-full items-center gap-3.5 rounded-2xl border p-3.5 text-left transition ${
                                active
                                  ? 'border-[#e5c17d]/70 bg-amber-300/10'
                                  : 'border-white/10 bg-slate-950/45 hover:border-white/25'
                              }`}
                            >
                              <span
                                className="h-10 w-10 shrink-0 rounded-xl border border-white/15"
                                style={{background: option.swatch}}
                                aria-hidden="true"
                              />
                              <div className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold text-slate-100">
                                  {option.label}
                                </span>
                                <span className="mt-0.5 block text-xs text-slate-400">
                                  {option.detail}
                                </span>
                              </div>
                              <span
                                className={`h-4 w-4 shrink-0 rounded-full border ${
                                  active
                                    ? 'border-[5px] border-[#e5c17d] bg-slate-950'
                                    : 'border-slate-600'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>

                      <div className="pt-1">
                        <p className="mb-2 text-xs font-medium tracking-wider text-slate-400 uppercase">
                          Покрытие фасадов
                        </p>
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          {FACADE_OPTIONS.map((facade) => {
                            const active = formData.facade === facade.id;
                            return (
                              <button
                                key={facade.id}
                                type="button"
                                aria-pressed={active}
                                onClick={() => updateField('facade', facade.id)}
                                className={`min-h-[58px] rounded-xl border px-3.5 py-2.5 text-left transition ${
                                  active
                                    ? 'border-[#e5c17d]/70 bg-amber-300/10'
                                    : 'border-white/10 bg-slate-950/45 hover:border-white/25'
                                }`}
                              >
                                <span className="block text-sm font-semibold text-slate-100">
                                  {facade.label}
                                </span>
                                <span className="mt-0.5 block text-[11px] text-slate-400">
                                  {facade.detail}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}

                  {currentStep === 4 && (
                    <>
                      <div>
                        <h2 className="m-0! text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
                          Получите точный расчёт
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                          Смета готова. Введите номер WhatsApp, чтобы открыть расчёт и забрать бонус.
                        </p>
                      </div>

                      {/* Мгновенный предпросмотр расчёта + Бонус */}
                      <div className="rounded-2xl border border-amber-300/25 bg-slate-950/70 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                          <div>
                            <p className="text-[11px] font-semibold tracking-wider text-[#e5c17d] uppercase">
                              Предварительный расчёт
                            </p>
                            <p className="mt-0.5 text-xs text-slate-300">
                              {selectedLayout.shortLabel} ·{' '}
                              {formData.meters.toFixed(1)} м ·{' '}
                              {selectedStyle.shortLabel} ·{' '}
                              {selectedFacade.shortLabel}
                            </p>
                          </div>
                          <span className="rounded-lg bg-amber-300/15 px-2.5 py-1 text-xs font-semibold text-[#e5c17d] tabular-nums">
                            ~{formatKzt((estimate.min + estimate.max) / 2)}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-2.5 text-xs text-slate-200">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-300/15 text-[#e5c17d]">
                            +
                          </span>
                          <span>
                            <strong className="font-semibold text-white">
                              Ваш бонус:
                            </strong>{' '}
                            Бесплатный 3D-дизайн проект + подробная смета в PDF
                          </span>
                        </div>
                      </div>

                      {/* Поле ввода WhatsApp (+7 Казахстан) */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="quiz-whatsapp-phone"
                          className="block text-xs font-medium tracking-wider text-slate-300 uppercase"
                        >
                          Номер WhatsApp (Казахстан +7)
                        </label>
                        <input
                          id="quiz-whatsapp-phone"
                          name="phone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="+7 (701) 555-24-88"
                          value={formData.phone}
                          onFocus={() => {
                            if (!formData.phone) updateField('phone', '+7 (');
                          }}
                          onBlur={() => {
                            if (
                              formData.phone === '+7 (' ||
                              formData.phone === '+7'
                            ) {
                              updateField('phone', '');
                            }
                          }}
                          onChange={handlePhoneChange}
                          aria-invalid={Boolean(phoneError)}
                          aria-describedby={
                            phoneError ? 'quiz-phone-error' : undefined
                          }
                          className={`m-0! min-h-[52px] w-full rounded-xl! border! bg-slate-950/85 px-4! py-3! text-base! text-slate-100 placeholder-slate-500 outline-none transition tabular-nums ${
                            phoneError
                              ? 'border-rose-400/80! focus:ring-2 focus:ring-rose-400/30'
                              : 'border-white/15! focus:border-[#e5c17d]! focus:ring-2 focus:ring-amber-300/20'
                          }`}
                        />
                        {phoneError && (
                          <p
                            id="quiz-phone-error"
                            role="alert"
                            className="text-xs font-medium text-rose-300"
                          >
                            {phoneError}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Навигация */}
                <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-5">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={goBack}
                      className="min-h-[48px] rounded-xl border border-white/12 bg-slate-950/50 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-white/25 hover:text-white"
                    >
                      Назад
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500">
                      Без обязательств · 1 мин
                    </span>
                  )}

                  {currentStep < TOTAL_STEPS ? (
                    <button
                      type="button"
                      onClick={goNext}
                      className="ml-auto inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#e5c17d] px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#f0d196] active:scale-[0.99]"
                    >
                      Далее
                      <svg
                        viewBox="0 0 20 20"
                        className="h-4 w-4"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="ml-auto inline-flex min-h-[50px] flex-1 items-center justify-center rounded-xl bg-[#e5c17d] px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#f0d196] disabled:opacity-60 sm:flex-initial"
                    >
                      {isSubmitting
                        ? 'Рассчитываем...'
                        : 'Получить расчёт + 3D-дизайн'}
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default QuizLanding;
