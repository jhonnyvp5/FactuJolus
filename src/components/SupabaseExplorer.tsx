import React, { useState, useEffect } from 'react';
import { 
  Database, RefreshCw, Search, Users, ShoppingBag, FileText, 
  Layers, FolderArchive, Shield, AlertTriangle, Check, Eye, Download, FileCode, ArrowUpDown, ChevronRight
} from 'lucide-react';
import { fetchSupabaseTableRows, fetchSupabaseStorageFiles, getSupabaseConfig, SUPABASE_BUCKETS, getSupabase } from '../lib/supabase';

interface SupabaseExplorerProps {
  onClose?: () => void;
}

type TabType = 'usuarios_portal' | 'clients' | 'products' | 'invoices' | 'proformas' | 'actividades' | 'storage_buckets';

export const SupabaseExplorer: React.FC<SupabaseExplorerProps> = () => {
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

  // Filter rows based on search
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

  const getTableBadgeColor = (tab: TabType) => {
    switch (tab) {
      case 'usuarios_portal': return 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300';
      case 'clients': return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300';
      case 'products': return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
      case 'invoices': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
      case 'proformas': return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300';
      case 'actividades': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300';
      case 'storage_buckets': return 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPublicFileUrl = (bucket: string, fileName: string) => {
    const supabase = getSupabase();
    if (!supabase) return '#';
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 p-5 md:p-6 space-y-5">
      {/* HEADER & STATUS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-50">
              Explorador de Base de Datos Supabase
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
        <button
          onClick={() => setActiveTab('usuarios_portal')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'usuarios_portal'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          usuarios_portal
        </button>

        <button
          onClick={() => setActiveTab('clients')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'clients'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          clients / clientes
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'products'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          products / productos
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'invoices'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          invoices / facturas
        </button>

        <button
          onClick={() => setActiveTab('proformas')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'proformas'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          proformas
        </button>

        <button
          onClick={() => setActiveTab('actividades')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'actividades'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          actividades
        </button>

        <button
          onClick={() => setActiveTab('storage_buckets')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'storage_buckets'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700'
          }`}
        >
          <FolderArchive className="w-3.5 h-3.5" />
          Storage Buckets (Archivos XML/PDF)
        </button>
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
              <option value={SUPABASE_BUCKETS.PROFORMAS_PDF}>proformas-pdf</option>
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <span>Registros encontrados:</span>
            <span className={`px-2 py-0.5 rounded-full font-mono font-bold text-xs ${getTableBadgeColor(activeTab)}`}>
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
            <p className="text-[11px] opacity-80">
              Verifique que la tabla o script SQL haya sido ejecutado en el editor SQL de Supabase si aún no ha sido creada.
            </p>
          </div>
        </div>
      )}

      {/* MAIN CONTENT DISPLAY */}
      {activeTab === 'storage_buckets' ? (
        /* BUCKETS VIEW */
        <div className="overflow-x-auto">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-zinc-500 text-xs font-medium">
              No hay archivos subidos en el bucket "{selectedBucket}" aún.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-800 text-gray-500 font-mono text-[11px] bg-gray-50/50 dark:bg-zinc-950/50">
                  <th className="p-3">Nombre del Archivo en Supabase Storage</th>
                  <th className="p-3">Tamaño</th>
                  <th className="p-3">Fecha Creación</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 font-mono text-gray-800 dark:text-zinc-200">
                {filteredFiles.map((file, idx) => {
                  const fileUrl = getPublicFileUrl(selectedBucket, file.name);
                  return (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition">
                      <td className="p-3 font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                        {file.name.endsWith('.pdf') ? <FileText className="w-4 h-4 text-red-500" /> : <FileCode className="w-4 h-4 text-amber-500" />}
                        {file.name}
                      </td>
                      <td className="p-3 text-gray-500">
                        {file.metadata?.size ? `${(file.metadata.size / 1024).toFixed(1)} KB` : 'N/A'}
                      </td>
                      <td className="p-3 text-gray-500">
                        {file.created_at ? new Date(file.created_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="p-3 text-right">
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-lg hover:bg-rose-100 transition font-sans font-medium"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Abrir / Descargar
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* TABLE ROWS VIEW */
        <div className="space-y-4">
          {filteredRows.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-400 dark:text-zinc-500 text-xs font-medium space-y-1">
              <p>No se encontraron filas en la tabla "{activeTab}".</p>
              <p className="text-[11px] opacity-75">Las inserciones se registrarán automáticamente al emitir documentos o crear usuarios.</p>
            </div>
          )}

          {filteredRows.length > 0 && (
            <div className="overflow-x-auto border border-gray-100 dark:border-zinc-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-800 text-gray-500 font-mono text-[11px] bg-gray-50 dark:bg-zinc-950">
                    <th className="p-3">#</th>
                    {Object.keys(filteredRows[0]).slice(0, 6).map((colKey) => (
                      <th key={colKey} className="p-3 uppercase tracking-wider font-bold">
                        {colKey}
                      </th>
                    ))}
                    <th className="p-3 text-right">Detalle Completo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 font-mono text-gray-800 dark:text-zinc-200">
                  {filteredRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/80 dark:hover:bg-zinc-800/50 transition">
                      <td className="p-3 text-gray-400">{idx + 1}</td>
                      {Object.keys(row).slice(0, 6).map((colKey) => {
                        const val = row[colKey];
                        let renderedVal = '';
                        if (val === null || val === undefined) {
                          renderedVal = 'null';
                        } else if (typeof val === 'object') {
                          renderedVal = JSON.stringify(val);
                        } else {
                          renderedVal = String(val);
                        }

                        return (
                          <td key={colKey} className="p-3 max-w-[200px] truncate" title={renderedVal}>
                            {colKey === 'correo' || colKey === 'identificacion' || colKey === 'secuencial' ? (
                              <strong className="text-indigo-600 dark:text-indigo-400">{renderedVal}</strong>
                            ) : (
                              <span>{renderedVal}</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedRowDetail(row)}
                          className="px-2.5 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 text-xs font-sans font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver JSON
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

      {/* ROW DETAIL MODAL */}
      {selectedRowDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full p-6 space-y-4 border border-gray-200 dark:border-zinc-800 shadow-2xl animate-fade-in max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <h4 className="text-base font-bold text-gray-900 dark:text-zinc-50 flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-500" />
                Detalle del Registro Supabase ({activeTab})
              </h4>
              <button
                onClick={() => setSelectedRowDetail(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-3 bg-zinc-950 rounded-xl border border-zinc-800 font-mono text-xs text-indigo-300 space-y-2">
              <pre className="whitespace-pre-wrap break-all">
                {JSON.stringify(selectedRowDetail, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRowDetail(null)}
                className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-xs transition cursor-pointer"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
