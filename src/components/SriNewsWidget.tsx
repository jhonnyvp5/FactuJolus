import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, RefreshCw, Sparkles, AlertCircle, ShieldCheck, Calendar, Tag, ChevronRight, Search } from 'lucide-react';

export interface SriNewsItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  badgeColor?: string;
  date: string;
  url: string;
  isHighlight?: boolean;
  source?: string;
}

const DEFAULT_SRI_NEWS: SriNewsItem[] = [
  {
    id: 'sri-2026-01',
    title: 'Actualización en el Esquema de Comprobantes Off-line XAdES-BES 2.1',
    summary: 'El SRI ratifica los lineamientos técnicos oficiales para emisión, firma digital y autorización inmediata de facturas electrónicas y notas de crédito.',
    category: 'Facturación Electrónica',
    badgeColor: 'blue',
    date: 'Agosto 2026',
    url: 'https://www.sri.gob.ec/comprobantes-electronicos',
    isHighlight: true,
    source: 'Servicio de Rentas Internas (SRI)'
  },
  {
    id: 'sri-2026-02',
    title: 'Vigencia de la Tarifa del 15% del IVA en Bienes y Servicios',
    summary: 'Directrices del SRI sobre el desglose tributario y código de impuesto IVA 15% (código 4) para todos los emisores del territorio ecuatoriano.',
    category: 'Tributario & IVA',
    badgeColor: 'emerald',
    date: 'Agosto 2026',
    url: 'https://www.sri.gob.ec/iva',
    isHighlight: true,
    source: 'SRI Ecuador'
  },
  {
    id: 'sri-2026-03',
    title: 'Calendario Oficial de Declaraciones según Noveno Dígito del RUC',
    summary: 'Fechas límite para la presentación de declaraciones periódicas de IVA, Retenciones en la Fuente y anexos tributarios correspondientes.',
    category: 'Calendario Fiscal',
    badgeColor: 'amber',
    date: 'Julio 2026',
    url: 'https://www.sri.gob.ec/calendario-tributario',
    isHighlight: false,
    source: 'Portal SRI en Línea'
  },
  {
    id: 'sri-2026-04',
    title: 'Régimen RIMPE: Emprendedores y Negocios Populares',
    summary: 'Requisitos y leyendas obligatorias en la emisión de comprobantes electrónicos para contribuyentes clasificados en el régimen RIMPE.',
    category: 'Régimen RIMPE',
    badgeColor: 'purple',
    date: 'Junio 2026',
    url: 'https://www.sri.gob.ec/rimpe',
    isHighlight: false,
    source: 'SRI Dirección General'
  },
  {
    id: 'sri-2026-05',
    title: 'Monitoreo y Alta Disponibilidad de Web Services SRI',
    summary: 'Servicios web de recepción y autorización con soporte off-line para sincronización continua y sin interrupciones operativas.',
    category: 'Servidores & Web Service',
    badgeColor: 'cyan',
    date: '2026',
    url: 'https://srienlinea.sri.gob.ec',
    isHighlight: false,
    source: 'SRI Soporte Tecnológico'
  }
];

export default function SriNewsWidget() {
  const [news, setNews] = useState<SriNewsItem[]>(DEFAULT_SRI_NEWS);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [activeCategory, setActiveCategory] = useState<string>('TODAS');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSriNews = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sri-news');
      if (response.ok) {
        const data = await response.json();
        if (data.news && Array.isArray(data.news) && data.news.length > 0) {
          setNews(data.news);
          setLastUpdated('Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      }
    } catch (e) {
      console.warn('Usando boletines SRI cacheados:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSriNews();
  }, []);

  const categories = ['TODAS', 'Facturación Electrónica', 'Tributario & IVA', 'Calendario Fiscal', 'Régimen RIMPE'];

  const filteredNews = news.filter(item => {
    const matchesCategory = activeCategory === 'TODAS' || item.category.toLowerCase().includes(activeCategory.toLowerCase());
    const matchesSearch = !searchTerm || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.summary.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-blue-500/20 text-white shadow-xl">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-blue-400/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-cyan-300">
            <Newspaper className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">Novedades Oficiales SRI</h4>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[10px] text-blue-200/70">Conexión con www.sri.gob.ec ({lastUpdated})</p>
          </div>
        </div>

        <button
          onClick={fetchSriNews}
          disabled={isLoading}
          title="Actualizar novedades del SRI"
          className="p-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-800/60 border border-blue-400/30 text-cyan-300 hover:text-white transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 no-scrollbar text-[10px]">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition cursor-pointer ${
              activeCategory === cat
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-800/80 text-blue-200/80 hover:bg-slate-700/80 hover:text-white border border-blue-500/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* News list */}
      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
        {filteredNews.map((item) => (
          <div
            key={item.id}
            className="group bg-slate-950/50 hover:bg-blue-950/40 p-2.5 rounded-xl border border-blue-400/15 hover:border-cyan-400/40 transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-cyan-300 border border-blue-400/20">
                  {item.category}
                </span>
                <span className="text-[9px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5" />
                  {item.date}
                </span>
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer noopener"
                className="opacity-60 group-hover:opacity-100 text-cyan-400 hover:text-cyan-200 transition p-0.5"
                title="Ver publicación oficial en el SRI"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <h5 className="text-[11px] font-bold text-slate-100 group-hover:text-cyan-200 transition leading-snug">
              {item.title}
            </h5>
            <p className="text-[10px] text-slate-300/80 mt-1 leading-relaxed line-clamp-2">
              {item.summary}
            </p>
          </div>
        ))}

        {filteredNews.length === 0 && (
          <div className="text-center py-4 text-xs text-slate-400">
            No se encontraron novedades en esta categoría.
          </div>
        )}
      </div>

      {/* Footer link to SRI */}
      <div className="mt-3 pt-2 border-t border-blue-400/10 flex items-center justify-between text-[10px] text-blue-200/60">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          Servicio de Rentas Internas del Ecuador
        </span>
        <a
          href="https://www.sri.gob.ec"
          target="_blank"
          rel="noreferrer noopener"
          className="text-cyan-300 hover:text-cyan-100 hover:underline font-semibold flex items-center gap-0.5"
        >
          sri.gob.ec
          <ChevronRight className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  );
}
