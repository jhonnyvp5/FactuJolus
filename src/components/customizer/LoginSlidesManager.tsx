import React, { useState } from 'react';
import { Sliders, Plus, Upload, Edit2, Trash2 } from 'lucide-react';
import { usePlatformSettings } from '../../context/PlatformSettingsContext';
import { LoginSlideItem } from '../../types';
import { modalAlert } from '../../context/ModalAlertContext';

export const LoginSlidesManager: React.FC = () => {
  const { settings, updateSettings } = usePlatformSettings();

  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [slideFormData, setSlideFormData] = useState<Partial<LoginSlideItem>>({
    url: '',
    tagline: '',
    alt: '',
    subtitle: '',
    active: true
  });

  const handleSlideImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        modalAlert.warning('Tamaño Excedido', 'La imagen para la diapositiva no debe superar 3MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setSlideFormData(prev => ({ ...prev, url: reader.result as string }));
        modalAlert.success('Imagen Cargada', 'Imagen cargada correctamente en el formulario.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSlide = () => {
    if (!slideFormData.url) {
      modalAlert.warning('URL Requerida', 'Debes ingresar una URL de imagen o subir un archivo.');
      return;
    }

    if (editingSlideId) {
      const updated = settings.loginSlides.map(s =>
        s.id === editingSlideId ? { ...s, ...slideFormData } as LoginSlideItem : s
      );
      updateSettings({ loginSlides: updated });
      modalAlert.success('Slide Actualizado', 'Diapositiva actualizada con éxito.');
    } else {
      const newSlide: LoginSlideItem = {
        id: `slide-${Date.now()}`,
        url: slideFormData.url || '',
        tagline: slideFormData.tagline || 'Facturación Rápida & Segura',
        alt: slideFormData.alt || 'Slide Login',
        subtitle: slideFormData.subtitle || 'Emite comprobantes autorizados por el SRI al instante.',
        active: true
      };
      updateSettings({ loginSlides: [...settings.loginSlides, newSlide] });
      modalAlert.success('Slide Añadido', 'Nueva diapositiva añadida con éxito.');
    }

    setEditingSlideId(null);
    setSlideFormData({ url: '', tagline: '', alt: '', subtitle: '', active: true });
  };

  const handleDeleteSlide = (id: string) => {
    if (settings.loginSlides.length <= 1) {
      modalAlert.warning('Límite Mínimo', 'Debe haber al menos una diapositiva en el carrusel de login.');
      return;
    }
    modalAlert.confirm(
      '¿Eliminar Diapositiva?',
      'Esta imagen ya no aparecerá en el carrusel de la pantalla de bienvenida.',
      () => {
        const filtered = settings.loginSlides.filter(s => s.id !== id);
        updateSettings({ loginSlides: filtered });
        modalAlert.success('Eliminado', 'Diapositiva eliminada con éxito.');
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
              <Sliders className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>Carrusel de Imágenes & Lemas (Pantalla de Login)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Personaliza las fotografías publicitarias y mensajes visuales que acompañan la pantalla de inicio de sesión.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingSlideId(null);
              setSlideFormData({ url: '', tagline: '', alt: '', subtitle: '', active: true });
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Nuevo Slide</span>
          </button>
        </div>

        {/* FORM FOR ADDING / EDITING SLIDE */}
        <div className="p-5 bg-purple-50/40 dark:bg-purple-950/20 rounded-2xl border border-purple-200/60 dark:border-purple-900/30 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-purple-900 dark:text-purple-300">
            {editingSlideId ? 'Editar Diapositiva' : 'Nueva Diapositiva'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                URL de la Imagen (o sube un archivo abajo)
              </label>
              <input
                type="text"
                value={slideFormData.url || ''}
                onChange={(e) => setSlideFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
              />
            </div>

            <div className="flex items-end">
              <label className="w-full px-4 py-2 bg-white dark:bg-zinc-800 hover:bg-slate-50 text-slate-700 dark:text-zinc-200 font-bold text-xs rounded-xl border border-slate-300 dark:border-zinc-700 transition cursor-pointer flex items-center justify-center gap-2">
                <Upload className="w-3.5 h-3.5 text-purple-600" />
                <span>Subir desde mi PC</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSlideImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Lema / Título Principal (Tagline)
              </label>
              <input
                type="text"
                value={slideFormData.tagline || ''}
                onChange={(e) => setSlideFormData(prev => ({ ...prev, tagline: e.target.value }))}
                placeholder="Ej: Emisión Rápida & Firma XAdES-BES"
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Subtítulo / Descripción
              </label>
              <input
                type="text"
                value={slideFormData.subtitle || ''}
                onChange={(e) => setSlideFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Ej: Validación inmediata ante el SRI..."
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Descripción Accesible (Alt Text)
              </label>
              <input
                type="text"
                value={slideFormData.alt || ''}
                onChange={(e) => setSlideFormData(prev => ({ ...prev, alt: e.target.value }))}
                placeholder="Ej: Asesora Profesional SRI"
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            {editingSlideId && (
              <button
                onClick={() => {
                  setEditingSlideId(null);
                  setSlideFormData({ url: '', tagline: '', alt: '', subtitle: '', active: true });
                }}
                className="px-4 py-2 bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={handleSaveSlide}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
            >
              {editingSlideId ? 'Actualizar Diapositiva' : 'Guardar Diapositiva'}
            </button>
          </div>
        </div>

        {/* LIST OF CURRENT SLIDES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {settings.loginSlides.map((slide, index) => (
            <div
              key={slide.id}
              className="group relative bg-white dark:bg-zinc-850 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col"
            >
              <div className="relative h-36 bg-slate-900 overflow-hidden">
                <img
                  src={slide.url}
                  alt={slide.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold">
                  Slide #{index + 1}
                </span>
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h5 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">
                    {slide.tagline}
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 mt-0.5">
                    {slide.subtitle || slide.alt}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <button
                    onClick={() => {
                      setEditingSlideId(slide.id);
                      setSlideFormData(slide);
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => handleDeleteSlide(slide.id)}
                    className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
