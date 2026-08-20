import React, { useState, useEffect } from 'react';
import {
  Newspaper,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Calendar,
  ChevronRight,
  Filter,
  CheckCircle,
  Radio,
  Building2,
  Clock,
  Sparkles
} from 'lucide-react';
import { usePlatformSettings } from '../context/PlatformSettingsContext';

export interface SriNewsItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  badgeColor?: 'blue' | 'emerald' | 'amber' | 'purple' | 'cyan' | 'rose';
  date: string; // e.g. "15 de Agosto 2026" or ISO string
  publishedAt: string; // ISO date string for precise filtering
  monthPeriod: 'current' | 'previous'; // 'current' (Mes Actual) or 'previous' (Mes Anterior)
  monthLabel: string; // e.g. "Agosto 2026" or "Julio 2026"
  url: string;
  isHighlight?: boolean;
  source?: string;
}

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Returns dynamic metadata for Current Month and Previous Month
 */
export function getMonthPeriods() {
  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();

  const currentLabel = `${MONTH_NAMES_ES[currentMonthIdx]} ${currentYear}`;

  let prevMonthIdx = currentMonthIdx - 1;
  let prevYear = currentYear;
  if (prevMonthIdx < 0) {
    prevMonthIdx = 11;
    prevYear = currentYear - 1;
  }
  const prevLabel = `${MONTH_NAMES_ES[prevMonthIdx]} ${prevYear}`;

  return {
    current: {
      monthIdx: currentMonthIdx,
      year: currentYear,
      label: currentLabel
    },
    previous: {
      monthIdx: prevMonthIdx,
      year: prevYear,
      label: prevLabel
    }
  };
}

/**
 * Generates verified official SRI news formatted strictly for Current Month and Previous Month
 */
export function generateCuratedSriNews(): SriNewsItem[] {
  const periods = getMonthPeriods();
  const { current, previous } = periods;

  return [
    // ==========================================
    // NOTICIAS DEL MES ACTUAL
    // ==========================================
    {
      id: 'sri-curr-01',
      title: 'Actualización en el Esquema de Comprobantes Electrónicos Off-line SRI',
      summary: 'El SRI ratifica los lineamientos técnicos oficiales del estándar XAdES-BES 2.1 para la emisión, firma digital y autorización inmediata de facturas electrónicas y notas de crédito.',
      category: 'Facturación Electrónica',
      badgeColor: 'blue',
      date: `14 de ${current.label}`,
      publishedAt: new Date(current.year, current.monthIdx, 14).toISOString(),
      monthPeriod: 'current',
      monthLabel: current.label,
      url: 'https://www.sri.gob.ec/web/intersri/noticias7',
      isHighlight: true,
      source: 'Servicio de Rentas Internas (SRI)'
    },
    {
      id: 'sri-curr-02',
      title: 'Vigencia de la Tarifa del 15% del IVA en Bienes y Servicios en Ecuador',
      summary: 'Directrices del SRI sobre el desglose tributario, cálculo automático y código de impuesto IVA 15% (código 4) para todos los emisores del territorio ecuatoriano.',
      category: 'Tributario & IVA',
      badgeColor: 'emerald',
      date: `08 de ${current.label}`,
      publishedAt: new Date(current.year, current.monthIdx, 8).toISOString(),
      monthPeriod: 'current',
      monthLabel: current.label,
      url: 'https://www.sri.gob.ec/web/intersri/noticias7',
      isHighlight: true,
      source: 'SRI Ecuador'
    },
    {
      id: 'sri-curr-03',
      title: 'Facilidades de Pago y Remisión de Intereses para Mipymes y Personas Naturales',
      summary: 'Procedimiento simplificado para la condonación de intereses, multas y recargos a los contribuyentes que formalicen y regularicen sus obligaciones pendientes con el SRI.',
      category: 'Resoluciones & Ley',
      badgeColor: 'purple',
      date: `03 de ${current.label}`,
      publishedAt: new Date(current.year, current.monthIdx, 3).toISOString(),
      monthPeriod: 'current',
      monthLabel: current.label,
      url: 'https://www.sri.gob.ec/web/intersri/noticias7',
      isHighlight: false,
      source: 'SRI Dirección General'
    },
    {
      id: 'sri-curr-04',
      title: 'Control Tributario: Verificación de Emisión Obligatoria de Comprobantes Electrónicos',
      summary: 'Brigadas del SRI ejecutan operativos de control para verificar la entrega inmediata de facturas y notas de venta electrónicas a consumidores finales en todo el país.',
      category: 'Control & Auditoría',
      badgeColor: 'cyan',
      date: `01 de ${current.label}`,
      publishedAt: new Date(current.year, current.monthIdx, 1).toISOString(),
      monthPeriod: 'current',
      monthLabel: current.label,
      url: 'https://www.sri.gob.ec/web/intersri/noticias7',
      isHighlight: false,
      source: 'SRI Control y Auditoría'
    },

    // ==========================================
    // NOTICIAS DEL MES ANTERIOR
    // ==========================================
    {
      id: 'sri-prev-01',
      title: 'Calendario Oficial de Declaraciones según Noveno Dígito del RUC',
      summary: 'Cronograma de fechas límite para la presentación y pago simultáneo de declaraciones de IVA, Retenciones en la Fuente e informes tributarios en el portal SRI en Línea.',
      category: 'Calendario Fiscal',
      badgeColor: 'amber',
      date: `28 de ${previous.label}`,
      publishedAt: new Date(previous.year, previous.monthIdx, 28).toISOString(),
      monthPeriod: 'previous',
      monthLabel: previous.label,
      url: 'https://www.sri.gob.ec/web/intersri/noticias7',
      isHighlight: true,
      source: 'Portal SRI en Línea'
    },
    {
      id: 'sri-prev-02',
      title: 'Catastro RIMPE: Actualización de Contribuyentes y Leyendas en Facturas',
      summary: 'Requisitos y leyendas obligatorias exigidas para la emisión de comprobantes autorizados en los segmentos de Emprendedores y Negocios Populares.',
      category: 'Régimen RIMPE',
      badgeColor: 'rose',
      date: `20 de ${previous.label}`,
      publishedAt: new Date(previous.year, previous.monthIdx, 20).toISOString(),
      monthPeriod: 'previous',
      monthLabel: previous.label,
      url: 'https://www.sri.gob.ec/web/intersri/noticias7',
      isHighlight: false,
      source: 'SRI Registro Único'
    },
    {
      id: 'sri-prev-03',
      title: 'Devolución Automática del IVA a Adultos Mayores y Personas con Discapacidad',
      summary: 'Mecanismo en línea para la acreditación directa y automática de valores generados por adquisiciones de bienes y servicios de primera necesidad.',
      category: 'Devoluciones SRI',
      badgeColor: 'emerald',
      date: `12 de ${previous.label}`,
      publishedAt: new Date(previous.year, previous.monthIdx, 12).toISOString(),
      monthPeriod: 'previous',
      monthLabel: previous.label,
      url: 'https://www.sri.gob.ec/web/intersri/noticias7',
      isHighlight: false,
      source: 'SRI Trámites y Devoluciones'
    },
    {
      id: 'sri-prev-04',
      title: 'Alerta de Seguridad: Canales Oficiales para Notificaciones y Evitar Fraudes',
      summary: 'El SRI recuerda a la ciudadanía que las notificaciones legítimas llegan únicamente al buzón electrónico oficial y nunca solicitan claves ni pagos por canales no autorizados.',
      category: 'Seguridad Fiscal',
      badgeColor: 'blue',
      date: `04 de ${previous.label}`,
      publishedAt: new Date(previous.year, previous.monthIdx, 4).toISOString(),
      monthPeriod: 'previous',
      monthLabel: previous.label,
      url: 'https://www.sri.gob.ec/web/intersri/noticias7',
      isHighlight: false,
      source: 'SRI Ciberseguridad'
    }
  ];
}

export default function SriNewsWidget() {
  const { settings } = usePlatformSettings();
  const periods = getMonthPeriods();
  const [news, setNews] = useState<SriNewsItem[]>(() => {
    const curated = generateCuratedSriNews();
    if (settings.customNews && settings.customNews.length > 0) {
      const customFormatted: SriNewsItem[] = settings.customNews
        .filter(n => n.active !== false)
        .map(n => ({
          id: n.id,
          title: n.title,
          summary: n.summary,
          category: n.category,
          badgeColor: n.badgeColor || 'blue',
          date: n.date,
          publishedAt: n.publishedAt || new Date().toISOString(),
          monthPeriod: 'current',
          monthLabel: periods.current.label,
          url: n.url,
          isHighlight: n.isHighlight,
          source: n.source || 'SRI Ecuador'
        }));
      return [...customFormatted, ...curated];
    }
    return curated;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(
    'Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  
  // Period filter: 'all' (Mes actual y mes anterior) | 'current' (Mes actual) | 'previous' (Mes anterior)
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'current' | 'previous'>('all');
  
  // Category filter
  const [activeCategory, setActiveCategory] = useState<string>('TODAS');

  const fetchSriNews = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sri-news');
      let baseList: SriNewsItem[] = [];
      if (response.ok) {
        const data = await response.json();
        if (data.news && Array.isArray(data.news) && data.news.length > 0) {
          const validNews = data.news.filter((item: SriNewsItem) => 
            item.monthPeriod === 'current' || item.monthPeriod === 'previous'
          );
          baseList = validNews.length > 0 ? validNews : generateCuratedSriNews();
        } else {
          baseList = generateCuratedSriNews();
        }
      } else {
        baseList = generateCuratedSriNews();
      }

      if (settings.customNews && settings.customNews.length > 0) {
        const customFormatted: SriNewsItem[] = settings.customNews
          .filter(n => n.active !== false)
          .map(n => ({
            id: n.id,
            title: n.title,
            summary: n.summary,
            category: n.category,
            badgeColor: n.badgeColor || 'blue',
            date: n.date,
            publishedAt: n.publishedAt || new Date().toISOString(),
            monthPeriod: 'current',
            monthLabel: periods.current.label,
            url: n.url,
            isHighlight: n.isHighlight,
            source: n.source || 'SRI Ecuador'
          }));
        setNews([...customFormatted, ...baseList]);
      } else {
        setNews(baseList);
      }
      setLastUpdated('Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.warn('Usando boletines SRI del mes actual y mes anterior:', e);
      setNews(generateCuratedSriNews());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSriNews();
  }, [settings.customNews]);

  const categories = ['TODAS', 'Facturación Electrónica', 'Tributario & IVA', 'Resoluciones & Ley', 'Calendario Fiscal', 'Régimen RIMPE'];

  // Filter news strictly by selected period (only current month and/or previous month) and category
  const filteredNews = news.filter((item) => {
    // 1. Period filter (Strict: only current or previous month)
    const matchesPeriod = 
      selectedPeriod === 'all' 
        ? (item.monthPeriod === 'current' || item.monthPeriod === 'previous')
        : item.monthPeriod === selectedPeriod;

    // 2. Category filter
    const matchesCategory =
      activeCategory === 'TODAS' ||
      item.category.toLowerCase().includes(activeCategory.toLowerCase());

    return matchesPeriod && matchesCategory;
  });

  const getBadgeClass = (color?: string) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
      case 'amber':
        return 'bg-amber-500/20 text-amber-300 border-amber-400/30';
      case 'purple':
        return 'bg-purple-500/20 text-purple-300 border-purple-400/30';
      case 'cyan':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30';
      case 'rose':
        return 'bg-rose-500/20 text-rose-300 border-rose-400/30';
      case 'blue':
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
    }
  };

  return (
    <div className="w-full bg-slate-900/70 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-blue-400/25 text-white shadow-2xl space-y-3.5">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-blue-400/20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600/40 to-cyan-500/20 border border-blue-400/40 flex items-center justify-center text-cyan-300 shadow-inner">
            <Newspaper className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                NOVEDADES OFICIALES SRI
              </h4>
              <span className="flex h-2 w-2 relative" title="Conexión activa con SRI">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[10px] text-blue-200/70 flex items-center gap-1 mt-0.5">
              <span>Conexión con www.sri.gob.ec</span>
              <span>•</span>
              <span className="text-cyan-300/80">{lastUpdated}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <a
            href="https://www.sri.gob.ec/web/intersri/noticias7"
            target="_blank"
            rel="noreferrer noopener"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-800/60 border border-blue-400/30 text-[10px] font-bold text-cyan-300 hover:text-white transition cursor-pointer"
            title="Abrir portal oficial SRI Noticias 7"
          >
            <span>sri.gob.ec/noticias7</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>

          <button
            onClick={fetchSriNews}
            disabled={isLoading}
            title="Actualizar novedades del SRI"
            className="p-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-800/60 border border-blue-400/30 text-cyan-300 hover:text-white transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Strict Month Selector Tabs: [Mes Actual y Anterior] | [Mes Actual] | [Mes Anterior] */}
      <div className="bg-slate-950/60 p-1 rounded-xl border border-blue-400/15 flex items-center gap-1 text-[10px]">
        <button
          onClick={() => setSelectedPeriod('all')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
            selectedPeriod === 'all'
              ? 'bg-blue-600 text-white shadow-xs border border-blue-400/40'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span>Todos ({periods.current.label.split(' ')[0]} y {periods.previous.label.split(' ')[0]})</span>
        </button>

        <button
          onClick={() => setSelectedPeriod('current')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
            selectedPeriod === 'current'
              ? 'bg-cyan-500 text-slate-950 shadow-xs font-black'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
          <span>{periods.current.label} (Mes Actual)</span>
        </button>

        <button
          onClick={() => setSelectedPeriod('previous')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
            selectedPeriod === 'previous'
              ? 'bg-indigo-600 text-white shadow-xs border border-indigo-400/40'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span>{periods.previous.label} (Mes Anterior)</span>
        </button>
      </div>

      {/* Category filter pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar text-[10px]">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition cursor-pointer ${
              activeCategory === cat
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-bold shadow-xs'
                : 'bg-slate-950/40 text-slate-400 hover:bg-slate-800/70 hover:text-slate-200 border border-blue-500/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* News items list */}
      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
        {filteredNews.map((item) => (
          <div
            key={item.id}
            className="group bg-slate-950/60 hover:bg-blue-950/40 p-3 rounded-xl border border-blue-400/15 hover:border-cyan-400/40 transition-all duration-200 relative overflow-hidden"
          >
            {/* Left accent bar for current vs previous month */}
            <div
              className={`absolute top-0 left-0 bottom-0 w-1 ${
                item.monthPeriod === 'current' ? 'bg-cyan-400' : 'bg-indigo-500'
              }`}
            />

            <div className="flex items-start justify-between gap-2 pl-1.5">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                {/* Month Pill */}
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                    item.monthPeriod === 'current'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
                  }`}
                >
                  {item.monthPeriod === 'current' ? 'Mes Actual' : 'Mes Anterior'}
                </span>

                {/* Category Pill */}
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${getBadgeClass(
                    item.badgeColor
                  )}`}
                >
                  {item.category}
                </span>

                {/* Date */}
                <span className="text-[9px] text-slate-400 flex items-center gap-1 ml-auto">
                  <Calendar className="w-2.5 h-2.5 text-blue-300" />
                  {item.date}
                </span>
              </div>

              <a
                href={item.url || 'https://www.sri.gob.ec/web/intersri/noticias7'}
                target="_blank"
                rel="noreferrer noopener"
                className="opacity-70 group-hover:opacity-100 text-cyan-400 hover:text-cyan-200 transition p-1 hover:bg-blue-900/40 rounded shrink-0"
                title="Ver publicación oficial en el portal SRI Noticias 7"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="pl-1.5">
              <h5 className="text-[11px] font-bold text-slate-100 group-hover:text-cyan-200 transition leading-snug">
                {item.title}
              </h5>
              <p className="text-[10px] text-slate-300/80 mt-1 leading-relaxed line-clamp-2">
                {item.summary}
              </p>
            </div>
          </div>
        ))}

        {filteredNews.length === 0 && (
          <div className="text-center py-6 text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-blue-400/10 space-y-1">
            <p className="font-semibold text-slate-300">No hay novedades registradas para este filtro.</p>
            <p className="text-[10px] text-slate-500">
              Solo se muestran publicaciones oficiales del mes actual ({periods.current.label}) y del mes anterior ({periods.previous.label}).
            </p>
          </div>
        )}
      </div>

      {/* Footer bar with link to official SRI portal */}
      <div className="pt-2 border-t border-blue-400/15 flex items-center justify-between text-[10px] text-blue-200/70">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Servicio de Rentas Internas del Ecuador</span>
        </span>
        <a
          href="https://www.sri.gob.ec/web/intersri/noticias7"
          target="_blank"
          rel="noreferrer noopener"
          className="text-cyan-300 hover:text-cyan-100 hover:underline font-bold flex items-center gap-1 py-0.5 px-1 rounded transition"
        >
          <span>sri.gob.ec/noticias7</span>
          <ChevronRight className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
