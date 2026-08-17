import React, { useState } from 'react';
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
  Award,
  Globe,
  Share2
} from 'lucide-react';
import { PortalUser, Invitation } from '../types';
import { logActivity } from '../lib/activityLogger';
import { authenticateUserInSupabase, upsertUserInSupabase } from '../lib/supabase';
import SriNewsWidget from './SriNewsWidget';

interface LoginFormProps {
  onLoginSuccess: (user: PortalUser) => void;
  adminEmail: string;
  inactivityNotice?: string | null;
}

export default function LoginForm({ onLoginSuccess, adminEmail, inactivityNotice }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Left sidebar view toggle: 'news' (SRI Noticias) or 'comisiones' (Editorial / Benefits)
  const [leftTab, setLeftTab] = useState<'news' | 'comisiones'>('news');

  // Password Recovery / Help Modal
  const [showForgotModal, setShowForgotModal] = useState(false);

  // For setting up a new permanent password on first invitation login
  const [pendingInvitation, setPendingInvitation] = useState<Invitation | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

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

      // 3. Fallback admin login
      if (cleanEmail === adminEmail.toLowerCase() && password === 'admin123') {
        const adminUser: PortalUser = {
          id: 'admin-local',
          correo: cleanEmail,
          clave: password,
          role: 'ADMIN',
          nombre: cleanEmail.split('@')[0].toUpperCase(),
          fechaRegistro: new Date().toISOString()
        };

        logActivity(adminUser, 'Inicio de Sesión', 'Acceso al portal en modo administrador.');
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
      fechaRegistro: new Date().toISOString()
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

    onLoginSuccess(newUser);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#eef2f7] text-slate-800 font-sans selection:bg-blue-600 selection:text-white relative">
      
      {/* ========================================================================= */}
      {/* LEFT PANEL: EDITORIAL, BRANDING & LIVE SRI NEWS (As shown in reference image) */}
      {/* ========================================================================= */}
      <div className="lg:w-[54%] xl:w-[52%] bg-gradient-to-b from-[#081b3b] via-[#0b244d] to-[#051329] text-white p-6 sm:p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden min-h-[580px] lg:min-h-screen shadow-2xl">
        
        {/* Ambient Glows and Decorative Visuals */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 bg-sky-400/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-10 left-1/4 w-72 h-72 bg-indigo-600/20 rounded-full blur-[110px] pointer-events-none" />

        {/* Corporate Portrait & Tech Aesthetic Overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 sm:opacity-40 lg:opacity-45 mix-blend-luminosity">
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1200&auto=format&fit=crop"
            alt="JOLUS Business Partner"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center translate-x-12 translate-y-6 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#081b3b] via-[#081b3b]/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#051329] via-transparent to-[#081b3b]/80" />
        </div>

        {/* Floating Holographic Vector Badges (as seen in image) */}
        <div className="absolute top-32 right-12 hidden md:flex items-center gap-2 p-3 bg-blue-900/40 backdrop-blur-md rounded-2xl border border-blue-400/30 text-xs shadow-xl animate-pulse">
          <div className="w-8 h-8 rounded-xl bg-blue-500/30 flex items-center justify-center text-cyan-300">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="block font-bold text-white text-[11px]">SRI Off-line 2.1</span>
            <span className="block text-[9px] text-cyan-200">Firma XAdES-BES</span>
          </div>
        </div>

        {/* TOP BRAND HEADER */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            {/* JOLUS Spiral Whirlwind Logo */}
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

            <div>
              <span className="font-sans font-black text-xl sm:text-2xl tracking-[0.2em] text-white block leading-none">
                JOLUS
              </span>
              <span className="text-[10px] text-cyan-300 font-bold tracking-[0.35em] uppercase block mt-1">
                — SERVICES —
              </span>
            </div>
          </div>
        </div>

        {/* CENTER CONTENT: HEADLINES, QUOTE & SRI LIVE NEWS TABS */}
        <div className="relative z-10 my-6 sm:my-8 space-y-6">
          
          {/* Main Typography Header (Matching image) */}
          <div className="space-y-1">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase leading-none">
              COMISIONES
            </h2>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-sky-400 uppercase leading-none">
              PREMIOS
            </h2>
            <div className="w-12 h-1 bg-sky-400 rounded-full mt-3" />
          </div>

          {/* Switcher Tab between "Noticias SRI" and "Comunidad" */}
          <div className="flex items-center gap-2 p-1 bg-slate-950/60 backdrop-blur-md rounded-xl border border-blue-400/20 max-w-fit">
            <button
              onClick={() => setLeftTab('news')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                leftTab === 'news'
                  ? 'bg-sky-500 text-slate-950 shadow-md'
                  : 'text-blue-200 hover:text-white hover:bg-white/5'
              }`}
            >
              <Newspaper className="w-3.5 h-3.5" />
              Novedades SRI Oficial
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </button>
            <button
              onClick={() => setLeftTab('comisiones')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                leftTab === 'comisiones'
                  ? 'bg-sky-500 text-slate-950 shadow-md'
                  : 'text-blue-200 hover:text-white hover:bg-white/5'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Comunidad & Distribuidores
            </button>
          </div>

          {/* TAB 1: SRI LIVE NEWS WIDGET (Connected to SRI updates) */}
          {leftTab === 'news' && (
            <div className="max-w-xl animate-in fade-in duration-300">
              <SriNewsWidget />
            </div>
          )}

          {/* TAB 2: QUOTE & MOTIVATIONAL BANNER (Matching loginJolusNuevo.jpg) */}
          {leftTab === 'comisiones' && (
            <div className="max-w-lg space-y-3 bg-slate-900/40 backdrop-blur-sm p-5 rounded-2xl border border-blue-400/20 animate-in fade-in duration-300">
              <div className="text-4xl sm:text-5xl font-serif text-sky-400 leading-none select-none">
                “
              </div>
              <p className="text-sm sm:text-base font-normal text-slate-200 leading-relaxed italic">
                Súmate a nuestra comunidad de distribuidores y crece con nosotros llevando soluciones digitales seguras y eficientes a todo el país.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs text-sky-300 font-semibold">
                <Sparkles className="w-4 h-4 text-cyan-300" />
                Facturación electrónica autorizada por el SRI Ecuador
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM FOOTER: SOCIAL ICONS & SRI BADGE */}
        <div className="relative z-10 pt-4 border-t border-blue-400/15 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {/* Facebook Icon */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer noopener"
              className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-sky-600 border border-blue-400/30 flex items-center justify-center text-slate-300 hover:text-white transition duration-200 cursor-pointer"
              title="Facebook"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>

            {/* Instagram Icon */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer noopener"
              className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-pink-600 border border-blue-400/30 flex items-center justify-center text-slate-300 hover:text-white transition duration-200 cursor-pointer"
              title="Instagram"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>

            {/* TikTok Icon */}
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noreferrer noopener"
              className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-blue-400/30 flex items-center justify-center text-slate-300 hover:text-white transition duration-200 cursor-pointer"
              title="TikTok"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3 15.28 6.34 6.34 0 0 0 9.34 21.6 6.34 6.34 0 0 0 15.68 15.3V8.71a8.18 8.18 0 0 0 4.91 1.63v-3.5a4.78 4.78 0 0 1-1-.15z" />
              </svg>
            </a>
          </div>

          <div className="text-[10px] text-blue-200/60 text-right">
            © {new Date().getFullYear()} JOLUS Services • Sistema Tributario SRI
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT PANEL: FLOATING WHITE LOGIN CARD (As in loginJolusNuevo.jpg) */}
      {/* ========================================================================= */}
      <div className="lg:w-[46%] xl:w-[48%] flex items-center justify-center p-6 sm:p-10 lg:p-12 relative">
        
        {/* Ambient subtle light background */}
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-blue-200/30 rounded-full blur-[90px] pointer-events-none" />

        {/* Floating White Card */}
        <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(8,30,65,0.08)] border border-slate-100 p-8 sm:p-10 relative z-10">
          
          {/* Card Header: JOLUS Spiral Logo */}
          <div className="flex flex-col items-center text-center">
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

            <div className="mt-1 text-center">
              <span className="font-sans font-black text-xs tracking-[0.25em] text-slate-800 uppercase block">
                JOLUS
              </span>
              <span className="text-[8px] text-sky-600 font-bold tracking-[0.3em] uppercase block">
                — SERVICES —
              </span>
            </div>

            {/* Title & Subtitle matching the design */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
              Bienvenido
            </h1>
            <p className="text-sm font-semibold text-sky-500 mt-0.5">
              Ingresa a tu panel
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
                setEmail(adminEmail || 'jhonnyVP5@gmail.com');
                setPassword('admin123');
              }}
              className="text-sky-600 hover:text-sky-800 font-bold hover:underline cursor-pointer"
            >
              Completar Admin
            </button>
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

    </div>
  );
}
