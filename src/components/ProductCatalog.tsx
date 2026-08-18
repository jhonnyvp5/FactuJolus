import React, { useState, useRef } from 'react';
import { Product, TipoIva, PortalUser } from '../types';
import { IVA_TARIFAS } from '../sri/utils';
import { Trash2, Sparkles, Plus, PackageCheck, Receipt, Edit3, Save, X, FileSpreadsheet, Download, Upload, AlertCircle, CheckCircle2, FileText, AlertTriangle } from 'lucide-react';
import { saveProductToSupabase } from '../lib/supabase';

interface ProductCatalogProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onSetProducts: (products: Product[]) => void;
  currentUser?: PortalUser | null;
}

interface ParsedBulkItem {
  rowNumber: number;
  codigo: string;
  nombre: string;
  precio: number;
  ivaTipo: TipoIva;
  descuentoDefault: number;
  isValid: boolean;
  errors: string[];
}

export default function ProductCatalog({
  products,
  onAddProduct,
  onDeleteProduct,
  onSetProducts,
  currentUser
}: ProductCatalogProps) {
  // Form states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('0.00');
  const [ivaType, setIvaType] = useState<TipoIva>('4'); // Default 15% IVA
  const [discountDefault, setDiscountDefault] = useState('0.00');

  // Error/Success state
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Bulk Upload Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkFileText, setBulkFileText] = useState('');
  const [bulkFileName, setBulkFileName] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedBulkItem[]>([]);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setCode(prod.codigo);
    setName(prod.nombre);
    setPrice(prod.precio.toFixed(2));
    setIvaType(prod.ivaTipo);
    setDiscountDefault((prod.descuentoDefault || 0).toFixed(2));
    setFormError('');
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setCode('');
    setName('');
    setPrice('0.00');
    setIvaType('4');
    setDiscountDefault('0.00');
    setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess(false);

    if (!code.trim() || !name.trim()) {
      setFormError('Por favor complete el código y nombre del producto.');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('El precio debe ser un número mayor o igual a 0.');
      return;
    }

    const discNum = parseFloat(discountDefault);
    if (isNaN(discNum) || discNum < 0) {
      setFormError('El descuento por defecto debe ser un número mayor o igual a 0.');
      return;
    }

    // Verify code exists if adding new
    if (!editingProduct && products.some(p => p.codigo.trim().toLowerCase() === code.trim().toLowerCase())) {
      setFormError(`Ya existe un producto con el código "${code}".`);
      return;
    }

    const productData: Product = {
      id: editingProduct ? editingProduct.id : 'p-' + Date.now(),
      codigo: code.trim().toUpperCase(),
      nombre: name.trim(),
      precio: priceNum,
      ivaTipo: ivaType,
      descuentoDefault: discNum,
      usuarioCorreo: currentUser?.correo || editingProduct?.usuarioCorreo,
      empresaRuc: currentUser?.empresaRuc || editingProduct?.empresaRuc,
      empresaNombre: currentUser?.empresaNombre || editingProduct?.empresaNombre
    };

    if (editingProduct) {
      const updatedProds = products.map(p => p.id === editingProduct.id ? productData : p);
      onSetProducts(updatedProds);
    } else {
      onAddProduct(productData);
    }
    
    // Save to Supabase
    saveProductToSupabase(productData);

    // Reset form
    cancelEdit();
    setFormSuccess(true);
    setTimeout(() => setFormSuccess(false), 3000);
  };

  // =========================================================================
  // BULK IMPORT & VALIDATION LOGIC
  // =========================================================================
  const downloadTemplate = () => {
    const headers = 'codigo,nombre,precio,iva_tipo,descuento_default';
    const sampleRows = [
      'PROD-001,Laptop HP Core i7 16GB RAM 512GB SSD,850.00,4,0.00',
      'SERV-002,Servicio de Mantenimiento Preventivo Servidores,120.00,4,10.00',
      'CONS-003,Asesoría Tributaria y Contable (Hora),45.00,0,0.00',
      'SOFT-004,Licencia Anual Software Facturación SRI,180.00,4,0.00',
      'EXEN-005,Insumo Agrícola Libre de Arancel,65.50,7,0.00'
    ];
    const csvContent = '\uFEFF' + [headers, ...sampleRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `plantilla_carga_masiva_productos_sri.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkFileName(file.name);
    setBulkError(null);
    setBulkSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setBulkFileText(text);
        validateAndParseCSV(text);
      }
    };
    reader.onerror = () => {
      setBulkError('Error al leer el archivo seleccionado.');
    };
    reader.readAsText(file);
  };

  const validateAndParseCSV = (csvText: string) => {
    setBulkError(null);
    setBulkSuccessMsg(null);

    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      setBulkError('El archivo está vacío.');
      setParsedItems([]);
      return;
    }

    // Determine separator: comma, semicolon or tab
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes(';') && !firstLine.includes(',')) {
      delimiter = ';';
    } else if (firstLine.includes('\t')) {
      delimiter = '\t';
    }

    // Check header
    let startIndex = 0;
    const headerLower = lines[0].toLowerCase();
    if (headerLower.includes('codigo') || headerLower.includes('código') || headerLower.includes('nombre') || headerLower.includes('precio')) {
      startIndex = 1; // Skip header row
    }

    const seenCodesInFile = new Set<string>();
    const results: ParsedBulkItem[] = [];

    for (let i = startIndex; i < lines.length; i++) {
      const rawLine = lines[i].trim();
      if (!rawLine) continue;

      // Split while respecting quoted values
      const parts: string[] = [];
      let cur = '';
      let insideQuote = false;
      for (let c = 0; c < rawLine.length; c++) {
        const char = rawLine[c];
        if (char === '"' || char === "'") {
          insideQuote = !insideQuote;
        } else if (char === delimiter && !insideQuote) {
          parts.push(cur.trim().replace(/^["']|["']$/g, ''));
          cur = '';
        } else {
          cur += char;
        }
      }
      parts.push(cur.trim().replace(/^["']|["']$/g, ''));

      const rowNumber = i + 1;
      const errors: string[] = [];

      const rawCode = (parts[0] || '').trim();
      const rawName = (parts[1] || '').trim();
      const rawPrice = (parts[2] || '').trim();
      const rawIva = (parts[3] || '4').trim();
      const rawDiscount = (parts[4] || '0').trim();

      // 1. Validation: Código
      if (!rawCode) {
        errors.push('El campo "código" es obligatorio y no puede estar vacío.');
      } else if (seenCodesInFile.has(rawCode.toUpperCase())) {
        errors.push(`El código "${rawCode}" está duplicado en el mismo archivo.`);
      } else {
        seenCodesInFile.add(rawCode.toUpperCase());
      }

      // 2. Validation: Nombre
      if (!rawName) {
        errors.push('El campo "nombre / descripción" es obligatorio.');
      } else if (rawName.length < 2) {
        errors.push('El nombre del producto debe tener al menos 2 caracteres.');
      }

      // 3. Validation: Precio
      const sanitizedPrice = rawPrice.replace('$', '').replace(',', '.');
      const priceNum = parseFloat(sanitizedPrice);
      if (!rawPrice) {
        errors.push('El campo "precio" es obligatorio.');
      } else if (isNaN(priceNum) || priceNum < 0) {
        errors.push(`El precio "${rawPrice}" no es un número válido mayor o igual a 0.`);
      }

      // 4. Validation: IVA Tipo
      let finalIva: TipoIva = '4';
      if (['0', '2', '4', '6', '7'].includes(rawIva)) {
        finalIva = rawIva as TipoIva;
      } else if (rawIva.includes('15') || rawIva.toLowerCase().includes('15%')) {
        finalIva = '4';
      } else if (rawIva.includes('12') || rawIva.toLowerCase().includes('12%')) {
        finalIva = '2';
      } else if (rawIva.includes('0') || rawIva.toLowerCase().includes('0%')) {
        finalIva = '0';
      } else if (rawIva.toLowerCase().includes('no objeto')) {
        finalIva = '6';
      } else if (rawIva.toLowerCase().includes('exento')) {
        finalIva = '7';
      } else {
        errors.push(`Tarifa IVA "${rawIva}" inválida. Debe ser 4 (15%), 2 (12%), 0 (0%), 6 (No Objeto) o 7 (Exento).`);
      }

      // 5. Validation: Descuento
      const sanitizedDiscount = rawDiscount.replace('%', '').replace('$', '').replace(',', '.');
      const discNum = parseFloat(sanitizedDiscount || '0');
      if (isNaN(discNum) || discNum < 0) {
        errors.push(`El descuento "${rawDiscount}" debe ser un valor numérico.`);
      }

      results.push({
        rowNumber,
        codigo: rawCode.toUpperCase(),
        nombre: rawName,
        precio: isNaN(priceNum) ? 0 : priceNum,
        ivaTipo: finalIva,
        descuentoDefault: isNaN(discNum) ? 0 : discNum,
        isValid: errors.length === 0,
        errors
      });
    }

    setParsedItems(results);
    if (results.length === 0) {
      setBulkError('No se encontraron filas con datos de productos en el archivo.');
    }
  };

  const handleExecuteBulkImport = async () => {
    const validItems = parsedItems.filter(item => item.isValid);
    if (validItems.length === 0) {
      setBulkError('No hay productos válidos para importar. Corrija los errores indicados.');
      return;
    }

    setIsProcessingBulk(true);
    setBulkError(null);

    try {
      const newProducts: Product[] = [];
      const updatedCatalog = [...products];

      for (const item of validItems) {
        const prodData: Product = {
          id: 'p-bulk-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          codigo: item.codigo,
          nombre: item.nombre,
          precio: item.precio,
          ivaTipo: item.ivaTipo,
          descuentoDefault: item.descuentoDefault,
          usuarioCorreo: currentUser?.correo,
          empresaRuc: currentUser?.empresaRuc,
          empresaNombre: currentUser?.empresaNombre
        };

        // Update if existing or append
        const existingIdx = updatedCatalog.findIndex(p => p.codigo.toUpperCase() === item.codigo.toUpperCase());
        if (existingIdx >= 0) {
          prodData.id = updatedCatalog[existingIdx].id;
          updatedCatalog[existingIdx] = prodData;
        } else {
          updatedCatalog.push(prodData);
        }

        newProducts.push(prodData);
        // Persist to Supabase
        await saveProductToSupabase(prodData).catch(e => console.warn('Supabase bulk save notice:', e));
      }

      onSetProducts(updatedCatalog);
      setBulkSuccessMsg(`¡Éxito! Se han importado correctamente ${newProducts.length} productos al catálogo.`);
      
      setTimeout(() => {
        setIsBulkModalOpen(false);
        setParsedItems([]);
        setBulkFileText('');
        setBulkFileName('');
        setBulkSuccessMsg(null);
      }, 2000);

    } catch (err: any) {
      setBulkError(`Error durante la carga masiva: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const validCount = parsedItems.filter(i => i.isValid).length;
  const errorCount = parsedItems.filter(i => !i.isValid).length;

  const loadDefaults = () => {
    const demoItems: Product[] = [
      { id: 'p-demo-1', codigo: 'PROD-01', nombre: 'Computadora Portátil Intel i7 16GB RAM', precio: 899.99, ivaTipo: '4', descuentoDefault: 50.00 },
      { id: 'p-demo-2', codigo: 'SERV-01', nombre: 'Soporte Técnico Anual Standard PC', precio: 120.00, ivaTipo: '4', descuentoDefault: 0.00 },
      { id: 'p-demo-3', codigo: 'CONS-DEV', nombre: 'Asesoría y Programación de Sistemas Web (Hora)', precio: 45.00, ivaTipo: '0', descuentoDefault: 0.00 },
      { id: 'p-demo-4', codigo: 'LIC-EXP', nombre: 'Servicio de Hosting VPS - Licencia Corporativa', precio: 15.00, ivaTipo: '0', descuentoDefault: 0.00 }
    ];
    onSetProducts([...products, ...demoItems.filter(item => !products.some(p => p.codigo === item.codigo))]);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 animate-fade-in" id="product-catalog-box">
      
      {/* HEADER SECTION */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-950 dark:text-gray-50 flex items-center gap-2">
            <PackageCheck className="text-indigo-600 w-5.5 h-5.5" />
            Catálogo de Productos y Servicios
          </h2>
          <p className="text-xs text-gray-500">
            Administra tus códigos, tarifas del IVA, precios y carga masiva mediante plantilla oficial.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* BULK UPLOAD BUTTON */}
          <button
            onClick={() => {
              setIsBulkModalOpen(true);
              setBulkError(null);
              setBulkSuccessMsg(null);
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Carga Masiva (Excel / CSV)
          </button>

          <button
            onClick={loadDefaults}
            className="px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Cargar Demos
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* ADD / EDIT PRODUCT FORM */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 dark:border-zinc-800 pb-2">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-1.5">
              {editingProduct ? <Edit3 className="w-4 h-4 text-amber-500" /> : <Plus className="w-4 h-4 text-indigo-600" />}
              {editingProduct ? 'Editar Producto Seleccionado' : 'Registrar Nuevo Producto / Bien'}
            </h3>
            {editingProduct && (
              <button
                type="button"
                onClick={cancelEdit}
                className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 flex items-center gap-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Cancelar
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-600 dark:text-zinc-400 mb-1">CÓDIGO ÚNICO</label>
              <input
                type="text"
                placeholder="Ej. SERV-05 o P-102"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 font-mono focus:ring-1 focus:ring-indigo-500 uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-600 dark:text-zinc-400 mb-1">DESCRIPCIÓN / DETALLE</label>
              <input
                type="text"
                placeholder="Ej. Suscripción Mensual ERP Contifico o Mouse Gaming"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-600 dark:text-zinc-400 mb-1">PRECIO BASE ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 font-mono text-right"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-600 dark:text-zinc-400 mb-1">DESC. SUGERIDO ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={discountDefault}
                  onChange={(e) => setDiscountDefault(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 font-mono text-right"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-600 dark:text-zinc-400 mb-1">TARIFA DE IVA SRI</label>
              <select
                value={ivaType}
                onChange={(e) => setIvaType(e.target.value as TipoIva)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
              >
                {Object.entries(IVA_TARIFAS).map(([c, def]) => (
                  <option key={c} value={c}>{def.label}</option>
                ))}
              </select>
            </div>

            {formError && (
              <p className="p-2.5 bg-red-50 text-red-600 rounded-lg font-medium leading-normal">
                ⚠️ {formError}
              </p>
            )}

            {formSuccess && (
              <p className="p-2.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-lg font-medium">
                ✓ ¡Producto guardado correctamente en el catálogo!
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer leading-none"
            >
              {editingProduct ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingProduct ? 'Actualizar Producto' : 'Guardar en Catálogo'}
            </button>
          </form>
        </div>

        {/* PRODUCTS LIST TABLE */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 md:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 dark:border-zinc-800 pb-2">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-indigo-600" />
              Catálogo de Ítems e Impuestos ({products.length})
            </h3>
            <span className="text-[11px] text-gray-400">
              {currentUser?.empresaNombre ? `Empresa: ${currentUser.empresaNombre}` : 'Productos Registrados'}
            </span>
          </div>

          <div className="overflow-x-auto">
            {products.length === 0 ? (
              <div className="py-12 text-center text-gray-400 space-y-3">
                <PackageCheck className="w-12 h-12 text-gray-300 mx-auto" />
                <p className="font-medium text-gray-600 dark:text-zinc-300">No tienes productos registrados en tu catálogo.</p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={() => setIsBulkModalOpen(true)}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Cargar Masivamente por Excel/CSV
                  </button>
                  <button
                    onClick={loadDefaults}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cargar Demos
                  </button>
                </div>
              </div>
            ) : (
              <table className="w-full text-left text-xs whitespace-nowrap divide-y divide-gray-150 dark:divide-zinc-800">
                <thead className="bg-gray-50 dark:bg-zinc-800 text-gray-500 font-semibold uppercase">
                  <tr>
                    <th className="px-3 py-2 rounded-l">Código</th>
                    <th className="px-3 py-2">Nombre / Descripción</th>
                    <th className="px-3 py-2 text-right">Precio Base</th>
                    <th className="px-3 py-2">IVA SRI</th>
                    <th className="px-3 py-2 text-center rounded-r">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-zinc-800/60 font-medium">
                  {products.map((item) => {
                    const ivaDef = IVA_TARIFAS[item.ivaTipo] || { label: 'Desconocido' };
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-850/20">
                        <td className="px-3 py-3 font-mono text-indigo-600 dark:text-indigo-400 font-bold">{item.codigo}</td>
                        <td className="px-3 py-3 truncate max-w-[200px] text-gray-900 dark:text-gray-100" title={item.nombre}>
                          {item.nombre}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-gray-800 dark:text-gray-200">
                          ${item.precio.toFixed(2)}
                        </td>
                        <td className="px-3 py-3 text-gray-500 font-sans text-[10px]">{ivaDef.label}</td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEditProduct(item)}
                              className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded cursor-pointer transition"
                              title="Editar producto"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteProduct(item.id)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded cursor-pointer transition"
                              title="Eliminar producto de catálogo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* BULK UPLOAD MODAL & STRICT VALIDATION VIEWER */}
      {/* ========================================================================= */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50/50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    Carga Masiva de Productos SRI
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    Importa tu catálogo completo validando automáticamente códigos, precios e IVA.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* Step 1: Download Template */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <Download className="w-4 h-4" />
                    Paso 1: Descargar Plantilla Oficial
                  </div>
                  <p className="text-emerald-700 dark:text-emerald-400 text-[11px]">
                    Descarga el archivo CSV con las columnas preconfiguradas: <code className="font-mono bg-emerald-100 dark:bg-emerald-900/40 px-1 py-0.5 rounded">codigo, nombre, precio, iva_tipo, descuento_default</code>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar Plantilla (.csv)
                </button>
              </div>

              {/* Step 2: Upload File / Drag and Drop */}
              <div className="space-y-2">
                <label className="font-bold text-gray-700 dark:text-zinc-300 block">
                  Paso 2: Cargar Archivo CSV / Excel
                </label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer transition bg-gray-50/50 dark:bg-zinc-800/30 hover:bg-emerald-50/20"
                >
                  <Upload className="w-8 h-8 text-gray-400 dark:text-zinc-500 mx-auto mb-2" />
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    {bulkFileName ? `Archivo cargado: ${bulkFileName}` : 'Haz clic aquí o arrastra tu archivo CSV'}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Formatos admitidos: .csv delimitado por comas, punto y coma o tabulaciones.
                  </p>
                </div>
              </div>

              {/* Step 3: Validation Results */}
              {parsedItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-gray-800 dark:text-zinc-200 text-xs">
                      Paso 3: Validación de Datos ({parsedItems.length} registros analizados)
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold rounded-md flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {validCount} Válidos
                      </span>
                      {errorCount > 0 && (
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-bold rounded-md flex items-center gap-1 text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {errorCount} Con Errores
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Validation Table / Summary */}
                  <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-zinc-800 rounded-xl">
                    <table className="w-full text-left text-xs whitespace-nowrap divide-y divide-gray-150 dark:divide-zinc-800">
                      <thead className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 font-semibold sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Fila</th>
                          <th className="px-3 py-2">Código</th>
                          <th className="px-3 py-2">Nombre</th>
                          <th className="px-3 py-2 text-right">Precio</th>
                          <th className="px-3 py-2">Tarifa IVA</th>
                          <th className="px-3 py-2">Estado Validación</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150 dark:divide-zinc-800/60 font-medium">
                        {parsedItems.map((item) => (
                          <tr
                            key={item.rowNumber}
                            className={item.isValid ? 'hover:bg-emerald-50/30' : 'bg-red-50/40 dark:bg-red-950/20'}
                          >
                            <td className="px-3 py-2 font-mono text-gray-400">{item.rowNumber}</td>
                            <td className="px-3 py-2 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {item.codigo || '<VACÍO>'}
                            </td>
                            <td className="px-3 py-2 truncate max-w-[150px]" title={item.nombre}>
                              {item.nombre || '<VACÍO>'}
                            </td>
                            <td className="px-3 py-2 text-right font-mono">${item.precio.toFixed(2)}</td>
                            <td className="px-3 py-2">
                              {IVA_TARIFAS[item.ivaTipo]?.label || item.ivaTipo}
                            </td>
                            <td className="px-3 py-2">
                              {item.isValid ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Correcto
                                </span>
                              ) : (
                                <div className="space-y-0.5">
                                  {item.errors.map((err, eIdx) => (
                                    <span key={eIdx} className="block text-red-600 dark:text-red-400 text-[10px] font-bold">
                                      ⚠️ {err}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {bulkError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl text-red-700 dark:text-red-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="font-semibold">{bulkError}</div>
                </div>
              )}

              {bulkSuccessMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <div className="font-bold">{bulkSuccessMsg}</div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50/50 dark:bg-zinc-800/50">
              <button
                type="button"
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setParsedItems([]);
                  setBulkFileText('');
                  setBulkFileName('');
                }}
                className="px-4 py-2 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>

              <button
                type="button"
                disabled={validCount === 0 || isProcessingBulk}
                onClick={handleExecuteBulkImport}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition"
              >
                <Upload className="w-4 h-4" />
                {isProcessingBulk ? 'Importando Productos...' : `Proceder con Carga (${validCount} Válidos)`}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
