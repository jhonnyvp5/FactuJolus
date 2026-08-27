import React, { useState, useRef, useMemo } from 'react';
import { Product, TipoIva, PortalUser } from '../types';
import { IVA_TARIFAS } from '../sri/utils';
import { Trash2, Sparkles, Plus, PackageCheck, Receipt, Edit3, Save, X, FileSpreadsheet, Download, Upload, AlertCircle, CheckCircle2, FileText, AlertTriangle, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { saveProductToSupabase, saveBulkProductsToSupabase } from '../lib/supabase';
import { modalAlert } from '../context/ModalAlertContext';
import { usePlatformSettings } from '../context/PlatformSettingsContext';
import * as XLSX from 'xlsx';

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
  const { settings } = usePlatformSettings();
  const allowDemo = Boolean(settings?.modules?.showDemoButtons || settings?.allowDemoData);

  // Form states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('0.00');
  const [ivaType, setIvaType] = useState<TipoIva>('4'); // Default 15% IVA
  const [discountDefault, setDiscountDefault] = useState('0.00');

  // Table Sorting State
  const [sortField, setSortField] = useState<'codigo' | 'nombre' | 'precio' | 'ivaTipo' | 'descuentoDefault'>('codigo');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: 'codigo' | 'nombre' | 'precio' | 'ivaTipo' | 'descuentoDefault') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'precio' || sortField === 'descuentoDefault') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [products, sortField, sortDirection]);

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
  const [isParsingFile, setIsParsingFile] = useState(false);
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
  // BULK IMPORT & VALIDATION LOGIC (EXCLUSIVELY XLSX)
  // =========================================================================
  const downloadTemplate = () => {
    // Sheet 1: Productos (Main Table)
    const productData = [
      {
        codigo: 'PROD-001',
        nombre: 'Laptop HP Core i7 16GB RAM 512GB SSD',
        precio: 850.00,
        iva_tipo: 4,
        descuento_default: 0.00
      },
      {
        codigo: 'SERV-002',
        nombre: 'Servicio de Mantenimiento Preventivo Servidores',
        precio: 120.00,
        iva_tipo: 4,
        descuento_default: 10.00
      },
      {
        codigo: 'CONS-003',
        nombre: 'Asesoría Tributaria y Contable (Hora)',
        precio: 45.00,
        iva_tipo: 0,
        descuento_default: 0.00
      },
      {
        codigo: 'SOFT-004',
        nombre: 'Licencia Anual Software Facturación SRI',
        precio: 180.00,
        iva_tipo: 4,
        descuento_default: 0.00
      },
      {
        codigo: 'EXEN-005',
        nombre: 'Insumo Agrícola Libre de Arancel',
        precio: 65.50,
        iva_tipo: 7,
        descuento_default: 0.00
      }
    ];

    // Sheet 2: Guía de Códigos IVA
    const ivaGuide = [
      { Codigo_IVA: 4, Porcentaje: '15%', Descripcion: 'Tarifa General vigente en Ecuador (IVA 15%)' },
      { Codigo_IVA: 2, Porcentaje: '12%', Descripcion: 'Tarifa IVA 12%' },
      { Codigo_IVA: 0, Porcentaje: '0%', Descripcion: 'Tarifa 0% (Productos canasta básica / servicios de salud)' },
      { Codigo_IVA: 6, Porcentaje: '0%', Descripcion: 'No Objeto de Impuesto' },
      { Codigo_IVA: 7, Porcentaje: '0%', Descripcion: 'Exento de IVA' }
    ];

    const wb = XLSX.utils.book_new();
    const wsProducts = XLSX.utils.json_to_sheet(productData, { header: ['codigo', 'nombre', 'precio', 'iva_tipo', 'descuento_default'] });
    wsProducts['!cols'] = [
      { wch: 16 }, // codigo
      { wch: 48 }, // nombre
      { wch: 14 }, // precio
      { wch: 12 }, // iva_tipo
      { wch: 18 }  // descuento_default
    ];

    const wsGuide = XLSX.utils.json_to_sheet(ivaGuide);
    wsGuide['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 55 }];

    XLSX.utils.book_append_sheet(wb, wsProducts, 'Productos');
    XLSX.utils.book_append_sheet(wb, wsGuide, 'Guia_Tarifas_IVA');

    XLSX.writeFile(wb, 'plantilla_carga_masiva_productos_sri.xlsx');
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

    // Allow UI to immediately display the reading/validating indicator
    setTimeout(async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', dense: true, cellDates: true });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          setBulkError('El archivo Excel no contiene hojas de cálculo.');
          setParsedItems([]);
          setIsParsingFile(false);
          return;
        }

        // Prioritize sheet named 'Productos' or first sheet with data
        let targetSheetName = workbook.SheetNames[0];
        for (const sName of workbook.SheetNames) {
          const lower = sName.toLowerCase();
          if (lower.includes('prod') || lower.includes('catálogo') || lower.includes('catalogo') || lower.includes('item') || lower.includes('articul')) {
            targetSheetName = sName;
            break;
          }
        }

        const worksheet = workbook.Sheets[targetSheetName];
        if (!worksheet) {
          setBulkError(`No se pudo leer la hoja "${targetSheetName}" del archivo Excel.`);
          setParsedItems([]);
          setIsParsingFile(false);
          return;
        }

        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', blankrows: false }) as any[][];
        validateAndParseRows(rows);

      } catch (err: any) {
        console.error('Error al procesar archivo Excel:', err);
        setBulkError('Error al leer el archivo Excel (.xlsx): ' + (err?.message || 'Asegúrate de que no esté protegido con contraseña o dañado.'));
        setParsedItems([]);
      } finally {
        setIsParsingFile(false);
      }
    }, 50);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileNameLower = (file.name || '').toLowerCase();
      if (!fileNameLower.endsWith('.xlsx')) {
        setBulkError(`Formato no permitido. El archivo "${file.name}" no tiene la extensión .xlsx. Solo se admiten archivos en formato Excel (.xlsx).`);
        setBulkFileName('');
        setParsedItems([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      processFile(file);
    }
  };

  const validateAndParseRows = (rows: any[][]) => {
    setBulkError(null);
    setBulkSuccessMsg(null);

    if (!rows || rows.length === 0) {
      setBulkError('El archivo Excel no contiene filas con información.');
      setParsedItems([]);
      return;
    }

    // Dynamic Header Detection & Column Mapping
    let headerRowIndex = -1;
    let colMap = {
      codigo: 0,
      nombre: 1,
      precio: 2,
      iva: 3,
      descuento: 4
    };

    for (let r = 0; r < Math.min(rows.length, 5); r++) {
      const rowArr = rows[r] || [];
      const joined = rowArr.map((c: any) => String(c !== undefined && c !== null ? c : '').toLowerCase().trim()).join(' ');
      if (joined.includes('cod') || joined.includes('cód') || joined.includes('nom') || joined.includes('prec') || joined.includes('iva')) {
        headerRowIndex = r;
        rowArr.forEach((cellVal: any, colIdx: number) => {
          const v = String(cellVal || '').toLowerCase().trim();
          if (v.includes('cod') || v.includes('cód')) colMap.codigo = colIdx;
          else if (v.includes('nom') || v.includes('descrip') || v.includes('detall')) colMap.nombre = colIdx;
          else if (v.includes('prec') || v.includes('cost') || v.includes('pvp') || v.includes('unit')) colMap.precio = colIdx;
          else if (v.includes('iva') || v.includes('tarif') || v.includes('imp')) colMap.iva = colIdx;
          else if (v.includes('desc') || v.includes('dscto')) colMap.descuento = colIdx;
        });
        break;
      }
    }

    const startIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;
    const seenCodesInFile = new Set<string>();
    const results: ParsedBulkItem[] = [];

    for (let i = startIndex; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || row.every(c => c === null || c === undefined || String(c).trim() === '')) {
        continue;
      }

      const rowNumber = i + 1;
      const errors: string[] = [];

      const rawCode = String(row[colMap.codigo] !== undefined && row[colMap.codigo] !== null ? row[colMap.codigo] : '').trim();
      const rawName = String(row[colMap.nombre] !== undefined && row[colMap.nombre] !== null ? row[colMap.nombre] : '').trim();
      const rawPrice = String(row[colMap.precio] !== undefined && row[colMap.precio] !== null ? row[colMap.precio] : '').trim();
      const rawIva = String(row[colMap.iva] !== undefined && row[colMap.iva] !== null ? row[colMap.iva] : '4').trim();
      const rawDiscount = String(row[colMap.descuento] !== undefined && row[colMap.descuento] !== null ? row[colMap.descuento] : '0').trim();

      // 1. Validation: Código
      if (!rawCode) {
        errors.push('El campo "código" es obligatorio.');
      } else if (seenCodesInFile.has(rawCode.toUpperCase())) {
        errors.push(`El código "${rawCode}" está duplicado en el mismo archivo.`);
      } else {
        seenCodesInFile.add(rawCode.toUpperCase());
      }

      // 2. Validation: Nombre
      if (!rawName) {
        errors.push('El campo "nombre / descripción" es obligatorio.');
      } else if (rawName.length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres.');
      }

      // 3. Validation: Precio
      const sanitizedPrice = rawPrice.replace('$', '').replace(/\s/g, '').replace(',', '.');
      const priceNum = parseFloat(sanitizedPrice);
      if (!rawPrice || isNaN(priceNum) || priceNum < 0) {
        errors.push(`El precio "${rawPrice}" no es un número válido.`);
      }

      // 4. Validation: IVA Tipo
      let finalIva: TipoIva = '4';
      const cleanIva = rawIva.toLowerCase().replace('%', '').trim();
      if (['0', '2', '4', '6', '7'].includes(cleanIva)) {
        finalIva = cleanIva as TipoIva;
      } else if (cleanIva === '15') {
        finalIva = '4';
      } else if (cleanIva === '12') {
        finalIva = '2';
      } else if (cleanIva === '0') {
        finalIva = '0';
      } else if (cleanIva.includes('no objeto')) {
        finalIva = '6';
      } else if (cleanIva.includes('exento')) {
        finalIva = '7';
      } else {
        errors.push(`Tarifa IVA "${rawIva}" inválida. Use 4 (15%), 2 (12%), 0 (0%), 6 (No Objeto) o 7 (Exento).`);
      }

      // 5. Validation: Descuento
      const sanitizedDiscount = rawDiscount.replace('%', '').replace('$', '').replace(/\s/g, '').replace(',', '.');
      const discNum = parseFloat(sanitizedDiscount || '0');
      if (isNaN(discNum) || discNum < 0) {
        errors.push(`El descuento "${rawDiscount}" no es válido.`);
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
      setBulkError('No se encontraron registros de productos válidos en el archivo Excel.');
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
      }

      // Fast parallel batch save to Supabase
      await saveBulkProductsToSupabase(newProducts, currentUser?.correo);

      onSetProducts(updatedCatalog);
      setBulkSuccessMsg(`¡Éxito! Se han importado correctamente ${newProducts.length} productos al catálogo.`);
      
      setTimeout(() => {
        setIsBulkModalOpen(false);
        setParsedItems([]);
        setBulkFileText('');
        setBulkFileName('');
        setBulkSuccessMsg(null);
      }, 1500);

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
            Carga Masiva (Excel)
          </button>

          {allowDemo && (
            <button
              onClick={loadDefaults}
              className="px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Cargar Demos
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
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
        <div className="bg-white p-6 rounded-2xl border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-50 dark:border-zinc-800 pb-3">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-indigo-600" />
                Catálogo de Ítems e Impuestos ({products.length})
              </h3>
              <span className="text-[11px] text-gray-400">
                {currentUser?.empresaNombre ? `Empresa: ${currentUser.empresaNombre}` : 'Productos Registrados'}
              </span>
            </div>

            {/* Quick Sort Direction Badge */}
            {products.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400 text-[11px]">Ordenar por:</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 uppercase text-[10px] bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-md">
                  {sortField} ({sortDirection === 'asc' ? 'Menor a Mayor ↑' : 'Mayor a Menor ↓'})
                </span>
              </div>
            )}
          </div>

          <div className="w-full">
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
                    Cargar Masiva (Excel)
                  </button>
                  {allowDemo && (
                    <button
                      onClick={loadDefaults}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Cargar Demos
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-full overflow-visible">
                <table className="w-full text-left text-xs divide-y divide-gray-150 dark:divide-zinc-800">
                  <thead className="bg-gray-50 dark:bg-zinc-800 text-gray-500 font-semibold uppercase select-none">
                    <tr>
                      <th 
                        onClick={() => handleSort('codigo')}
                        className="px-3 py-2.5 rounded-l cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                        title="Ordenar por Código"
                      >
                        <div className="flex items-center gap-1">
                          <span>Código</span>
                          {sortField === 'codigo' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('nombre')}
                        className="px-3 py-2.5 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                        title="Ordenar por Descripción"
                      >
                        <div className="flex items-center gap-1">
                          <span>Nombre / Descripción</span>
                          {sortField === 'nombre' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('precio')}
                        className="px-3 py-2.5 text-right cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                        title="Ordenar por Precio (Mayor a menor / Menor a mayor)"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Precio Base</span>
                          {sortField === 'precio' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('ivaTipo')}
                        className="px-3 py-2.5 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                        title="Ordenar por IVA"
                      >
                        <div className="flex items-center gap-1">
                          <span>IVA SRI</span>
                          {sortField === 'ivaTipo' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40" />
                          )}
                        </div>
                      </th>
                      <th className="px-3 py-2.5 text-center rounded-r">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 dark:divide-zinc-800/60 font-medium">
                    {sortedProducts.map((item) => {
                      const ivaDef = IVA_TARIFAS[item.ivaTipo] || { label: 'Desconocido' };
                      return (
                        <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-850/20 transition">
                          <td className="px-3 py-2.5 font-mono text-indigo-600 dark:text-indigo-400 font-bold whitespace-nowrap">{item.codigo}</td>
                          <td className="px-3 py-2.5 text-gray-900 dark:text-gray-100 font-sans">
                            <div className="font-semibold break-words leading-tight">{item.nombre}</div>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-gray-800 dark:text-gray-200 font-bold whitespace-nowrap">
                            ${item.precio.toFixed(2)}
                          </td>
                          <td className="px-3 py-2.5 text-gray-500 font-sans text-[11px] whitespace-nowrap">
                            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 rounded">{ivaDef.label}</span>
                          </td>
                          <td className="px-3 py-2.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => startEditProduct(item)}
                                className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-lg cursor-pointer transition"
                                title="Editar producto"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  modalAlert.confirm(
                                    '¿Eliminar producto?',
                                    `¿Está seguro de eliminar "${item.nombre}" (${item.codigo}) del catálogo?`,
                                    () => {
                                      onDeleteProduct(item.id);
                                      modalAlert.success('Producto Eliminado', `El producto ${item.nombre} ha sido eliminado.`);
                                    },
                                    true,
                                    'Eliminar Producto',
                                    'Cancelar'
                                  );
                                }}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer transition"
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
              </div>
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
                    Descarga la plantilla en Excel con columnas y guía: <code className="font-mono bg-emerald-100 dark:bg-emerald-900/40 px-1 py-0.5 rounded">codigo, nombre, precio, iva_tipo, descuento_default</code>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Descargar Plantilla (.xlsx)
                </button>
              </div>

              {/* Step 2: Upload File / Drag and Drop */}
              <div className="space-y-2">
                <label className="font-bold text-gray-700 dark:text-zinc-300 block">
                  Paso 2: Cargar Archivo Excel (.xlsx)
                </label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div
                  onClick={() => !isParsingFile && !isProcessingBulk && fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isParsingFile || isProcessingBulk) return;
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      const fileNameLower = (file.name || '').toLowerCase();
                      if (!fileNameLower.endsWith('.xlsx')) {
                        setBulkError(`Formato no permitido. El archivo "${file.name}" no es válido. Solo se admiten archivos con extensión .xlsx.`);
                        setBulkFileName('');
                        setParsedItems([]);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                        return;
                      }
                      processFile(file);
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition ${
                    isParsingFile
                      ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 cursor-wait animate-pulse'
                      : 'border-gray-300 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-500 cursor-pointer bg-gray-50/50 dark:bg-zinc-800/30 hover:bg-emerald-50/20'
                  }`}
                >
                  {isParsingFile ? (
                    <div>
                      <Loader2 className="w-9 h-9 text-emerald-600 dark:text-emerald-400 animate-spin mx-auto mb-2" />
                      <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                        Leyendo y procesando archivo Excel (.xlsx)...
                      </p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                        Analizando columnas, validando tarifas de IVA y precios en tiempo récord...
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                      <p className="font-semibold text-gray-800 dark:text-gray-200">
                        {bulkFileName ? `Archivo cargado: ${bulkFileName}` : 'Haz clic aquí o arrastra tu archivo Excel (.xlsx)'}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1">
                        Formato admitido: Exclusivamente <strong className="text-emerald-600 dark:text-emerald-400">.xlsx</strong> (Excel). No se admiten archivos .csv ni otros formatos.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* In-progress processing banner */}
              {isProcessingBulk && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 rounded-xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 shadow-sm animate-pulse">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-bold text-xs">Guardando e importando {validCount} productos al catálogo...</p>
                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">Sincronizando de forma optimizada con la base de datos en segundo plano.</p>
                  </div>
                </div>
              )}

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
                disabled={isProcessingBulk || isParsingFile}
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setParsedItems([]);
                  setBulkFileText('');
                  setBulkFileName('');
                }}
                className="px-4 py-2 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>

              <button
                type="button"
                disabled={validCount === 0 || isProcessingBulk || isParsingFile}
                onClick={handleExecuteBulkImport}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition"
              >
                {isProcessingBulk ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando Productos...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Proceder con Carga ({validCount} Válidos)</span>
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
