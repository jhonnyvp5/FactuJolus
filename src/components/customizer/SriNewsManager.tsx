import React, { useState } from 'react';
import { Newspaper, Plus, Edit2, Trash2 } from 'lucide-react';
import { usePlatformSettings } from '../../context/PlatformSettingsContext';
import { CustomNewsItem } from '../../types';
import { modalAlert } from '../../context/ModalAlertContext';

export const SriNewsManager: React.FC = () => {
  const { settings, updateSettings } = usePlatformSettings();

  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [newsFormData, setNewsFormData] = useState<Partial<CustomNewsItem>>({
    title: '',
    summary: '',
    category: 'Facturación Electrónica',
    badgeColor: 'blue',
    date: '15 de Agosto 2026',
    url: 'https://www.sri.gob.ec',
    isHighlight: false,
    source: 'SRI Ecuador',
    active: true
  });

  const handleSaveNews = () => {
    if (!newsFormData.title || !newsFormData.summary) {
      modalAlert.warning('Campos Requeridos', 'Debes ingresar al menos el título y el resumen de la noticia.');
      return;
    }

    if (editingNewsId) {
      const updated = settings.customNews.map(n =>
        n.id === editingNewsId ? { ...n, ...newsFormData } as CustomNewsItem : n
      );
      updateSettings({ customNews: updated });
      modalAlert.success('Noticia Actualizada', 'Noticia actualizada con éxito.');
    } else {
      const newNews: CustomNewsItem = {
        id: `news-${Date.now()}`,
        title: newsFormData.title || '',
        summary: newsFormData.summary || '',
        category: newsFormData.category || 'Facturación Electrónica',
        badgeColor: newsFormData.badgeColor || 'blue',
        date: newsFormData.date || '2026',
        publishedAt: new Date().toISOString(),
        url: newsFormData.url || 'https://www.sri.gob.ec',
        isHighlight: newsFormData.isHighlight || false,
        source: newsFormData.source || 'SRI Ecuador',
        active: true
      };
      updateSettings({ customNews: [newNews, ...settings.customNews] });
      modalAlert.success('Noticia Publicada', 'Nueva noticia publicada con éxito.');
    }

    setEditingNewsId(null);
    setNewsFormData({
      title: '',
      summary: '',
      category: 'Facturación Electrónica',
      badgeColor: 'blue',
      date: '15 de Agosto 2026',
      url: 'https://www.sri.gob.ec',
      isHighlight: false,
      source: 'SRI Ecuador',
      active: true
    });
  };

  const handleDeleteNews = (id: string) => {
    modalAlert.confirm(
      '¿Eliminar Noticia?',
      'Esta noticia desaparecerá del panel y de la pantalla de login.',
      () => {
        const filtered = settings.customNews.filter(n => n.id !== id);
        updateSettings({ customNews: filtered });
        modalAlert.success('Eliminado', 'Noticia eliminada con éxito.');
      },
      true,
      'Sí, Eliminar',
      'Cancelar'
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Gestor de Noticias y Comunicados Tributarios SRI</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Publica y edita las noticias tributarias que aparecen en la barra de noticias del login y en el portal general.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingNewsId(null);
              setNewsFormData({
                title: '',
                summary: '',
                category: 'Facturación Electrónica',
                badgeColor: 'blue',
                date: '15 de Agosto 2026',
                url: 'https://www.sri.gob.ec',
                isHighlight: false,
                source: 'SRI Ecuador',
                active: true
              });
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Noticia</span>
          </button>
        </div>

        {/* FORM FOR ADDING / EDITING NEWS */}
        <div className="p-5 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/30 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
            {editingNewsId ? 'Editar Noticia / Comunicado' : 'Crear Nueva Noticia SRI'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Título de la Noticia
              </label>
              <input
                type="text"
                value={newsFormData.title || ''}
                onChange={(e) => setNewsFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ej: Actualización de Esquema XAdES-BES SRI 2026"
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Categoría
              </label>
              <input
                type="text"
                value={newsFormData.category || ''}
                onChange={(e) => setNewsFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Ej: Facturación Electrónica / IVA 15%"
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Resumen Informativo
              </label>
              <textarea
                rows={2}
                value={newsFormData.summary || ''}
                onChange={(e) => setNewsFormData(prev => ({ ...prev, summary: e.target.value }))}
                placeholder="Breve resumen explicativo del cambio normativo..."
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Fecha de Publicación
              </label>
              <input
                type="text"
                value={newsFormData.date || ''}
                onChange={(e) => setNewsFormData(prev => ({ ...prev, date: e.target.value }))}
                placeholder="Ej: 15 de Agosto 2026"
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Enlace Externo (URL)
              </label>
              <input
                type="text"
                value={newsFormData.url || ''}
                onChange={(e) => setNewsFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://www.sri.gob.ec/..."
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Fuente Oficial
              </label>
              <input
                type="text"
                value={newsFormData.source || ''}
                onChange={(e) => setNewsFormData(prev => ({ ...prev, source: e.target.value }))}
                placeholder="Ej: SRI Dirección General"
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
              />
            </div>

            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={newsFormData.isHighlight || false}
                  onChange={(e) => setNewsFormData(prev => ({ ...prev, isHighlight: e.target.checked }))}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Fijar como Destacada ⭐</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            {editingNewsId && (
              <button
                onClick={() => {
                  setEditingNewsId(null);
                  setNewsFormData({
                    title: '',
                    summary: '',
                    category: 'Facturación Electrónica',
                    badgeColor: 'blue',
                    date: '15 de Agosto 2026',
                    url: 'https://www.sri.gob.ec',
                    isHighlight: false,
                    source: 'SRI Ecuador',
                    active: true
                  });
                }}
                className="px-4 py-2 bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={handleSaveNews}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
            >
              {editingNewsId ? 'Actualizar Noticia' : 'Publicar Noticia'}
            </button>
          </div>
        </div>

        {/* LIST OF ACTIVE NEWS */}
        <div className="space-y-3">
          {settings.customNews.map((newsItem) => (
            <div
              key={newsItem.id}
              className="p-4 bg-white dark:bg-zinc-850 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="space-y-1 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                    {newsItem.category}
                  </span>
                  {newsItem.isHighlight && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                      ⭐ DESTACADA
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 font-medium">
                    {newsItem.date} • {newsItem.source}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {newsItem.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2">
                  {newsItem.summary}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setEditingNewsId(newsItem.id);
                    setNewsFormData(newsItem);
                  }}
                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  title="Editar Noticia"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeleteNews(newsItem.id)}
                  className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 text-red-600 rounded-xl text-xs font-bold transition cursor-pointer"
                  title="Eliminar Noticia"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
