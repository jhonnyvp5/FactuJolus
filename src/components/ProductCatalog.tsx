import React, { useState } from 'react';
import { Product, TipoIva } from '../types';
import { IVA_TARIFAS } from '../sri/utils';
import { Trash2, Sparkles, Plus, PackageCheck, Receipt, Edit3, Save, X } from 'lucide-react';
import { saveProductToSupabase } from '../lib/supabase';

interface ProductCatalogProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onSetProducts: (products: Product[]) => void;
}

export default function ProductCatalog({
  products,
  onAddProduct,
  onDeleteProduct,
  onSetProducts,
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
      descuentoDefault: discNum
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
            Administra tus códigos, tarifas del IVA, precios recurrentes y descuentos por defecto.
          </p>
        </div>
        <button
          onClick={loadDefaults}
          className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Cargar Productos Iniciales Demo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* ADD PRODUCT FORM */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 border-b border-gray-50 dark:border-zinc-805 pb-2 text-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-indigo-600" />
            Registrar Nuevo Producto / Bien
          </h3>

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
                {Object.entries(IVA_TARIFAS).map(([code, def]) => (
                  <option key={code} value={code}>{def.label}</option>
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
                ✓ ¡Producto agregado correctamente al catálogo!
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer leading-none"
            >
              <Plus className="w-4 h-4" /> Guardar en Catálogo
            </button>
          </form>
        </div>

        {/* PRODUCTS LIST TABLE */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 md:col-span-2 space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 border-b border-gray-50 dark:border-zinc-805 pb-2 text-sm flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-indigo-600" />
            Catálogo de Ítems e Impuestos ({products.length})
          </h3>

          <div className="overflow-x-auto">
            {products.length === 0 ? (
              <div className="py-12 text-center text-gray-400 space-y-2">
                <p>No tienes productos registrados en tu catálogo.</p>
                <p className="text-[10px]">Carga los de prueba o registra uno usando el formulario de la izquierda.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs whitespace-nowrap divide-y divide-gray-150 dark:divide-zinc-800">
                <thead className="bg-gray-50 dark:bg-zinc-800 text-gray-500 font-semibold uppercase">
                  <tr>
                    <th className="px-3 py-2 rounded-l">Código</th>
                    <th className="px-3 py-2">Nombre / Descripción</th>
                    <th className="px-3 py-2 text-right">Precio Base</th>
                    <th className="px-3 py-2">IVA SRI</th>
                    <th className="px-3 py-2 text-center rounded-r"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-zinc-800/60 font-medium">
                  {products.map((item) => {
                    const ivaDef = IVA_TARIFAS[item.ivaTipo] || { label: 'Desconocido' };
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-850/20">
                        <td className="px-3 py-3 font-mono text-indigo-600 dark:text-indigo-400 font-bold">{item.codigo}</td>
                        <td className="px-3 py-3 truncate max-w-[200px] text-gray-900 dark:text-gray-105" title={item.nombre}>
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
                              className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded cursor-pointer"
                              title="Editar producto"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteProduct(item.id)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded cursor-pointer"
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
    </div>
  );
}
