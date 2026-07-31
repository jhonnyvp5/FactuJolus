import React, { useState } from 'react';
import { ShieldAlert, KeyRound, Mail, User, Check, Eye, EyeOff, Lock } from 'lucide-react';
import { PortalUser, Invitation } from '../types';
import { logActivity } from '../lib/activityLogger';

interface LoginFormProps {
  onLoginSuccess: (user: PortalUser) => void;
  adminEmail: string;
}

export default function LoginForm({ onLoginSuccess, adminEmail }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // For setting up a new permanent password on first invitation login
  const [pendingInvitation, setPendingInvitation] = useState<Invitation | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError('Por favor complete todos los campos.');
      return;
    }

    // 1. Check existing users in localStorage
    const savedUsersRaw = localStorage.getItem('sri_portal_users');
    let registeredUsers: PortalUser[] = [];
    if (savedUsersRaw) {
      registeredUsers = JSON.parse(savedUsersRaw);
    }

    // Check if matching registered user
    const foundUser = registeredUsers.find(u => u.correo.toLowerCase() === cleanEmail);

    if (foundUser) {
      if (foundUser.clave === password) {
        logActivity(foundUser, 'Inicio de Sesión', `Inicio de sesión exitoso como ${foundUser.role}.`);
        onLoginSuccess(foundUser);
        return;
      } else {
        setError('Contraseña incorrecta.');
        return;
      }
    }

    // 2. If not registered, check if this is the default admin or superadmin login
    if (cleanEmail === 'jolusservices@gmail.com' || cleanEmail === adminEmail.toLowerCase()) {
      const superAdmin: PortalUser = {
        id: 'superadmin-jolusservices',
        correo: 'jolusservices@gmail.com',
        clave: password || 'admin123',
        role: 'SUPERADMIN',
        nombre: 'Anibal Joel Gualoto Indacochea',
        fechaRegistro: new Date().toISOString()
      };

      const idx = registeredUsers.findIndex(u => u.correo.toLowerCase() === 'jolusservices@gmail.com');
      if (idx >= 0) {
        registeredUsers[idx] = superAdmin;
      } else {
        registeredUsers.push(superAdmin);
      }
      localStorage.setItem('sri_portal_users', JSON.stringify(registeredUsers));
      logActivity(superAdmin, 'Inicio de Sesión', 'Acceso al portal con cuenta SUPERADMIN de Administrador Principal.');
      onLoginSuccess(superAdmin);
      return;
    }

    // 3. Check invitations for temporary password
    const savedInvitesRaw = localStorage.getItem('sri_portal_invitations');
    if (savedInvitesRaw) {
      const invitations: Invitation[] = JSON.parse(savedInvitesRaw);
      const matchedInvite = invitations.find(
        inv => inv.correo.toLowerCase() === cleanEmail && 
               inv.claveTemporal === password && 
               inv.estado === 'PENDIENTE'
      );

      if (matchedInvite) {
        // Matched an invitation! User must now set their custom password
        setPendingInvitation(matchedInvite);
        setError(null);
        return;
      }
    }

    setError('Credenciales inválidas o invitación expirada/inexistente.');
  };

  const handleCreatePasswordSubmit = (e: React.FormEvent) => {
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

    // Convert invitation to registered user
    const newUser: PortalUser = {
      id: 'usr-' + Date.now(),
      correo: pendingInvitation.correo,
      clave: newPassword,
      role: pendingInvitation.role,
      nombre: pendingInvitation.nombreInvitado || pendingInvitation.correo.split('@')[0].toUpperCase(),
      fechaRegistro: new Date().toISOString()
    };

    // Update registered users
    const savedUsersRaw = localStorage.getItem('sri_portal_users');
    const registeredUsers: PortalUser[] = savedUsersRaw ? JSON.parse(savedUsersRaw) : [];
    registeredUsers.push(newUser);
    localStorage.setItem('sri_portal_users', JSON.stringify(registeredUsers));

    // Mark invitation as accepted
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

    // Log registration activities
    logActivity(newUser, 'Aceptación de Invitación', `Operador ${newUser.nombre} (${newUser.role}) ha establecido su contraseña.`);
    logActivity(newUser, 'Inicio de Sesión', 'Inicio de sesión automático tras activar su cuenta.');

    // Log the user in
    onLoginSuccess(newUser);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient blue glow background matching the logo spiral */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        
        {/* APP BRANDING LOGO */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="relative group cursor-pointer transition-transform duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-md group-hover:blur-lg transition-all" />
            <svg viewBox="0 0 100 100" className="w-20 h-20 relative z-10 animate-[spin_40s_linear_infinite]" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logoBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="30%" stopColor="#d8f2ff" />
                  <stop offset="70%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#0060d0" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="48" fill="#030d1a" stroke="#0ea5e9" strokeWidth="1.5" strokeOpacity="0.4" />
              {/* Spiral Whirlwind Arms */}
              <path d="M50 14 C25 18 16 45 35 65 C41 71 52 74 62 70 C72 66 79 55 77 44 C75 33 65 24 54 26 C43 28 35 38 38 49 C40 57 48 62 55 59 C61 56 63 48 59 43 C55 39 49 40 48 45 C47 48 50 51 52 50" stroke="url(#logoBlueGrad)" strokeWidth="6" strokeLinecap="round" />
              <path d="M50 20 C32 24 25 45 39 60 C49 71 66 69 74 55 C79 45 74 32 61 28 C50 24 40 32 41 44 C42 51 49 55 54 52 C58 50 59 44 56 41 C53 38 49 40 49 43" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.95" />
              <circle cx="50" cy="50" r="4" fill="#0ea5e9" />
            </svg>
          </div>
          
          <div className="text-center mt-2">
            <span className="font-sans font-black text-2xl tracking-widest text-white block">
              JOLUS
            </span>
            <span className="text-[10px] text-indigo-400 font-bold tracking-[0.4em] uppercase block pl-1.5 mt-0.5">
              SERVICES
            </span>
          </div>
        </div>

        <h2 className="text-center text-xl font-extrabold text-white tracking-tight">
          {pendingInvitation ? 'Configure su Contraseña' : 'Acceso al Portal Tributario'}
        </h2>
        <p className="mt-1.5 text-center text-xs text-zinc-400">
          {pendingInvitation 
            ? 'Bienvenido. Por favor cree una clave única para su cuenta.'
            : 'Ingrese sus credenciales de Emisor o su clave temporal de invitación.'
          }
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-zinc-900 py-8 px-6 shadow-2xl rounded-3xl border border-zinc-850 sm:px-10">

          {error && (
            <div className="mb-4 bg-red-50 text-red-900 dark:bg-red-950/20 dark:text-red-300 p-3.5 rounded-xl border border-red-200 dark:border-red-900/30 text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0"></span>
              {error}
            </div>
          )}

          {/* CHOOSE ROUTINE */}
          {!pendingInvitation ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                  Contraseña / Clave Temporal
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-10 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex justify-center py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/10 focus:outline-none transition cursor-pointer"
                >
                  Ingresar al Portal
                </button>
              </div>

              {/* DEVELOPER DEMO ACCREDITATION */}
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800 space-y-3 bg-gray-50/50 dark:bg-zinc-950/20 p-3.5 rounded-2xl">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-500 block text-center">
                  🔐 Demostración & Cuentas de Prueba
                </span>
                
                <div className="grid grid-cols-1 gap-2.5 text-left font-sans text-[11px] text-gray-500 dark:text-zinc-400">
                  <div className="bg-indigo-50/45 dark:bg-indigo-950/15 p-2.5 rounded-xl border border-indigo-100/30">
                    <span className="font-bold text-indigo-700 dark:text-indigo-400">Perfil ADMINISTRADOR (Acceso Total):</span>
                    <div className="mt-1 font-medium">
                      Correo: <strong className="font-mono text-gray-750 dark:text-zinc-200 select-all">{adminEmail}</strong><br />
                      Clave: <strong className="font-mono text-gray-750 dark:text-zinc-200 select-all">admin123</strong>
                    </div>
                  </div>

                  <div className="bg-amber-50/45 dark:bg-amber-950/10 p-2.5 rounded-xl border border-amber-100/30">
                    <span className="font-bold text-amber-700 dark:text-amber-400">Perfil OPERADOR USER (Acceso Restringido):</span>
                    <div className="mt-1 font-medium">
                      Correo: <strong className="font-mono text-gray-750 dark:text-zinc-200 select-all font-bold">user@sri.com</strong><br />
                      Clave: <strong className="font-mono text-gray-750 dark:text-zinc-200 select-all font-bold">sriuser123</strong>
                    </div>
                    <p className="text-[10px] text-gray-450 dark:text-zinc-500 mt-1.5 leading-relaxed">
                      * El rol <strong>USER</strong> no tiene de acceso a llaves de firma .p12, no puede emitir Notas de Crédito, ni configurar parámetros.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreatePasswordSubmit} className="space-y-4">
              <div className="bg-indigo-50 text-indigo-900 dark:bg-indigo-950/20 dark:text-indigo-300 p-3 rounded-xl border border-indigo-150 border-indigo-200/20 text-xs font-medium">
                🔑 Rol asignado: <strong className="underline uppercase tracking-wide">{pendingInvitation.role}</strong>
                <p className="text-[10px] text-gray-500 mt-1">
                  Correo: {pendingInvitation.correo}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                  Nueva Contraseña Permanente
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Contraseña de operador"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirmación de contraseña"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setPendingInvitation(null)}
                  className="flex-1 text-center py-2.5 px-4 rounded-xl text-xs font-bold text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-850 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 flex justify-center py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/10 focus:outline-none transition cursor-pointer"
                >
                  Validar Registro
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
