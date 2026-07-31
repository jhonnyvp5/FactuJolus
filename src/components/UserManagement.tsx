import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Key, Check, ShieldCheck, Mail, Clipboard, AlertCircle, FileText, History, RefreshCw, User, Lock, Unlock, Settings, Package, ArrowLeftRight, Plus, GripVertical, ArrowRight, ArrowLeft, Sliders, CheckSquare } from 'lucide-react';
import { PortalUser, Invitation, UserRole, ActivityLog } from '../types';
import { getLogs, logActivity } from '../lib/activityLogger';

interface UserManagementProps {
  currentUser: PortalUser;
  userPermissions: string[];
  onUpdatePermissions: (perms: string[]) => void;
}

export default function UserManagement({ currentUser, userPermissions, onUpdatePermissions }: UserManagementProps) {
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [permissionMode, setPermissionMode] = useState<'marking' | 'moving'>('marking');

  // Creation form states
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('USER');
  const [generatedInvite, setGeneratedInvite] = useState<Invitation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // 1. Registered Users
    const savedUsers = localStorage.getItem('sri_portal_users');
    let uList: PortalUser[] = [];
    if (savedUsers) {
      uList = JSON.parse(savedUsers);
    } else {
      if (currentUser) {
        uList.push(currentUser);
      }
    }

    // Ensure SUPERADMIN Anibal Joel Gualoto Indacochea exists as Principal Administrator
    const superAdminIndex = uList.findIndex(u => u.correo.toLowerCase() === 'jolusservices@gmail.com');
    const superAdminUser: PortalUser = {
      id: 'superadmin-jolusservices',
      correo: 'jolusservices@gmail.com',
      clave: 'admin123',
      role: 'SUPERADMIN',
      nombre: 'Anibal Joel Gualoto Indacochea',
      fechaRegistro: new Date().toISOString()
    };

    if (superAdminIndex >= 0) {
      uList[superAdminIndex] = {
        ...uList[superAdminIndex],
        role: 'SUPERADMIN',
        nombre: 'Anibal Joel Gualoto Indacochea'
      };
    } else {
      uList.unshift(superAdminUser);
    }

    // Seed provisional USER demo operator if not exists
    const hasProvisional = uList.some(u => u.correo.toLowerCase() === 'user@sri.com');
    if (!hasProvisional) {
      uList.push({
        id: 'usr-provisional-user',
        correo: 'user@sri.com',
        clave: 'sriuser123',
        role: 'USER',
        nombre: 'Mariana Delgado',
        fechaRegistro: new Date().toISOString()
      });
    }

    localStorage.setItem('sri_portal_users', JSON.stringify(uList));
    setUsers(uList);

    // 2. Invitations
    const savedInvites = localStorage.getItem('sri_portal_invitations');
    if (savedInvites) {
      setInvitations(JSON.parse(savedInvites));
    } else {
      // Seed a starter invitation for ease of demoing
      const seedInvite: Invitation = {
        id: 'seed-invite-1',
        correo: 'operador1@gmail.com',
        claveTemporal: 'temp2026',
        role: 'USER',
        nombreInvitado: 'Carlos Mendoza',
        fechaCreacion: new Date().toISOString(),
        estado: 'PENDIENTE'
      };
      const initialInvites = [seedInvite];
      localStorage.setItem('sri_portal_invitations', JSON.stringify(initialInvites));
      setInvitations(initialInvites);
    }

    // 3. Activity Logs
    setLogs(getLogs());
  };

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let pass = 'SRI-';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleCreateInvitationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setGeneratedInvite(null);

    if (currentUser?.role === 'USER') {
      setErrorMessage('Un usuario con rol USER no tiene permisos para crear o gestionar nuevas invitaciones.');
      return;
    }

    if (currentUser?.role === 'ADMIN' && newRole === 'SUPERADMIN') {
      setErrorMessage('Un usuario con rol ADMIN solo tiene disponible la asignación de roles USER o ADMIN.');
      return;
    }

    const email = newEmail.trim().toLowerCase();
    if (!email) {
      setErrorMessage('Por favor ingrese un correo válido.');
      return;
    }

    // Check if user already exists
    const userExists = users.some(u => u.correo.toLowerCase() === email);
    if (userExists) {
      setErrorMessage('Ya existe un usuario registrado con este correo.');
      return;
    }

    // Create the invitation
    const tempPass = generateTempPassword();
    const newInvitation: Invitation = {
      id: 'inv-' + Date.now(),
      correo: email,
      claveTemporal: tempPass,
      role: newRole,
      nombreInvitado: newName.trim() || undefined,
      fechaCreacion: new Date().toISOString(),
      estado: 'PENDIENTE'
    };

    const updatedInvites = [newInvitation, ...invitations];
    setInvitations(updatedInvites);
    localStorage.setItem('sri_portal_invitations', JSON.stringify(updatedInvites));

    // Log the event
    logActivity(
      currentUser,
      'Generación de Invitación',
      `Invitación creada para ${newInvitation.nombreInvitado || 'Sin Nombre'} (${email}) con rol ${newRole}.`
    );
    setLogs(getLogs());

    // Show success dialog component
    setGeneratedInvite(newInvitation);
    setNewEmail(''); // Reset field
    setNewName('');  // Reset field
  };

  const handleDeleteUser = (userId: string, email: string) => {
    if (userId === currentUser.id || email === currentUser.correo) {
      alert('No puedes eliminar tu propia sesión activa.');
      return;
    }

    const targetUser = users.find(u => u.id === userId);
    if (targetUser?.role === 'SUPERADMIN' && currentUser?.role !== 'SUPERADMIN') {
      alert('No tienes permisos suficientes para eliminar a un usuario con rol SUPERADMIN.');
      return;
    }

    if (!confirm(`¿Está seguro de eliminar el acceso del usuario "${email}"? El operador ya no podrá iniciar sesión.`)) {
      return;
    }

    const updated = users.filter(u => u.id !== userId);
    setUsers(updated);
    localStorage.setItem('sri_portal_users', JSON.stringify(updated));

    // Log deletion
    logActivity(currentUser, 'Eliminación de Usuario', `Eliminado acceso permanente de operador: ${email}`);
    setLogs(getLogs());
  };

  const handleDeleteInvitation = (inviteId: string) => {
    if (!confirm('¿Está seguro de revocar esta invitación pendiente?')) {
      return;
    }

    const inviteToDelete = invitations.find(inv => inv.id === inviteId);
    const updated = invitations.filter(inv => inv.id !== inviteId);
    setInvitations(updated);
    localStorage.setItem('sri_portal_invitations', JSON.stringify(updated));
    
    if (generatedInvite?.id === inviteId) {
      setGeneratedInvite(null);
    }

    // Log revocation
    if (inviteToDelete) {
      logActivity(currentUser, 'Cancelación de Invitación', `Revocada invitación pendiente para: ${inviteToDelete.correo}`);
      setLogs(getLogs());
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('¡Copiado al portapapeles con éxito!');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* INTRO AND HIGHLIGHT INFO */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 dark:bg-zinc-900 dark:border-zinc-850 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-650 text-indigo-500">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-md font-extrabold text-gray-900 dark:text-white">Control de Usuarios, Roles e Invitaciones</h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Gestione accesos para administradores totales (<strong className="font-bold underline text-indigo-600 dark:text-indigo-400">ADMIN</strong>) o ingresantes restringidos (<strong className="font-bold underline text-indigo-600 dark:text-indigo-400">USER</strong>).
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PANEL 1: CREAR INVITACIÓN (FORMULARIO) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 dark:bg-zinc-900 dark:border-zinc-850 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Nueva Invitación</h3>
            </div>

            {errorMessage && (
              <div className="mb-4 bg-red-50 text-red-900 dark:bg-red-950/20 dark:text-red-300 p-3.5 rounded-xl border border-red-200 dark:border-red-900/30 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errorMessage}
              </div>
            )}

            {currentUser?.role === 'USER' ? (
              <div className="bg-amber-50 text-amber-900 dark:bg-amber-950/20 dark:text-amber-300 p-4 rounded-xl border border-amber-200 dark:border-amber-900/30 text-xs font-semibold space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  Acceso Restringido
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 font-normal leading-relaxed">
                  Un usuario con rol <strong className="font-bold underline">USER</strong> no dispone de permisos para gestionar o crear nuevas invitaciones en el portal.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateInvitationSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                    Nombre y Apellido del Invitado
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="ej. Juan Pérez"
                      className="block w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                    Correo del Invitado
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="ej. operador_ventas@empresa.com"
                      className="block w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                    Rol Asignado
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="block w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                  >
                    <option value="USER">USER (Acceso restringido: Solo Historial, Facturar y Productos)</option>
                    <option value="ADMIN">ADMIN (Acceso total: Configuración SRI, Cuentas, Notas de Crédito, Perfiles)</option>
                    {currentUser?.role === 'SUPERADMIN' && (
                      <option value="SUPERADMIN">SUPERADMIN (Superadministrador: Acceso total + Configuración Base de Datos Cloud Supabase)</option>
                    )}
                  </select>
                  <p className="text-[10px] text-gray-450 mt-1.5 leading-relaxed">
                    * Los usuarios de tipo <strong>USER</strong> no pueden ver la configuración del SRI (pág. de llaves o .p12), no pueden emitir Notas de Crédito y no editan el Perfil.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full flex justify-center py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/10 focus:outline-none transition cursor-pointer"
                >
                  Generar Clave Temporal
                </button>
              </form>
            )}

            {/* Generated results box */}
            {generatedInvite && (
              <div className="mt-5 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/10 dark:text-emerald-300 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/30 space-y-2.5">
                <div className="flex gap-1.5 items-center">
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">¡Invitación Creada Exitosamente!</span>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-zinc-400">
                  Envíe esta clave temporal e email manual al usuario para que inicie sesión:
                </p>
                <div className="bg-white dark:bg-zinc-855 dark:bg-zinc-900 border border-emerald-250 p-2.5 rounded-xl font-mono text-xs flex justify-between items-center bg-gray-50">
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase">Correo</div>
                    <div className="font-bold text-gray-800 dark:text-zinc-100">{generatedInvite.correo}</div>
                    <div className="text-[10px] text-gray-400 uppercase mt-1">Clave Temporal</div>
                    <div className="font-black text-indigo-600 dark:text-indigo-400 text-sm tracking-wider select-all">{generatedInvite.claveTemporal}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`Correo: ${generatedInvite.correo}\nClave Temporal: ${generatedInvite.claveTemporal}\nInicie sesión en el portal y configure su clave permanente.`)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg text-gray-500 dark:text-zinc-400 cursor-pointer"
                    title="Copiar datos completos"
                  >
                    <Clipboard className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PANEL 2: INVITACIONES PENDIENTES */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 dark:bg-zinc-900 dark:border-zinc-850 shadow-xs flex flex-col justify-between lg:col-span-2">
          <div className="space-y-4">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Invitaciones Pendientes / Activas</h3>
              </div>
              <span className="px-2.5 py-0.5 font-mono text-[10px] leading-none bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 rounded-full font-bold">
                {invitations.filter(i => i.estado === 'PENDIENTE').length} Activas
              </span>
            </div>

            {invitations.length === 0 ? (
              <p className="text-xs text-center text-gray-400 py-6">
                No hay invitaciones registradas en base local.
              </p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-zinc-850 max-h-[220px] overflow-y-auto pr-1">
                {invitations.map(inv => (
                  <div key={inv.id} className="py-2.5 flex justify-between items-center gap-2 text-xs">
                    <div>
                      <div className="font-bold text-gray-800 dark:text-zinc-200 font-mono">
                        {inv.correo}
                      </div>
                      {inv.nombreInvitado && (
                        <div className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                          Para: {inv.nombreInvitado}
                        </div>
                      )}
                      <div className="flex gap-1.5 items-center mt-1 text-[10px] text-gray-400">
                        <span className={`px-1 rounded-sm uppercase tracking-wider font-extrabold ${inv.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40' : 'bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                          {inv.role}
                        </span>
                        <span>• Clave Temp: <strong>{inv.claveTemporal}</strong></span>
                        <span>• {new Date(inv.fechaCreacion).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${inv.estado === 'ACEPTADA' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20' : 'bg-yellow-100 text-yellow-850 dark:bg-yellow-950/20 dark:text-yellow-400'}`}>
                        {inv.estado === 'ACEPTADA' ? 'REGISTRADO' : 'PENDIENTE'}
                      </span>
                      {inv.estado === 'PENDIENTE' && (
                        <button
                          onClick={() => handleDeleteInvitation(inv.id)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/35 text-red-400 hover:text-red-700 rounded-lg transition cursor-pointer"
                          title="Revocar invitación"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* REGISTERED USERS LIST */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-zinc-800 pt-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Usuarios con Acceso Permanente</h3>
              </div>
              <span className="px-2.5 py-0.5 font-mono text-[10px] leading-none bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-full font-bold">
                {users.length} Usuarios
              </span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-zinc-850 max-h-[180px] overflow-y-auto pr-1">
              {users.map(usr => (
                <div key={usr.id} className="py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-gray-800 dark:text-zinc-200">
                      {usr.nombre || usr.correo.split('@')[0].toUpperCase()}
                    </div>
                    <div className="flex gap-2 items-center text-[10px] text-gray-400 mt-0.5">
                      <span className="font-mono">{usr.correo}</span>
                      <span>• Rol: <strong className="uppercase">{usr.role}</strong></span>
                      <span>• Registro: {new Date(usr.fechaRegistro).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {usr.correo !== currentUser.correo && (
                    <button
                      onClick={() => handleDeleteUser(usr.id, usr.correo)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/35 text-red-400 hover:text-red-700 rounded-lg transition cursor-pointer"
                      title="Quitar acceso permanente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>

      {/* PANEL DE CONFIGURACIÓN DE PERMISOS DINÁMICOS PARA EL ROL "USER" */}
      <div className="bg-white rounded-2xl border border-gray-100 dark:bg-zinc-900 dark:border-zinc-850 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <div className="text-left">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white font-sans">
                Panel de Control de Privilegios y Accesos (Rol USER)
              </h3>
              <p className="text-[10.5px] text-gray-500 font-sans">
                Defina en tiempo real a qué módulos, herramientas y opciones del portal ecuatoriano SRI puede ingresar un operador con rol <strong className="text-indigo-600 dark:text-indigo-400">USER</strong>.
              </p>
            </div>
          </div>
          
          <div className="flex bg-gray-50 dark:bg-zinc-950/40 p-1 rounded-xl border border-gray-200/50 dark:border-zinc-800 w-fit self-start md:self-auto">
            <button
              onClick={() => setPermissionMode('marking')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${permissionMode === 'marking' ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-white shadow-xs' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'}`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Marcando Casillas
            </button>
            <button
              onClick={() => setPermissionMode('moving')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${permissionMode === 'moving' ? 'bg-white dark:bg-zinc-850 text-indigo-600 dark:text-white shadow-xs' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'}`}
            >
              <GripVertical className="w-3.5 h-3.5" />
              Moviendo Bloques
            </button>
          </div>
        </div>

        <div className="p-5">
          {/* DEFINICIÓN DE LOS BLOQUES DE FUNCIONES ACCESIBLES */}
          {(() => {
            const AVAILABLE_TABS = [
              { id: 'history', name: 'Historial de Comprobantes', desc: 'Acceso a la búsqueda, visualización del RIDE, descarga de XMLs emitidos y opción para re-procesar/re-enviar la factura.', icon: History, colorClass: 'text-indigo-605 bg-indigo-50/70 dark:bg-indigo-950/20' },
              { id: 'new-invoice', name: 'Emitir Factura Electrónica', desc: 'Permite seleccionar clientes, agregar artículos del catálogo, calcular impuestos (IVA 15%) y emitir a pruebas/producción.', icon: Plus, colorClass: 'text-emerald-655 bg-emerald-50/70 dark:bg-emerald-950/20' },
              { id: 'new-nc', name: 'Emitir Nota de Crédito', desc: 'Facultad para anular o corregir facturas emitidas, enlazando los secuenciales y aplicando reembolsos porcentuales.', icon: ArrowLeftRight, colorClass: 'text-amber-550 bg-amber-50/70 dark:bg-amber-950/20' },
              { id: 'products', name: 'Catálogo de Productos', desc: 'Permite registrar nuevos ítems de ventas, modificar precios de lista, configurar códigos auxiliares e IVA personalizado.', icon: Package, colorClass: 'text-sky-655 bg-sky-50/70 dark:bg-sky-950/20' },
              { id: 'profile', name: 'Mi Perfil de Sucursal', desc: 'Edición de nombre comercial, dirección matriz, dirección de la sucursal, logotipo e información de contacto.', icon: User, colorClass: 'text-purple-655 bg-purple-50/70 dark:bg-purple-950/20' },
              { id: 'settings', name: 'Llave Digital y Token SRI', desc: 'Acceso crítico para subir la firma digital .p12, cambiar la contraseña de resguardo y alternar los ambientes de prueba/producción.', icon: Settings, colorClass: 'text-rose-655 bg-rose-50/70 dark:bg-rose-950/20' }
            ];

            const handleMoveBlock = (tabId: string, action: 'allow' | 'restrict') => {
              let updated: string[];
              if (action === 'allow') {
                if (userPermissions.includes(tabId)) return;
                updated = [...userPermissions, tabId];
              } else {
                updated = userPermissions.filter(p => p !== tabId);
              }
              onUpdatePermissions(updated);
              
              // Log dynamic audit activity
              const tabName = AVAILABLE_TABS.find(t => t.id === tabId)?.name || tabId;
              logActivity(
                currentUser,
                'Configuración de Permisos',
                `Acceso ${action === 'allow' ? 'CONCEDIDO' : 'REVOCADO'} para Rol USER en sección: "${tabName}".`
              );
              setLogs(getLogs());
            };

            const handleTogglePermission = (tabId: string) => {
              const isAllowed = userPermissions.includes(tabId);
              handleMoveBlock(tabId, isAllowed ? 'restrict' : 'allow');
            };

            if (permissionMode === 'marking') {
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {AVAILABLE_TABS.map((t) => {
                    const IconComponent = t.icon;
                    const isAllowed = userPermissions.includes(t.id);
                    return (
                      <div
                        key={t.id}
                        onClick={() => handleTogglePermission(t.id)}
                        className={`p-4 rounded-xl border text-left cursor-pointer transition duration-150 flex flex-col justify-between h-[145px] hover:shadow-xs group ${isAllowed ? 'border-indigo-100 dark:border-indigo-950/50 bg-gradient-to-br from-indigo-50/20 to-white dark:from-indigo-950/5 dark:to-zinc-900' : 'border-gray-150 dark:border-zinc-850 bg-white dark:bg-zinc-900'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className={`p-2 rounded-lg ${t.colorClass} flex-shrink-0`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          
                          {/* Toggle Switch */}
                          <div className={`w-9 h-5 rounded-full p-0.5 transition duration-200 focus:outline-none ${isAllowed ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-zinc-700'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-xs transform duration-200 ${isAllowed ? 'translate-x-4' : 'translate-x-0'}`} />
                          </div>
                        </div>

                        <div className="mt-2.5">
                          <h4 className="text-xs font-extrabold text-gray-800 dark:text-zinc-150 flex items-center gap-1.5">
                            {t.name}
                          </h4>
                          <p className="text-[10px] text-gray-450 dark:text-zinc-500 mt-1 leading-relaxed line-clamp-2">
                            {t.desc}
                          </p>
                        </div>

                        <div className="mt-2 flex justify-between items-center pt-1 border-t border-gray-100/50 dark:border-zinc-800/40">
                          <span className={`text-[9.5px] font-black uppercase tracking-wider ${isAllowed ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-450 dark:text-zinc-550'}`}>
                            {isAllowed ? '● HABILITADO' : '○ EXCLUIDO'}
                          </span>
                          <span className="text-[9.5px] font-bold text-gray-400 dark:text-zinc-550 group-hover:text-indigo-500 transition">
                            Haga clic para {isAllowed ? 'restringir' : 'permitir'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }

            // Otherwise, Moving tab views
            const restrictedTabs = AVAILABLE_TABS.filter(t => !userPermissions.includes(t.id));
            const allowedTabs = AVAILABLE_TABS.filter(t => userPermissions.includes(t.id));

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-gray-50/50 dark:bg-zinc-950/25 p-5 rounded-2xl border border-gray-100 dark:border-zinc-850">
                
                {/* BLOCKED COLUMN */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 pb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-red-500 flex items-center gap-1.5 font-bold">
                      <Lock className="w-3.5 h-3.5 text-red-400" />
                      Bloques Deshabilitados ({restrictedTabs.length})
                    </span>
                    <span className="text-[9.5px] font-bold text-gray-400">Accesos Denegados para USER</span>
                  </div>

                  <div className="space-y-2.5 min-h-[160px] max-h-[360px] overflow-y-auto pr-1">
                    {restrictedTabs.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 text-xs border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900">
                        No hay bloques restringidos. El rol USER tiene permisos totales.
                      </div>
                    ) : (
                      restrictedTabs.map((t) => {
                        const IconComponent = t.icon;
                        return (
                          <div 
                            key={t.id} 
                            className="flex justify-between items-center p-3 bg-white dark:bg-zinc-900 w-full rounded-xl border border-gray-100 dark:border-zinc-805 shadow-2xs hover:shadow-xs transition duration-150 gap-3 group text-left"
                          >
                            <div className="flex items-center gap-2 max-w-[70%]">
                              <span className="p-1" title="Mover bloque">
                                <GripVertical className="w-3.5 h-3.5 text-gray-300 dark:text-zinc-650 group-hover:text-gray-400 transition cursor-grab" />
                              </span>
                              <div className={`p-1.5 rounded-lg ${t.colorClass} flex-shrink-0`}>
                                <IconComponent className="w-3.5 h-3.5" />
                              </div>
                              <div className="truncate">
                                <span className="font-bold text-gray-800 dark:text-zinc-250 text-xs block truncate">{t.name}</span>
                                <span className="text-[9.5px] text-gray-400 dark:text-zinc-500 block truncate">{t.desc}</span>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handleMoveBlock(t.id, 'allow')}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 dark:text-emerald-400 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition cursor-pointer border border-emerald-100 dark:border-emerald-900/10 flex-shrink-0 font-bold"
                              title="Habilitar bloque de acceso"
                            >
                              <span>Permitir</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* ALLOWED COLUMN */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 pb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-605 dark:text-emerald-400 flex items-center gap-1.5 font-bold">
                      <Unlock className="w-3.5 h-3.5 text-emerald-555" />
                      Bloques Habilitados ({allowedTabs.length})
                    </span>
                    <span className="text-[9.5px] font-bold text-gray-400">Secciones Permitidas para USER</span>
                  </div>

                  <div className="space-y-2.5 min-h-[160px] max-h-[360px] overflow-y-auto pr-1">
                    {allowedTabs.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 text-xs border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900">
                        Bloques vacíos. El rol USER no podrá ingresar a ninguna sección del portal.
                      </div>
                    ) : (
                      allowedTabs.map((t) => {
                        const IconComponent = t.icon;
                        return (
                          <div 
                            key={t.id} 
                            className="flex justify-between items-center p-3 bg-white dark:bg-zinc-900 w-full rounded-xl border border-gray-100 dark:border-zinc-805 shadow-2xs hover:shadow-xs transition duration-150 gap-3 group text-left"
                          >
                            <div className="flex items-center gap-2 max-w-[70%]">
                              <span className="p-1" title="Mover bloque">
                                <GripVertical className="w-3.5 h-3.5 text-gray-300 dark:text-zinc-650 group-hover:text-gray-400 transition cursor-grab" />
                              </span>
                              <div className={`p-1.5 rounded-lg ${t.colorClass} flex-shrink-0`}>
                                <IconComponent className="w-3.5 h-3.5" />
                              </div>
                              <div className="truncate">
                                <span className="font-bold text-gray-800 dark:text-zinc-250 text-xs block truncate">{t.name}</span>
                                <span className="text-[9.5px] text-gray-400 dark:text-zinc-500 block truncate">{t.desc}</span>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handleMoveBlock(t.id, 'restrict')}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-705 dark:bg-red-950/20 dark:hover:bg-red-950/45 dark:text-red-400 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition cursor-pointer border border-red-100 dark:border-red-900/10 flex-shrink-0 font-bold"
                              title="Restringir este bloque"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                              <span>Bloquear</span>
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            );
          })()}
        </div>
      </div>

      {/* HISTORIAL DE LOGS DE ACTIVIDAD (REQUERIMIENTO #3) */}
      <div className="bg-white rounded-2xl border border-gray-100 dark:bg-zinc-900 dark:border-zinc-850 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white font-sans">Bitácora de Auditoría y Logs de Actividad</h3>
              <p className="text-[10.5px] text-gray-500 font-sans">
                Acciones clave del portal registradas por administradores y operadores (Inicios de sesión, comprobantes generados, configuraciones, altas y bajas).
              </p>
            </div>
          </div>
          <button
            onClick={() => setLogs(getLogs())}
            className="flex items-center gap-1 px-3 py-1.5 hover:bg-gray-100 bg-gray-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-650 dark:text-zinc-300 rounded-lg text-xs font-sans font-semibold cursor-pointer border border-gray-200 dark:border-zinc-700 transition"
            title="Sincronizar bitácora"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizar
          </button>
        </div>
        
        {logs.length === 0 ? (
          <p className="text-xs text-center text-gray-400 py-10">No se registran actividades en el sistema.</p>
        ) : (
          <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-zinc-800/50 text-gray-550 dark:text-zinc-400 text-[10.5px] uppercase tracking-wide font-bold">
                <tr>
                  <th className="px-5 py-3.5">Fecha y Hora</th>
                  <th className="px-5 py-3.5">Usuario Operador</th>
                  <th className="px-5 py-3.5">Rol</th>
                  <th className="px-5 py-3.5">Acción Ejecutada</th>
                  <th className="px-5 py-3.5">Detalla / Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-850">
                {logs.map((log) => {
                  let badgeColor = 'bg-gray-100 text-gray-750';
                  if (log.accion.includes('Sesión') || log.accion.includes('Log')) badgeColor = 'bg-sky-50 text-sky-850 dark:bg-sky-950/20 dark:text-sky-300';
                  else if (log.accion.includes('Factura') || log.accion.includes('Comprobante')) badgeColor = 'bg-emerald-50 text-emerald-850 dark:bg-emerald-950/20 dark:text-emerald-300';
                  else if (log.accion.includes('Creación') || log.accion.includes('Invitación')) badgeColor = 'bg-indigo-50 text-indigo-850 dark:bg-indigo-950/20 dark:text-indigo-300';
                  else if (log.accion.includes('Elimin') || log.accion.includes('Cancel')) badgeColor = 'bg-red-50 text-red-850 dark:bg-red-950/20 dark:text-red-300';

                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-850/20 text-gray-700 dark:text-zinc-350">
                      <td className="px-5 py-3 font-mono text-[11px] text-gray-450 dark:text-zinc-500">
                        {new Date(log.fecha).toLocaleString()}
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-bold text-gray-800 dark:text-zinc-200">{log.usuarioNombre}</div>
                        <div className="text-[10px] text-gray-450 font-mono">{log.usuarioCorreo}</div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-sm text-[9.5px] font-black tracking-side uppercase ${log.usuarioRol === 'ADMIN' ? 'bg-indigo-100 text-indigo-750 dark:bg-indigo-950/30 dark:text-indigo-400' : 'bg-amber-100 text-amber-755 dark:bg-amber-950/30 dark:text-amber-400'}`}>
                          {log.usuarioRol}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${badgeColor}`}>
                          {log.accion}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600 dark:text-zinc-300 font-medium">
                        {log.detalles}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
