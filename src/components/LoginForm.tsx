import React, { useState, useEffect } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  KeyRound,
  Mail,
  Loader2,
  HelpCircle,
  X,
  CheckCircle2,
  Sparkles,
  Newspaper,
  Globe,
  Share2,
  CreditCard,
  Megaphone,
  ArrowRight
} from 'lucide-react';
import { PortalUser, Invitation } from '../types';
import { logActivity } from '../lib/activityLogger';
import { authenticateUserInSupabase, upsertUserInSupabase, getEmpresaByRuc, getEmpresaForUser } from '../lib/supabase';
import SriNewsWidget from './SriNewsWidget';
import { usePlatformSettings } from '../context/PlatformSettingsContext';
import BillingPlansModal from './BillingPlansModal';

interface LoginFormProps {
  onLoginSuccess: (user: PortalUser) => void;
  adminEmail: string;
  inactivityNotice?: string | null;
}

const HERO_SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1400&auto=format&fit=crop',
    alt: 'Asesora Profesional de Facturación SRI',
    tagline: 'Emisión Rápida & Firma XAdES-BES'
  },
  {
    url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1400&auto=format&fit=crop',
    alt: 'Equipo de Gestión Contable y Comercial',
    tagline: 'Facturas, Notas de Crédito & Proformas'
  },
  {
    url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1400&auto=format&fit=crop',
    alt: 'Consultor de Negocios y Finanzas',
    tagline: 'Validación en Línea con SRI Ecuador'
  },
  {
    url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1400&auto=format&fit=crop',
    alt: 'Punto de Venta y Comercio Digital',
    tagline: 'Catastro RIMPE & Seguridad Tributaria'
  }
];

export default function LoginForm({ onLoginSuccess, adminEmail, inactivityNotice }: LoginFormProps) {
  const { settings, themeClasses } = usePlatformSettings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);

  // Background carousel slide state with smooth transitions
  const activeSlides = (settings.loginSlides && settings.loginSlides.filter(s => s.active !== false).length > 0)
    ? settings.loginSlides.filter(s => s.active !== false)
    : HERO_SLIDES;

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % activeSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  // Password Recovery / Help Modal
  const [showForgotModal, setShowForgotModal] = useState(false);

  // For setting up a new permanent password on first invitation login
  const [pendingInvitation, setPendingInvitation] = useState<Invitation | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const checkTenantAccess = async (user: PortalUser): Promise<boolean> => {
    if (user.role?.toUpperCase() === 'SUPERADMIN' || user.correo?.toLowerCase() === 'jhonnyvp5@gmail.com') {
      return true;
    }
    if (user.empresaRuc) {
      const emp = await getEmpresaByRuc(user.empresaRuc);
      if (emp) {
        if (emp.estado === 'SUSPENDIDO') {
          setError(`❌ Acceso Bloqueado: La empresa "${emp.nombreComercial || emp.razonSocial}" está SUSPENDIDA. Solo el SUPERADMIN puede acceder.`);
          return false;
        }
        if (new Date(emp.fechaExpiracion) < new Date()) {
          setError(`❌ Acceso Bloqueado: El servicio de la empresa "${emp.nombreComercial || emp.razonSocial}" expiró el ${emp.fechaExpiracion}. Solo el SUPERADMIN puede acceder.`);
          return false;
        }
      }
    }
    return true;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError('Por favor complete todos los campos.');
      return;
    }

    setIsLoggingIn(true);

    try {
      // 1. Validate in Supabase usuarios_portal
      const supaUser = await authenticateUserInSupabase(cleanEmail, password);

      const savedUsersRaw = localStorage.getItem('sri_portal_users');
      let registeredUsers: PortalUser[] = savedUsersRaw ? JSON.parse(savedUsersRaw) : [];

      if (supaUser) {
        if (!supaUser.empresaRuc) {
          const emp = await getEmpresaForUser(cleanEmail);
          if (emp) {
            supaUser.empresaRuc = emp.ruc;
            supaUser.empresaNombre = emp.nombreComercial || emp.razonSocial;
          }
        }

        const canAccess = await checkTenantAccess(supaUser);
        if (!canAccess) {
          setIsLoggingIn(false);
          return;
        }

        const idx = registeredUsers.findIndex(u => u.correo.toLowerCase() === supaUser.correo.toLowerCase());
        if (idx >= 0) {
          registeredUsers[idx] = supaUser;
        } else {
          registeredUsers.push(supaUser);
        }
        localStorage.setItem('sri_portal_users', JSON.stringify(registeredUsers));

        logActivity(supaUser, 'Inicio de Sesión', `Inicio de sesión exitoso desde Supabase (Rol: ${supaUser.role}).`);
        setIsLoggingIn(false);
        onLoginSuccess(supaUser);
        return;
      }

      // 2. Fallback in local storage
      const foundUser = registeredUsers.find(u => u.correo.toLowerCase() === cleanEmail);

      if (foundUser) {
        if (foundUser.clave === password) {
          if (!foundUser.empresaRuc) {
            const emp = await getEmpresaForUser(cleanEmail);
            if (emp) {
              foundUser.empresaRuc = emp.ruc;
              foundUser.empresaNombre = emp.nombreComercial || emp.razonSocial;
            }
          }

          const canAccess = await checkTenantAccess(foundUser);
          if (!canAccess) {
            setIsLoggingIn(false);
            return;
          }

          logActivity(foundUser, 'Inicio de Sesión', `Inicio de sesión exitoso como ${foundUser.role}.`);
          setIsLoggingIn(false);
          onLoginSuccess(foundUser);
          return;
        } else {
          setIsLoggingIn(false);
          setError('Contraseña incorrecta.');
          return;
        }
      }

      // 3. Fallback admin/superadmin login
      if ((cleanEmail === 'jhonnyvp5@gmail.com' || cleanEmail === adminEmail.toLowerCase()) && password === 'admin123') {
        const isSuper = cleanEmail === 'jhonnyvp5@gmail.com';
        const emp = await getEmpresaForUser(cleanEmail);

        const adminUser: PortalUser = {
          id: isSuper ? 'superadmin-jhonny' : 'admin-local',
          correo: cleanEmail,
          clave: password,
          role: isSuper ? 'SUPERADMIN' : 'ADMIN',
          nombre: isSuper ? 'Jhonny Vargas' : cleanEmail.split('@')[0].toUpperCase(),
          fechaRegistro: new Date().toISOString(),
          empresaRuc: emp?.ruc || (isSuper ? '0952227858001' : undefined),
          empresaNombre: emp?.nombreComercial || emp?.razonSocial || (isSuper ? 'ORIONNX' : undefined)
        };

        const canAccess = await checkTenantAccess(adminUser);
        if (!canAccess) {
          setIsLoggingIn(false);
          return;
        }

        logActivity(adminUser, 'Inicio de Sesión', `Acceso al portal en modo ${adminUser.role.toLowerCase()}.`);
        setIsLoggingIn(false);
        onLoginSuccess(adminUser);
        return;
      }

      // 4. Check invitations for temporary password
      const savedInvitesRaw = localStorage.getItem('sri_portal_invitations');
      if (savedInvitesRaw) {
        const invitations: Invitation[] = JSON.parse(savedInvitesRaw);
        const matchedInvite = invitations.find(
          inv => inv.correo.toLowerCase() === cleanEmail &&
            inv.claveTemporal === password &&
            inv.estado === 'PENDIENTE'
        );

        if (matchedInvite) {
          setPendingInvitation(matchedInvite);
          setIsLoggingIn(false);
          setError(null);
          return;
        }
      }

      setIsLoggingIn(false);
      setError('Credenciales inválidas. Verifique su usuario o contraseña.');
    } catch (err: any) {
      setIsLoggingIn(false);
      setError(`Error al validar usuario: ${err.message || 'Error de conexión'}`);
    }
  };

  const handleCreatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingInvitation) return;
    setError(null);

    if (newPassword.length < 5) {
      setError('La contraseña permanente debe tener al menos 5 caracteres.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    const newUser: PortalUser = {
      id: 'usr-' + Date.now(),
      correo: pendingInvitation.correo,
      clave: newPassword,
      role: pendingInvitation.role,
      nombre: pendingInvitation.nombreInvitado || pendingInvitation.correo.split('@')[0].toUpperCase(),
      fechaRegistro: new Date().toISOString(),
      empresaRuc: pendingInvitation.empresaRuc,
      empresaNombre: pendingInvitation.empresaNombre,
      creadorCorreo: pendingInvitation.creadorCorreo
    };

    const savedUsersRaw = localStorage.getItem('sri_portal_users');
    const registeredUsers: PortalUser[] = savedUsersRaw ? JSON.parse(savedUsersRaw) : [];
    registeredUsers.push(newUser);
    localStorage.setItem('sri_portal_users', JSON.stringify(registeredUsers));

    await upsertUserInSupabase(newUser).catch(err => console.warn('Supabase upsert notice:', err));

    const savedInvitesRaw = localStorage.getItem('sri_portal_invitations');
    if (savedInvitesRaw) {
      const invitations: Invitation[] = JSON.parse(savedInvitesRaw);
      const updatedInv = invitations.map(inv => {
        if (inv.id === pendingInvitation.id) {
          return { ...inv, estado: 'ACEPTADA' as const };
        }
        return inv;
      });
      localStorage.setItem('sri_portal_invitations', JSON.stringify(updatedInv));
    }

    logActivity(newUser, 'Aceptación de Invitación', `Operador ${newUser.nombre} (${newUser.role}) ha establecido su contraseña.`);
    logActivity(newUser, 'Inicio de Sesión', 'Inicio de sesión automático tras activar su cuenta.');

    const canAccess = await checkTenantAccess(newUser);
    if (!canAccess) {
      setIsLoggingIn(false);
      return;
    }

    onLoginSuccess(newUser);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#eef2f7] text-slate-800 font-sans selection:bg-blue-600 selection:text-white relative">
      
      {/* ========================================================================= */}
      {/* TOP ANNOUNCEMENT / PROMOTIONAL BANNER */}
      {/* ========================================================================= */}
      {settings.topBanner?.enabled && settings.modules?.showTopAnnouncementBar !== false && (
        <div
          style={{ backgroundColor: settings.topBanner.bgColor || '#0284c7', color: '#ffffff' }}
          className="relative z-30 px-4 py-2 text-xs font-bold flex items-center justify-between text-center shadow-md animate-fade-in"
        >
          <div className="flex-1 flex items-center justify-center gap-2">
            <Megaphone className="w-4 h-4 animate-bounce shrink-0" />
            {settings.topBanner.badgeText && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-black/20 text-white tracking-wider">
                {settings.topBanner.badgeText}
              </span>
            )}
            <span>{settings.topBanner.message}</span>
            {settings.topBanner.linkText && settings.topBanner.linkUrl && (
              <a
                href={settings.topBanner.linkUrl}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 ml-1 inline-flex items-center gap-1 hover:opacity-80"
              >
                <span>{settings.topBanner.linkText}</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* ========================================================================= */}
        {/* LEFT PANEL: EDITORIAL, BRANDING & LIVE SRI NEWS */}
        {/* ========================================================================= */}
        <div className="lg:w-[54%] xl:w-[52%] bg-gradient-to-b from-[#081b3b] via-[#0b244d] to-[#051329] text-white p-6 sm:p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden min-h-[580px] lg:min-h-screen shadow-2xl">
          
          {/* Ambient Glows and Decorative Visuals */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-1/3 -right-24 w-80 h-80 bg-sky-400/15 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-10 left-1/4 w-72 h-72 bg-indigo-600/20 rounded-full blur-[110px] pointer-events-none" />

          {/* Corporate Background Image Carousel with Smooth Transitions */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {activeSlides.map((slide, idx) => (
              <div
                key={slide.url || idx}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  idx === currentSlideIndex ? 'opacity-85 sm:opacity-90' : 'opacity-0'
                }`}
              >
                <img
                  src={slide.url}
                  alt={slide.alt || 'Slide'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center translate-x-4 sm:translate-x-8 scale-105"
                />
              </div>
            ))}
            {/* Lighter, translucent gradients ensuring clear image visibility while keeping high-contrast readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#06142e]/90 via-[#081b3b]/70 to-[#081b3b]/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#051329]/95 via-transparent to-[#081b3b]/80" />
          </div>

          {/* Floating Action / SRI Badge */}
          <div className="absolute top-32 right-12 hidden md:flex items-center gap-2 p-3 bg-blue-900/60 backdrop-blur-md rounded-2xl border border-blue-400/40 text-xs shadow-2xl">
            <div className="w-8 h-8 rounded-xl bg-blue-500/40 flex items-center justify-center text-cyan-300 shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="block font-bold text-white text-[11px]">SRI Off-line 2.1</span>
              <span className="block text-[9px] text-cyan-200">Firma XAdES-BES</span>
            </div>
          </div>

          {/* TOP BRAND HEADER */}
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Dynamic Logo or Spiral Icon */}
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt={settings.platformName || 'Logo'}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 sm:w-14 sm:h-14 object-contain rounded-xl bg-white/10 p-1 backdrop-blur-sm border border-white/20"
                  />
                ) : (
                  <div className="relative group cursor-pointer">
                    <svg viewBox="0 0 100 100" className="w-12 h-12 sm:w-14 sm:h-14 animate-[spin_40s_linear_infinite]" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="jolusLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#ffffff" />
                          <stop offset="35%" stopColor="#e0f2fe" />
                          <stop offset="70%" stopColor="#38bdf8" />
                          <stop offset="100%" stopColor="#0284c7" />
                        </linearGradient>
                      </defs>
                      <circle cx="50" cy="50" r="48" fill="#041226" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.4" />
                      <path d="M50 14 C25 18 16 45 35 65 C41 71 52 74 62 70 C72 66 79 55 77 44 C75 33 65 24 54 26 C43 28 35 38 38 49 C40 57 48 62 55 59 C61 56 63 48 59 43 C55 39 49 40 48 45 C47 48 50 51 52 50" stroke="url(#jolusLeftGrad)" strokeWidth="6.5" strokeLinecap="round" />
                      <path d="M50 20 C32 24 25 45 39 60 C49 71 66 69 74 55 C79 45 74 32 61 28 C50 24 40 32 41 44 C42 51 49 55 54 52 C58 50 59 44 56 41 C53 38 49 40 49 43" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.95" />
                      <circle cx="50" cy="50" r="4.5" fill="#38bdf8" />
                    </svg>
                  </div>
                )}

                <div>
                  <span className="font-sans font-black text-xl sm:text-2xl tracking-[0.2em] text-white block leading-none">
                    {settings.platformName || 'JOLUS'}
                  </span>
                  <span className="text-[10px] text-cyan-300 font-bold tracking-[0.35em] uppercase block mt-1">
                    {settings.platformTagline || '— SERVICES —'}
                  </span>
                </div>
              </div>

              {/* Plans Button & Slide Indicators */}
              <div className="flex items-center gap-3">
                {settings.modules?.showPlansInLogin !== false && (
                  <button
                    onClick={() => setShowPlansModal(true)}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white text-xs font-black shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Ver Planes de Facturación</span>
                  </button>
                )}

                {activeSlides.length > 1 && (
                  <div className="flex items-center gap-1.5 bg-slate-950/60 px-2.5 py-1 rounded-full border border-blue-400/20">
                    {activeSlides.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlideIndex(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                          i === currentSlideIndex ? 'w-5 bg-cyan-400' : 'w-1.5 bg-slate-600 hover:bg-slate-400'
                        }`}
                        title={`Imagen ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CENTER CONTENT: PLATFORM TITLE & SRI LIVE NEWS */}
          <div className="relative z-10 my-6 sm:my-8 space-y-5">
            
            {/* Main Typography Header */}
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white uppercase leading-tight">
                PORTAL DE FACTURACIÓN ELECTRÓNICA
              </h2>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-12 h-1 bg-sky-400 rounded-full" />
                <span className="text-xs text-blue-200/90 font-medium">
                  {activeSlides[currentSlideIndex]?.tagline || 'Catastro RIMPE & Seguridad Tributaria'}
                </span>
              </div>
            </div>

            {/* SRI LIVE NEWS WIDGET */}
            {settings.modules?.showSriNewsInLogin !== false && (
              <div className="max-w-xl animate-in fade-in duration-300">
                <SriNewsWidget />
              </div>
            )}
          </div>

          {/* BOTTOM FOOTER: SOCIAL ICONS & SRI BADGE */}
          <div className="relative z-10 pt-4 border-t border-blue-400/15 flex flex-wrap items-center justify-between gap-4">
            {settings.modules?.showSocialLinksInLogin !== false && (
              <div className="flex items-center gap-2.5">
                {settings.socialLinks?.facebook && (
                  <a
                    href={settings.socialLinks.facebook}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-sky-600 border border-blue-400/30 flex items-center justify-center text-slate-300 hover:text-white transition duration-200 cursor-pointer"
                    title="Facebook"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                )}

                {settings.socialLinks?.instagram && (
                  <a
                    href={settings.socialLinks.instagram}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-pink-600 border border-blue-400/30 flex items-center justify-center text-slate-300 hover:text-white transition duration-200 cursor-pointer"
                    title="Instagram"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                )}

                {settings.socialLinks?.tiktok && (
                  <a
                    href={settings.socialLinks.tiktok}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-blue-400/30 flex items-center justify-center text-slate-300 hover:text-white transition duration-200 cursor-pointer"
                    title="TikTok"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3 15.28 6.34 6.34 0 0 0 9.34 21.6 6.34 6.34 0 0 0 15.68 15.3V8.71a8.18 8.18 0 0 0 4.91 1.63v-3.5a4.78 4.78 0 0 1-1-.15z" />
                    </svg>
                  </a>
                )}

                {settings.socialLinks?.whatsapp && (
                  <a
                    href={settings.socialLinks.whatsapp}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-emerald-600 border border-blue-400/30 flex items-center justify-center text-slate-300 hover:text-white transition duration-200 cursor-pointer"
                    title="WhatsApp"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                  </a>
                )}
              </div>
            )}

            <div className="text-[10px] text-blue-200/60 text-right">
              {settings.footerCopyright || `© ${new Date().getFullYear()} ORIONNX • Sistema Tributario SRI`}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT PANEL: FLOATING WHITE LOGIN CARD */}
        {/* ========================================================================= */}
        <div className="lg:w-[46%] xl:w-[48%] flex items-center justify-center p-6 sm:p-10 lg:p-12 relative">
          
          {/* Ambient subtle light background */}
          <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-blue-200/30 rounded-full blur-[90px] pointer-events-none" />

          {/* Floating White Card */}
          <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(8,30,65,0.08)] border border-slate-100 p-8 sm:p-10 relative z-10">
            
            {/* Card Header: Custom or Default Logo */}
            <div className="flex flex-col items-center text-center">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.platformName || 'Logo'}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 object-contain rounded-2xl mb-1"
                />
              ) : (
                <div className="w-14 h-14 relative group">
                  <svg viewBox="0 0 100 100" className="w-full h-full animate-[spin_50s_linear_infinite]" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="jolusCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0284c7" />
                        <stop offset="50%" stopColor="#0ea5e9" />
                        <stop offset="100%" stopColor="#38bdf8" />
                      </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="48" fill="#f0f9ff" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.5" />
                    <path d="M50 14 C25 18 16 45 35 65 C41 71 52 74 62 70 C72 66 79 55 77 44 C75 33 65 24 54 26 C43 28 35 38 38 49 C40 57 48 62 55 59 C61 56 63 48 59 43 C55 39 49 40 48 45 C47 48 50 51 52 50" stroke="url(#jolusCardGrad)" strokeWidth="6" strokeLinecap="round" />
                    <path d="M50 20 C32 24 25 45 39 60 C49 71 66 69 74 55 C79 45 74 32 61 28 C50 24 40 32 41 44 C42 51 49 55 54 52 C58 50 59 44 56 41 C53 38 49 40 49 43" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
                    <circle cx="50" cy="50" r="4" fill="#0ea5e9" />
                  </svg>
                </div>
              )}

              <div className="mt-1 text-center">
                <span className="font-sans font-black text-xs tracking-[0.25em] text-slate-800 uppercase block">
                  {settings.platformName || 'JOLUS'}
                </span>
                <span className="text-[8px] text-sky-600 font-bold tracking-[0.3em] uppercase block">
                  {settings.platformTagline || '— SERVICES —'}
                </span>
              </div>

              {/* Title & Subtitle matching the design */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
                {settings.loginWelcomeHeading || 'Bienvenido'}
              </h1>
              <p className="text-sm font-semibold text-sky-500 mt-0.5">
                {settings.loginWelcomeSubheading || 'Ingresa a tu panel'}
              </p>
            </div>

          {/* Inactivity notice banner */}
          {inactivityNotice && (
            <div className="mt-4 bg-amber-50 text-amber-900 p-3 rounded-xl border border-amber-200 text-xs font-semibold flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping mt-1 flex-shrink-0" />
              <span>{inactivityNotice}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* MAIN LOGIN FORM (or Temporary Invitation Setup) */}
          {!pendingInvitation ? (
            <form onSubmit={handleLoginSubmit} className="mt-6 space-y-5">
              
              {/* Field 1: Usuario */}
              <div>
                <div className="relative flex items-center border-b-2 border-slate-200 focus-within:border-blue-600 transition-colors duration-200 pb-1">
                  <div className="pr-2.5 text-slate-400">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Usuario"
                    className="w-full py-2 bg-transparent text-slate-900 placeholder:text-slate-400 text-sm font-medium focus:outline-none"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Field 2: Contraseña */}
              <div>
                <div className="relative flex items-center border-b-2 border-slate-200 focus-within:border-blue-600 transition-colors duration-200 pb-1">
                  <div className="pr-2.5 text-slate-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña"
                    className="w-full py-2 bg-transparent text-slate-900 placeholder:text-slate-400 text-sm font-medium focus:outline-none pr-8"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
                    title={showPassword ? 'Ocultar clave' : 'Mostrar clave'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button: Ingresar */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-lg shadow-blue-600/25 transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Ingresando...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Ingresar
                    </>
                  )}
                </button>
              </div>

              {/* Forgot Password Link (Matching image) */}
              <div className="pt-3 text-center space-y-1">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-sky-600 hover:text-sky-700 font-semibold hover:underline block w-full cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
                <p className="text-[11px] text-slate-400">
                  Cambia tu clave de acceso.
                </p>
              </div>
            </form>
          ) : (
            /* First Time Invitation Password Setup */
            <form onSubmit={handleCreatePasswordSubmit} className="mt-6 space-y-4">
              <div className="bg-sky-50 text-sky-900 p-3 rounded-xl border border-sky-200 text-xs font-medium">
                🔑 Rol asignado: <strong className="uppercase">{pendingInvitation.role}</strong>
                <p className="text-[10px] text-slate-500 mt-1">
                  Establezca su clave permanente para: <strong>{pendingInvitation.correo}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Nueva Contraseña
                </label>
                <div className="relative flex items-center border-b-2 border-slate-200 focus-within:border-blue-600 pb-1">
                  <KeyRound className="h-4 w-4 text-slate-400 mr-2" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 5 caracteres"
                    className="w-full py-1.5 bg-transparent text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Confirmar Contraseña
                </label>
                <div className="relative flex items-center border-b-2 border-slate-200 focus-within:border-blue-600 pb-1">
                  <KeyRound className="h-4 w-4 text-slate-400 mr-2" />
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Repita su contraseña"
                    className="w-full py-1.5 bg-transparent text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPendingInvitation(null)}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-600 border border-slate-300 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                >
                  Guardar y Entrar
                </button>
              </div>
            </form>
          )}

          {/* Quick Demo Accounts Helper (discreet pill for fast testing) */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Acceso rápido:</span>
            <button
              type="button"
              onClick={() => {
                setEmail('jhonnyvp5@gmail.com');
                setPassword('admin123');
              }}
              className="text-sky-600 hover:text-sky-800 font-bold hover:underline cursor-pointer"
            >
              Completar Superadmin (jhonnyvp5@gmail.com)
            </button>
          </div>

        </div>
      </div>
      </div>

      {/* ========================================================================= */}
      {/* FORGOT PASSWORD MODAL */}
      {/* ========================================================================= */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full border border-slate-100 text-slate-800 relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Recuperación de Clave
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Por razones de seguridad tributaria, las contraseñas son gestionadas por el Administrador del Emisor o mediante invitación en la tabla <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono">usuarios_portal</code>.
            </p>

            <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="font-semibold text-slate-700">Opciones disponibles:</div>
              <ul className="list-disc pl-4 text-slate-600 space-y-1 text-[11px]">
                <li>Contacte al administrador de su empresa para solicitar una nueva clave temporal.</li>
                <li>Si es el administrador, puede acceder con su correo emisor configurado o usar su credencial maestra.</li>
              </ul>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BILLING PLANS MODAL */}
      {/* ========================================================================= */}
      <BillingPlansModal
        isOpen={showPlansModal}
        onClose={() => setShowPlansModal(false)}
      />

    </div>
  );
}
