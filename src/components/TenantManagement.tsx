import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, Plus, Edit2, Trash2, Shield, Calendar, Layers, Users, FileCheck2, 
  AlertCircle, CheckCircle2, Search, X, Check, ArrowRight, ShieldCheck, Lock,
  ChevronDown, ChevronUp, FileText, Receipt, Percent, KeyRound, ExternalLink,
  Briefcase, Mail, MapPin, Globe, Sparkles, Phone, FileSpreadsheet,
  ArrowUpDown, ArrowUp, ArrowDown, Sliders, ToggleRight, Infinity, XCircle
} from 'lucide-react';
import { EmpresaTenant, PortalUser, Invoice, CreditNote, Proforma, Retention, EmitterConfig } from '../types';
import TenantPermissionsModal from './tenants/TenantPermissionsModal';
import { 
  fetchEmpresasFromSupabase, 
  saveEmpresaToSupabase, 
  deleteEmpresaFromSupabase,
  fetchUsersFromSupabase,
  fetchInvoicesFromSupabase,
  fetchCreditNotesFromSupabase,
  fetchRetencionesFromSupabase,
  fetchProformasFromSupabase,
  fetchEmitterConfigFromSupabase,
  fetchAllEmitterConfigsFromSupabase
} from '../lib/supabase';
import { logActivity } from '../lib/activityLogger';
import { modalAlert } from '../context/ModalAlertContext';

interface TenantManagementProps {
  currentUser: PortalUser;
  onCompanySelected?: (empresa: EmpresaTenant) => void;
}

export default function TenantManagement({ currentUser, onCompanySelected }: TenantManagementProps) {
  const [empresas, setEmpresas] = useState<EmpresaTenant[]>([]);
  const [portalUsers, setPortalUsers] = useState<PortalUser[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [retenciones, setRetenciones] = useState<Retention[]>([]);
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [emitterConfigs, setEmitterConfigs] = useState<Record<string, EmitterConfig>>({});
  
  const [expandedEmpresaId, setExpandedEmpresaId] = useState<string | null>(null);
  const [selectedEmpresaForPerms, setSelectedEmpresaForPerms] = useState<EmpresaTenant | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingEmpresa, setEditingEmpresa] = useState<EmpresaTenant | null>(null);
  
  // Form fields
  const [ruc, setRuc] = useState<string>('');
  const [razonSocial, setRazonSocial] = useState<string>('');
  const [nombreComercial, setNombreComercial] = useState<string>('');
  const [adminCorreo, setAdminCorreo] = useState<string>('');
  const [estado, setEstado] = useState<'ACTIVO' | 'SUSPENDIDO' | 'VENCIDO'>('ACTIVO');
  const [fechaInicio, setFechaInicio] = useState<string>(new Date().toISOString().split('T')[0]);
  const [fechaExpiracion, setFechaExpiracion] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [limiteComprobantes, setLimiteComprobantes] = useState<number>(100);
  const [isFacturasIlimitadas, setIsFacturasIlimitadas] = useState<boolean>(false);
  const [limiteUsuarios, setLimiteUsuarios] = useState<number>(3);
  const [isUsuariosIlimitados, setIsUsuariosIlimitados] = useState<boolean>(false);
  const [isVigenciaIlimitada, setIsVigenciaIlimitada] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const isSuperAdmin = currentUser.role?.toUpperCase() === 'SUPERADMIN';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (empresas.length === 0) {
      setLoading(true);
    }
    try {
      // Parallel fast batch fetch (including all emitter configs in 1 query)
      const [empList, userList, invList, cnList, retList, profList, allConfigsMap] = await Promise.all([
        fetchEmpresasFromSupabase(),
        fetchUsersFromSupabase(undefined, 'SUPERADMIN'),
        fetchInvoicesFromSupabase(undefined, 'SUPERADMIN'),
        fetchCreditNotesFromSupabase(undefined, 'SUPERADMIN'),
        fetchRetencionesFromSupabase(undefined, 'SUPERADMIN'),
        fetchProformasFromSupabase(undefined, 'SUPERADMIN'),
        fetchAllEmitterConfigsFromSupabase()
      ]);
      
      const loadedEmps = empList || [];
      setEmpresas(loadedEmps);
      if (userList) setPortalUsers(userList);
      if (invList) setInvoices(invList);
      if (cnList) setCreditNotes(cnList);
      if (retList) setRetenciones(retList);
      if (profList) setProformas(profList);
      if (allConfigsMap) setEmitterConfigs(allConfigsMap);

    } catch (e) {
      console.warn('Error cargando inquilinos y comprobantes:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingEmpresa(null);
    setRuc('');
    setRazonSocial('');
    setNombreComercial('');
    setAdminCorreo('');
    setEstado('ACTIVO');
    setFechaInicio(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    setFechaExpiracion(d.toISOString().split('T')[0]);
    setIsVigenciaIlimitada(false);
    setIsFacturasIlimitadas(false);
    setIsUsuariosIlimitados(false);
    setLimiteComprobantes(100);
    setLimiteUsuarios(3);
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: EmpresaTenant) => {
    setEditingEmpresa(emp);
    setRuc(emp.ruc);
    setRazonSocial(emp.razonSocial);
    setNombreComercial(emp.nombreComercial || emp.razonSocial);
    setAdminCorreo(emp.adminCorreo);
    setEstado(emp.estado);
    setFechaInicio(emp.fechaInicio);
    setFechaExpiracion(emp.fechaExpiracion);
    const isInf = emp.fechaExpiracion === 'ilimitada' || 
                  emp.fechaExpiracion === '2099-12-31' || 
                  (Boolean(emp.fechaExpiracion) && emp.fechaExpiracion.startsWith('2099'));
    setIsVigenciaIlimitada(Boolean(isInf));

    const isInfFacturas = !emp.limiteComprobantes || emp.limiteComprobantes <= 0 || emp.limiteComprobantes >= 99999;
    const isInfUsuarios = !emp.limiteUsuarios || emp.limiteUsuarios <= 0 || emp.limiteUsuarios >= 99999;
    setIsFacturasIlimitadas(isInfFacturas);
    setIsUsuariosIlimitados(isInfUsuarios);
    setLimiteComprobantes(isInfFacturas ? 100 : (emp.limiteComprobantes || 100));
    setLimiteUsuarios(isInfUsuarios ? 3 : (emp.limiteUsuarios || 3));

    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const cleanRuc = ruc.trim();
    if (!cleanRuc || cleanRuc.length < 10) {
      setFormError('El RUC o Identificación de la empresa debe tener al menos 10 o 13 dígitos.');
      return;
    }

    if (!razonSocial.trim()) {
      setFormError('La Razón Social o Nombre Legal es obligatorio.');
      return;
    }

    if (!adminCorreo.trim() || !adminCorreo.includes('@')) {
      setFormError('Debe especificar un correo de administrador válido para la empresa.');
      return;
    }

    const finalFechaExp = isVigenciaIlimitada ? '2099-12-31' : fechaExpiracion;
    const finalLimiteComprobantes = isFacturasIlimitadas ? 0 : (Number(limiteComprobantes) || 100);
    const finalLimiteUsuarios = isUsuariosIlimitados ? 0 : (Number(limiteUsuarios) || 3);

    const payload: EmpresaTenant = {
      id: editingEmpresa?.id || `emp-${cleanRuc}`,
      ruc: cleanRuc,
      razonSocial: razonSocial.trim(),
      nombreComercial: nombreComercial.trim() || razonSocial.trim(),
      adminCorreo: adminCorreo.trim().toLowerCase(),
      estado,
      fechaInicio,
      fechaExpiracion: finalFechaExp,
      limiteComprobantes: finalLimiteComprobantes,
      limiteUsuarios: finalLimiteUsuarios
    };

    const res = await saveEmpresaToSupabase(payload);
    if (res.success) {
      setFormSuccess('Empresa guardada exitosamente.');
      logActivity(
        currentUser,
        editingEmpresa ? 'Actualización de Empresa/Inquilino' : 'Creación de Empresa/Inquilino',
        `Empresa "${payload.razonSocial}" (RUC: ${payload.ruc}) configurada. Límite: ${payload.limiteComprobantes === 0 ? 'Ilimitado' : payload.limiteComprobantes} facturas, ${payload.limiteUsuarios === 0 ? 'Ilimitado' : payload.limiteUsuarios} usuarios. Expira: ${payload.fechaExpiracion}`
      );
      await loadData();
      setTimeout(() => {
        setIsModalOpen(false);
      }, 700);
    } else {
      setFormError(res.errorDetails || 'Error al guardar la empresa en el sistema.');
    }
  };

  const handleDelete = async (emp: EmpresaTenant) => {
    modalAlert.confirm(
      '¿Eliminar empresa inquilina?',
      `¿Está seguro de eliminar la empresa "${emp.razonSocial}" (RUC: ${emp.ruc})?\nEsto eliminará la configuración del inquilino.`,
      async () => {
        const ok = await deleteEmpresaFromSupabase(emp.id, emp.ruc);
        if (ok) {
          logActivity(
            currentUser,
            'Eliminación de Empresa/Inquilino',
            `Empresa eliminada: ${emp.razonSocial} (RUC: ${emp.ruc})`
          );
          await loadData();
          modalAlert.success('Empresa Eliminada', `La empresa "${emp.razonSocial}" ha sido eliminada.`);
        } else {
          modalAlert.error('Error al Eliminar', 'Error al eliminar la empresa de Supabase.');
        }
      },
      true,
      'Eliminar Empresa',
      'Cancelar'
    );
  };

  const [sortField, setSortField] = useState<'razonSocial' | 'ruc' | 'estado' | 'fechaExpiracion' | 'comprobantes'>('razonSocial');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: 'razonSocial' | 'ruc' | 'estado' | 'fechaExpiracion' | 'comprobantes') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSavePermissions = async (updatedEmpresa: EmpresaTenant) => {
    const res = await saveEmpresaToSupabase(updatedEmpresa);
    if (res.success) {
      setEmpresas(prev => prev.map(e => e.id === updatedEmpresa.id || e.ruc === updatedEmpresa.ruc ? updatedEmpresa : e));
      logActivity(
        currentUser,
        'PERMISOS_ACTUALIZADOS',
        `Funciones y diseños actualizados para inquilino: ${updatedEmpresa.razonSocial} (${updatedEmpresa.ruc})`
      );
      modalAlert.success(
        'Permisos Actualizados',
        `Las funciones, subfunciones y estilos autorizados para "${updatedEmpresa.razonSocial}" se han guardado exitosamente.`
      );
    } else {
      throw new Error(res.errorDetails || 'Error al guardar en base de datos');
    }
  };

  const filteredEmpresas = useMemo(() => {
    const list = empresas.filter(e => 
      e.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.ruc.includes(searchTerm) ||
      e.adminCorreo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.nombreComercial && e.nombreComercial.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return list.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      if (sortField === 'razonSocial') {
        valA = a.razonSocial.toLowerCase();
        valB = b.razonSocial.toLowerCase();
      } else if (sortField === 'ruc') {
        valA = a.ruc;
        valB = b.ruc;
      } else if (sortField === 'estado') {
        valA = a.estado;
        valB = b.estado;
      } else if (sortField === 'fechaExpiracion') {
        valA = a.fechaExpiracion;
        valB = b.fechaExpiracion;
      } else if (sortField === 'comprobantes') {
        valA = a.comprobantesEmitidos || 0;
        valB = b.comprobantesEmitidos || 0;
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const cmp = String(valA).localeCompare(String(valB));
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [empresas, searchTerm, sortField, sortDirection]);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-gray-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800/40">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Gestión de Empresas & Inquilinos (Multi-Tenancy)
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Aislamiento completo de información por empresa, control de planes, límites de emisión y usuarios.
              </p>
            </div>
          </div>
        </div>

        {isSuperAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Empresa / Inquilino</span>
          </button>
        )}
      </div>

      {/* SEARCH AND STATS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por Razón Social, RUC o Correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-gray-200 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Inquilinos:</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            {empresas.length}
          </span>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-gray-200 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Inquilinos Activos:</span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            {empresas.filter(e => e.estado === 'ACTIVO').length}
          </span>
        </div>
      </div>

      {/* SORT CONTROLS BAR */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs bg-gray-50 dark:bg-zinc-850 p-2.5 px-4 rounded-xl border border-gray-200/80 dark:border-zinc-800">
        <span className="font-bold text-gray-500 dark:text-zinc-400 flex items-center gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-blue-500" />
          Ordenar Inquilinos:
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => handleSort('razonSocial')}
            className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 cursor-pointer ${sortField === 'razonSocial' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
          >
            <span>Razón Social</span>
            {sortField === 'razonSocial' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
          </button>
          <button
            onClick={() => handleSort('ruc')}
            className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 cursor-pointer ${sortField === 'ruc' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
          >
            <span>RUC</span>
            {sortField === 'ruc' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
          </button>
          <button
            onClick={() => handleSort('estado')}
            className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 cursor-pointer ${sortField === 'estado' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
          >
            <span>Estado</span>
            {sortField === 'estado' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
          </button>
          <button
            onClick={() => handleSort('fechaExpiracion')}
            className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 cursor-pointer ${sortField === 'fechaExpiracion' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
          >
            <span>Vencimiento</span>
            {sortField === 'fechaExpiracion' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
          </button>
          <button
            onClick={() => handleSort('comprobantes')}
            className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 cursor-pointer ${sortField === 'comprobantes' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
          >
            <span>Comprobantes</span>
            {sortField === 'comprobantes' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
          </button>
        </div>
      </div>

      {/* TENANT LIST CARDS / TABLE */}
      {loading ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 text-gray-500">
          Cargando empresas e inquilinos registrados...
        </div>
      ) : filteredEmpresas.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
          <Building2 className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">No hay empresas registradas</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
            {searchTerm ? 'No se encontraron resultados para la búsqueda.' : 'Crea tu primer inquilino empresarial para habilitar el aislamiento multi-empresa.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredEmpresas.map((emp) => {
            const isUnlimited = emp.fechaExpiracion === 'ilimitada' || 
                                emp.fechaExpiracion === '2099-12-31' || 
                                (Boolean(emp.fechaExpiracion) && emp.fechaExpiracion.startsWith('2099'));
            const isExpired = !isUnlimited && Boolean(emp.fechaExpiracion && new Date(emp.fechaExpiracion) < new Date());
            const isExpanded = expandedEmpresaId === emp.id;

            // 1. Dynamic calculation of Vouchers issued for this company
            const empInvoices = invoices.filter(i => 
              (i.empresaRuc && i.empresaRuc === emp.ruc) ||
              (i.usuarioCorreo && emp.adminCorreo && i.usuarioCorreo.toLowerCase() === emp.adminCorreo.toLowerCase())
            );
            const empCreditNotes = creditNotes.filter(cn => 
              (cn.empresaRuc && cn.empresaRuc === emp.ruc) ||
              (cn.usuarioCorreo && emp.adminCorreo && cn.usuarioCorreo.toLowerCase() === emp.adminCorreo.toLowerCase())
            );
            const empRetenciones = retenciones.filter(r => 
              (r.empresaRuc && r.empresaRuc === emp.ruc) ||
              (r.usuarioCorreo && emp.adminCorreo && r.usuarioCorreo.toLowerCase() === emp.adminCorreo.toLowerCase())
            );
            const empProformas = proformas.filter(p => 
              (p.empresaRuc && p.empresaRuc === emp.ruc) ||
              (p.usuarioCorreo && emp.adminCorreo && p.usuarioCorreo.toLowerCase() === emp.adminCorreo.toLowerCase())
            );

            const calculatedVouchersCount = empInvoices.length + empCreditNotes.length + empRetenciones.length + empProformas.length;
            const vouchersUsed = Math.max(emp.comprobantesEmitidos || 0, calculatedVouchersCount);
            const isUnlimitedVouchers = !emp.limiteComprobantes || emp.limiteComprobantes <= 0 || emp.limiteComprobantes >= 99999;
            const vouchersLimit = isUnlimitedVouchers ? 0 : (emp.limiteComprobantes || 100);
            const vouchersPercent = isUnlimitedVouchers ? 0 : Math.min(100, Math.round((vouchersUsed / vouchersLimit) * 100));

            // 2. Dynamic calculation of Users for this company
            const empUsers = portalUsers.filter(u => 
              (u.empresaRuc && u.empresaRuc === emp.ruc) ||
              (u.correo && emp.adminCorreo && u.correo.toLowerCase() === emp.adminCorreo.toLowerCase())
            );
            const usersUsed = Math.max(empUsers.length, 1);
            const isUnlimitedUsers = !emp.limiteUsuarios || emp.limiteUsuarios <= 0 || emp.limiteUsuarios >= 99999;
            const usersLimit = isUnlimitedUsers ? 0 : (emp.limiteUsuarios || 3);
            const usersPercent = isUnlimitedUsers ? 0 : Math.min(100, Math.round((usersUsed / usersLimit) * 100));

            // Config emisor for accordion
            const configEmisor = emitterConfigs[emp.ruc];
            const hasFirmaP12 = Boolean(
              configEmisor?.p12FirmaB64 || 
              configEmisor?.p12Nombre || 
              configEmisor?.p12Password
            );

            return (
              <div 
                key={emp.id}
                className={`bg-white dark:bg-zinc-900 rounded-xl border transition duration-200 flex flex-col justify-between overflow-hidden ${
                  emp.estado === 'SUSPENDIDO' || isExpired
                    ? 'border-amber-300 dark:border-amber-800/60 bg-amber-50/10 shadow-xs'
                    : isExpanded
                    ? 'border-indigo-400 dark:border-indigo-600 shadow-md ring-1 ring-indigo-400/20'
                    : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 shadow-xs'
                }`}
              >
                <div 
                  className="p-5 cursor-pointer select-none"
                  onClick={() => setExpandedEmpresaId(isExpanded ? null : emp.id)}
                  title="Haz clic para expandir o colapsar información de la empresa"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
                          {emp.razonSocial}
                        </h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          emp.estado === 'ACTIVO' && !isExpired
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                        }`}>
                          {isExpired ? 'VENCIDO' : emp.estado}
                        </span>
                      </div>
                      {emp.nombreComercial && emp.nombreComercial !== emp.razonSocial && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                          {emp.nombreComercial}
                        </p>
                      )}
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono mt-0.5 font-bold">
                        RUC: {emp.ruc}
                      </p>
                    </div>

                    {isSuperAdmin && (
                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEmpresaForPerms(emp);
                          }}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 rounded-md transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                          title="Gestionar permisos, módulos y diseños autorizados"
                        >
                          <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Funciones</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(emp);
                          }}
                          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition cursor-pointer"
                          title="Editar empresa y límites"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(emp);
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition cursor-pointer"
                          title="Eliminar empresa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ADMIN, DATES & SIGNATURE STATUS */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs py-2.5 border-t border-b border-gray-100 dark:border-zinc-800/80 my-3">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Admin Principal</span>
                      <span className="text-gray-700 dark:text-gray-200 font-medium truncate block" title={emp.adminCorreo}>
                        {emp.adminCorreo}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Vigencia Plan</span>
                      {isUnlimited ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Infinity className="w-3.5 h-3.5 shrink-0" />
                          <span>Ilimitada (De por vida)</span>
                        </span>
                      ) : (
                        <span className={`font-medium ${isExpired ? 'text-rose-600 font-bold' : 'text-gray-700 dark:text-gray-200'}`}>
                          {emp.fechaExpiracion}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Firma Electrónica</span>
                      {hasFirmaP12 ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 truncate" title={configEmisor?.p12Nombre || 'Certificado P12 Registrado'}>
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                          <span>Certificado P12 Registrado</span>
                        </span>
                      ) : (
                        <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                          <span>Sin Firma Electrónica Registrada</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CONSUMPTION & LIMITS BAR (DYNAMICALLY CALCULATED) */}
                  <div className="space-y-3 pt-1">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 dark:text-gray-300 font-medium flex items-center gap-1.5">
                          <FileCheck2 className="w-3.5 h-3.5 text-blue-500" />
                          Comprobantes Emitidos
                        </span>
                        {isUnlimitedVouchers ? (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                            <span>{vouchersUsed}</span>
                            <span className="text-gray-400 font-sans">/</span>
                            <Infinity className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-sans font-semibold text-emerald-600 dark:text-emerald-400">Ilimitado</span>
                          </span>
                        ) : (
                          <span className="font-bold text-gray-900 dark:text-white font-mono">
                            {vouchersUsed} / {vouchersLimit} <span className="text-gray-500 font-sans font-normal">({vouchersPercent}%)</span>
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 rounded-full ${
                            isUnlimitedVouchers
                              ? 'bg-emerald-500'
                              : vouchersPercent >= 90 
                              ? 'bg-rose-500' 
                              : vouchersPercent >= 70 
                              ? 'bg-amber-500' 
                              : 'bg-blue-600'
                          }`}
                          style={{ width: isUnlimitedVouchers ? `${Math.min(100, Math.max(8, vouchersUsed > 0 ? 100 : 0))}%` : `${Math.max(vouchersPercent, vouchersUsed > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 dark:text-gray-300 font-medium flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-indigo-500" />
                          Usuarios del Equipo
                        </span>
                        {isUnlimitedUsers ? (
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono flex items-center gap-1">
                            <span>{usersUsed}</span>
                            <span className="text-gray-400 font-sans">/</span>
                            <Infinity className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-sans font-semibold text-indigo-600 dark:text-indigo-400">Ilimitado</span>
                          </span>
                        ) : (
                          <span className="font-bold text-gray-900 dark:text-white font-mono">
                            {usersUsed} / {usersLimit} <span className="text-gray-500 font-sans font-normal">({usersPercent}%)</span>
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 rounded-full ${
                            isUnlimitedUsers ? 'bg-indigo-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: isUnlimitedUsers ? `${Math.min(100, Math.max(8, usersUsed > 0 ? 100 : 0))}%` : `${Math.max(usersPercent, usersUsed > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ACCORDION TRIGGER (FOR SUPERADMIN) */}
                {isSuperAdmin && (
                  <div className="px-5 py-3 bg-gray-50/70 dark:bg-zinc-850/50 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setExpandedEmpresaId(isExpanded ? null : emp.id)}
                      className={`text-xs font-bold flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition cursor-pointer ${
                        isExpanded
                          ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                          : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
                      }`}
                    >
                      <span>{isExpanded ? 'Ocultar datos de esta empresa' : 'Ver datos de esta empresa'}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {onCompanySelected && (
                      <button
                        onClick={() => onCompanySelected(emp)}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 hover:underline cursor-pointer"
                        title="Seleccionar y operar como esta empresa"
                      >
                        <span>Entrar a Empresa</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* ACCORDION CONTENT (SUPERADMIN EXPANDED VIEW) */}
                {isSuperAdmin && isExpanded && (
                  <div className="p-5 border-t border-indigo-100 dark:border-zinc-800 bg-indigo-50/20 dark:bg-zinc-950/40 space-y-4 animate-fadeIn text-xs">
                    
                    {/* Header badge */}
                    <div className="flex items-center justify-between pb-2 border-b border-indigo-100 dark:border-zinc-800">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-300">
                        <Briefcase className="w-4 h-4 text-indigo-600" />
                        <span>Ficha Técnica y Configuración SRI ({emp.razonSocial})</span>
                      </div>
                      <span className="font-mono text-[10px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded font-bold">
                        RUC: {emp.ruc}
                      </span>
                    </div>

                    {/* SRI Configuration Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-gray-200/80 dark:border-zinc-800">
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Ambiente SRI</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {configEmisor?.ambiente === '2' ? 'Producción (2)' : 'Pruebas / Certificación (1)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Punto Emisión & Establecimiento</span>
                        <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                          {configEmisor?.codEstablecimiento || '001'} - {configEmisor?.codPuntoEmision || '001'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Régimen Tributario</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {configEmisor?.regimen || 'Régimen General'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Obligado a Contabilidad</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          {configEmisor?.obligadoContabilidad ? 'SÍ' : 'NO'}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Dirección Matriz</span>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                          {configEmisor?.dirMatriz || 'No configurada'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Firma Electrónica (.p12)</span>
                        {hasFirmaP12 ? (
                          <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>{configEmisor?.p12Nombre ? `Certificado P12 Registrado (${configEmisor.p12Nombre})` : 'Certificado P12 Registrado'}</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400">
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Sin Firma Electrónica Registrada</span>
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Fecha de Registro Inquilino</span>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                          {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString('es-EC') : (emp.fechaInicio || 'No registrada')}
                        </span>
                      </div>
                    </div>

                    {/* Vouchers Breakdown */}
                    <div className="space-y-1.5">
                      <span className="text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider block">
                        Desglose de Comprobantes ({vouchersUsed} emitidos)
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 text-center">
                          <span className="text-gray-400 text-[10px] block font-bold">Facturas</span>
                          <span className="text-base font-extrabold text-blue-600 font-mono">{empInvoices.length}</span>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 text-center">
                          <span className="text-gray-400 text-[10px] block font-bold">Notas de Crédito</span>
                          <span className="text-base font-extrabold text-amber-600 font-mono">{empCreditNotes.length}</span>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 text-center">
                          <span className="text-gray-400 text-[10px] block font-bold">Retenciones</span>
                          <span className="text-base font-extrabold text-indigo-600 font-mono">{empRetenciones.length}</span>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 text-center">
                          <span className="text-gray-400 text-[10px] block font-bold">Proformas</span>
                          <span className="text-base font-extrabold text-emerald-600 font-mono">{empProformas.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Users of this Company */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                          Usuarios del Equipo ({empUsers.length} de {usersLimit} cupos)
                        </span>
                      </div>
                      
                      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 divide-y divide-gray-100 dark:divide-zinc-850 overflow-hidden">
                        {empUsers.length === 0 ? (
                          <div className="p-3 text-center text-gray-400 text-xs">
                            Solo el administrador principal ({emp.adminCorreo}) tiene credenciales de acceso.
                          </div>
                        ) : (
                          empUsers.map((usr) => (
                            <div key={usr.id} className="p-2.5 flex items-center justify-between text-xs">
                              <div>
                                <div className="font-bold text-gray-800 dark:text-gray-200">
                                  {usr.nombre || usr.correo.split('@')[0]}
                                </div>
                                <div className="text-[11px] text-gray-400 font-mono">
                                  {usr.correo}
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                                (usr.role || '').toUpperCase() === 'ADMIN'
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                                  : (usr.role || '').toUpperCase() === 'SUPERADMIN'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                              }`}>
                                {usr.role || 'USER'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Accordion Footer Actions */}
                    <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedEmpresaForPerms(emp)}
                        className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                      >
                        <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Permisos, Módulos & Diseños</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(emp)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Modificar Parámetros y Cuotas</span>
                      </button>
                      
                      {onCompanySelected && (
                        <button
                          type="button"
                          onClick={() => onCompanySelected(emp)}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Acceder y Operar con esta Empresa</span>
                        </button>
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {editingEmpresa ? 'Editar Inquilino & Límites' : 'Registrar Nueva Empresa / Inquilino'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    RUC / Identificación Fiscal *
                  </label>
                  <input
                    type="text"
                    required
                    value={ruc}
                    onChange={(e) => setRuc(e.target.value)}
                    placeholder="1792451083001"
                    disabled={!!editingEmpresa}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white font-mono disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Estado de la Empresa *
                  </label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white"
                  >
                    <option value="ACTIVO">ACTIVO (Permite Facturación)</option>
                    <option value="SUSPENDIDO">SUSPENDIDO (Bloqueado)</option>
                    <option value="VENCIDO">VENCIDO (Plan expirado)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Razón Social / Nombre Legal *
                </label>
                <input
                  type="text"
                  required
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  placeholder="DIGITAL SOLUTIONS CORP S.A.S."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nombre Comercial
                </label>
                <input
                  type="text"
                  value={nombreComercial}
                  onChange={(e) => setNombreComercial(e.target.value)}
                  placeholder="Digital Solutions"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Correo del Administrador Principal *
                </label>
                <input
                  type="email"
                  required
                  value={adminCorreo}
                  onChange={(e) => setAdminCorreo(e.target.value)}
                  placeholder="admin@empresa.com"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white"
                />
              </div>

              {/* LIMITS SECTION */}
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-lg space-y-3">
                <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Control de Plan y Límites de Generación</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* LIMIT FACTURAS / NC */}
                  <div className="p-3 bg-white dark:bg-zinc-850 border border-blue-100 dark:border-blue-900/40 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Límite de Facturas / NC
                      </label>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isFacturasIlimitadas}
                          onChange={(e) => setIsFacturasIlimitadas(e.target.checked)}
                          className="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                        <span>Ilimitado</span>
                      </label>
                    </div>

                    {isFacturasIlimitadas ? (
                      <div className="w-full px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 h-[38px]">
                        <Infinity className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>Emisión Ilimitada (Sin tope)</span>
                      </div>
                    ) : (
                      <input
                        type="number"
                        min={1}
                        max={100000}
                        value={limiteComprobantes}
                        onChange={(e) => setLimiteComprobantes(parseInt(e.target.value) || 0)}
                        placeholder="Ej: 100"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white font-semibold"
                      />
                    )}
                  </div>

                  {/* LIMIT USUARIOS */}
                  <div className="p-3 bg-white dark:bg-zinc-850 border border-blue-100 dark:border-blue-900/40 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Límite de Usuarios Invitados
                      </label>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isUsuariosIlimitados}
                          onChange={(e) => setIsUsuariosIlimitados(e.target.checked)}
                          className="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                        <span>Ilimitado</span>
                      </label>
                    </div>

                    {isUsuariosIlimitados ? (
                      <div className="w-full px-3 py-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-lg text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 h-[38px]">
                        <Infinity className="w-4 h-4 shrink-0 text-indigo-600" />
                        <span>Usuarios Ilimitados (Sin tope)</span>
                      </div>
                    ) : (
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={limiteUsuarios}
                        onChange={(e) => setLimiteUsuarios(parseInt(e.target.value) || 0)}
                        placeholder="Ej: 3"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white font-semibold"
                      />
                    )}
                  </div>
                </div>

                {/* Unlimited plan validity option */}
                <div className="p-3 bg-white dark:bg-zinc-800/80 border border-blue-100 dark:border-blue-900/40 rounded-lg">
                  <label className="flex items-center justify-between cursor-pointer select-none">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                        <Infinity className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white block">
                          Vigencia del Plan Ilimitada (Acceso de por vida)
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-zinc-400 block">
                          El inquilino tendrá acceso permanente a la plataforma sin fecha de caducidad.
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isVigenciaIlimitada}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsVigenciaIlimitada(checked);
                        if (checked) {
                          setFechaExpiracion('2099-12-31');
                        } else {
                          const d = new Date();
                          d.setFullYear(d.getFullYear() + 1);
                          setFechaExpiracion(d.toISOString().split('T')[0]);
                        }
                      }}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha Inicio de Plan
                    </label>
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha Expiración de Acceso
                    </label>
                    {isVigenciaIlimitada ? (
                      <div className="w-full px-3 py-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 h-[38px]">
                        <Infinity className="w-4 h-4 shrink-0" />
                        <span>Acceso Ilimitado / De por vida</span>
                      </div>
                    ) : (
                      <input
                        type="date"
                        value={fechaExpiracion}
                        onChange={(e) => setFechaExpiracion(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition cursor-pointer font-semibold shadow-xs"
                >
                  Guardar Empresa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPERADMIN TENANT PERMISSIONS MODAL */}
      {selectedEmpresaForPerms && (
        <TenantPermissionsModal
          empresa={selectedEmpresaForPerms}
          isOpen={!!selectedEmpresaForPerms}
          onClose={() => setSelectedEmpresaForPerms(null)}
          onSave={handleSavePermissions}
        />
      )}
    </div>
  );
}
