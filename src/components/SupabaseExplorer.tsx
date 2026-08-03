import React, { useState, useEffect } from 'react';
import { 
  Database, RefreshCw, Search, Users, ShoppingBag, FileText, 
  Layers, FolderArchive, Shield, AlertTriangle, Eye, FileCode, CheckCircle, Mail, Activity, Settings
} from 'lucide-react';
import { fetchSupabaseTableRows, fetchSupabaseStorageFiles, getSupabaseConfig, SUPABASE_BUCKETS, getSupabase } from '../lib/supabase';

type TabType = 
  | 'usuarios_portal' 
  | 'clientes' 
  | 'productos' 
  | 'emisor_config' 
  | 'facturas' 
  | 'factura_detalles' 
  | 'proformas' 
  | 'proforma_detalles' 
  | 'notas_credito' 
  | 'nota_credito_detalles' 
  | 'invitaciones' 
  | 'bitacora_actividades' 
  | 'storage_buckets';

export const SupabaseExplorer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('usuarios_portal');
  const [selectedBucket, setSelectedBucket] = useState<string>(SUPABASE_BUCKETS.FACTURAS_PDF);
  const [rows, setRows] = useState<any[]>([]);
  const [bucketFiles, setBucketFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRowDetail, setSelectedRowDetail] = useState<any | null>(null);

  const { url } = getSupabaseConfig();

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setSelectedRowDetail(null);

    if (activeTab === 'storage_buckets') {
      const { files, error: err } = await fetchSupabaseStorageFiles(selectedBucket);
      if (err) {
        setError(`Error en Bucket "${selectedBucket}": ${err}`);
        setBucketFiles([]);
      } else {
        setBucketFiles(files);
      }
    } else {
      const { data, error: err } = await fetchSupabaseTableRows(activeTab);
      if (err) {
        setError(`Error consultando la tabla "${activeTab}": ${err}`);
        setRows([]);
      } else {
        setRows(data);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeTab, selectedBucket]);

  const filteredRows = rows.filter(row => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return Object.values(row).some(val => {
      if (val === null || val === undefined) return false;
      if (typeof val === 'object') return JSON.stringify(val).toLowerCase().includes(term);
      return String(val).toLowerCase().includes(term);
    });
  });

  const filteredFiles = bucketFiles.filter(file => {
    if (!searchTerm.trim()) return true;
    return file.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getPublicFileUrl = (bucket: string, fileName: string) => {
    const supabase = getSupabase();
    if (!supabase) return '#';
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const tabsConfig: { id: TabType; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'usuarios_portal', label: 'usuarios_portal', icon: <Shield className="w-3.5 h-3.5" />, color: 'bg-purple-600' },
    { id: 'clientes', label: 'clientes', icon: <Users className="w-3.5 h-3.5" />, color: 'bg-blue-600' },
    { id: 'productos', label: 'productos', icon: <ShoppingBag className="w-3.5 h-3.5" />, color: 'bg-amber-600' },
    { id: 'emisor_config', label: 'emisor_config', icon: <Settings className="w-3.5 h-3.5" />, color: 'bg-zinc-600' },
    { id: 'facturas', label: 'facturas', icon: <FileText className="w-3.5 h-3.5" />, color: 'bg-emerald-600' },
    { id: 'factura_detalles', label: 'factura_detalles', icon: <FileCode className="w-3.5 h-3.5" />, color: 'bg-teal-600' },
    { id: 'proformas', label: 'proformas', icon: <Layers className="w-3.5 h-3.5" />, color: 'bg-cyan-600' },
    { id: 'proforma_detalles', label: 'proforma_detalles', icon: <FileCode className="w-3.5 h-3.5" />, color: 'bg-sky-600' },
    { id: 'notas_credito', label: 'notas_credito', icon: <FileText className="w-3.5 h-3.5" />, color: 'bg-rose-600' },
    { id: 'nota_credito_detalles', label: 'nota_credito_detalles', icon: <FileCode className="w-3.5 h-3.5" />, color: 'bg-pink-600' },
    { id: 'invitaciones', label: 'invitaciones', icon: <Mail className="w-3.5 h-3.5" />, color: 'bg-indigo-600' },
    { id: 'bitacora_actividades', label: 'bitacora_actividades', icon: <Activity className="w-3.5 h-3.5" />, color: 'bg-violet-600' },
    { id: 'storage_buckets', label: 'Storage Buckets', icon: <FolderArchive className="w-3.5 h-3.5" />, color: 'bg-rose-700' }
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 p-5 md:p-6 space-y-5">
      {/* HEADER & STATUS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-50">
              Explorador de Base de Datos Supabase (12 Tablas)
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              En Vivo
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 font-mono">
            Host: <strong className="text-indigo-600 dark:text-indigo-300">{url}</strong>
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="self-start md:self-auto py-2 px-4 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl font-medium text-xs flex items-center gap-2 transition cursor-pointer border border-indigo-100 dark:border-indigo-800/40"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Cargando Datos...' : 'Refrescar Supabase'}
        </button>
      </div>

      {/* TAB SELECTORS */}
      <div className="flex flex-wrap gap-2 border-b border-gray-100 dark:border-zinc-800 pb-3">
        {tabsConfig.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === t.id
                ? `${t.color} text-white shadow-xs`
                : 'bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* SEARCH AND BUCKET SELECTOR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50 dark:bg-zinc-950 p-3 rounded-xl border border-gray-100 dark:border-zinc-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar en registros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {activeTab === 'storage_buckets' ? (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-medium text-gray-500">Bucket:</span>
            <select
              value={selectedBucket}
              onChange={(e) => setSelectedBucket(e.target.value)}
              className="py-1.5 px-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value={SUPABASE_BUCKETS.FACTURAS_PDF}>facturas-pdf</option>
              <option value={SUPABASE_BUCKETS.FACTURAS_XML_FIRMADOS}>facturas-xml-firmados</option>
              <option value={SUPABASE_BUCKETS.FACTURAS_XML_SIN_FIRMAR}>facturas-xml-sin-firmar</option>
              <option value={SUPABASE_BUCKETS.NOTAS_CREDITO_PDF}>notas-credito-pdf</option>
              <option value={SUPABASE_BUCKETS.NOTAS_CREDITO_XML_FIRMADOS}>notas-credito-xml-firmados</option>
              <option value={SUPABASE_BUCKETS.NOTAS_CREDITO_XML_SIN_FIRMAR}>notas-credito-xml-sin-firmar</option>
              <option value={SUPABASE_BUCKETS.PROFORMAS_PDF}>proformas-pdf</option>
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <span>Registros encontrados:</span>
            <span className="px-2 py-0.5 rounded-full font-mono font-bold text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {filteredRows.length} fila(s)
            </span>
          </div>
        )}
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 p-4 rounded-xl border border-amber-200 dark:border-amber-800 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">{error}</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-300">
              Asegúrese de haber ejecutado el script de migración SQL en su consola de Supabase.
            </p>
          </div>
        </div>
      )}

      {/* CONTENT TABLES */}
      {loading ? (
        <div className="py-12 text-center text-xs text-gray-400 font-mono animate-pulse">
          Consultando Supabase en tiempo real...
        </div>
      ) : activeTab === 'storage_buckets' ? (
        /* BUCKET FILES LIST */
        <div className="space-y-3">
          {filteredFiles.length === 0 ? (
            <div className="py-10 text-center text-xs text-gray-400 font-mono bg-gray-50 dark:bg-zinc-950 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800">
              No hay archivos subidos en el bucket "{selectedBucket}".
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-gray-500 dark:text-zinc-400 font-semibold">
                    <th className="py-2.5 px-3">Nombre del Archivo</th>
                    <th className="py-2.5 px-3">Tamaño</th>
                    <th className="py-2.5 px-3">Fecha de Subida</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 font-mono">
                  {filteredFiles.map((file, idx) => {
                    const fileUrl = getPublicFileUrl(selectedBucket, file.name);
                    return (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-zinc-850/50">
                        <td className="py-2.5 px-3 text-gray-900 dark:text-zinc-100 font-bold">{file.name}</td>
                        <td className="py-2.5 px-3 text-gray-500">{file.metadata?.size ? `${(file.metadata.size / 1024).toFixed(1)} KB` : 'N/A'}</td>
                        <td className="py-2.5 px-3 text-gray-500">{file.created_at ? new Date(file.created_at).toLocaleString() : 'N/A'}</td>
                        <td className="py-2.5 px-3 text-right">
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-sans font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Ver/Descargar
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* DATABASE TABLE ROWS */
        <div className="space-y-4">
          {filteredRows.length === 0 ? (
            <div className="py-10 text-center text-xs text-gray-400 font-mono bg-gray-50 dark:bg-zinc-950 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800">
              No se encontraron datos registrados en la tabla "{activeTab}".
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-gray-500 dark:text-zinc-400 font-semibold">
                    {Object.keys(filteredRows[0] || {}).slice(0, 6).map((key) => (
                      <th key={key} className="py-2.5 px-3 capitalize">{key.replace('_', ' ')}</th>
                    ))}
                    <th className="py-2.5 px-3 text-right">Detalle JSON</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 font-mono">
                  {filteredRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-zinc-850/50">
                      {Object.keys(row).slice(0, 6).map((key) => {
                        const val = row[key];
                        const displayVal = typeof val === 'object' ? JSON.stringify(val).substring(0, 25) + '...' : String(val ?? '');
                        return (
                          <td key={key} className="py-2.5 px-3 text-gray-800 dark:text-zinc-200 max-w-[180px] truncate">
                            {displayVal}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedRowDetail(row)}
                          className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-[11px] font-sans font-semibold hover:bg-indigo-100 transition cursor-pointer"
                        >
                          Ver Objeto
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* JSON MODAL DETALLE */}
      {selectedRowDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-gray-100 dark:border-zinc-800 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <h4 className="font-bold text-sm text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Detalle del Registro en "{activeTab}"
              </h4>
              <button
                onClick={() => setSelectedRowDetail(null)}
                className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                Cerrar ✕
              </button>
            </div>
            <pre className="bg-gray-950 text-emerald-400 p-4 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed border border-gray-800">
              {JSON.stringify(selectedRowDetail, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
