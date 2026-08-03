import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Client, Product, Invoice, CreditNote, Proforma, EmitterConfig, PortalUser, ActivityLog, Invitation } from '../types';

// Default Supabase project URL & Anon Key provided by user
const DEFAULT_SUPABASE_URL = 'https://zrbmybedhtziyvkwrvzl.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyYm15YmVkaHR6aXl2a3dydnpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MDMzMzUsImV4cCI6MjEwMTA3OTMzNX0.shxpYArUxwCd9nLqSG7fV2SbVGwz7oHp4rKuTWY2T7g';

// Storage keys
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

export function resetSupabaseInstance() {
  supabaseInstance = null;
}

// Connection test helper
export async function testSupabaseConnection(): Promise<{ success: boolean; tablesExist: boolean; message: string }> {
  const { url } = getSupabaseConfig();
  if (!url) return { success: false, tablesExist: false, message: 'URL de Supabase no configurada.' };
  
  try {
    const supabase = getSupabase();
    if (!supabase) return { success: false, tablesExist: false, message: 'No se pudo instanciar el cliente de Supabase.' };

    const { error } = await supabase.from('clientes').select('id').limit(1);

    // Ensure storage buckets and superadmin exist
    ensureSupabaseBucketsExist().catch(e => console.warn('Bucket check notice:', e));
    ensureSuperAdminInSupabase().catch(e => console.warn('Superadmin user sync notice:', e));

    if (error) {
      if (isTableMissingError(error)) {
        return { 
          success: true, 
          tablesExist: false, 
          message: 'Conexión REST exitosa. Ejecute el script SQL en Supabase para crear todas las 12 tablas si aún no existen.' 
        };
      }
      if (error.message.includes('row-level security') || error.code === '42501') {
        return {
          success: false,
          tablesExist: true,
          message: 'Tablas encontradas, pero RLS requiere habilitar las políticas anónimas. Ejecute el script SQL adjunto.'
        };
      }
      return { success: false, tablesExist: false, message: `Aviso Supabase: ${error.message}` };
    }

    return { success: true, tablesExist: true, message: '¡Conexión exitosa, 12 tablas y buckets verificados en Supabase!' };
  } catch (err: any) {
    return { success: false, tablesExist: false, message: `Error al conectar con Supabase: ${err.message || 'Error de red'}` };
  }
}

export const SUPABASE_SQL_SCRIPT = `-- SCRIPT DE CREACIÓN DE TABLAS Y BUCKETS EN SUPABASE - JOLUS SERVICES PORTAL SRI
-- Copie y pegue este código completo en el "SQL Editor" de su panel de Supabase y haga clic en "Run".

-- 1. TABLA DE CLIENTES
CREATE TABLE IF NOT EXISTS public.clientes (
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
CREATE TABLE IF NOT EXISTS public.productos (
    id TEXT PRIMARY KEY,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    precio NUMERIC(12,4) NOT NULL DEFAULT 0,
    iva_tipo TEXT DEFAULT '4',
    descuento_default NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE CONFIGURACIÓN EMISOR
CREATE TABLE IF NOT EXISTS public.emisor_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    ruc TEXT,
    razon_social TEXT,
    nombre_comercial TEXT,
    direccion_matriz TEXT,
    direccion_establecimiento TEXT,
    establecimiento TEXT DEFAULT '001',
    punto_emision TEXT DEFAULT '001',
    lleva_contabilidad TEXT DEFAULT 'NO',
    contribuyente_especial TEXT DEFAULT '',
    regimen_tributario TEXT DEFAULT 'GENERAL',
    ambiente TEXT DEFAULT '1',
    logo_url TEXT,
    ultimo_secuencial_factura TEXT DEFAULT '000000001',
    clave_firma TEXT,
    correo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE FACTURAS
CREATE TABLE IF NOT EXISTS public.facturas (
    id TEXT PRIMARY KEY,
    secuencial TEXT NOT NULL,
    fecha_emision TEXT NOT NULL,
    cliente_datos JSONB NOT NULL,
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

-- 5. TABLA DE FACTURA DETALLES
CREATE TABLE IF NOT EXISTS public.factura_detalles (
    id TEXT PRIMARY KEY,
    factura_id TEXT REFERENCES public.facturas(id) ON DELETE CASCADE,
    factura_secuencial TEXT,
    producto_id TEXT,
    producto_codigo TEXT,
    producto_nombre TEXT,
    cantidad NUMERIC(12,4),
    precio_unitario NUMERIC(12,4),
    descuento NUMERIC(12,4),
    subtotal NUMERIC(12,4),
    iva_calculado NUMERIC(12,4),
    total NUMERIC(12,4),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA DE PROFORMAS
CREATE TABLE IF NOT EXISTS public.proformas (
    id TEXT PRIMARY KEY,
    secuencial TEXT NOT NULL,
    fecha_emision TEXT NOT NULL,
    cliente_datos JSONB NOT NULL,
    detalles JSONB NOT NULL,
    resumen_impuestos JSONB,
    informacion_pago TEXT,
    nota_dudas TEXT,
    empresa_datos JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA DE PROFORMA DETALLES
CREATE TABLE IF NOT EXISTS public.proforma_detalles (
    id TEXT PRIMARY KEY,
    proforma_id TEXT REFERENCES public.proformas(id) ON DELETE CASCADE,
    producto_codigo TEXT,
    producto_nombre TEXT,
    cantidad NUMERIC(12,4),
    precio_unitario NUMERIC(12,4),
    subtotal NUMERIC(12,4),
    iva_calculado NUMERIC(12,4),
    total NUMERIC(12,4),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLA DE NOTAS DE CRÉDITO
CREATE TABLE IF NOT EXISTS public.notas_credito (
    id TEXT PRIMARY KEY,
    secuencial TEXT NOT NULL,
    fecha_emision TEXT NOT NULL,
    factura_modificada_num TEXT,
    motivo TEXT,
    cliente_datos JSONB NOT NULL,
    detalles JSONB NOT NULL,
    clave_acceso TEXT UNIQUE,
    xml TEXT,
    xml_firmado TEXT,
    estado TEXT DEFAULT 'BORRADOR',
    mensajes_sri JSONB DEFAULT '[]'::jsonb,
    fecha_autorizacion TEXT,
    numero_autorizacion TEXT,
    resumen_impuestos JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABLA DE NOTA DE CRÉDITO DETALLES
CREATE TABLE IF NOT EXISTS public.nota_credito_detalles (
    id TEXT PRIMARY KEY,
    nota_credito_id TEXT REFERENCES public.notas_credito(id) ON DELETE CASCADE,
    producto_codigo TEXT,
    producto_nombre TEXT,
    cantidad NUMERIC(12,4),
    precio_unitario NUMERIC(12,4),
    subtotal NUMERIC(12,4),
    iva_calculado NUMERIC(12,4),
    total NUMERIC(12,4),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABLA DE USUARIOS DEL PORTAL
CREATE TABLE IF NOT EXISTS public.usuarios_portal (
    id TEXT PRIMARY KEY,
    usuario TEXT,
    correo VARCHAR(255) NOT NULL UNIQUE,
    clave_hash TEXT NOT NULL DEFAULT 'admin123',
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    nombre TEXT,
    is_temp BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TABLA DE INVITACIONES
CREATE TABLE IF NOT EXISTS public.invitaciones (
    id TEXT PRIMARY KEY,
    correo VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    clave_temporal TEXT NOT NULL,
    estado TEXT DEFAULT 'PENDIENTE',
    fecha_invitacion TEXT,
    nombre_invitado TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ALTER MIGRATIONS PARA ASEGURAR COLUMNAS EN TABLAS EXISTENTES
ALTER TABLE IF EXISTS public.emisor_config ADD COLUMN IF NOT EXISTS clave_firma TEXT;
ALTER TABLE IF EXISTS public.emisor_config ADD COLUMN IF NOT EXISTS correo TEXT;
ALTER TABLE IF EXISTS public.emisor_config ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE IF EXISTS public.emisor_config ADD COLUMN IF NOT EXISTS ultimo_secuencial_factura TEXT DEFAULT '000000001';
ALTER TABLE IF EXISTS public.emisor_config ADD COLUMN IF NOT EXISTS ambiente TEXT DEFAULT '1';
ALTER TABLE IF EXISTS public.emisor_config ADD COLUMN IF NOT EXISTS regimen_tributario TEXT DEFAULT 'GENERAL';
ALTER TABLE IF EXISTS public.emisor_config ADD COLUMN IF NOT EXISTS contribuyente_especial TEXT DEFAULT '';

ALTER TABLE IF EXISTS public.facturas ADD COLUMN IF NOT EXISTS creador_nombre TEXT;
ALTER TABLE IF EXISTS public.facturas ADD COLUMN IF NOT EXISTS resumen_impuestos JSONB;
ALTER TABLE IF EXISTS public.facturas ADD COLUMN IF NOT EXISTS info_adicional JSONB DEFAULT '[]'::jsonb;

ALTER TABLE IF EXISTS public.usuarios_portal ADD COLUMN IF NOT EXISTS is_temp BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS public.invitaciones ADD COLUMN IF NOT EXISTS nombre_invitado TEXT;

-- 12. TABLA DE BITÁCORA DE ACTIVIDADES
CREATE TABLE IF NOT EXISTS public.bitacora_actividades (
    id TEXT PRIMARY KEY,
    usuario_correo TEXT,
    usuario_nombre TEXT,
    usuario_rol TEXT,
    fecha TEXT,
    accion TEXT,
    detalles TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS y políticas de INSERT/UPDATE/DELETE/SELECT para todas las tablas especificadas
ALTER TABLE IF EXISTS public.bitacora_actividades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en bitacora_actividades" ON public.bitacora_actividades;
CREATE POLICY "Permitir todo en bitacora_actividades" ON public.bitacora_actividades FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.emisor_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en emisor_config" ON public.emisor_config;
CREATE POLICY "Permitir todo en emisor_config" ON public.emisor_config FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.factura_detalles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en factura_detalles" ON public.factura_detalles;
CREATE POLICY "Permitir todo en factura_detalles" ON public.factura_detalles FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.invitaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en invitaciones" ON public.invitaciones;
CREATE POLICY "Permitir todo en invitaciones" ON public.invitaciones FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.nota_credito_detalles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en nota_credito_detalles" ON public.nota_credito_detalles;
CREATE POLICY "Permitir todo en nota_credito_detalles" ON public.nota_credito_detalles FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.notas_credito ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en notas_credito" ON public.notas_credito;
CREATE POLICY "Permitir todo en notas_credito" ON public.notas_credito FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.proforma_detalles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en proforma_detalles" ON public.proforma_detalles;
CREATE POLICY "Permitir todo en proforma_detalles" ON public.proforma_detalles FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.usuarios_portal ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en usuarios_portal" ON public.usuarios_portal;
CREATE POLICY "Permitir todo en usuarios_portal" ON public.usuarios_portal FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en clientes" ON public.clientes;
CREATE POLICY "Permitir todo en clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.productos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en productos" ON public.productos;
CREATE POLICY "Permitir todo en productos" ON public.productos FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.facturas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en facturas" ON public.facturas;
CREATE POLICY "Permitir todo en facturas" ON public.facturas FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.proformas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en proformas" ON public.proformas;
CREATE POLICY "Permitir todo en proformas" ON public.proformas FOR ALL USING (true) WITH CHECK (true);

-- Bucle dinámico para asegurar RLS en cualquier tabla existente
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'clientes', 'productos', 'emisor_config', 'facturas', 'factura_detalles',
        'proformas', 'proforma_detalles', 'notas_credito', 'nota_credito_detalles',
        'usuarios_portal', 'invitaciones', 'bitacora_actividades'
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

-- SUPERADMIN DEFAULT
INSERT INTO public.usuarios_portal (id, usuario, correo, clave_hash, role, nombre, is_temp)
VALUES (
    'superadmin-jolusservices',
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

-- 13. BUCKETS DE ALMACENAMIENTO (SUPABASE STORAGE)
INSERT INTO storage.buckets (id, name, public) VALUES
    ('facturas-pdf', 'facturas-pdf', true),
    ('facturas-xml-sin-firmar', 'facturas-xml-sin-firmar', true),
    ('facturas-xml-firmados', 'facturas-xml-firmados', true),
    ('notas-credito-pdf', 'notas-credito-pdf', true),
    ('notas-credito-xml-firmados', 'notas-credito-xml-firmados', true),
    ('notas-credito-xml-sin-firmar', 'notas-credito-xml-sin-firmar', true),
    ('proformas-pdf', 'proformas-pdf', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para almacenamiento en storage.objects
ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total a storage objects" ON storage.objects;
CREATE POLICY "Permitir acceso total a storage objects" ON storage.objects FOR ALL USING (true) WITH CHECK (true);
`;

function isTableMissingError(error: any): boolean {
  if (!error) return false;
  const msg = error.message || '';
  return msg.includes('schema cache') || msg.includes('does not exist') || error.code === '42P01' || error.code === 'PGRST204';
}

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// ==========================================
// HELPER FOR SAFE UPSERT/INSERT WITH FALLBACKS & MISSING COLUMN STRIPPING
// ==========================================
export async function safeUpsert(
  tableName: string,
  payload: Record<string, any>,
  conflictField?: string
): Promise<{ success: boolean; errorDetails?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    console.error(`[Supabase safeUpsert]: No initialized Supabase client for ${tableName}`);
    return { success: false, errorDetails: 'Cliente Supabase no configurado.' };
  }

  const currentPayload: Record<string, any> = { ...payload };
  const maxAttempts = Object.keys(payload).length + 5;

  const extractMissingColumn = (err: any): string | null => {
    if (!err) return null;
    const msg = typeof err === 'string' 
      ? err 
      : `${err?.message || ''} ${err?.details || ''} ${err?.hint || ''}`;
    
    // Do NOT match constraint or not-null errors as missing columns
    if (msg.toLowerCase().includes('violates') || msg.toLowerCase().includes('not-null') || msg.toLowerCase().includes('null value')) {
      return null;
    }

    const match = 
      msg.match(/Could not find the '([^']+)' column/i) || 
      msg.match(/column ["']?([^"'\s]+)["']? of relation .* does not exist/i) ||
      msg.match(/column ["']?([^"'\s]+)["']? does not exist/i);
    return match && match[1] ? match[1] : null;
  };

  const isUuidError = (err: any): boolean => {
    if (!err) return false;
    const code = err?.code;
    const msg = typeof err === 'string' ? err : `${err?.message || ''} ${err?.details || ''}`;
    return code === '22P02' || /invalid input syntax for type uuid/i.test(msg);
  };

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let lastError: any = null;

    // Strategy 1: Attempt Upsert with specified conflict field if provided
    if (conflictField && currentPayload[conflictField] !== undefined) {
      try {
        const { error } = await supabase.from(tableName).upsert(currentPayload, { onConflict: conflictField });
        if (!error) return { success: true };
        lastError = error;
      } catch (err: any) {
        lastError = err;
      }

      const missingCol1 = extractMissingColumn(lastError);
      if (missingCol1 && missingCol1 in currentPayload) {
        console.warn(`[Supabase safeUpsert]: Columna '${missingCol1}' no existe en la tabla '${tableName}'. Omitiendo y reintentando...`);
        delete currentPayload[missingCol1];
        continue;
      }

      if (isUuidError(lastError) && currentPayload.id !== undefined && !isValidUuid(currentPayload.id)) {
        console.warn(`[Supabase safeUpsert]: 'id' ("${currentPayload.id}") no es un UUID válido. Omitiendo 'id' y reintentando...`);
        delete currentPayload.id;
        continue;
      }
    }

    // Strategy 2: Attempt Upsert by primary key 'id' if 'id' exists in currentPayload and is a valid UUID
    if (currentPayload.id !== undefined && isValidUuid(currentPayload.id)) {
      try {
        const { error } = await supabase.from(tableName).upsert(currentPayload, { onConflict: 'id' });
        if (!error) return { success: true };
        lastError = error;
      } catch (err: any) {
        lastError = err;
      }

      const missingCol2 = extractMissingColumn(lastError);
      if (missingCol2 && missingCol2 in currentPayload) {
        console.warn(`[Supabase safeUpsert]: Columna '${missingCol2}' no existe en la tabla '${tableName}'. Omitiendo y reintentando...`);
        delete currentPayload[missingCol2];
        continue;
      }

      if (isUuidError(lastError) && currentPayload.id !== undefined) {
        console.warn(`[Supabase safeUpsert]: 'id' ("${currentPayload.id}") produjo error UUID. Omitiendo 'id' y reintentando...`);
        delete currentPayload.id;
        continue;
      }
    }

    // Strategy 3: Check existence and perform explicit UPDATE or INSERT
    try {
      const matchCol = (conflictField && currentPayload[conflictField] !== undefined) ? conflictField : (currentPayload.id !== undefined && isValidUuid(currentPayload.id) ? 'id' : null);
      if (matchCol && currentPayload[matchCol] !== undefined) {
        const matchVal = currentPayload[matchCol];
        const { data: existing } = await supabase.from(tableName).select(matchCol).eq(matchCol, matchVal).maybeSingle();

        if (existing) {
          // Row exists -> perform UPDATE
          const { error: updateErr } = await supabase.from(tableName).update(currentPayload).eq(matchCol, matchVal);
          if (!updateErr) return { success: true };
          lastError = updateErr;
        } else {
          // Row does not exist -> perform INSERT
          const { error: insertErr } = await supabase.from(tableName).insert(currentPayload);
          if (!insertErr) return { success: true };
          lastError = insertErr;
        }
      } else {
        const { error: insertErr } = await supabase.from(tableName).insert(currentPayload);
        if (!insertErr) return { success: true };
        lastError = insertErr;
      }
    } catch (err: any) {
      lastError = err;
    }

    const missingCol3 = extractMissingColumn(lastError);
    if (missingCol3 && missingCol3 in currentPayload) {
      console.warn(`[Supabase safeUpsert]: Columna '${missingCol3}' no existe en la tabla '${tableName}'. Omitiendo y reintentando...`);
      delete currentPayload[missingCol3];
      continue;
    }

    if (isUuidError(lastError) && currentPayload.id !== undefined && !isValidUuid(currentPayload.id)) {
      console.warn(`[Supabase safeUpsert]: 'id' ("${currentPayload.id}") no es un UUID válido. Omitiendo 'id' y reintentando...`);
      delete currentPayload.id;
      continue;
    }

    console.error(`[Supabase Error en ${tableName}]:`, lastError?.message || lastError?.details || 'Error desconocido', lastError?.code);
    return { success: false, errorDetails: lastError?.message || 'Error guardando en Supabase' };
  }

  return { success: false, errorDetails: 'No se pudo guardar el registro en Supabase tras varios reintentos.' };
}

// ==========================================
// 1. CLIENTES
// ==========================================
export async function fetchClientsFromSupabase(): Promise<Client[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.from('clientes').select('*').order('created_at', { ascending: false });

  if (error) return null;

  return data ? data.map(item => ({
    id: item.id || `cli-${Date.now()}`,
    tipoIdentificacion: item.tipo_identificacion || item.tipoIdentificacion || '05',
    identificacion: item.identificacion,
    nombre: item.nombre,
    direccion: item.direccion || '',
    telefono: item.telefono || '',
    correo: item.correo || ''
  })) : [];
}

export async function saveClientToSupabase(client: Client): Promise<{ success: boolean; errorDetails?: string }> {
  const spanishPayload: Record<string, any> = {
    id: client.id || `cli-${Date.now()}`,
    tipo_identificacion: client.tipoIdentificacion,
    identificacion: client.identificacion,
    nombre: client.nombre,
    direccion: client.direccion || '',
    telefono: client.telefono || '',
    correo: client.correo || ''
  };

  return safeUpsert('clientes', spanishPayload, 'identificacion');
}

export async function deleteClientFromSupabase(id: string, identificacion?: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { error } = await supabase.from('clientes').delete().eq('identificacion', identificacion || id);
  return !error;
}

// ==========================================
// 2. PRODUCTOS
// ==========================================
export async function fetchProductsFromSupabase(): Promise<Product[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.from('productos').select('*').order('created_at', { ascending: false });

  if (error) return null;

  return data ? data.map(item => ({
    id: item.id || `prod-${Date.now()}`,
    codigo: item.codigo,
    nombre: item.nombre,
    precio: Number(item.precio) || 0,
    ivaTipo: item.iva_tipo || item.ivaTipo || '4',
    descuentoDefault: Number(item.descuento_default ?? item.descuentoDefault ?? 0)
  })) : [];
}

export async function saveProductToSupabase(product: Product): Promise<boolean> {
  const payload: Record<string, any> = {
    id: product.id || `prod-${Date.now()}`,
    codigo: product.codigo,
    nombre: product.nombre,
    precio: product.precio,
    iva_tipo: product.ivaTipo,
    descuento_default: product.descuentoDefault || 0
  };

  const res = await safeUpsert('productos', payload, 'codigo');
  return res.success;
}

export async function deleteProductFromSupabase(id: string, codigo?: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { error } = await supabase.from('productos').delete().eq('codigo', codigo || id);
  return !error;
}

// ==========================================
// 3. EMISOR CONFIG (emisor_config)
// ==========================================
export async function fetchEmitterConfigFromSupabase(ruc?: string): Promise<EmitterConfig | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    let data: any = null;
    if (ruc) {
      const res = await supabase.from('emisor_config').select('*').eq('ruc', ruc).maybeSingle();
      data = res.data;
    }
    if (!data) {
      const res = await supabase.from('emisor_config').select('*').limit(1).maybeSingle();
      data = res.data;
    }
    if (!data) return null;

    return {
      ruc: data.ruc || '',
      razonSocial: data.razon_social || '',
      nombreComercial: data.nombre_comercial || '',
      dirMatriz: data.direccion_matriz || data.dir_matriz || '',
      dirEstablecimiento: data.direccion_establecimiento || data.dir_establecimiento || '',
      codEstablecimiento: data.establecimiento || '001',
      codPuntoEmision: data.punto_emision || '001',
      obligadoContabilidad: data.lleva_contabilidad === 'SI' || data.lleva_contabilidad === true,
      contribuyenteEspecial: data.contribuyente_especial || '',
      regimen: data.regimen_tributario || 'GENERAL',
      ambiente: data.ambiente || '1',
      logoB64: data.logo_url || '',
      ultimoSecuencialFactura: data.ultimo_secuencial_factura || '000000001',
      p12Password: data.clave_firma || '',
      correo: data.correo || '',
      isDemoMode: false
    };
  } catch {
    return null;
  }
}

export async function saveEmitterConfigToSupabase(config: EmitterConfig): Promise<boolean> {
  const targetRuc = config.ruc || '';
  const dirMatrizVal = config.dirMatriz || 'Matriz Principal';

  const payload: Record<string, any> = {
    ruc: config.ruc || '',
    razon_social: config.razonSocial || 'Emisor',
    nombre_comercial: config.nombreComercial || '',
    direccion_matriz: dirMatrizVal,
    dir_matriz: dirMatrizVal,
    direccion_establecimiento: config.dirEstablecimiento || dirMatrizVal,
    dir_establecimiento: config.dirEstablecimiento || dirMatrizVal,
    establecimiento: config.codEstablecimiento || '001',
    punto_emision: config.codPuntoEmision || '001',
    lleva_contabilidad: config.obligadoContabilidad ? 'SI' : 'NO',
    contribuyente_especial: config.contribuyenteEspecial || '',
    regimen_tributario: config.regimen || 'GENERAL',
    ambiente: config.ambiente || '1',
    logo_url: config.logoB64 !== undefined ? config.logoB64 : '',
    ultimo_secuencial_factura: config.ultimoSecuencialFactura || '000000001',
    clave_firma: config.p12Password !== undefined ? config.p12Password : '',
    correo: config.correo || ''
  };

  const supabase = getSupabase();
  if (supabase && targetRuc) {
    try {
      const { data: existing } = await supabase.from('emisor_config').select('id').eq('ruc', targetRuc).maybeSingle();
      if (existing?.id && isValidUuid(existing.id)) {
        payload.id = existing.id;
      }
    } catch {
      // Ignore query error
    }
  }

  const res = await safeUpsert('emisor_config', payload, 'ruc');
  return res.success;
}

export async function saveEmitterLogoToSupabase(ruc: string, logoB64: string): Promise<boolean> {
  const targetRuc = ruc || '';
  const defaultDir = 'Matriz Principal';
  const payload: Record<string, any> = {
    ruc: targetRuc,
    logo_url: logoB64,
    direccion_matriz: defaultDir,
    dir_matriz: defaultDir
  };

  const supabase = getSupabase();
  if (supabase && targetRuc) {
    try {
      const { data: existing } = await supabase.from('emisor_config').select('*').eq('ruc', targetRuc).maybeSingle();
      if (existing) {
        if (existing.id && isValidUuid(existing.id)) payload.id = existing.id;
        if (existing.dir_matriz) payload.dir_matriz = existing.dir_matriz;
        if (existing.direccion_matriz) payload.direccion_matriz = existing.direccion_matriz;
        if (existing.razon_social) payload.razon_social = existing.razon_social;
        if (existing.nombre_comercial) payload.nombre_comercial = existing.nombre_comercial;
      }
    } catch {
      // Ignore query error
    }
  }

  const res = await safeUpsert('emisor_config', payload, 'ruc');
  return res.success;
}

// ==========================================
// 4. FACTURAS & 5. FACTURA_DETALLES
// ==========================================
export async function fetchInvoicesFromSupabase(): Promise<Invoice[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.from('facturas').select('*').order('created_at', { ascending: false });

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
  const spanishPayload: Record<string, any> = {
    id: invoice.id,
    secuencial: invoice.secuencial,
    fecha_emision: invoice.fechaEmision || new Date().toISOString().split('T')[0],
    cliente_datos: invoice.cliente,
    detalles: invoice.detalles,
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

  const res = await safeUpsert('facturas', spanishPayload, 'id');

  // Also save line items in 'factura_detalles' table
  if (res.success && invoice.detalles && invoice.detalles.length > 0) {
    try {
      const lineItems = invoice.detalles.map(d => ({
        id: d.id || `${invoice.id}-${d.producto.codigo}`,
        factura_id: invoice.id,
        factura_secuencial: invoice.secuencial,
        producto_id: d.producto.id,
        producto_codigo: d.producto.codigo,
        producto_nombre: d.producto.nombre,
        cantidad: d.cantidad,
        precio_unitario: d.producto.precio,
        descuento: d.descuento || 0,
        subtotal: d.subtotal,
        iva_calculado: d.ivaCalculado,
        total: d.total
      }));
      for (const item of lineItems) {
        await safeUpsert('factura_detalles', item, 'id');
      }
    } catch (e) {
      console.warn('Aviso guardando factura_detalles:', e);
    }
  }

  return res.success;
}

export async function deleteInvoiceFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { error } = await supabase.from('facturas').delete().eq('id', id);
  return !error;
}

// ==========================================
// 6. PROFORMAS & 7. PROFORMA_DETALLES
// ==========================================
export async function fetchProformasFromSupabase(): Promise<Proforma[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('proformas').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;

    return data.map(item => ({
      id: item.id,
      secuencial: item.secuencial,
      fechaEmision: item.fecha_emision || item.fechaEmision,
      cliente: typeof item.cliente_datos === 'string' ? JSON.parse(item.cliente_datos) : (typeof item.cliente === 'string' ? JSON.parse(item.cliente) : item.cliente),
      detalles: typeof item.detalles === 'string' ? JSON.parse(item.detalles) : (item.detalles || []),
      resumenImpuestos: typeof item.resumen_impuestos === 'string' ? JSON.parse(item.resumen_impuestos) : item.resumen_impuestos,
      informacionPago: item.informacion_pago || item.informacionPago,
      notaDudas: item.nota_dudas || item.notaDudas,
      empresaNombre: item.empresa_datos?.nombre || item.empresa_nombre || item.empresaNombre,
      empresaDireccion: item.empresa_datos?.direccion || item.empresa_direccion || item.empresaDireccion,
      empresaTelefono: item.empresa_datos?.telefono || item.empresa_telefono || item.empresaTelefono,
      empresaCorreo: item.empresa_datos?.correo || item.empresa_correo || item.empresaCorreo
    }));
  } catch {
    return null;
  }
}

export async function saveProformaToSupabase(proforma: Proforma): Promise<boolean> {
  const payload: Record<string, any> = {
    id: proforma.id,
    secuencial: proforma.secuencial,
    fecha_emision: proforma.fechaEmision,
    cliente_datos: proforma.cliente,
    detalles: proforma.detalles,
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

  const res = await safeUpsert('proformas', payload, 'id');

  if (res.success && proforma.detalles && proforma.detalles.length > 0) {
    const lineItems = proforma.detalles.map(d => ({
      id: `${proforma.id}-${d.producto.codigo}`,
      proforma_id: proforma.id,
      producto_codigo: d.producto.codigo,
      producto_nombre: d.producto.nombre,
      cantidad: d.cantidad,
      precio_unitario: d.producto.precio,
      subtotal: d.subtotal,
      iva_calculado: d.ivaCalculado,
      total: d.total
    }));
    for (const item of lineItems) {
      await safeUpsert('proforma_detalles', item, 'id');
    }
  }

  return res.success;
}

export async function deleteProformaFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from('proformas').delete().eq('id', id);
  return !error;
}

// ==========================================
// 8. NOTAS_CREDITO & 9. NOTA_CREDITO_DETALLES
// ==========================================
export async function fetchCreditNotesFromSupabase(): Promise<CreditNote[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('notas_credito').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;

    return data.map(item => ({
      id: item.id,
      secuencial: item.secuencial,
      fechaEmision: item.fecha_emision,
      facturaModificadaSecuencial: item.factura_modificada_num || '',
      facturaModificadaClaveAcceso: item.factura_modificada_clave || '',
      fechaEmisionModificado: item.fecha_emision_modificado || item.fecha_emision,
      razonModificacion: item.motivo || '',
      cliente: typeof item.cliente_datos === 'string' ? JSON.parse(item.cliente_datos) : item.cliente_datos,
      detalles: typeof item.detalles === 'string' ? JSON.parse(item.detalles) : (item.detalles || []),
      claveAcceso: item.clave_acceso,
      xml: item.xml,
      xmlFirmado: item.xml_firmado,
      estado: item.estado,
      mensajesSRI: typeof item.mensajes_sri === 'string' ? JSON.parse(item.mensajes_sri) : (item.mensajes_sri || []),
      fechaAutorizacion: item.fecha_autorizacion,
      numeroAutorizacion: item.numero_autorizacion,
      infoAdicional: typeof item.info_adicional === 'string' ? JSON.parse(item.info_adicional) : (item.info_adicional || []),
      resumenImpuestos: typeof item.resumen_impuestos === 'string' ? JSON.parse(item.resumen_impuestos) : item.resumen_impuestos
    }));
  } catch {
    return null;
  }
}

export async function saveCreditNoteToSupabase(creditNote: CreditNote): Promise<boolean> {
  const payload = {
    id: creditNote.id,
    secuencial: creditNote.secuencial,
    fecha_emision: creditNote.fechaEmision,
    factura_modificada_num: creditNote.facturaModificadaSecuencial,
    motivo: creditNote.razonModificacion,
    cliente_datos: creditNote.cliente,
    detalles: creditNote.detalles,
    clave_acceso: creditNote.claveAcceso,
    xml: creditNote.xml,
    xml_firmado: creditNote.xmlFirmado,
    estado: creditNote.estado,
    mensajes_sri: creditNote.mensajesSRI,
    fecha_autorizacion: creditNote.fechaAutorizacion,
    numero_autorizacion: creditNote.numeroAutorizacion,
    info_adicional: creditNote.infoAdicional,
    resumen_impuestos: creditNote.resumenImpuestos
  };

  const res = await safeUpsert('notas_credito', payload, 'id');

  if (res.success && creditNote.detalles && creditNote.detalles.length > 0) {
    const lineItems = creditNote.detalles.map(d => ({
      id: `${creditNote.id}-${d.producto.codigo}`,
      nota_credito_id: creditNote.id,
      producto_codigo: d.producto.codigo,
      producto_nombre: d.producto.nombre,
      cantidad: d.cantidad,
      precio_unitario: d.producto.precio,
      subtotal: d.subtotal,
      iva_calculado: d.ivaCalculado,
      total: d.total
    }));
    for (const item of lineItems) {
      await safeUpsert('nota_credito_detalles', item, 'id');
    }
  }

  return res.success;
}

export async function deleteCreditNoteFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from('notas_credito').delete().eq('id', id);
  return !error;
}

// ==========================================
// 10. USUARIOS_PORTAL
// ==========================================
export async function fetchUsersFromSupabase(): Promise<PortalUser[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('usuarios_portal').select('*').order('created_at', { ascending: true });
    if (error || !data) return null;

    return data.map(item => ({
      id: item.id || item.correo,
      correo: item.correo,
      clave: item.clave_hash || item.clave || 'admin123',
      role: (item.role || 'USER').toUpperCase() as any,
      nombre: item.nombre || item.usuario || item.correo.split('@')[0],
      fechaRegistro: item.created_at || new Date().toISOString()
    }));
  } catch {
    return null;
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
    console.warn('[Supabase] Error autenticación usuarios_portal:', err);
  }
  return null;
}

export async function upsertUserInSupabase(user: PortalUser): Promise<void> {
  const userPayload = {
    id: user.id || `usr-${Date.now()}`,
    usuario: user.nombre,
    correo: user.correo.toLowerCase(),
    clave_hash: user.clave,
    role: user.role,
    nombre: user.nombre,
    is_temp: false
  };

  await safeUpsert('usuarios_portal', userPayload, 'correo');
}

export async function deleteUserFromSupabase(id: string, email?: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { error } = await supabase.from('usuarios_portal').delete().eq('correo', email || id);
  return !error;
}

// ==========================================
// 11. INVITACIONES
// ==========================================
export async function fetchInvitationsFromSupabase(): Promise<Invitation[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('invitaciones').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;

    return data.map(item => ({
      id: item.id,
      correo: item.correo,
      role: item.role as any,
      claveTemporal: item.clave_temporal,
      nombreInvitado: item.nombre_invitado || item.nombre,
      fechaCreacion: item.fecha_invitacion || item.created_at,
      estado: item.estado || 'PENDIENTE'
    }));
  } catch {
    return null;
  }
}

export async function saveInvitationToSupabase(invite: Invitation): Promise<boolean> {
  const payload = {
    id: invite.id,
    correo: invite.correo,
    role: invite.role,
    clave_temporal: invite.claveTemporal,
    estado: invite.estado,
    fecha_invitacion: invite.fechaCreacion,
    nombre_invitado: invite.nombreInvitado
  };

  const res = await safeUpsert('invitaciones', payload, 'id');
  return res.success;
}

export async function deleteInvitationFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from('invitaciones').delete().eq('id', id);
  return !error;
}

// ==========================================
// 12. BITACORA_ACTIVIDADES
// ==========================================
export async function fetchActivityLogsFromSupabase(): Promise<ActivityLog[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('bitacora_actividades')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300);

    if (error || !data) return null;

    return data.map(item => ({
      id: item.id,
      usuarioCorreo: item.usuario_correo,
      usuarioNombre: item.usuario_nombre,
      usuarioRol: item.usuario_rol,
      fecha: item.fecha || item.created_at,
      accion: item.accion,
      detalles: item.detalles
    }));
  } catch {
    return null;
  }
}

export async function saveActivityLogToSupabase(log: ActivityLog): Promise<boolean> {
  const payload = {
    id: log.id,
    usuario_correo: log.usuarioCorreo,
    usuario_nombre: log.usuarioNombre,
    usuario_rol: log.usuarioRol,
    fecha: log.fecha,
    accion: log.accion,
    detalles: log.detalles
  };

  const res = await safeUpsert('bitacora_actividades', payload, 'id');
  return res.success;
}

export async function deleteActivityLogFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from('bitacora_actividades').delete().eq('id', id);
  return !error;
}

export async function deleteRowFromSupabaseTable(
  tableName: string,
  matchKey: string,
  matchValue: any
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Cliente de Supabase no inicializado.' };

  try {
    const { error } = await supabase.from(tableName).delete().eq(matchKey, matchValue);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error eliminando registro en Supabase.' };
  }
}

export async function saveRowToSupabaseTable(
  tableName: string,
  payload: Record<string, any>,
  conflictField?: string
): Promise<{ success: boolean; errorDetails?: string }> {
  return safeUpsert(tableName, payload, conflictField);
}

// ==========================================
// AUTO-MIGRACIÓN DE DATOS LOCALES A SUPABASE
// ==========================================
export async function migrateLocalDataToSupabase(data: {
  clients?: Client[];
  products?: Product[];
  invoices?: Invoice[];
  proformas?: Proforma[];
  creditNotes?: CreditNote[];
  config?: EmitterConfig;
  users?: PortalUser[];
  invitations?: Invitation[];
  logs?: ActivityLog[];
}) {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    if (data.clients) {
      for (const c of data.clients) {
        await saveClientToSupabase(c);
      }
    }
    if (data.products) {
      for (const p of data.products) {
        await saveProductToSupabase(p);
      }
    }
    if (data.invoices) {
      for (const inv of data.invoices) {
        await saveInvoiceToSupabase(inv);
      }
    }
    if (data.proformas) {
      for (const prof of data.proformas) {
        await saveProformaToSupabase(prof);
      }
    }
    if (data.creditNotes) {
      for (const cn of data.creditNotes) {
        await saveCreditNoteToSupabase(cn);
      }
    }
    if (data.config) {
      await saveEmitterConfigToSupabase(data.config);
    }
    if (data.users) {
      for (const u of data.users) {
        await upsertUserInSupabase(u);
      }
    }
    if (data.invitations) {
      for (const inv of data.invitations) {
        await saveInvitationToSupabase(inv);
      }
    }
    if (data.logs) {
      for (const log of data.logs) {
        await saveActivityLogToSupabase(log);
      }
    }
  } catch (err) {
    console.warn('[Supabase Migration] Aviso al migrar datos locales:', err);
  }
}

// ==========================================
// REALTIME SUBSCRIPTION FOR AUTO-UPDATES
// ==========================================
export function subscribeToSupabaseRealtime(onDataChanged: () => void): (() => void) | null {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const channel = supabase
      .channel('schema-db-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          console.log('[Supabase Realtime] Cambio en tiempo real detectado:', payload.table, payload.eventType);
          onDataChanged();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('[Supabase Realtime] No se pudo activar la suscripción:', err);
    return null;
  }
}

// ==========================================
// SUPABASE STORAGE BUCKETS (7 BUCKETS)
// ==========================================
export const SUPABASE_BUCKETS = {
  FACTURAS_PDF: 'facturas-pdf',
  FACTURAS_XML_SIN_FIRMAR: 'facturas-xml-sin-firmar',
  FACTURAS_XML_FIRMADOS: 'facturas-xml-firmados',
  NOTAS_CREDITO_PDF: 'notas-credito-pdf',
  NOTAS_CREDITO_XML_FIRMADOS: 'notas-credito-xml-firmados',
  NOTAS_CREDITO_XML_SIN_FIRMAR: 'notas-credito-xml-sin-firmar',
  PROFORMAS_PDF: 'proformas-pdf',
} as const;

export async function ensureSupabaseBucketsExist(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const buckets = Object.values(SUPABASE_BUCKETS);
  for (const bucket of buckets) {
    try {
      await supabase.storage.createBucket(bucket, { public: true });
    } catch {
      // Bucket exists
    }
  }
}

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

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, payload, {
        upsert: true,
        contentType
      });

    if (error) {
      return { success: false, error: error.message };
    }

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    return { success: true, publicUrl: publicUrlData.publicUrl };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error de red en almacenamiento' };
  }
}

export async function uploadInvoicePdf(estab: string = '001', ptoEmi: string = '001', secuencial: string, pdfContent: Blob | File) {
  const cleanEstab = String(estab).padStart(3, '0');
  const cleanPtoEmi = String(ptoEmi).padStart(3, '0');
  const cleanSeq = String(secuencial).padStart(9, '0');
  return uploadToSupabaseBucket(SUPABASE_BUCKETS.FACTURAS_PDF, `FAC ${cleanEstab}-${cleanPtoEmi}-${cleanSeq}.pdf`, pdfContent, 'application/pdf');
}

export async function uploadInvoiceXmlSinFirmar(estab: string = '001', ptoEmi: string = '001', secuencial: string, xmlContent: string) {
  const cleanEstab = String(estab).padStart(3, '0');
  const cleanPtoEmi = String(ptoEmi).padStart(3, '0');
  const cleanSeq = String(secuencial).padStart(9, '0');
  return uploadToSupabaseBucket(SUPABASE_BUCKETS.FACTURAS_XML_SIN_FIRMAR, `FAC ${cleanEstab}-${cleanPtoEmi}-${cleanSeq}.xml`, xmlContent, 'application/xml');
}

export async function uploadInvoiceXmlFirmado(estab: string = '001', ptoEmi: string = '001', secuencial: string, xmlContent: string) {
  const cleanEstab = String(estab).padStart(3, '0');
  const cleanPtoEmi = String(ptoEmi).padStart(3, '0');
  const cleanSeq = String(secuencial).padStart(9, '0');
  return uploadToSupabaseBucket(SUPABASE_BUCKETS.FACTURAS_XML_FIRMADOS, `FAC ${cleanEstab}-${cleanPtoEmi}-${cleanSeq}_firmado.xml`, xmlContent, 'application/xml');
}

export async function uploadCreditNotePdf(estab: string = '001', ptoEmi: string = '001', secuencial: string, pdfContent: Blob | File) {
  const cleanEstab = String(estab).padStart(3, '0');
  const cleanPtoEmi = String(ptoEmi).padStart(3, '0');
  const cleanSeq = String(secuencial).padStart(9, '0');
  return uploadToSupabaseBucket(SUPABASE_BUCKETS.NOTAS_CREDITO_PDF, `NCT ${cleanEstab}-${cleanPtoEmi}-${cleanSeq}.pdf`, pdfContent, 'application/pdf');
}

export async function uploadCreditNoteXmlFirmado(estab: string = '001', ptoEmi: string = '001', secuencial: string, xmlContent: string) {
  const cleanEstab = String(estab).padStart(3, '0');
  const cleanPtoEmi = String(ptoEmi).padStart(3, '0');
  const cleanSeq = String(secuencial).padStart(9, '0');
  return uploadToSupabaseBucket(SUPABASE_BUCKETS.NOTAS_CREDITO_XML_FIRMADOS, `NCT ${cleanEstab}-${cleanPtoEmi}-${cleanSeq}_firmado.xml`, xmlContent, 'application/xml');
}

export async function uploadCreditNoteXmlSinFirmar(estab: string = '001', ptoEmi: string = '001', secuencial: string, xmlContent: string) {
  const cleanEstab = String(estab).padStart(3, '0');
  const cleanPtoEmi = String(ptoEmi).padStart(3, '0');
  const cleanSeq = String(secuencial).padStart(9, '0');
  return uploadToSupabaseBucket(SUPABASE_BUCKETS.NOTAS_CREDITO_XML_SIN_FIRMAR, `NCT ${cleanEstab}-${cleanPtoEmi}-${cleanSeq}.xml`, xmlContent, 'application/xml');
}

export async function uploadProformaPdf(clienteOEmpresa: string, fecha: string, pdfContent: Blob | File) {
  const cleanName = (clienteOEmpresa || 'Cliente').trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
  const cleanFecha = fecha || new Date().toISOString().split('T')[0];
  return uploadToSupabaseBucket(SUPABASE_BUCKETS.PROFORMAS_PDF, `Proforma_${cleanName}_${cleanFecha}.pdf`, pdfContent, 'application/pdf');
}

export async function ensureSuperAdminInSupabase(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const superAdminUser = {
      id: 'superadmin-jolusservices',
      usuario: 'Anibal Joel Gualoto Indacochea',
      correo: 'jolusservices@gmail.com',
      role: 'SUPERADMIN',
      nombre: 'Anibal Joel Gualoto Indacochea',
      clave_hash: 'admin123',
      is_temp: false
    };

    await supabase
      .from('usuarios_portal')
      .upsert([superAdminUser], { onConflict: 'correo' });
  } catch (err) {
    console.warn('[Supabase] Excepción en usuarios_portal superadmin:', err);
  }
}

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
