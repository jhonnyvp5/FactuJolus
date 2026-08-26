import React from 'react';
import { Share2, Globe, MessageSquare, Facebook, Instagram, Linkedin, Mail, Phone, Video } from 'lucide-react';
import { usePlatformSettings } from '../../context/PlatformSettingsContext';

export const SocialChannelsEditor: React.FC = () => {
  const { settings, updateSettings } = usePlatformSettings();

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
      <div>
        <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Share2 className="w-5 h-5 text-pink-600 dark:text-pink-400" />
          <span>Enlaces de Redes Sociales & Soporte Corporativo</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
          Configura los accesos directos a tus canales de contacto que se muestran en el pie de página y en la pantalla de acceso.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-emerald-500" />
            <span>Número de WhatsApp Oficial (con código de país)</span>
          </label>
          <input
            type="text"
            value={settings.socialLinks.whatsapp || ''}
            onChange={(e) => updateSettings({
              socialLinks: { ...settings.socialLinks, whatsapp: e.target.value }
            })}
            placeholder="Ej: 593995831920"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <Facebook className="w-4 h-4 text-blue-600" />
            <span>Facebook (URL Completa)</span>
          </label>
          <input
            type="text"
            value={settings.socialLinks.facebook || ''}
            onChange={(e) => updateSettings({
              socialLinks: { ...settings.socialLinks, facebook: e.target.value }
            })}
            placeholder="https://facebook.com/orionnx.sri"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <Instagram className="w-4 h-4 text-pink-500" />
            <span>Instagram (URL Completa)</span>
          </label>
          <input
            type="text"
            value={settings.socialLinks.instagram || ''}
            onChange={(e) => updateSettings({
              socialLinks: { ...settings.socialLinks, instagram: e.target.value }
            })}
            placeholder="https://instagram.com/orionnx_sri"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <Video className="w-4 h-4 text-black dark:text-white" />
            <span>TikTok (URL Completa)</span>
          </label>
          <input
            type="text"
            value={settings.socialLinks.tiktok || ''}
            onChange={(e) => updateSettings({
              socialLinks: { ...settings.socialLinks, tiktok: e.target.value }
            })}
            placeholder="https://tiktok.com/@orionnx_factura"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <Linkedin className="w-4 h-4 text-sky-600" />
            <span>LinkedIn (URL Completa)</span>
          </label>
          <input
            type="text"
            value={settings.socialLinks.linkedin || ''}
            onChange={(e) => updateSettings({
              socialLinks: { ...settings.socialLinks, linkedin: e.target.value }
            })}
            placeholder="https://linkedin.com/company/orionnx-sri"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-indigo-500" />
            <span>Sitio Web Oficial</span>
          </label>
          <input
            type="text"
            value={settings.socialLinks.website || ''}
            onChange={(e) => updateSettings({
              socialLinks: { ...settings.socialLinks, website: e.target.value }
            })}
            placeholder="https://www.orionnxservices.com"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-purple-500" />
            <span>Correo Electrónico de Soporte</span>
          </label>
          <input
            type="email"
            value={settings.socialLinks.email || ''}
            onChange={(e) => updateSettings({
              socialLinks: { ...settings.socialLinks, email: e.target.value }
            })}
            placeholder="soporte@orionnxservices.com"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-emerald-500" />
            <span>Teléfono de Atención</span>
          </label>
          <input
            type="text"
            value={settings.socialLinks.phone || ''}
            onChange={(e) => updateSettings({
              socialLinks: { ...settings.socialLinks, phone: e.target.value }
            })}
            placeholder="+593 99 583 1920"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium"
          />
        </div>
      </div>
    </div>
  );
};
