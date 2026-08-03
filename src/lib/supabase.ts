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

    // Try 'clientes' (Spanish) first, then 'clients' (English)
    let { data, error } = await supabase.from('clientes').select('id').limit(1);

    if (error && isTableMissingError(error)) {
      const res = await supabase.from('clients').select('id').limit(1);
      error = res.error;
    }

    // Ensure storage buckets exist
    ensureSupabaseBucketsExist().catch(e => console.warn('Bucket check notice:', e));
    ensureSuperAdminInSupabase().catch(e => console.warn('Superadmin user sync notice:', e));

    if (error) {
      if (isTableMissingError(error)) {
        return { 
          success: true, 
          tablesExist: false, 
          message: 'Conexión REST exitosa, pero la tabla "clientes" o "clients" aún no existe en Supabase.' 
        };
      }
      if (error.message.includes('row-level security') || error.code === '42501') {
        return {
          success: false,
          tablesExist: true,
          message: 'Tabla encontrada, pero las políticas de seguridad RLS bloquean la clave pública anon. Ejecute el comando SQL para permitir RLS en anon.'
        };
      }
      return { success: false, tablesExist: false, message: `Aviso Supabase: ${error.message}` };
    }

    return { success: true, tablesExist: true, message: '¡Conexión exitosa, tablas y buckets verificados en Supabase!' };
  } catch (err: any) {
    return { success: false, tablesExist: false, message: `Error al conectar con Supabase: ${err.message || 'Error de red'}` };
  }
}

export const SUPABASE_SQL_SCRIPT = `-- SCRIPT DE CREACIÓN DE TABLAS Y BUCKETS EN SUPABASE - JOLUS SERVICES PORTAL SRI
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

-- 5. TABLA DE USUARIOS DEL PORTAL
CREATE TABLE IF NOT EXISTS public.usuarios_portal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario TEXT,
    correo VARCHAR(255) NOT NULL UNIQUE,
    clave_hash TEXT NOT NULL DEFAULT 'admin123',
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    nombre TEXT,
    is_temp BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS y crear políticas de acceso público/anon para todas las tablas
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'clientes',
        'productos',
        'facturas',
        'proformas',
        'bitacoras_actividades',
        'emisor_config',
        'factura_detalles',
        'invitaciones',
        'notas_credito',
        'notas_credito_detalles',
        'proforma_detalles',
        'usuarios_portal',
        'clients',
        'products',
        'invoices'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'Permitir anon ' || t, t);
            EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (true) WITH CHECK (true);', 'Permitir anon ' || t, t);
        END IF;
    END LOOP;
END $$;

-- REGISTRO DE USUARIO SUPERADMIN SOLICITADO
INSERT INTO public.usuarios_portal (usuario, correo, clave_hash, role, nombre, is_temp)
VALUES (
    'Anibal Joel Gualoto Indacochea',
    'jolusservices@gmail.com',
    'admin123',
    'SUPERADMIN',
    'Anibal Joel Gualoto Indacochea',
    false
)
ON CONFLICT (correo) DO UPDATE SET 
    usuario = EXCLUDED.usuario,
    role = 'SUPERADMIN',
    nombre = EXCLUDED.nombre;

-- ==============================================================================
-- 5. CREACIÓN DE BUCKETS DE ALMACENAMIENTO DE ARCHIVOS (SUPABASE STORAGE)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) VALUES
    ('facturas-pdf', 'facturas-pdf', true),
    ('facturas-xml-sin-firmar', 'facturas-xml-sin-firmar', true),
    ('facturas-xml-firmados', 'facturas-xml-firmados', true),
    ('notas-credito-pdf', 'notas-credito-pdf', true),
    ('notas-credito-xml-firmados', 'notas-credito-xml-firmados', true),
    ('notas-credito-xml-sin-firmar', 'notas-credito-xml-sin-firmar', true),
    ('proformas-pdf', 'proformas-pdf', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas permisivas de lectura y escritura para almacenamiento público
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Permitir lectura y escritura publica en buckets'
    ) THEN
        CREATE POLICY "Permitir lectura y escritura publica en buckets"
        ON storage.objects FOR ALL
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;
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

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// --- CLIENTS / CLIENTES ---
export async function fetchClientsFromSupabase(): Promise<Client[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  // Try Spanish table 'clientes' first
  let { data, error } = await supabase.from('clientes').select('*');
  
  if (error && isTableMissingError(error)) {
    const fallback = await supabase.from('clients').select('*');
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    if (!isTableMissingError(error)) {
      console.warn('Aviso Supabase clientes:', error.message);
    }
    return null;
  }

  return data ? data.map(item => ({
    id: item.id,
    tipoIdentificacion: item.tipo_identificacion || item.tipoIdentificacion || '05',
    identificacion: item.identificacion,
    nombre: item.nombre,
    direccion: item.direccion || '',
    telefono: item.telefono || '',
    correo: item.correo || ''
  })) : [];
}

export async function saveClientToSupabase(client: Client): Promise<{ success: boolean; errorDetails?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { success: false, errorDetails: 'Cliente de Supabase no inicializado.' };

  // Prepare Spanish table payload ('clientes')
  const spanishPayload: Record<string, any> = {
    tipo_identificacion: client.tipoIdentificacion,
    identificacion: client.identificacion,
    nombre: client.nombre,
    direccion: client.direccion,
    telefono: client.telefono,
    correo: client.correo
  };

  if (isValidUuid(client.id)) {
    spanishPayload.id = client.id;
  }

  // First try 'clientes' table
  let { error } = await supabase.from('clientes').upsert(spanishPayload, { onConflict: 'identificacion' });

  if (error && isTableMissingError(error)) {
    // Fallback to 'clients' table
    const englishPayload = {
      id: client.id,
      tipo_identificacion: client.tipoIdentificacion,
      identificacion: client.identificacion,
      nombre: client.nombre,
      direccion: client.direccion,
      telefono: client.telefono,
      correo: client.correo
    };
    const res = await supabase.from('clients').upsert(englishPayload);
    error = res.error;
  }

  if (error) {
    console.warn('Error al guardar cliente en Supabase:', error.message, error);
    return { success: false, errorDetails: error.message };
  }

  return { success: true };
}

export async function deleteClientFromSupabase(id: string, identificacion?: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  let { error } = await supabase.from('clientes').delete().eq('identificacion', identificacion || id);
  if (error && isTableMissingError(error)) {
    const res = await supabase.from('clients').delete().eq('id', id);
    error = res.error;
  }
  return !error;
}

// --- PRODUCTS / PRODUCTOS ---
export async function fetchProductsFromSupabase(): Promise<Product[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  let { data, error } = await supabase.from('productos').select('*');
  if (error && isTableMissingError(error)) {
    const fallback = await supabase.from('products').select('*');
    data = fallback.data;
    error = fallback.error;
  }

  if (error) return null;

  return data ? data.map(item => ({
    id: item.id,
    codigo: item.codigo,
    nombre: item.nombre,
    precio: Number(item.precio) || 0,
    ivaTipo: item.iva_tipo || item.ivaTipo || '4',
    descuentoDefault: Number(item.descuento_default ?? item.descuentoDefault ?? 0)
  })) : [];
}

export async function saveProductToSupabase(product: Product): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const spanishPayload: Record<string, any> = {
    codigo: product.codigo,
    nombre: product.nombre,
    precio: product.precio,
    iva_tipo: product.ivaTipo,
    descuento_default: product.descuentoDefault
  };

  if (isValidUuid(product.id)) {
    spanishPayload.id = product.id;
  }

  let { error } = await supabase.from('productos').upsert(spanishPayload, { onConflict: 'codigo' });

  if (error && isTableMissingError(error)) {
    const englishPayload = {
      id: product.id,
      codigo: product.codigo,
      nombre: product.nombre,
      precio: product.precio,
      iva_tipo: product.ivaTipo,
      descuento_default: product.descuentoDefault
    };
    const res = await supabase.from('products').upsert(englishPayload);
    error = res.error;
  }

  return !error;
}

export async function deleteProductFromSupabase(id: string, codigo?: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  let { error } = await supabase.from('productos').delete().eq('codigo', codigo || id);
  if (error && isTableMissingError(error)) {
    const res = await supabase.from('products').delete().eq('id', id);
    error = res.error;
  }
  return !error;
}

// --- INVOICES / FACTURAS ---
export async function fetchInvoicesFromSupabase(): Promise<Invoice[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  let { data, error } = await supabase.from('facturas').select('*').order('created_at', { ascending: false });
  if (error && isTableMissingError(error)) {
    const fallback = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    data = fallback.data;
    error = fallback.error;
  }

  if (error) return null;

  return data ? data.map(item => ({
    id: item.id,
    secuencial: item.secuencial,
    fechaEmision: item.fecha_emision || item.fechaEmision,
    cliente: typeof item.cliente_datos === 'string' ? JSON.parse(item.cliente_datos) : (typeof item.cliente === 'string' ? JSON.parse(item.cliente) : (item.cliente_datos || item.cliente)),
    detalles: typeof item.detalles === 'string' ? JSON.parse(item.detalles) : (item.detalles || []),
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

  const spanishPayload: Record<string, any> = {
    secuencial: invoice.secuencial,
    fecha_emision: invoice.fechaEmision || new Date().toISOString().split('T')[0],
    cliente_datos: invoice.cliente,
    forma_pago: invoice.formaPago || '01',
    plazo: invoice.plazo || 0,
    unidad_tiempo: invoice.unidadTiempo || 'dias',
    clave_acceso: invoice.claveAcceso,
    xml: invoice.xml,
    xml_firmado: invoice.xmlFirmado,
    estado: invoice.estado || 'Borrador',
    mensajes_sri: invoice.mensajesSRI,
    fecha_autorizacion: invoice.fechaAutorizacion,
    numero_autorizacion: invoice.numeroAutorizacion,
    info_adicional: invoice.infoAdicional,
    resumen_impuestos: invoice.resumenImpuestos,
    creador_nombre: invoice.creadorNombre
  };

  if (isValidUuid(invoice.id)) {
    spanishPayload.id = invoice.id;
  }

  let { error } = await supabase.from('facturas').upsert(spanishPayload, { onConflict: 'clave_acceso' });

  if (error && isTableMissingError(error)) {
    const englishPayload = {
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
    const res = await supabase.from('invoices').upsert(englishPayload);
    error = res.error;
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
    cliente: typeof item.cliente_datos === 'string' ? JSON.parse(item.cliente_datos) : (typeof item.cliente === 'string' ? JSON.parse(item.cliente) : item.cliente),
    detalles: typeof item.detalles === 'string' ? JSON.parse(item.detalles) : (item.detalles || []),
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

  const payload: Record<string, any> = {
    secuencial: proforma.secuencial,
    fecha_emision: proforma.fechaEmision,
    cliente_datos: proforma.cliente,
    resumen_impuestos: proforma.resumenImpuestos,
    informacion_pago: proforma.informacionPago,
    nota_dudas: proforma.notaDudas,
    empresa_datos: {
      nombre: proforma.empresaNombre,
      direccion: proforma.empresaDireccion,
      telefono: proforma.empresaTelefono,
      correo: proforma.empresaCorreo
    }
  };

  if (isValidUuid(proforma.id)) {
    payload.id = proforma.id;
  }

  const { error } = await supabase.from('proformas').upsert(payload);
  return !error;
}

/* ========================================================================
   SUPABASE STORAGE BUCKETS (7 BUCKETS IMPLEMENTATION & FILE NAMING)
   ======================================================================== */

export const SUPABASE_BUCKETS = {
  FACTURAS_PDF: 'facturas-pdf',
  FACTURAS_XML_SIN_FIRMAR: 'facturas-xml-sin-firmar',
  FACTURAS_XML_FIRMADOS: 'facturas-xml-firmados',
  NOTAS_CREDITO_PDF: 'notas-credito-pdf',
  NOTAS_CREDITO_XML_FIRMADOS: 'notas-credito-xml-firmados',
  NOTAS_CREDITO_XML_SIN_FIRMAR: 'notas-credito-xml-sin-firmar',
  PROFORMAS_PDF: 'proformas-pdf',
} as const;

/**
 * Helper to ensure all 7 buckets exist in Supabase Storage
 */
export async function ensureSupabaseBucketsExist(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const buckets = Object.values(SUPABASE_BUCKETS);
  for (const bucket of buckets) {
    try {
      await supabase.storage.createBucket(bucket, { public: true });
    } catch {
      // Bucket already exists or created via SQL
    }
  }
}

/**
 * Upload raw content (XML string or PDF Blob/File) to a Supabase bucket
 */
export async function uploadToSupabaseBucket(
  bucketName: string,
  fileName: string,
  content: string | Blob | File,
  contentType: string = 'text/plain'
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Supabase no inicializado.' };

  try {
    let payload: Blob | File;
    if (typeof content === 'string') {
      payload = new Blob([content], { type: contentType });
    } else {
      payload = content;
    }

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, payload, {
        upsert: true,
        contentType
      });

    if (error) {
      console.warn(`[Supabase Storage] Error al subir ${fileName} a ${bucketName}:`, error.message);
      return { success: false, error: error.message };
    }

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    return { success: true, publicUrl: publicUrlData.publicUrl };
  } catch (err: any) {
    console.error(`[Supabase Storage] Excepción al subir a ${bucketName}:`, err);
    return { success: false, error: err.message || 'Error de red en almacenamiento' };
  }
}

// --- 1. FACTURA PDF ("FAC establecimiento-punto de emision-secuencial factura") ---
export async function uploadInvoicePdf(
  estab: string = '001',
  ptoEmi: string = '001',
  secuencial: string,
  pdfContent: Blob | File
) {
  const cleanEstab = String(estab).padStart(3, '0');
  const cleanPtoEmi = String(ptoEmi).padStart(3, '0');
  const cleanSeq = String(secuencial).padStart(9, '0');
  const fileName = `FAC ${cleanEstab}-${cleanPtoEmi}-${cleanSeq}.pdf`;

  return uploadToSupabaseBucket(SUPABASE_BUCKETS.FACTURAS_PDF, fileName, pdfContent, 'application/pdf');
}

// --- 2. FACTURA XML SIN FIRMAR ("FAC establecimiento-punto de emision-secuencial factura") ---
export async function uploadInvoiceXmlSinFirmar(
  estab: string = '001',
  ptoEmi: string = '001',
  secuencial: string,
  xmlContent: string
) {
  const cleanEstab = String(estab).padStart(3, '0');
  const cleanPtoEmi = String(ptoEmi).padStart(3, '0');
  const cleanSeq = String(secuencial).padStart(9, '0');
  const fileName = `FAC ${cleanEstab}-${cleanPtoEmi}-${cleanSeq}.xml`;

  return uploadToSupabaseBucket(SUPABASE_BUCKETS.FACTURAS_XML_SIN_FIRMAR, fileName, xmlContent, 'application/xml');
}

// --- 3. FACTURA XML FIRMADO ("FAC establecimiento-punto de emision-secuencial factura_firmado") ---
export async function uploadInvoiceXmlFirmado(
  estab: string = '001',
  ptoEmi: string = '001',
  secuencial: string,
  xmlContent: string
) {
  const cleanEstab = String(estab).padStart(3, '0');
  const cleanPtoEmi = String(ptoEmi).padStart(3, '0');
  const cleanSeq = String(secuencial).padStart(9, '0');
  const fileName = `FAC ${cleanEstab}-${cleanPtoEmi}-${cleanSeq}_firmado.xml`;

  return uploadToSupabaseBucket(SUPABASE_BUCKETS.FACTURAS_XML_FIRMADOS, fileName, xmlContent, 'application/xml');
}

// --- 4. NOTA DE CRÉDITO PDF ("NCT establecimiento-punto de emision-secuencial (nota nc)") ---
export async function uploadCreditNotePdf(
  estab: string = '001',
  ptoEmi: string = '001',
  secuencial: string,
  pdfContent: Blob | File
) {
  const cleanEstab = String(estab).padStart(3, '0');
  const cleanPtoEmi = String(ptoEmi).padStart(3, '0');
  const cleanSeq = String(secuencial).padStart(9, '0');
  const fileName = `NCT ${cleanEstab}-${cleanPtoEmi}-${cleanSeq}.pdf`;

  return uploadToSupabaseBucket(SUPABASE_BUCKETS.NOTAS_CREDITO_PDF, fileName, pdfContent, 'application/pdf');
}

// --- 5. NOTA DE CRÉDITO XML FIRMADO ("NCT establecimiento-punto de emision-secuencial (nota nc)_firmado") ---
export async function uploadCreditNoteXmlFirmado(
  estab: string = '001',
  ptoEmi: string = '001',
  secuencial: string,
  xmlContent: string
) {
  const cleanEstab = String(estab).padStart(3, '0');
  const cleanPtoEmi = String(ptoEmi).padStart(3, '0');
  const cleanSeq = String(secuencial).padStart(9, '0');
  const fileName = `NCT ${cleanEstab}-${cleanPtoEmi}-${cleanSeq}_firmado.xml`;

  return uploadToSupabaseBucket(SUPABASE_BUCKETS.NOTAS_CREDITO_XML_FIRMADOS, fileName, xmlContent, 'application/xml');
}

// --- 6. NOTA DE CRÉDITO XML SIN FIRMAR ("NCT establecimiento-punto de emision-secuencial (nota nc)") ---
export async function uploadCreditNoteXmlSinFirmar(
  estab: string = '001',
  ptoEmi: string = '001',
  secuencial: string,
  xmlContent: string
) {
  const cleanEstab = String(estab).padStart(3, '0');
  const cleanPtoEmi = String(ptoEmi).padStart(3, '0');
  const cleanSeq = String(secuencial).padStart(9, '0');
  const fileName = `NCT ${cleanEstab}-${cleanPtoEmi}-${cleanSeq}.xml`;

  return uploadToSupabaseBucket(SUPABASE_BUCKETS.NOTAS_CREDITO_XML_SIN_FIRMAR, fileName, xmlContent, 'application/xml');
}

// --- 7. PROFORMA PDF ("Proforma_NombreClienteOEmpresa_fecha") ---
export async function uploadProformaPdf(
  clienteOEmpresa: string,
  fecha: string,
  pdfContent: Blob | File
) {
  const cleanName = (clienteOEmpresa || 'Cliente').trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
  const cleanFecha = fecha || new Date().toISOString().split('T')[0];
  const fileName = `Proforma_${cleanName}_${cleanFecha}.pdf`;

  return uploadToSupabaseBucket(SUPABASE_BUCKETS.PROFORMAS_PDF, fileName, pdfContent, 'application/pdf');
}

/**
 * Ensure superadmin user is registered in Supabase usuarios_portal table
 */
export async function ensureSuperAdminInSupabase(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const superAdminUser = {
      usuario: 'Anibal Joel Gualoto Indacochea',
      correo: 'jolusservices@gmail.com',
      role: 'SUPERADMIN',
      nombre: 'Anibal Joel Gualoto Indacochea',
      clave_hash: 'admin123',
      is_temp: false
    };

    const { error } = await supabase
      .from('usuarios_portal')
      .upsert([superAdminUser], { onConflict: 'correo' });

    if (error && !isTableMissingError(error)) {
      console.warn('[Supabase] Aviso usuarios_portal superadmin:', error.message);
    }
  } catch (err) {
    console.warn('[Supabase] Excepción en usuarios_portal superadmin:', err);
  }
}

/**
 * Fetch rows from any Supabase table for database inspection
 */
export async function fetchSupabaseTableRows(tableName: string): Promise<{ data: any[]; error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { data: [], error: 'Cliente de Supabase no configurado o inactivo.' };

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      // Retry without order by created_at if table doesn't have created_at column
      if (error.message.includes('created_at') || error.code === '42703') {
        const fallbackRes = await supabase.from(tableName).select('*').limit(100);
        if (fallbackRes.error) {
          return { data: [], error: fallbackRes.error.message };
        }
        return { data: fallbackRes.data || [], error: null };
      }
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err: any) {
    return { data: [], error: err.message || 'Error consultando la tabla en Supabase.' };
  }
}

/**
 * Fetch list of files in a Supabase storage bucket
 */
export async function fetchSupabaseStorageFiles(bucketName: string): Promise<{ files: any[]; error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { files: [], error: 'Cliente de Supabase no configurado.' };

  try {
    const { data, error } = await supabase.storage.from(bucketName).list('', {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' }
    });

    if (error) {
      return { files: [], error: error.message };
    }

    return { files: data || [], error: null };
  } catch (err: any) {
    return { files: [], error: err.message || 'Error listando archivos del bucket.' };
  }
}

export async function authenticateUserInSupabase(
  email: string,
  pass: string
): Promise<PortalUser | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase
      .from('usuarios_portal')
      .select('*')
      .eq('correo', cleanEmail)
      .maybeSingle();

    if (error || !data) return null;

    // Check password match (supports clave_hash or clave)
    if (data.clave_hash === pass || data.clave === pass) {
      return {
        id: data.id || `supa-${Date.now()}`,
        correo: data.correo,
        clave: pass,
        role: (data.role || 'USER').toUpperCase() as any,
        nombre: data.nombre || data.usuario || data.correo.split('@')[0],
        fechaRegistro: data.created_at || new Date().toISOString()
      };
    }
  } catch (err) {
    console.warn('[Supabase] Error en autenticación usuarios_portal:', err);
  }
  return null;
}

/**
 * Upsert user into Supabase usuarios_portal
 */
export async function upsertUserInSupabase(user: PortalUser): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase
      .from('usuarios_portal')
      .upsert([
        {
          usuario: user.nombre,
          correo: user.correo.toLowerCase(),
          clave_hash: user.clave,
          role: user.role,
          nombre: user.nombre,
          is_temp: false
        }
      ], { onConflict: 'correo' });
  } catch (err) {
    console.warn('[Supabase] Error al sincronizar usuario en usuarios_portal:', err);
  }
}



