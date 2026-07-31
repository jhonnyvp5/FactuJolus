import React, { useState, useEffect } from 'react';
import { Client, TipoIdentificacion } from '../types';
import { Trash2, UserPlus, Users, Search, Sparkles, AlertCircle, Phone, Mail, MapPin, CreditCard, Database, Check, Copy, AlertTriangle } from 'lucide-react';
import { saveClientToSupabase, deleteClientFromSupabase, SUPABASE_SQL_SCRIPT, testSupabaseConnection } from '../lib/supabase';

interface ClientCatalogProps {
  clients: Client[];
  onAddClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onSetClients: (clients: Client[]) => void;
}

export default function ClientCatalog({
  clients,
  onAddClient,
  onDeleteClient,
  onSetClients,
}: ClientCatalogProps) {
  // Form states
  const [name, setName] = useState('');
  const [idType, setIdType] = useState<TipoIdentificacion>('05'); // Default: Cédula
  const [identificacion, setIdentificacion] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [sbStatus, setSbStatus] = useState<{ synced: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlHelp, setShowSqlHelp] = useState(false);

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

    // Verify duplication
    if (clients.some(c => c.identificacion.trim() === identificacion.trim())) {
      setFormError(`Ya existe un cliente registrado con la identificación "${identificacion}".`);
      return;
    }

    const newClient: Client = {
      id: 'c-' + Date.now(),
      tipoIdentificacion: idType,
      identificacion: identificacion.trim(),
      nombre: name.trim().toUpperCase(),
      direccion: address.trim() || 'Quito, Ecuador',
      telefono: phone.trim() || '0999999999',
      correo: email.trim().toLowerCase() || 'cliente@correo.com'
    };

    onAddClient(newClient);

    // Sync to Supabase
    const resSb = await saveClientToSupabase(newClient);
    const isOk = typeof resSb === 'boolean' ? resSb : resSb.success;

    if (isOk) {
      setSbStatus({ synced: true, message: '¡Cliente guardado exitosamente en la base de datos de Supabase!' });
      setShowSqlHelp(false);
    } else {
      const errDetail = typeof resSb === 'object' && resSb.errorDetails ? resSb.errorDetails : '';
      let msg = 'Cliente guardado localmente, pero ocurrió un aviso en Supabase.';
      if (errDetail.includes('row-level security') || errDetail.includes('42501')) {
        msg = 'Error RLS en Supabase: Las políticas impiden que la clave pública anon guarde registros. Ejecute los comandos SQL RLS a continuación.';
      } else if (errDetail) {
        msg = `Supabase: ${errDetail}`;
      }
      setSbStatus({ synced: false, message: msg });
      setShowSqlHelp(true);
    }

    // Reset Form
    setName('');
    setIdType('05');
    setIdentificacion('');
    setEmail('');
    setPhone('');
    setAddress('');

    setFormSuccess(true);
    setTimeout(() => setFormSuccess(false), 4000);
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
      }
    ];

    onSetClients([...clients, ...demoClients.filter(demo => !clients.some(c => c.identificacion === demo.identificacion))]);
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

  const filteredClients = clients.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.identificacion.includes(searchTerm) ||
    c.correo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 animate-fade-in" id="client-catalog-box">
      
      {/* HEADER SECTION */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-150 dark:bg-zinc-900 dark:border-zinc-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-950 dark:text-gray-50 flex items-center gap-2">
            <Users className="text-indigo-600 w-5.5 h-5.5" />
            Catálogo de Clientes Registrados
          </h2>
          <p className="text-xs text-gray-500">
            Administra tus clientes, tipos de identificaciones autorizados por el SRI, direcciones de envío, correos y contactos.
          </p>
        </div>
        <button
          onClick={loadDefaults}
          className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Cargar Clientes Iniciales Demo
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ADD CLIENT FORM */}
        <div className="bg-white p-6 rounded-2xl border border-gray-150 dark:bg-zinc-900 dark:border-zinc-850 space-y-4 h-fit">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 border-b border-gray-50 dark:border-zinc-805 pb-2 text-sm flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-indigo-600" />
            Registrar Nuevo Cliente
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-600 dark:text-zinc-400 mb-1">TIPO IDENTIFICACIÓN</label>
              <select
                value={idType}
                onChange={(e) => {
                  setIdType(e.target.value as TipoIdentificacion);
                  if (e.target.value === '07') {
                    setIdentificacion('9999999999999');
                    setName('CONSUMIDOR FINAL');
                  } else {
                    setIdentificacion('');
                  }
                }}
                className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="05">Cédula (10 dígitos)</option>
                <option value="04">RUC (13 dígitos)</option>
                <option value="06">Pasaporte</option>
                <option value="07">Consumidor Final</option>
                <option value="08">Identificación del Exterior</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-600 dark:text-zinc-400 mb-1">Nº IDENTIFICACIÓN</label>
              <input
                type="text"
                placeholder={idType === '05' ? 'Ej. 1712345678' : idType === '04' ? 'Ej. 1792451083001' : 'Identificación'}
                required
                disabled={idType === '07'}
                value={identificacion}
                onChange={(e) => setIdentificacion(e.target.value.replace(/[^0-9A-Za-z]/g, ''))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 font-mono focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-600 dark:text-zinc-400 mb-1 font-sans">NOMBRE COMPLETO / RAZÓN SOCIAL</label>
              <input
                type="text"
                placeholder="Ej. JERALDINE SHADIRA VALLE PLUA"
                required
                disabled={idType === '07'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-600 dark:text-zinc-400 mb-1">CORREO ELECTRÓNICO</label>
              <input
                type="email"
                placeholder="Ej. cliente@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block font-semibold text-gray-600 dark:text-zinc-400 mb-1">TELÉFONO</label>
                <input
                  type="text"
                  placeholder="Ej. 0995831920"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-600 dark:text-zinc-400 mb-1">DIRECCIÓN</label>
              <input
                type="text"
                placeholder="Ej. Quito Norte, Calle Amazonas N2"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {formError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-750 dark:text-red-405 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl font-medium">
                ¡Cliente registrado exitosamente!
              </div>
            )}

            {sbStatus && (
              <div className={`p-3 rounded-xl border text-[11px] space-y-2 ${
                sbStatus.synced
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300'
              }`}>
                <div className="flex items-center gap-1.5 font-semibold">
                  {sbStatus.synced ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
                  <span>{sbStatus.message}</span>
                </div>

                {!sbStatus.synced && showSqlHelp && (
                  <div className="pt-1.5 border-t border-amber-200/60 dark:border-amber-800/60 space-y-2">
                    <p className="text-[10px] text-amber-800 dark:text-amber-300">
                      Copia este código y ejecútalo en el <strong>SQL Editor</strong> de Supabase para activar el guardado automático de tablas:
                    </p>
                    <button
                      type="button"
                      onClick={copySql}
                      className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedSql ? '¡Código SQL Copiado al Portapapeles!' : 'Copiar SQL para crear Tablas Supabase'}
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl transition shadow-md hover:shadow-indigo-500/20 cursor-pointer text-xs flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Registrar Cliente
            </button>
          </form>
        </div>

        {/* CLIENTS TABLE/LIST */}
        <div className="bg-white p-6 rounded-2xl border border-gray-150 dark:bg-zinc-900 dark:border-zinc-850 space-y-4 lg:col-span-2">
          
          {/* SEARCH BAR */}
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-850 px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-750">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar por Nombre, Identificación (RUC/Cédula) o Correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none text-xs text-gray-800 dark:text-gray-100 outline-hidden w-full focus:ring-0"
            />
          </div>

          {filteredClients.length === 0 ? (
            <div className="py-20 text-center text-gray-400 space-y-3">
              <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-zinc-700 animate-pulse" />
              <div>
                <p className="font-bold text-gray-500">No se encontraron clientes</p>
                <p className="text-[11px]">Intenta buscar con otros términos o registra un nuevo cliente en el panel izquierdo.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-zinc-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-zinc-850 text-gray-500 dark:text-zinc-400 font-extrabold uppercase tracking-wider border-b border-gray-100 dark:border-zinc-800">
                    <th className="p-3 pl-4">Cliente / Razón Social</th>
                    <th className="p-3">Identificación</th>
                    <th className="p-3">Contacto</th>
                    <th className="p-3 pr-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-950/20 transition">
                      <td className="p-3 pl-4 space-y-1">
                        <div className="font-extrabold text-gray-950 dark:text-white uppercase leading-tight">
                          {client.nombre}
                        </div>
                        {client.direccion && (
                          <div className="text-[10px] text-gray-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[200px]">{client.direccion}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3 space-y-1 font-mono">
                        <div className="font-bold text-gray-700 dark:text-zinc-350">
                          {client.identificacion}
                        </div>
                        <div className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                          {getIdentificacionLabel(client.tipoIdentificacion)}
                        </div>
                      </td>
                      <td className="p-3 space-y-1">
                        {client.correo && (
                          <div className="text-[10px] text-gray-500 flex items-center gap-1.5 dark:text-zinc-400">
                            <Mail className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                            <span className="truncate max-w-[150px]">{client.correo}</span>
                          </div>
                        )}
                        {client.telefono && (
                          <div className="text-[10px] text-gray-500 flex items-center gap-1.5 dark:text-zinc-400">
                            <Phone className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                            <span>{client.telefono}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3 pr-4 text-center">
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Está seguro de eliminar al cliente "${client.nombre}"?`)) {
                              onDeleteClient(client.id);
                            }
                          }}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-650 dark:bg-red-950/20 dark:hover:bg-red-950/40 rounded-lg transition shrink-0 cursor-pointer"
                          title="Eliminar cliente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-between items-center text-[10px] text-gray-400 pt-2 border-t border-gray-50 dark:border-zinc-805">
            <span>Total Clientes: <b>{clients.length}</b></span>
            <span>Mostrando: <b>{filteredClients.length}</b></span>
          </div>

        </div>

      </div>

    </div>
  );
}
