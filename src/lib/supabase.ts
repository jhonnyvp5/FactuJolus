import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Client, Product, Invoice, CreditNote, Proforma, EmitterConfig, PortalUser, ActivityLog } from '../types';

// Default Supabase project URL & Anon Key provided by user
const DEFAULT_SUPABASE_URL = 'https://zrbmybedhtziyvkwrvzl.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyYm15YmVkaHR6aXl2a3dydnpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MDMzMzUsImV4cCI6MjEwMTA3OTMzNX0.shxpYArUxwCd9nLqSG7fV2SbVGwz7oHp4rKuTWY2T7g';

// Key stored in localStorage if user configures it dynamically
const ANON_KEY_STORAGE_KEY = 'sri_supabase_anon_key';
const URL_STORAGE_KEY = 'sri_supabase_url';

export function getSupabaseConfig() {
  const metaEnv = (import.meta as any).env || {};
  const url = localStorage.getItem(URL_STORAGE_KEY) || metaEnv.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const anonKey = localStorage.getItem(ANON_KEY_STORAGE_KEY) || metaEnv.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
  return { url, anonKey };
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  if (url) localStorage.setItem(URL_STORAGE_KEY, url);
  if (anonKey) localStorage.setItem(ANON_KEY_STORAGE_KEY, anonKey);
  resetSupabaseInstance();
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;

  try {
    if (!supabaseInstance) {
      supabaseInstance = createClient(url, anonKey, {
        auth: { persistSession: false }
      });
    }
    return supabaseInstance;
  } catch (err) {
    console.error('Error instantiating Supabase client:', err);
    return null;
  }
}

// Reset instance when config changes
export function resetSupabaseInstance() {
  supabaseInstance = null;
}

// Connection test helper
export async function testSupabaseConnection(): Promise<{ success: boolean; tablesExist: boolean; message: string }> {
  const { url, anonKey } = getSupabaseConfig();
  if (!url) return { success: false, tablesExist: false, message: 'URL de Supabase no configurada.' };
  
  try {
    const supabase = getSupabase();
    if (!supabase) return { success: false, tablesExist: false, message: 'No se pudo instanciar el cliente de Supabase.' };

    const { error } = await supabase.from('clients').select('id').limit(1);

    if (error) {
      if (error.message.includes('schema cache') || error.message.includes('does not exist') || error.code === '42P01' || error.code === 'PGRST204') {
        return { 
          success: true, 
          tablesExist: false, 
          message: 'Conexión REST exitosa, pero las tablas aún no existen en Supabase. Copie y ejecute el código SQL proporcionado en el SQL Editor de Supabase.' 
        };
      }
      return { success: false, tablesExist: false, message: `Aviso Supabase: ${error.message}` };
    }

    return { success: true, tablesExist: true, message: '¡Conexión exitosa y tablas verificadas en Supabase!' };
  } catch (err: any) {
    return { success: false, tablesExist: false, message: `Error al conectar con Supabase: ${err.message || 'Error de red'}` };
  }
}

export const SUPABASE_SQL_SCRIPT = `-- SCRIPT DE CREACIÓN DE TABLAS SUPABASE - JOLUS SERVICES PORTAL SRI
-- Copie y pegue este código completo en el "SQL Editor" de su panel de Supabase y haga clic en "Run".

-- 1. TABLA DE CLIENTES
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    tipo_identificacion TEXT NOT NULL,
    identificacion TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    direccion TEXT,
    telefono TEXT,
    correo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA DE PRODUCTOS
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    precio NUMERIC(12,4) NOT NULL DEFAULT 0,
    iva_tipo TEXT DEFAULT '4',
    descuento_default NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE FACTURAS
CREATE TABLE IF NOT EXISTS public.invoices (
    id TEXT PRIMARY KEY,
    secuencial TEXT NOT NULL,
    fecha_emision TEXT NOT NULL,
    cliente JSONB NOT NULL,
    detalles JSONB NOT NULL,
    forma_pago TEXT,
    plazo NUMERIC DEFAULT 0,
    unidad_tiempo TEXT,
    clave_acceso TEXT UNIQUE,
    xml TEXT,
    xml_firmado TEXT,
    estado TEXT DEFAULT 'BORRADOR',
    mensajes_sri JSONB DEFAULT '[]'::jsonb,
    fecha_autorizacion TEXT,
    numero_autorizacion TEXT,
    info_adicional JSONB DEFAULT '[]'::jsonb,
    resumen_impuestos JSONB,
    creador_nombre TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE PROFORMAS
CREATE TABLE IF NOT EXISTS public.proformas (
    id TEXT PRIMARY KEY,
    secuencial TEXT NOT NULL,
    fecha_emision TEXT NOT NULL,
    cliente JSONB NOT NULL,
    detalles JSONB NOT NULL,
    resumen_impuestos JSONB,
    informacion_pago TEXT,
    nota_dudas TEXT,
    empresa_nombre TEXT,
    empresa_direccion TEXT,
    empresa_telefono TEXT,
    empresa_correo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deshabilitar RLS para permitir lectura y escritura mediante anon_key
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.proformas DISABLE ROW LEVEL SECURITY;
`;

/* ========================================================================
   SUPABASE DATA SYNC HELPERS (CLIENTS, PRODUCTS, INVOICES, PROFORMAS, ETC)
   ======================================================================== */

// Helper to check if error is table missing
function isTableMissingError(error: any): boolean {
  if (!error) return false;
  const msg = error.message || '';
  return msg.includes('schema cache') || msg.includes('does not exist') || error.code === '42P01' || error.code === 'PGRST204';
}

// --- CLIENTS ---
export async function fetchClientsFromSupabase(): Promise<Client[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from('clients').select('*');
  if (error) {
    if (!isTableMissingError(error)) {
      console.warn('Aviso Supabase clientes:', error.message);
    }
    return null;
  }
  return data ? data.map(item => ({
    id: item.id,
    tipoIdentificacion: item.tipo_identificacion || item.tipoIdentificacion,
    identificacion: item.identificacion,
    nombre: item.nombre,
    direccion: item.direccion,
    telefono: item.telefono,
    correo: item.correo
  })) : [];
}

export async function saveClientToSupabase(client: Client): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  
  const payload = {
    id: client.id,
    tipo_identificacion: client.tipoIdentificacion,
    identificacion: client.identificacion,
    nombre: client.nombre,
    direccion: client.direccion,
    telefono: client.telefono,
    correo: client.correo
  };

  const { error } = await supabase.from('clients').upsert(payload);
  if (error) {
    if (!isTableMissingError(error)) {
      console.warn('No se pudo sincronizar cliente en Supabase:', error.message);
    }
    return false;
  }
  return true;
}

export async function deleteClientFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from('clients').delete().eq('id', id);
  return !error;
}

// --- PRODUCTS ---
export async function fetchProductsFromSupabase(): Promise<Product[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from('products').select('*');
  if (error) return null;
  return data ? data.map(item => ({
    id: item.id,
    codigo: item.codigo,
    nombre: item.nombre,
    precio: item.precio,
    ivaTipo: item.iva_tipo || item.ivaTipo || '4',
    descuentoDefault: item.descuento_default ?? item.descuentoDefault ?? 0
  })) : [];
}

export async function saveProductToSupabase(product: Product): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const payload = {
    id: product.id,
    codigo: product.codigo,
    nombre: product.nombre,
    precio: product.precio,
    iva_tipo: product.ivaTipo,
    descuento_default: product.descuentoDefault
  };

  const { error } = await supabase.from('products').upsert(payload);
  if (error && !isTableMissingError(error)) {
    console.warn('No se pudo sincronizar producto en Supabase:', error.message);
  }
  return !error;
}

export async function deleteProductFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from('products').delete().eq('id', id);
  return !error;
}

// --- INVOICES ---
export async function fetchInvoicesFromSupabase(): Promise<Invoice[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
  if (error) return null;
  return data ? data.map(item => ({
    id: item.id,
    secuencial: item.secuencial,
    fechaEmision: item.fecha_emision || item.fechaEmision,
    cliente: typeof item.cliente === 'string' ? JSON.parse(item.cliente) : item.cliente,
    detalles: typeof item.detalles === 'string' ? JSON.parse(item.detalles) : item.detalles,
    formaPago: item.forma_pago || item.formaPago,
    plazo: item.plazo,
    unidadTiempo: item.unidad_tiempo || item.unidadTiempo,
    claveAcceso: item.clave_acceso || item.claveAcceso,
    xml: item.xml,
    xmlFirmado: item.xml_firmado || item.xmlFirmado,
    estado: item.estado,
    mensajesSRI: typeof item.mensajes_sri === 'string' ? JSON.parse(item.mensajes_sri) : (item.mensajes_sri || []),
    fechaAutorizacion: item.fecha_autorizacion || item.fechaAutorizacion,
    numeroAutorizacion: item.numero_autorizacion || item.numeroAutorizacion,
    infoAdicional: typeof item.info_adicional === 'string' ? JSON.parse(item.info_adicional) : (item.info_adicional || []),
    resumenImpuestos: typeof item.resumen_impuestos === 'string' ? JSON.parse(item.resumen_impuestos) : item.resumen_impuestos,
    creadorNombre: item.creador_nombre || item.creadorNombre
  })) : [];
}

export async function saveInvoiceToSupabase(invoice: Invoice): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const payload = {
    id: invoice.id,
    secuencial: invoice.secuencial,
    fecha_emision: invoice.fechaEmision,
    cliente: invoice.cliente,
    detalles: invoice.detalles,
    forma_pago: invoice.formaPago,
    plazo: invoice.plazo,
    unidad_tiempo: invoice.unidadTiempo,
    clave_acceso: invoice.claveAcceso,
    xml: invoice.xml,
    xml_firmado: invoice.xmlFirmado,
    estado: invoice.estado,
    mensajes_sri: invoice.mensajesSRI,
    fecha_autorizacion: invoice.fechaAutorizacion,
    numero_autorizacion: invoice.numeroAutorizacion,
    info_adicional: invoice.infoAdicional,
    resumen_impuestos: invoice.resumenImpuestos,
    creador_nombre: invoice.creadorNombre
  };

  const { error } = await supabase.from('invoices').upsert(payload);
  if (error && !isTableMissingError(error)) {
    console.warn('No se pudo sincronizar factura en Supabase:', error.message);
  }
  return !error;
}

// --- PROFORMAS ---
export async function fetchProformasFromSupabase(): Promise<Proforma[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from('proformas').select('*').order('created_at', { ascending: false });
  if (error) return null;
  return data ? data.map(item => ({
    id: item.id,
    secuencial: item.secuencial,
    fechaEmision: item.fecha_emision || item.fechaEmision,
    cliente: typeof item.cliente === 'string' ? JSON.parse(item.cliente) : item.cliente,
    detalles: typeof item.detalles === 'string' ? JSON.parse(item.detalles) : item.detalles,
    resumenImpuestos: typeof item.resumen_impuestos === 'string' ? JSON.parse(item.resumen_impuestos) : item.resumen_impuestos,
    informacionPago: item.informacion_pago || item.informacionPago,
    notaDudas: item.nota_dudas || item.notaDudas,
    empresaNombre: item.empresa_nombre || item.empresaNombre,
    empresaDireccion: item.empresa_direccion || item.empresaDireccion,
    empresaTelefono: item.empresa_telefono || item.empresaTelefono,
    empresaCorreo: item.empresa_correo || item.empresaCorreo
  })) : [];
}

export async function saveProformaToSupabase(proforma: Proforma): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const payload = {
    id: proforma.id,
    secuencial: proforma.secuencial,
    fecha_emision: proforma.fechaEmision,
    cliente: proforma.cliente,
    detalles: proforma.detalles,
    resumen_impuestos: proforma.resumenImpuestos,
    informacion_pago: proforma.informacionPago,
    nota_dudas: proforma.notaDudas,
    empresa_nombre: proforma.empresaNombre,
    empresa_direccion: proforma.empresaDireccion,
    empresa_telefono: proforma.empresaTelefono,
    empresa_correo: proforma.empresaCorreo
  };

  const { error } = await supabase.from('proformas').upsert(payload);
  if (error && !isTableMissingError(error)) {
    console.warn('No se pudo sincronizar proforma en Supabase:', error.message);
  }
  return !error;
}

