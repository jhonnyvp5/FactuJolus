import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Client, TipoIdentificacion, PortalUser } from '../types';
import { 
  Trash2, 
  UserPlus, 
  Users, 
  Search, 
  Sparkles, 
  AlertCircle, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Database, 
  Check, 
  Copy, 
  AlertTriangle, 
  Edit3, 
  Save, 
  X, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  FileText,
  Loader2
} from 'lucide-react';
import { saveClientToSupabase, deleteClientFromSupabase, saveBulkClientsToSupabase, SUPABASE_SQL_SCRIPT, testSupabaseConnection } from '../lib/supabase';
import { modalAlert } from '../context/ModalAlertContext';
import { usePlatformSettings } from '../context/PlatformSettingsContext';
import * as XLSX from 'xlsx';

interface ClientCatalogProps {
  clients: Client[];
  onAddClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onSetClients: (clients: Client[]) => void;
  currentUser?: PortalUser | null;
}

interface ParsedBulkClient {
  rowNumber: number;
  tipoIdentificacion: TipoIdentificacion;
  identificacion: string;
  nombre: string;
  correo: string;
  telefono: string;
  direccion: string;
  isValid: boolean;
  errors: string[];
}

export default function ClientCatalog({
  clients,
  onAddClient,
  onDeleteClient,
  onSetClients,
  currentUser
}: ClientCatalogProps) {
  const { settings } = usePlatformSettings();
  
  const isSuperadmin = 
    currentUser?.role?.toUpperCase() === 'SUPERADMIN' || 
    currentUser?.correo?.toLowerCase() === 'jhonnyvp5@gmail.com';

  // Demo buttons are only visible if Superadmin enabled them or current user is Superadmin
  const allowDemo = isSuperadmin || Boolean(settings?.modules?.showDemoButtons || settings?.allowDemoData);

  // Form states
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [name, setName] = useState('');
  const [idType, setIdType] = useState<TipoIdentificacion>('05'); // Default: Cédula
  const [identificacion, setIdentificacion] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [sbStatus, setSbStatus] = useState<{ synced: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlHelp, setShowSqlHelp] = useState(false);

  // Table Sorting State
  const [sortField, setSortField] = useState<'identificacion' | 'nombre' | 'tipoIdentificacion' | 'correo' | 'telefono'>('nombre');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Bulk Upload Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkFileName, setBulkFileName] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedBulkClient[]>([]);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check initial connection status on mount
    testSupabaseConnection().then(res => {
      if (!res.tablesExist) {
        setSbStatus({
          synced: false,
          message: 'Atención: La tabla "clients" no existe aún en Supabase. Ejecute el script SQL en Supabase.'
        });
        setShowSqlHelp(true);
      }
    });
  }, []);

  const copySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleSort = (field: 'identificacion' | 'nombre' | 'tipoIdentificacion' | 'correo' | 'telefono') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedClients = useMemo(() => {
    return clients
      .filter(c => {
        const matchesSearch = 
          c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.identificacion.includes(searchTerm) ||
          (c.correo && c.correo.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (c.telefono && c.telefono.includes(searchTerm));
        
        const matchesType = filterType === 'all' || c.tipoIdentificacion === filterType;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        let valA = String(a[sortField] || '').toLowerCase();
        let valB = String(b[sortField] || '').toLowerCase();

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [clients, searchTerm, filterType, sortField, sortDirection]);

  const startEditClient = (c: Client) => {
    setEditingClient(c);
    setName(c.nombre);
    setIdType(c.tipoIdentificacion);
    setIdentificacion(c.identificacion);
    setEmail(c.correo || '');
    setPhone(c.telefono || '');
    setAddress(c.direccion || '');
    setFormError('');
  };

  const cancelEdit = () => {
    setEditingClient(null);
    setName('');
    setIdType('05');
    setIdentificacion('');
    setEmail('');
    setPhone('');
    setAddress('');
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess(false);

    if (!name.trim() || !identificacion.trim()) {
      setFormError('Por favor complete el nombre y la identificación del cliente.');
      return;
    }

    // Basic validation of identification lengths
    if (idType === '05' && identificacion.length !== 10) {
      setFormError('La cédula de identidad debe tener exactamente 10 dígitos.');
      return;
    }
    if (idType === '04' && identificacion.length !== 13) {
      setFormError('El RUC debe tener exactamente 13 dígitos.');
      return;
    }

    // Verify duplication if creating new
    if (!editingClient && clients.some(c => c.identificacion.trim() === identificacion.trim())) {
      setFormError(`Ya existe un cliente registrado con la identificación "${identificacion}".`);
      return;
    }

    const clientData: Client = {
      id: editingClient ? editingClient.id : 'c-' + Date.now(),
      tipoIdentificacion: idType,
      identificacion: identificacion.trim(),
      nombre: name.trim().toUpperCase(),
      direccion: address.trim() || 'Quito, Ecuador',
      telefono: phone.trim() || '0999999999',
      correo: email.trim().toLowerCase() || 'cliente@correo.com',
      usuarioCorreo: currentUser?.correo || editingClient?.usuarioCorreo,
      empresaRuc: currentUser?.empresaRuc || editingClient?.empresaRuc,
      empresaNombre: currentUser?.empresaNombre || editingClient?.empresaNombre
    };

    if (editingClient) {
      const updatedList = clients.map(c => c.id === editingClient.id ? clientData : c);
      onSetClients(updatedList);
    } else {
      onAddClient(clientData);
    }

    // Sync to Supabase
    const resSb = await saveClientToSupabase(clientData);
    const isOk = typeof resSb === 'boolean' ? resSb : resSb.success;

    if (isOk) {
      setSbStatus(null);
      setShowSqlHelp(false);
    } else {
      const errDetail = typeof resSb === 'object' && resSb.errorDetails ? resSb.errorDetails : '';
      let msg = 'Cliente guardado localmente, pero ocurrió un aviso en Supabase.';
      if (errDetail.includes('row-level security') || errDetail.includes('42501')) {
        msg = 'Error RLS en Supabase: Las políticas impiden que la clave pública anon guarde registros.';
      } else if (errDetail) {
        msg = `Supabase: ${errDetail}`;
      }
      setSbStatus({ synced: false, message: msg });
      setShowSqlHelp(true);
    }

    cancelEdit();
    setFormSuccess(true);
    setTimeout(() => {
      setFormSuccess(false);
    }, 4000);
  };

  // =========================================================================
  // BULK IMPORT & VALIDATION LOGIC (EXCLUSIVELY XLSX)
  // =========================================================================
  const downloadTemplate = () => {
    // Sheet 1: Clientes (Main Table)
    const clientData = [
      {
        tipo_identificacion: '04',
        identificacion: '1792451083001',
        nombre: 'CONSORCIO INDUSTRIAL ECUATORIANO S.A.',
        correo: 'facturacion@consorcio.ec',
        telefono: '042689400',
        direccion: 'Av. Juan Tanca Marengo Km 4.5, Guayaquil'
      },
      {
        tipo_identificacion: '05',
        identificacion: '1713567890',
        nombre: 'CARLOS ALBERTO MENDOZA VELEZ',
        correo: 'carlos.mendoza@gmail.com',
        telefono: '0998765432',
        direccion: 'Av. República de El Salvador N34-12, Quito'
      },
      {
        tipo_identificacion: '06',
        identificacion: 'A12345678',
        nombre: 'JOHN MICHAEL SMITH (PASAPORTE)',
        correo: 'john.smith@globant.com',
        telefono: '0999123456',
        direccion: 'Hotel Oro Verde, Manta'
      },
      {
        tipo_identificacion: '07',
        identificacion: '9999999999999',
        nombre: 'CONSUMIDOR FINAL',
        correo: 'consumidorfinal@sri.gob.ec',
        telefono: '9999999999',
        direccion: 'Ecuador'
      }
    ];

    // Sheet 2: Guía de Tipos de Identificación SRI
    const idGuide = [
      { Codigo_SRI: '04', Tipo: 'RUC', Descripcion: 'Registro Único de Contribuyentes (13 dígitos)' },
      { Codigo_SRI: '05', Tipo: 'Cédula', Descripcion: 'Cédula de Identidad Ecuatoriana (10 dígitos)' },
      { Codigo_SRI: '06', Tipo: 'Pasaporte', Descripcion: 'Pasaporte Extranjero' },
      { Codigo_SRI: '07', Tipo: 'Consumidor Final', Descripcion: 'Identificación 9999999999999 (Máx $50)' },
      { Codigo_SRI: '08', Tipo: 'Id del Exterior', Descripcion: 'Identificación Tributaria de Persona del Exterior' }
    ];

    const wb = XLSX.utils.book_new();
    const wsClients = XLSX.utils.json_to_sheet(clientData, { 
      header: ['tipo_identificacion', 'identificacion', 'nombre', 'correo', 'telefono', 'direccion'] 
    });
    wsClients['!cols'] = [
      { wch: 18 }, // tipo_identificacion
      { wch: 20 }, // identificacion
      { wch: 45 }, // nombre
      { wch: 30 }, // correo
      { wch: 16 }, // telefono
      { wch: 45 }  // direccion
    ];

    const wsGuide = XLSX.utils.json_to_sheet(idGuide);
    wsGuide['!cols'] = [{ wch: 14 }, { wch: 18 }, { wch: 55 }];

    XLSX.utils.book_append_sheet(wb, wsClients, 'Clientes');
    XLSX.utils.book_append_sheet(wb, wsGuide, 'Guia_Tipos_Identificacion');

    XLSX.writeFile(wb, 'plantilla_carga_masiva_clientes_sri.xlsx');
  };

  const processFile = async (file: File) => {
    setBulkError(null);
    setBulkSuccessMsg(null);

    // Strictly validate .xlsx extension
    const fileNameLower = (file.name || '').toLowerCase();
    if (!fileNameLower.endsWith('.xlsx')) {
      setBulkError(`Formato no permitido. El archivo "${file.name}" no es válido. Solo se admiten archivos con extensión .xlsx. Por favor guarda tu archivo en Excel (.xlsx) antes de subirlo.`);
      setBulkFileName('');
      setParsedItems([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setBulkFileName(file.name);
    setIsParsingFile(true);

    setTimeout(async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('El archivo Excel no contiene hojas de cálculo visibles.');
        }

        // Search for 'Clientes' sheet, otherwise use the first sheet
        let targetSheetName = workbook.SheetNames[0];
        const clientSheet = workbook.SheetNames.find(s => s.toLowerCase().includes('cliente'));
        if (clientSheet) {
          targetSheetName = clientSheet;
        }

        const worksheet = workbook.Sheets[targetSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          throw new Error(`La hoja "${targetSheetName}" está vacía. Por favor ingrese datos de clientes.`);
        }

        const parsedList: ParsedBulkClient[] = [];
        const seenIdentificacionesInFile = new Set<string>();

        rawJson.forEach((row, index) => {
          const rowNumber = index + 2; // Row 1 is header
          const errors: string[] = [];

          // Find values supporting various common header spellings
          const rawTipoId = String(
            row['tipo_identificacion'] ?? row['tipo_id'] ?? row['tipo'] ?? row['tipoidentificacion'] ?? '05'
          ).trim();

          const rawId = String(
            row['identificacion'] ?? row['cedula_ruc'] ?? row['ruc'] ?? row['cedula'] ?? row['id'] ?? ''
          ).trim();

          const rawNombre = String(
            row['nombre'] ?? row['razon_social'] ?? row['cliente'] ?? row['nombres'] ?? ''
          ).trim();

          const rawCorreo = String(
            row['correo'] ?? row['email'] ?? row['mail'] ?? ''
          ).trim();

          const rawTelefono = String(
            row['telefono'] ?? row['celular'] ?? row['telf'] ?? ''
          ).trim();

          const rawDireccion = String(
            row['direccion'] ?? row['dir'] ?? row['domicilio'] ?? ''
          ).trim();

          // 1. Validate Identification
          if (!rawId) {
            errors.push('Falta el número de identificación (RUC, Cédula o Pasaporte).');
          } else {
            if (seenIdentificacionesInFile.has(rawId)) {
              errors.push(`Identificación duplicada en este mismo archivo (fila ${rowNumber}).`);
            } else {
              seenIdentificacionesInFile.add(rawId);
            }
          }

          // 2. Validate Type & Identification Lengths
          let validatedTipoId: TipoIdentificacion = '05';
          if (['04', '05', '06', '07', '08'].includes(rawTipoId)) {
            validatedTipoId = rawTipoId as TipoIdentificacion;
          } else if (rawTipoId.toLowerCase().includes('ruc') || rawId.length === 13) {
            validatedTipoId = '04';
          } else if (rawTipoId.toLowerCase().includes('ced') || rawId.length === 10) {
            validatedTipoId = '05';
          } else if (rawTipoId.toLowerCase().includes('pas')) {
            validatedTipoId = '06';
          } else if (rawTipoId.toLowerCase().includes('cons') || rawId === '9999999999999') {
            validatedTipoId = '07';
          } else {
            errors.push(`Tipo de identificación "${rawTipoId}" no reconocido. Use: 04 (RUC), 05 (Cédula), 06 (Pasaporte), 07 (Consumidor Final), 08 (Exterior).`);
          }

          if (validatedTipoId === '05' && rawId && rawId.length !== 10) {
            errors.push(`La cédula debe tener exactamente 10 dígitos (actualmente tiene ${rawId.length}).`);
          }
          if (validatedTipoId === '04' && rawId && rawId.length !== 13) {
            errors.push(`El RUC debe tener exactamente 13 dígitos (actualmente tiene ${rawId.length}).`);
          }

          // 3. Validate Name
          if (!rawNombre) {
            errors.push('El nombre o razón social del cliente es obligatorio.');
          }

          parsedList.push({
            rowNumber,
            tipoIdentificacion: validatedTipoId,
            identificacion: rawId,
            nombre: rawNombre.toUpperCase(),
            correo: rawCorreo.toLowerCase() || 'cliente@correo.com',
            telefono: rawTelefono || '0999999999',
            direccion: rawDireccion || 'Ecuador',
            isValid: errors.length === 0,
            errors
          });
        });

        setParsedItems(parsedList);
        const validCount = parsedList.filter(i => i.isValid).length;
        const invalidCount = parsedList.length - validCount;

        if (invalidCount === 0) {
          setBulkSuccessMsg(`Se leyeron exitosamente ${validCount} clientes listos para importar.`);
        } else {
          setBulkError(`Se detectaron ${invalidCount} filas con observaciones de un total de ${parsedList.length} registros.`);
        }
      } catch (err: any) {
        console.error('Error parseando archivo Excel de clientes:', err);
        setBulkError(err?.message || 'Error al procesar el archivo Excel. Verifique que cumpla con el formato indicado.');
        setParsedItems([]);
      } finally {
        setIsParsingFile(false);
      }
    }, 150);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleExecuteBulkUpload = async () => {
    const validItems = parsedItems.filter(i => i.isValid);
    if (validItems.length === 0) {
      modalAlert.error('Sin registros válidos', 'No hay clientes válidos para importar en el archivo.');
      return;
    }

    setIsProcessingBulk(true);

    try {
      // 1. Transform into Client models
      const newClients: Client[] = validItems.map(item => {
        // Check if client already exists in local list to preserve ID
        const existing = clients.find(c => c.identificacion === item.identificacion);
        return {
          id: existing ? existing.id : 'c-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          tipoIdentificacion: item.tipoIdentificacion,
          identificacion: item.identificacion,
          nombre: item.nombre,
          correo: item.correo,
          telefono: item.telefono,
          direccion: item.direccion,
          usuarioCorreo: currentUser?.correo || existing?.usuarioCorreo,
          empresaRuc: currentUser?.empresaRuc || existing?.empresaRuc,
          empresaNombre: currentUser?.empresaNombre || existing?.empresaNombre
        };
      });

      // 2. Merge with existing state (upsert by identification)
      const clientsMap = new Map<string, Client>();
      clients.forEach(c => clientsMap.set(c.identificacion, c));
      newClients.forEach(c => clientsMap.set(c.identificacion, c));

      const mergedClients = Array.from(clientsMap.values());
      onSetClients(mergedClients);

      // 3. Batch save to Supabase via saveBulkClientsToSupabase
      const bulkRes = await saveBulkClientsToSupabase(newClients);

      setIsBulkModalOpen(false);
      setParsedItems([]);
      setBulkFileName('');
      setBulkError(null);
      setBulkSuccessMsg(null);

      if (bulkRes.successCount > 0 && bulkRes.errorCount === 0) {
        modalAlert.success(
          'Carga Masiva Exitosa',
          `Se importaron y sincronizaron ${bulkRes.successCount} clientes en el catálogo.`
        );
      } else if (bulkRes.successCount > 0) {
        modalAlert.warning(
          'Carga Parcial Completa',
          `Se agregaron ${bulkRes.successCount} clientes. ${bulkRes.errorCount} registros tuvieron advertencias de sincronización.`
        );
      } else {
        modalAlert.info(
          'Carga Local Realizada',
          `Se procesaron ${newClients.length} clientes en el sistema.`
        );
      }
    } catch (err: any) {
      modalAlert.error('Error en Carga Masiva', err?.message || 'Ocurrió un fallo al procesar los registros.');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const loadDefaults = () => {
    const demoClients: Client[] = [
      {
        id: 'c-demo-1',
        tipoIdentificacion: '04',
        identificacion: '1792451083001',
        nombre: 'CONSORCIO INDUSTRIAL ECUATORIANO S.A.',
        direccion: 'Av. Juan Tanca Marengo Km 4.5, Guayaquil',
        telefono: '042689400',
        correo: 'facturacion@consorcio.ec'
      },
      {
        id: 'c-demo-2',
        tipoIdentificacion: '05',
        identificacion: '0912345678',
        nombre: 'MARIA FERNANDA ESPINOZA RIZZO',
        direccion: 'Samborondón, Urbanización Los Arcos Mz 2',
        telefono: '0987654321',
        correo: 'mafer.espinoza@hotmail.com'
      },
      {
        id: 'c-demo-3',
        tipoIdentificacion: '06',
        identificacion: 'A12345678',
        nombre: 'JOHN SMITH (PASAPORTE)',
        direccion: 'Hotel Oro Verde, Manta',
        telefono: '0999123456',
        correo: 'john.smith@globant.com'
      },
      {
        id: 'c-demo-4',
        tipoIdentificacion: '07',
        identificacion: '9999999999999',
        nombre: 'CONSUMIDOR FINAL',
        direccion: 'Ecuador',
        telefono: '9999999999',
        correo: 'consumidorfinal@sri.gob.ec'
      }
    ];

    onSetClients([...clients, ...demoClients.filter(demo => !clients.some(c => c.identificacion === demo.identificacion))]);
    modalAlert.success('Demos Cargados', 'Se agregaron 4 clientes de prueba al catálogo.');
  };

  const getIdentificacionLabel = (type: TipoIdentificacion) => {
    switch (type) {
      case '04': return 'RUC';
      case '05': return 'Cédula';
      case '06': return 'Pasaporte';
      case '07': return 'Consumidor Final';
      case '08': return 'Id Exterior';
      default: return 'Identificación';
    }
  };

  // Stats calculation
  const totalCount = clients.length;
  const rucCount = clients.filter(c => c.tipoIdentificacion === '04').length;
  const cedulaCount = clients.filter(c => c.tipoIdentificacion === '05').length;
  const pasaporteCount = clients.filter(c => c.tipoIdentificacion === '06').length;

  return (
    <div className="space-y-6">
      
      {/* ========================================================================= */}
      {/* 1. HERO HEADER BANNER WITH STATS & ACTION BUTTONS */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Directorio SRI Ecuador
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Gestión Centralizada de Clientes & Compradores
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-indigo-400" />
              <span>Catálogo de Clientes</span>
            </h2>

            <p className="text-sm text-slate-300">
              Registra, organiza y sincroniza los receptores de facturas electrónicas, notas de crédito y retenciones con validación de RUC y cédula ecuatoriana.
            </p>
          </div>

          {/* QUICK ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* DOWNLOAD EXCEL TEMPLATE */}
            <button
              onClick={downloadTemplate}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center gap-2 backdrop-blur-xs cursor-pointer shadow-xs"
              title="Descargar plantilla oficial en formato .xlsx"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Plantilla Excel (.xlsx)</span>
            </button>

            {/* BULK UPLOAD BUTTON */}
            <button
              onClick={() => {
                setBulkError(null);
                setBulkSuccessMsg(null);
                setParsedItems([]);
                setBulkFileName('');
                setIsBulkModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer"
              title="Importar múltiples clientes desde archivo Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Carga Masiva (Excel)</span>
            </button>

            {/* DEMO BUTTON (SUPERADMIN ONLY) */}
            {allowDemo && (
              <button
                onClick={loadDefaults}
                className="px-3.5 py-2.5 rounded-xl bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/60 text-xs font-bold transition flex items-center gap-1.5 backdrop-blur-xs cursor-pointer"
                title="Cargar clientes de prueba para demostración"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Cargar Clientes Demo</span>
              </button>
            )}
          </div>
        </div>

        {/* QUICK STATS COUNTERS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3 bg-slate-850/60 rounded-2xl border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">Total Clientes</span>
              <span className="text-lg font-black text-white">{totalCount}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-850/60 rounded-2xl border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">Con RUC (Empresas)</span>
              <span className="text-lg font-black text-white">{rucCount}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-850/60 rounded-2xl border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">Con Cédula</span>
              <span className="text-lg font-black text-white">{cedulaCount}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-850/60 rounded-2xl border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">Pasaporte / Otros</span>
              <span className="text-lg font-black text-white">{pasaporteCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SQL WARNING BANNER IF SUPABASE TABLE IS NOT READY */}
      {sbStatus && !sbStatus.synced && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start justify-between gap-3 text-amber-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-300">{sbStatus.message}</p>
              <p className="text-[11px] text-amber-200/80 mt-0.5">
                Los clientes se mantendrán almacenados localmente de forma segura.
              </p>
            </div>
          </div>
          <button
            onClick={copySql}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 rounded-xl text-xs font-bold text-amber-200 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'Script Copiado' : 'Copiar SQL'}</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE (TWO-COLUMN RESPONSIVE LAYOUT) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: CLIENT REGISTRATION & EDIT FORM */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                {editingClient ? <Edit3 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
            </div>

            {editingClient && (
              <button
                type="button"
                onClick={cancelEdit}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancelar</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Cliente guardado y sincronizado correctamente.</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Tipo de Identificación *
              </label>
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value as TipoIdentificacion)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="04">04 - RUC (13 dígitos)</option>
                <option value="05">05 - Cédula de Identidad (10 dígitos)</option>
                <option value="06">06 - Pasaporte</option>
                <option value="07">07 - Consumidor Final</option>
                <option value="08">08 - Identificación del Exterior</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Número de Identificación *
              </label>
              <input
                type="text"
                value={identificacion}
                onChange={(e) => setIdentificacion(e.target.value)}
                placeholder={idType === '04' ? '1792451083001' : idType === '05' ? '1712345678' : 'Número de identificación'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Razón Social o Nombre Completo *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: EMPRESA O PERSONA NATURAL S.A."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Correo Electrónico (Para envío de RIDE / XML)
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@dominio.com"
                  className="w-full pl-9.5 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Teléfono / Móvil
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0999999999"
                    className="w-full pl-8.5 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Dirección
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Quito, Ecuador"
                    className="w-full pl-8.5 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 cursor-pointer mt-2"
            >
              {editingClient ? (
                <>
                  <Save className="w-4 h-4" />
                  <span>Actualizar Cliente</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Guardar Cliente</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: CLIENT LIST WITH SEARCH, FILTER & TABLE */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
          
          {/* SEARCH & FILTER CONTROLS */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, RUC, cédula, correo o teléfono..."
                className="w-full pl-9.5 pr-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-200 focus:outline-none"
              >
                <option value="all">Todos los Tipos</option>
                <option value="04">RUC (Empresas)</option>
                <option value="05">Cédula</option>
                <option value="06">Pasaporte</option>
                <option value="07">Consumidor Final</option>
                <option value="08">Exterior</option>
              </select>

              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 whitespace-nowrap px-2">
                {filteredAndSortedClients.length} de {clients.length}
              </span>
            </div>
          </div>

          {/* CLIENTS TABLE */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-800/80 border-b border-slate-200 dark:border-zinc-800 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  <th 
                    onClick={() => handleSort('identificacion')}
                    className="p-3.5 cursor-pointer hover:text-indigo-600 transition select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Identificación</span>
                      {sortField === 'identificacion' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-40" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('nombre')}
                    className="p-3.5 cursor-pointer hover:text-indigo-600 transition select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Razón Social / Nombre</span>
                      {sortField === 'nombre' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-40" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('correo')}
                    className="p-3.5 cursor-pointer hover:text-indigo-600 transition select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Contacto / Correo</span>
                      {sortField === 'correo' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-40" />
                      )}
                    </div>
                  </th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
                {filteredAndSortedClients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 dark:text-zinc-500">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-bold">No se encontraron clientes registrados</p>
                      <p className="text-[11px] mt-0.5">Usa el formulario lateral o la carga masiva en Excel para añadir nuevos clientes.</p>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedClients.map((client) => (
                    <tr 
                      key={client.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-850/60 transition group"
                    >
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase font-mono ${
                            client.tipoIdentificacion === '04'
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              : client.tipoIdentificacion === '05'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                          }`}>
                            {getIdentificacionLabel(client.tipoIdentificacion)}
                          </span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {client.identificacion}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <p className="font-bold text-slate-900 dark:text-white leading-tight">
                          {client.nombre}
                        </p>
                        {client.direccion && (
                          <p className="text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-xs">{client.direccion}</span>
                          </p>
                        )}
                      </td>

                      <td className="p-3.5">
                        {client.correo ? (
                          <p className="text-slate-700 dark:text-zinc-300 flex items-center gap-1 font-medium">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-xs">{client.correo}</span>
                          </p>
                        ) : (
                          <span className="text-slate-400 italic">Sin correo</span>
                        )}
                        {client.telefono && (
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{client.telefono}</span>
                          </p>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => startEditClient(client)}
                            className="p-2 rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-zinc-800 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-300 transition cursor-pointer"
                            title="Editar cliente"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={async () => {
                              modalAlert.confirm(
                                '¿Eliminar Cliente?',
                                `¿Estás seguro de eliminar a "${client.nombre}" del catálogo?`,
                                async () => {
                                  onDeleteClient(client.id);
                                  await deleteClientFromSupabase(client.id);
                                  modalAlert.success('Cliente Eliminado', 'Se removió el cliente con éxito.');
                                }
                              );
                            }}
                            className="p-2 rounded-lg bg-slate-100 hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-red-950/60 text-slate-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-300 transition cursor-pointer"
                            title="Eliminar cliente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. MODAL DE CARGA MASIVA EN EXCEL (.XLSX) */}
      {/* ========================================================================= */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            
            {/* MODAL HEADER */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex items-center justify-between border-b border-emerald-900/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-inner">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-white">
                    Carga Masiva de Clientes (Excel)
                  </h3>
                  <p className="text-xs text-emerald-200/80 font-medium">
                    Importa tu cartera de clientes desde archivos <span className="font-mono text-white font-bold">.xlsx</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50 dark:bg-zinc-900/50">
              
              {/* INSTRUCTION CARD */}
              <div className="p-4 bg-white dark:bg-zinc-850 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wide">
                    Paso 1: Descarga la plantilla oficial
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Utiliza la plantilla con columnas <span className="font-mono text-emerald-600 font-bold">tipo_identificacion</span>, <span className="font-mono text-emerald-600 font-bold">identificacion</span>, <span className="font-mono text-emerald-600 font-bold">nombre</span>, <span className="font-mono text-emerald-600 font-bold">correo</span>, <span className="font-mono text-emerald-600 font-bold">telefono</span> y <span className="font-mono text-emerald-600 font-bold">direccion</span>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Plantilla (.xlsx)</span>
                </button>
              </div>

              {/* DRAG AND DROP ZONE */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-emerald-300 dark:border-emerald-800/80 hover:border-emerald-500 bg-white dark:bg-zinc-850 rounded-3xl text-center cursor-pointer transition group shadow-xs"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition shadow-xs">
                  <Upload className="w-8 h-8" />
                </div>

                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  {bulkFileName ? bulkFileName : 'Haz clic o arrastra tu archivo Excel aquí'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Formato exclusivo admitido: <span className="font-mono font-bold text-emerald-600">.xlsx</span>
                </p>
              </div>

              {/* PARSING INDICATOR */}
              {isParsingFile && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center gap-3 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Leyendo y validando estructura del archivo Excel...</span>
                </div>
              )}

              {/* ERROR / SUCCESS ALERTS */}
              {bulkError && (
                <div className="p-4 bg-red-50 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-800/60 flex items-start gap-3 text-red-700 dark:text-red-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-black">Observaciones en el archivo:</p>
                    <p>{bulkError}</p>
                  </div>
                </div>
              )}

              {bulkSuccessMsg && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{bulkSuccessMsg}</span>
                </div>
              )}

              {/* PARSED TABLE PREVIEW */}
              {parsedItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Vista previa de clientes ({parsedItems.length} filas detectadas)
                    </h4>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {parsedItems.filter(i => i.isValid).length} válidos / {parsedItems.filter(i => !i.isValid).length} con errores
                    </span>
                  </div>

                  <div className="overflow-x-auto max-h-60 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-850">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-zinc-800 border-b border-slate-200 dark:border-zinc-700 text-[10px] font-black uppercase text-slate-500">
                          <th className="p-2.5">Fila</th>
                          <th className="p-2.5">Tipo</th>
                          <th className="p-2.5">Identificación</th>
                          <th className="p-2.5">Razón Social / Nombre</th>
                          <th className="p-2.5">Correo</th>
                          <th className="p-2.5">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                        {parsedItems.map((item) => (
                          <tr key={item.rowNumber} className={item.isValid ? '' : 'bg-red-50/50 dark:bg-red-950/20'}>
                            <td className="p-2.5 font-mono text-slate-400 font-bold">{item.rowNumber}</td>
                            <td className="p-2.5 font-mono font-bold">{item.tipoIdentificacion}</td>
                            <td className="p-2.5 font-mono font-bold">{item.identificacion}</td>
                            <td className="p-2.5 font-bold truncate max-w-xs">{item.nombre}</td>
                            <td className="p-2.5 text-slate-500 truncate max-w-xs">{item.correo}</td>
                            <td className="p-2.5">
                              {item.isValid ? (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                                  Válido
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold text-[10px]" title={item.errors.join(', ')}>
                                  {item.errors[0]}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                Cerrar
              </button>

              <button
                type="button"
                disabled={parsedItems.filter(i => i.isValid).length === 0 || isProcessingBulk}
                onClick={handleExecuteBulkUpload}
                className={`px-6 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg ${
                  parsedItems.filter(i => i.isValid).length > 0 && !isProcessingBulk
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 cursor-pointer'
                    : 'bg-slate-200 dark:bg-zinc-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isProcessingBulk ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando en Catálogo...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Importar {parsedItems.filter(i => i.isValid).length} Clientes</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
