import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Client, Product, Invoice, CreditNote, Proforma, EmitterConfig, PortalUser, ActivityLog, Invitation, EmpresaTenant, Retention, RetentionTax } from '../types';

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

    // Ensure storage buckets exist
    ensureSupabaseBucketsExist().catch(e => console.warn('Bucket check notice:', e));

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

export const SUPABASE_SQL_SCRIPT = `-- =========================================================================
-- SCRIPT DE MIGRACIÓN SUPABASE - PORTAL FACTURACIÓN ELECTRÓNICA SRI
-- Ejecute este script completo en el SQL Editor de Supabase
-- =========================================================================

-- 1. TABLA DE EMPRESAS / INQUILINOS (MULTI-TENANCY)
CREATE TABLE IF NOT EXISTS public.empresas_inquilinos (
    id TEXT PRIMARY KEY,
    ruc VARCHAR(20) UNIQUE NOT NULL,
    razon_social TEXT NOT NULL,
    nombre_comercial TEXT,
    admin_correo VARCHAR(255) NOT NULL,
    estado VARCHAR(30) DEFAULT 'ACTIVO',
    fecha_inicio DATE DEFAULT CURRENT_DATE,
    fecha_expiracion DATE DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
    limite_comprobantes INT DEFAULT 100,
    limite_usuarios INT DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA DE CLIENTES
CREATE TABLE IF NOT EXISTS public.clientes (
    id TEXT PRIMARY KEY,
    tipo_identificacion TEXT NOT NULL,
    identificacion TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    direccion TEXT,
    telefono TEXT,
    correo TEXT,
    usuario_correo TEXT,
    empresa_ruc VARCHAR(20),
    empresa_nombre TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE PRODUCTOS
CREATE TABLE IF NOT EXISTS public.productos (
    id TEXT PRIMARY KEY,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    precio NUMERIC(12,4) NOT NULL DEFAULT 0,
    iva_tipo TEXT DEFAULT '4',
    descuento_default NUMERIC(5,2) DEFAULT 0,
    usuario_correo TEXT,
    empresa_ruc VARCHAR(20),
    empresa_nombre TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE CONFIGURACIÓN EMISOR
CREATE TABLE IF NOT EXISTS public.emisor_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    ruc TEXT UNIQUE,
    razon_social TEXT,
    nombre_comercial TEXT,
    direccion_matriz TEXT,
    dir_matriz TEXT,
    direccion_establecimiento TEXT,
    dir_establecimiento TEXT,
    establecimiento TEXT DEFAULT '001',
    punto_emision TEXT DEFAULT '001',
    lleva_contabilidad TEXT DEFAULT 'NO',
    contribuyente_especial TEXT DEFAULT '',
    regimen TEXT DEFAULT 'GENERAL',
    regimen_tributario TEXT DEFAULT 'GENERAL',
    ambiente TEXT DEFAULT '1',
    is_demo_mode BOOLEAN DEFAULT true,
    logo_url TEXT,
    logo_b64 TEXT,
    ultimo_secuencial_factura TEXT DEFAULT '000000001',
    clave_firma TEXT,
    p12_nombre TEXT,
    p12_firma_b64 TEXT,
    p12_password TEXT,
    p12_valido_desde TEXT,
    p12_valido_hasta TEXT,
    valido_desde TEXT,
    valido_hasta TEXT,
    p12_subject TEXT,
    p12_issuer TEXT,
    p12_serial_number TEXT,
    correo TEXT,
    telefono TEXT,
    smtp_host TEXT,
    smtp_port TEXT,
    smtp_user TEXT,
    smtp_pass TEXT,
    smtp_from TEXT,
    usuario_correo TEXT,
    empresa_ruc VARCHAR(20),
    empresa_nombre TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar columnas para instalaciones existentes
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS razon_social TEXT;
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS nombre_comercial TEXT;
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS direccion_matriz TEXT;
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS dir_matriz TEXT;
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS direccion_establecimiento TEXT;
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS dir_establecimiento TEXT;
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS establecimiento TEXT DEFAULT '001';
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS punto_emision TEXT DEFAULT '001';
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS lleva_contabilidad TEXT DEFAULT 'NO';
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS contribuyente_especial TEXT DEFAULT '';
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS agente_retencion TEXT DEFAULT '';
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS regimen TEXT DEFAULT 'GENERAL';
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS regimen_tributario TEXT DEFAULT 'GENERAL';
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS ambiente TEXT DEFAULT '1';
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS is_demo_mode BOOLEAN DEFAULT true;
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS logo_b64 TEXT;
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS ultimo_secuencial_factura TEXT DEFAULT '000000001';
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS clave_firma TEXT;
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS p12_nombre TEXT;
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS p12_firma_b64 TEXT;
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS p12_password TEXT;
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS p12_valido_desde TEXT;
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS p12_valido_hasta TEXT;
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS valido_desde TEXT;
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS valido_hasta TEXT;
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS p12_subject TEXT;
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS p12_issuer TEXT;
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS p12_serial_number TEXT;
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS correo TEXT;
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS smtp_host TEXT;
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS smtp_port TEXT;
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS smtp_user TEXT;
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS smtp_pass TEXT;
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS smtp_from TEXT;
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS usuario_correo TEXT;
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS empresa_ruc VARCHAR(20);
ALTER TABLE public.emisor_config ADD COLUMN IF NOT EXISTS empresa_nombre TEXT;

-- 5. TABLA DE FACTURAS
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
    creador_correo TEXT,
    usuario_correo TEXT,
    empresa_ruc VARCHAR(20),
    empresa_nombre TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA DE FACTURA DETALLES
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
    iva_tipo TEXT DEFAULT '4',
    iva_calculado NUMERIC(12,4),
    total NUMERIC(12,4),
    usuario_correo TEXT,
    empresa_ruc VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA DE PROFORMAS
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
    creador_correo TEXT,
    usuario_correo TEXT,
    empresa_ruc VARCHAR(20),
    empresa_nombre TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLA DE PROFORMA DETALLES
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
    usuario_correo TEXT,
    empresa_ruc VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABLA DE NOTAS DE CRÉDITO
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
    creador_correo TEXT,
    usuario_correo TEXT,
    empresa_ruc VARCHAR(20),
    empresa_nombre TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABLA DE NOTA DE CRÉDITO DETALLES
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
    usuario_correo TEXT,
    empresa_ruc VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TABLA DE USUARIOS DEL PORTAL
CREATE TABLE IF NOT EXISTS public.usuarios_portal (
    id TEXT PRIMARY KEY,
    usuario TEXT,
    correo VARCHAR(255) NOT NULL UNIQUE,
    clave_hash TEXT NOT NULL DEFAULT 'admin123',
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    nombre TEXT,
    is_temp BOOLEAN DEFAULT FALSE,
    empresa_ruc VARCHAR(20),
    empresa_nombre TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. TABLA DE INVITACIONES
CREATE TABLE IF NOT EXISTS public.invitaciones (
    id TEXT PRIMARY KEY,
    correo VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    clave_temporal TEXT NOT NULL,
    estado TEXT DEFAULT 'PENDIENTE',
    fecha_invitacion TEXT,
    nombre_invitado TEXT,
    creador_correo TEXT,
    empresa_ruc VARCHAR(20),
    empresa_nombre TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. TABLA DE BITÁCORA DE ACTIVIDADES
CREATE TABLE IF NOT EXISTS public.bitacora_actividades (
    id TEXT PRIMARY KEY,
    usuario_correo TEXT,
    usuario_nombre TEXT,
    usuario_rol TEXT,
    fecha TEXT,
    accion TEXT,
    detalles TEXT,
    empresa_ruc VARCHAR(20),
    empresa_nombre TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. TABLA DE COMPROBANTES DE RETENCIÓN (SRI TIPO 07)
CREATE TABLE IF NOT EXISTS public.retenciones (
    id TEXT PRIMARY KEY,
    secuencial TEXT NOT NULL,
    fecha_emision TEXT NOT NULL,
    periodo_fiscal TEXT NOT NULL,
    proveedor_datos JSONB NOT NULL,
    sustento JSONB NOT NULL,
    impuestos JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_retenido NUMERIC(14,4) NOT NULL DEFAULT 0,
    clave_acceso TEXT UNIQUE,
    xml TEXT,
    xml_firmado TEXT,
    estado TEXT DEFAULT 'BORRADOR',
    mensajes_sri JSONB DEFAULT '[]'::jsonb,
    fecha_autorizacion TEXT,
    numero_autorizacion TEXT,
    pdf_url TEXT,
    xml_url TEXT,
    info_adicional JSONB DEFAULT '[]'::jsonb,
    creador_nombre TEXT,
    usuario_correo TEXT,
    empresa_ruc VARCHAR(20),
    empresa_nombre TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. TABLA DE DETALLES DE RETENCIÓN (IMPUESTOS RETENIDOS)
CREATE TABLE IF NOT EXISTS public.retencion_detalles (
    id TEXT PRIMARY KEY,
    retencion_id TEXT REFERENCES public.retenciones(id) ON DELETE CASCADE,
    codigo_impuesto TEXT NOT NULL,
    codigo_retencion TEXT NOT NULL,
    descripcion TEXT,
    base_imponible NUMERIC(14,4) NOT NULL DEFAULT 0,
    porcentaje_retener NUMERIC(6,2) NOT NULL DEFAULT 0,
    valor_retenido NUMERIC(14,4) NOT NULL DEFAULT 0,
    tipo_doc_sustento TEXT,
    num_doc_sustento TEXT,
    fecha_doc_sustento TEXT,
    usuario_correo TEXT,
    empresa_ruc VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. TABLA DE PERSONALIZACIÓN Y MARCA (SUPERADMIN CUSTOMIZER)
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id TEXT PRIMARY KEY DEFAULT 'global_platform_settings',
    settings_json JSONB NOT NULL,
    updated_by TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- ALTER MIGRATIONS PARA AGREGAR COLUMNAS DE EMPRESA A TABLAS EXISTENTES
-- =========================================================================
ALTER TABLE IF EXISTS public.clientes ADD COLUMN IF NOT EXISTS usuario_correo TEXT;
ALTER TABLE IF EXISTS public.clientes ADD COLUMN IF NOT EXISTS empresa_ruc VARCHAR(20);
ALTER TABLE IF EXISTS public.clientes ADD COLUMN IF NOT EXISTS empresa_nombre TEXT;

ALTER TABLE IF EXISTS public.productos ADD COLUMN IF NOT EXISTS usuario_correo TEXT;
ALTER TABLE IF EXISTS public.productos ADD COLUMN IF NOT EXISTS empresa_ruc VARCHAR(20);
ALTER TABLE IF EXISTS public.productos ADD COLUMN IF NOT EXISTS empresa_nombre TEXT;

ALTER TABLE IF EXISTS public.emisor_config ADD COLUMN IF NOT EXISTS clave_firma TEXT;
ALTER TABLE IF EXISTS public.emisor_config ADD COLUMN IF NOT EXISTS correo TEXT;
ALTER TABLE IF EXISTS public.emisor_config ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE IF EXISTS public.emisor_config ADD COLUMN IF NOT EXISTS logo_b64 TEXT;
ALTER TABLE IF EXISTS public.emisor_config ADD COLUMN IF NOT EXISTS ultimo_secuencial_factura TEXT DEFAULT '000000001';
ALTER TABLE IF EXISTS public.emisor_config ADD COLUMN IF NOT EXISTS ambiente TEXT DEFAULT '1';
ALTER TABLE IF EXISTS public.emisor_config ADD COLUMN IF NOT EXISTS regimen TEXT DEFAULT 'GENERAL';
ALTER TABLE IF EXISTS public.emisor_config ADD COLUMN IF NOT EXISTS regimen_tributario TEXT DEFAULT 'GENERAL';
ALTER TABLE IF EXISTS public.emisor_config ADD COLUMN IF NOT EXISTS contribuyente_especial TEXT DEFAULT '';
ALTER TABLE IF EXISTS public.emisor_config ADD COLUMN IF NOT EXISTS usuario_correo TEXT;
ALTER TABLE IF EXISTS public.emisor_config ADD COLUMN IF NOT EXISTS empresa_ruc VARCHAR(20);
ALTER TABLE IF EXISTS public.emisor_config ADD COLUMN IF NOT EXISTS empresa_nombre TEXT;

ALTER TABLE IF EXISTS public.facturas ADD COLUMN IF NOT EXISTS creador_nombre TEXT;
ALTER TABLE IF EXISTS public.facturas ADD COLUMN IF NOT EXISTS creador_correo TEXT;
ALTER TABLE IF EXISTS public.facturas ADD COLUMN IF NOT EXISTS resumen_impuestos JSONB;
ALTER TABLE IF EXISTS public.facturas ADD COLUMN IF NOT EXISTS info_adicional JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.facturas ADD COLUMN IF NOT EXISTS usuario_correo TEXT;
ALTER TABLE IF EXISTS public.facturas ADD COLUMN IF NOT EXISTS empresa_ruc VARCHAR(20);
ALTER TABLE IF EXISTS public.facturas ADD COLUMN IF NOT EXISTS empresa_nombre TEXT;

ALTER TABLE IF EXISTS public.factura_detalles ADD COLUMN IF NOT EXISTS iva_tipo TEXT DEFAULT '4';
ALTER TABLE IF EXISTS public.factura_detalles ADD COLUMN IF NOT EXISTS usuario_correo TEXT;
ALTER TABLE IF EXISTS public.factura_detalles ADD COLUMN IF NOT EXISTS empresa_ruc VARCHAR(20);

ALTER TABLE IF EXISTS public.proformas ADD COLUMN IF NOT EXISTS creador_correo TEXT;
ALTER TABLE IF EXISTS public.proformas ADD COLUMN IF NOT EXISTS usuario_correo TEXT;
ALTER TABLE IF EXISTS public.proformas ADD COLUMN IF NOT EXISTS empresa_ruc VARCHAR(20);
ALTER TABLE IF EXISTS public.proformas ADD COLUMN IF NOT EXISTS empresa_nombre TEXT;

ALTER TABLE IF EXISTS public.proforma_detalles ADD COLUMN IF NOT EXISTS usuario_correo TEXT;
ALTER TABLE IF EXISTS public.proforma_detalles ADD COLUMN IF NOT EXISTS empresa_ruc VARCHAR(20);

ALTER TABLE IF EXISTS public.notas_credito ADD COLUMN IF NOT EXISTS creador_correo TEXT;
ALTER TABLE IF EXISTS public.notas_credito ADD COLUMN IF NOT EXISTS usuario_correo TEXT;
ALTER TABLE IF EXISTS public.notas_credito ADD COLUMN IF NOT EXISTS empresa_ruc VARCHAR(20);
ALTER TABLE IF EXISTS public.notas_credito ADD COLUMN IF NOT EXISTS empresa_nombre TEXT;

ALTER TABLE IF EXISTS public.nota_credito_detalles ADD COLUMN IF NOT EXISTS usuario_correo TEXT;
ALTER TABLE IF EXISTS public.nota_credito_detalles ADD COLUMN IF NOT EXISTS empresa_ruc VARCHAR(20);

ALTER TABLE IF EXISTS public.retenciones ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE IF EXISTS public.retenciones ADD COLUMN IF NOT EXISTS xml_url TEXT;
ALTER TABLE IF EXISTS public.retenciones ADD COLUMN IF NOT EXISTS usuario_correo TEXT;
ALTER TABLE IF EXISTS public.retenciones ADD COLUMN IF NOT EXISTS empresa_ruc VARCHAR(20);
ALTER TABLE IF EXISTS public.retenciones ADD COLUMN IF NOT EXISTS empresa_nombre TEXT;

ALTER TABLE IF EXISTS public.usuarios_portal ADD COLUMN IF NOT EXISTS is_temp BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS public.usuarios_portal ADD COLUMN IF NOT EXISTS empresa_ruc VARCHAR(20);
ALTER TABLE IF EXISTS public.usuarios_portal ADD COLUMN IF NOT EXISTS empresa_nombre TEXT;

ALTER TABLE IF EXISTS public.invitaciones ADD COLUMN IF NOT EXISTS nombre_invitado TEXT;
ALTER TABLE IF EXISTS public.invitaciones ADD COLUMN IF NOT EXISTS creador_correo TEXT;
ALTER TABLE IF EXISTS public.invitaciones ADD COLUMN IF NOT EXISTS empresa_ruc VARCHAR(20);
ALTER TABLE IF EXISTS public.invitaciones ADD COLUMN IF NOT EXISTS empresa_nombre TEXT;

ALTER TABLE IF EXISTS public.bitacora_actividades ADD COLUMN IF NOT EXISTS empresa_ruc VARCHAR(20);
ALTER TABLE IF EXISTS public.bitacora_actividades ADD COLUMN IF NOT EXISTS empresa_nombre TEXT;

-- =========================================================================
-- ÍNDICES DE RENDIMIENTO PARA FILTRADO MULTI-INQUILINO
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON public.usuarios_portal(empresa_ruc);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON public.clientes(empresa_ruc);
CREATE INDEX IF NOT EXISTS idx_productos_empresa ON public.productos(empresa_ruc);
CREATE INDEX IF NOT EXISTS idx_facturas_empresa ON public.facturas(empresa_ruc);
CREATE INDEX IF NOT EXISTS idx_proformas_empresa ON public.proformas(empresa_ruc);
CREATE INDEX IF NOT EXISTS idx_nc_empresa ON public.notas_credito(empresa_ruc);
CREATE INDEX IF NOT EXISTS idx_retenciones_empresa ON public.retenciones(empresa_ruc);
CREATE INDEX IF NOT EXISTS idx_retenciones_clave ON public.retenciones(clave_acceso);

-- =========================================================================
-- HABILITACIÓN DE ROW LEVEL SECURITY (RLS)
-- =========================================================================
DO $
DECLARE
    t text;
    tables text[] := ARRAY[
        'empresas_inquilinos', 'clientes', 'productos', 'emisor_config', 
        'facturas', 'factura_detalles', 'proformas', 'proforma_detalles', 
        'notas_credito', 'nota_credito_detalles', 'retenciones', 'retencion_detalles',
        'usuarios_portal', 'invitaciones', 'bitacora_actividades', 'platform_settings'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'Permitir anon ' || t, t);
            EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (true) WITH CHECK (true);', 'Permitir anon ' || t, t);
        END IF;
    END LOOP;
END $;

-- USUARIO SUPERADMIN POR DEFECTO
INSERT INTO public.usuarios_portal (id, usuario, correo, clave_hash, role, nombre, is_temp)
VALUES (
    'superadmin-jhonny',
    'Jhonny Vargas',
    'jhonnyvp5@gmail.com',
    'admin123',
    'SUPERADMIN',
    'Jhonny Vargas',
    false
)
ON CONFLICT (correo) DO UPDATE SET 
    usuario = EXCLUDED.usuario,
    role = 'SUPERADMIN',
    nombre = EXCLUDED.nombre;

-- BUCKETS DE ALMACENAMIENTO (SUPABASE STORAGE)
INSERT INTO storage.buckets (id, name, public) VALUES
    ('facturas-pdf', 'facturas-pdf', true),
    ('facturas-xml-sin-firmar', 'facturas-xml-sin-firmar', true),
    ('facturas-xml-firmados', 'facturas-xml-firmados', true),
    ('notas-credito-pdf', 'notas-credito-pdf', true),
    ('notas-credito-xml-firmados', 'notas-credito-xml-firmados', true),
    ('notas-credito-xml-sin-firmar', 'notas-credito-xml-sin-firmar', true),
    ('retenciones-pdf', 'retenciones-pdf', true),
    ('retenciones-xml-firmados', 'retenciones-xml-firmados', true),
    ('retenciones-xml-sin-firmar', 'retenciones-xml-sin-firmar', true),
    ('proformas-pdf', 'proformas-pdf', true)
ON CONFLICT (id) DO NOTHING;

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
      const matchCol = (conflictField && currentPayload[conflictField] !== undefined)
        ? conflictField
        : (currentPayload.id !== undefined ? 'id' : null);
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
export async function fetchClientsFromSupabase(userEmail?: string, userRole?: string, empresaRuc?: string): Promise<Client[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.from('clientes').select('*').order('created_at', { ascending: false });

  if (error || !data) return null;

  // Filter strictly by the current user's company / tenant / emitter user (identically for SUPERADMIN and inquilinos)
  const filtered = data.filter(item => {
    if (empresaRuc && item.empresa_ruc === empresaRuc) return true;
    if (userEmail && item.usuario_correo && item.usuario_correo.toLowerCase() === userEmail.toLowerCase()) return true;
    if (!empresaRuc && !userEmail) return true;
    return false;
  });

  return filtered.map(item => ({
    id: item.id || `cli-${Date.now()}`,
    tipoIdentificacion: item.tipo_identificacion || item.tipoIdentificacion || '05',
    identificacion: item.identificacion,
    nombre: item.nombre,
    direccion: item.direccion || '',
    telefono: item.telefono || '',
    correo: item.correo || '',
    usuarioCorreo: item.usuario_correo,
    empresaRuc: item.empresa_ruc,
    empresaNombre: item.empresa_nombre
  }));
}

export async function saveClientToSupabase(client: Client, userEmail?: string): Promise<{ success: boolean; errorDetails?: string }> {
  const spanishPayload: Record<string, any> = {
    id: client.id || `cli-${Date.now()}`,
    tipo_identificacion: client.tipoIdentificacion,
    identificacion: client.identificacion,
    nombre: client.nombre,
    direccion: client.direccion || '',
    telefono: client.telefono || '',
    correo: client.correo || '',
    usuario_correo: userEmail || client.usuarioCorreo || '',
    empresa_ruc: client.empresaRuc || '',
    empresa_nombre: client.empresaNombre || ''
  };

  return safeUpsert('clientes', spanishPayload, 'identificacion');
}

export async function saveBulkClientsToSupabase(clientsList: Client[], userEmail?: string): Promise<{ successCount: number; errorCount: number }> {
  if (!clientsList || clientsList.length === 0) {
    return { successCount: 0, errorCount: 0 };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { successCount: clientsList.length, errorCount: 0 };
  }

  const batchPayloads = clientsList.map(c => ({
    id: c.id || `cli-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    tipo_identificacion: c.tipoIdentificacion || '05',
    identificacion: c.identificacion,
    nombre: c.nombre,
    direccion: c.direccion || '',
    telefono: c.telefono || '',
    correo: c.correo || '',
    usuario_correo: userEmail || c.usuarioCorreo || '',
    empresa_ruc: c.empresaRuc || '',
    empresa_nombre: c.empresaNombre || ''
  }));

  const chunkSize = 50;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < batchPayloads.length; i += chunkSize) {
    const chunk = batchPayloads.slice(i, i + chunkSize);
    try {
      const { error } = await supabase.from('clientes').upsert(chunk, { onConflict: 'identificacion' });
      if (!error) {
        successCount += chunk.length;
      } else {
        for (const item of chunk) {
          const res = await safeUpsert('clientes', item, 'identificacion');
          if (res.success) successCount++;
          else errorCount++;
        }
      }
    } catch {
      for (const item of chunk) {
        const res = await safeUpsert('clientes', item, 'identificacion');
        if (res.success) successCount++;
        else errorCount++;
      }
    }
  }

  return { successCount, errorCount };
}

export async function deleteClientFromSupabase(id: string, identificacion?: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    if (identificacion && id && id !== identificacion) {
      await supabase.from('clientes').delete().or(`id.eq.${id},identificacion.eq.${identificacion}`);
    } else if (identificacion) {
      await supabase.from('clientes').delete().eq('identificacion', identificacion);
    } else {
      await supabase.from('clientes').delete().or(`id.eq.${id},identificacion.eq.${id}`);
    }
    return true;
  } catch (err) {
    console.warn('Aviso borrando cliente de Supabase:', err);
    return false;
  }
}

// ==========================================
// 2. PRODUCTOS
// ==========================================
export async function fetchProductsFromSupabase(userEmail?: string, userRole?: string, empresaRuc?: string): Promise<Product[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.from('productos').select('*').order('created_at', { ascending: false });

  if (error || !data) return null;

  // Filter strictly by the current user's company / tenant / emitter user (same operation for SUPERADMIN and tenants)
  const filtered = data.filter(item => {
    if (empresaRuc && item.empresa_ruc === empresaRuc) return true;
    if (userEmail && item.usuario_correo && item.usuario_correo.toLowerCase() === userEmail.toLowerCase()) return true;
    if (!empresaRuc && !userEmail) return true;
    return false;
  });

  return filtered.map(item => ({
    id: item.id || `prod-${Date.now()}`,
    codigo: item.codigo,
    nombre: item.nombre,
    precio: Number(item.precio) || 0,
    ivaTipo: item.iva_tipo || item.ivaTipo || '4',
    descuentoDefault: Number(item.descuento_default ?? item.descuentoDefault ?? 0),
    usuarioCorreo: item.usuario_correo,
    empresaRuc: item.empresa_ruc,
    empresaNombre: item.empresa_nombre
  }));
}

export async function saveProductToSupabase(product: Product, userEmail?: string): Promise<boolean> {
  const payload: Record<string, any> = {
    id: product.id || `prod-${Date.now()}`,
    codigo: product.codigo,
    nombre: product.nombre,
    precio: product.precio,
    iva_tipo: product.ivaTipo,
    descuento_default: product.descuentoDefault || 0,
    usuario_correo: userEmail || product.usuarioCorreo || '',
    empresa_ruc: product.empresaRuc || '',
    empresa_nombre: product.empresaNombre || ''
  };

  const res = await safeUpsert('productos', payload, 'codigo');
  return res.success;
}

export async function saveBulkProductsToSupabase(productsList: Product[], userEmail?: string): Promise<{ successCount: number; errorCount: number }> {
  if (!productsList || productsList.length === 0) {
    return { successCount: 0, errorCount: 0 };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { successCount: productsList.length, errorCount: 0 };
  }

  const batchPayloads = productsList.map(p => ({
    id: p.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    codigo: p.codigo,
    nombre: p.nombre,
    precio: Number(p.precio) || 0,
    iva_tipo: String(p.ivaTipo || '4'),
    descuento_default: Number(p.descuentoDefault || 0),
    usuario_correo: userEmail || p.usuarioCorreo || '',
    empresa_ruc: p.empresaRuc || '',
    empresa_nombre: p.empresaNombre || ''
  }));

  // Fast Batch Upsert in parallel chunks of 50
  const chunkSize = 50;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < batchPayloads.length; i += chunkSize) {
    const chunk = batchPayloads.slice(i, i + chunkSize);
    try {
      const { error } = await supabase.from('productos').upsert(chunk, { onConflict: 'codigo' });
      if (!error) {
        successCount += chunk.length;
      } else {
        // Fallback to individual safeUpsert for this chunk
        for (const item of chunk) {
          const res = await safeUpsert('productos', item, 'codigo');
          if (res.success) successCount++;
          else errorCount++;
        }
      }
    } catch {
      for (const item of chunk) {
        const res = await safeUpsert('productos', item, 'codigo');
        if (res.success) successCount++;
        else errorCount++;
      }
    }
  }

  return { successCount, errorCount };
}

export async function deleteProductFromSupabase(id: string, codigo?: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    if (codigo && id && id !== codigo) {
      await supabase.from('productos').delete().or(`id.eq.${id},codigo.eq.${codigo}`);
    } else if (codigo) {
      await supabase.from('productos').delete().eq('codigo', codigo);
    } else {
      await supabase.from('productos').delete().or(`id.eq.${id},codigo.eq.${id}`);
    }
    return true;
  } catch (err) {
    console.warn('Aviso borrando producto de Supabase:', err);
    return false;
  }
}

// ==========================================
// 3. EMISOR CONFIG (emisor_config)
// ==========================================
export async function fetchEmitterConfigFromSupabase(ruc?: string, userEmail?: string, userRole?: string, empresaRuc?: string): Promise<EmitterConfig | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    let data: any = null;
    const targetRuc = ruc || empresaRuc;

    if (targetRuc) {
      const res = await supabase.from('emisor_config').select('*').eq('ruc', targetRuc).maybeSingle();
      data = res.data;
      if (!data) {
        const resEmp2 = await supabase.from('emisor_config').select('*').eq('empresa_ruc', targetRuc).maybeSingle();
        data = resEmp2.data;
      }
    } else if (userEmail) {
      const resUser = await supabase.from('emisor_config').select('*').eq('usuario_correo', userEmail).maybeSingle();
      data = resUser.data;
      if (!data) {
        const resUser2 = await supabase.from('emisor_config').select('*').eq('correo', userEmail).maybeSingle();
        data = resUser2.data;
      }
    }

    if (!data) return null;

    return {
      ruc: data.ruc || '',
      razonSocial: data.razon_social || '',
      nombreComercial: data.nombre_comercial || '',
      dirMatriz: data.direccion_matriz || data.dir_matriz || '',
      dirEstablecimiento: data.direccion_establecimiento || data.dir_establecimiento || '',
      codEstablecimiento: (data.establecimiento || '001').toString().trim().padStart(3, '0'),
      codPuntoEmision: (data.punto_emision || '001').toString().trim().padStart(3, '0'),
      obligadoContabilidad: data.lleva_contabilidad === 'SI' || data.lleva_contabilidad === true,
      contribuyenteEspecial: data.contribuyente_especial || '',
      agenteRetencion: data.agente_retencion || '',
      regimen: data.regimen || data.regimen_tributario || '',
      ambiente: data.ambiente || '',
      logoB64: data.logo_b64 || data.logo_url || '',
      ultimoSecuencialFactura: data.ultimo_secuencial_factura || '',
      p12Nombre: data.p12_nombre || '',
      p12FirmaB64: data.p12_firma_b64 || '',
      p12Password: data.p12_password || data.clave_firma || '',
      p12ValidoDesde: data.p12_valido_desde || data.valido_desde || data.p12ValidoDesde || '',
      p12ValidoHasta: data.p12_valido_hasta || data.valido_hasta || data.p12ValidoHasta || '',
      validoDesde: data.p12_valido_desde || data.valido_desde || data.p12ValidoDesde || '',
      validoHasta: data.p12_valido_hasta || data.valido_hasta || data.p12ValidoHasta || '',
      p12Subject: data.p12_subject || data.p12Subject || '',
      p12Issuer: data.p12_issuer || data.p12Issuer || '',
      p12SerialNumber: data.p12_serial_number || data.p12SerialNumber || '',
      correo: data.correo || userEmail || '',
      telefono: data.telefono || data.telefono_emisor || '',
      smtpHost: data.smtp_host || '',
      smtpPort: data.smtp_port || '',
      smtpUser: data.smtp_user || '',
      smtpPass: data.smtp_pass || '',
      smtpFrom: data.smtp_from || '',
      isDemoMode: data.is_demo_mode !== undefined && data.is_demo_mode !== null
        ? (data.is_demo_mode === true || data.is_demo_mode === 'true' || data.is_demo_mode === 'SI' || data.is_demo_mode === 1)
        : (data.isDemoMode !== undefined && data.isDemoMode !== null ? Boolean(data.isDemoMode) : true),
      usuarioCorreo: data.usuario_correo,
      empresaRuc: data.empresa_ruc || data.ruc,
      empresaNombre: data.empresa_nombre || data.razon_social
    };
  } catch {
    return null;
  }
}

/**
 * Fast bulk fetch for all emitter configs in a single query
 */
export async function fetchAllEmitterConfigsFromSupabase(): Promise<Record<string, EmitterConfig>> {
  const supabase = getSupabase();
  if (!supabase) return {};

  try {
    const { data, error } = await supabase.from('emisor_config').select('*');
    if (error || !data) return {};

    const map: Record<string, EmitterConfig> = {};
    for (const row of data) {
      const ruc = row.ruc || row.empresa_ruc;
      if (ruc) {
        map[ruc] = {
          ruc: ruc,
          razonSocial: row.razon_social || '',
          nombreComercial: row.nombre_comercial || '',
          dirMatriz: row.direccion_matriz || row.dir_matriz || '',
          dirEstablecimiento: row.direccion_establecimiento || row.dir_establecimiento || '',
          codEstablecimiento: (row.establecimiento || '001').toString().trim().padStart(3, '0'),
          codPuntoEmision: (row.punto_emision || '001').toString().trim().padStart(3, '0'),
          obligadoContabilidad: row.lleva_contabilidad === 'SI' || row.lleva_contabilidad === true,
          contribuyenteEspecial: row.contribuyente_especial || '',
          agenteRetencion: row.agente_retencion || '',
          regimen: row.regimen || row.regimen_tributario || '',
          ambiente: row.ambiente || '',
          logoB64: row.logo_b64 || row.logo_url || '',
          ultimoSecuencialFactura: row.ultimo_secuencial_factura || '',
          p12Nombre: row.p12_nombre || '',
          p12FirmaB64: row.p12_firma_b64 || '',
          p12Password: row.p12_password || row.clave_firma || '',
          p12ValidoDesde: row.p12_valido_desde || row.valido_desde || row.p12ValidoDesde || '',
          p12ValidoHasta: row.p12_valido_hasta || row.valido_hasta || row.p12ValidoHasta || '',
          validoDesde: row.p12_valido_desde || row.valido_desde || row.p12ValidoDesde || '',
          validoHasta: row.p12_valido_hasta || row.valido_hasta || row.p12ValidoHasta || '',
          p12Subject: row.p12_subject || row.p12Subject || '',
          p12Issuer: row.p12_issuer || row.p12Issuer || '',
          p12SerialNumber: row.p12_serial_number || row.p12SerialNumber || '',
          correo: row.correo || '',
          telefono: row.telefono || row.telefono_emisor || '',
          smtpHost: row.smtp_host || '',
          smtpPort: row.smtp_port || '',
          smtpUser: row.smtp_user || '',
          smtpPass: row.smtp_pass || '',
          smtpFrom: row.smtp_from || '',
          isDemoMode: row.is_demo_mode !== undefined && row.is_demo_mode !== null
            ? (row.is_demo_mode === true || row.is_demo_mode === 'true' || row.is_demo_mode === 'SI' || row.is_demo_mode === 1)
            : (row.isDemoMode !== undefined && row.isDemoMode !== null ? Boolean(row.isDemoMode) : true),
          usuarioCorreo: row.usuario_correo,
          empresaRuc: row.empresa_ruc || row.ruc,
          empresaNombre: row.empresa_nombre || row.razon_social
        };
      }
    }
    return map;
  } catch (e) {
    console.warn('Aviso cargando todas las configuraciones de emisor:', e);
    return {};
  }
}

export async function saveEmitterConfigToSupabase(config: EmitterConfig, userEmail?: string): Promise<boolean> {
  const targetRuc = config.ruc ? config.ruc.trim() : '';
  if (!targetRuc) {
    return false;
  }

  const payload: Record<string, any> = {
    ruc: targetRuc,
    razon_social: config.razonSocial ? config.razonSocial.trim() : '',
    nombre_comercial: config.nombreComercial ? config.nombreComercial.trim() : '',
    direccion_matriz: config.dirMatriz ? config.dirMatriz.trim() : '',
    dir_matriz: config.dirMatriz ? config.dirMatriz.trim() : '',
    direccion_establecimiento: config.dirEstablecimiento ? config.dirEstablecimiento.trim() : '',
    dir_establecimiento: config.dirEstablecimiento ? config.dirEstablecimiento.trim() : '',
    establecimiento: config.codEstablecimiento || '',
    punto_emision: config.codPuntoEmision || '',
    lleva_contabilidad: config.obligadoContabilidad ? 'SI' : 'NO',
    contribuyente_especial: config.contribuyenteEspecial || '',
    agente_retencion: config.agenteRetencion || '',
    regimen: config.regimen || '',
    regimen_tributario: config.regimen || '',
    ambiente: config.ambiente || '1',
    is_demo_mode: config.isDemoMode !== undefined ? config.isDemoMode : true,
    logo_url: config.logoB64 !== undefined ? config.logoB64 : '',
    logo_b64: config.logoB64 !== undefined ? config.logoB64 : '',
    ultimo_secuencial_factura: config.ultimoSecuencialFactura || '',
    clave_firma: config.p12Password !== undefined ? config.p12Password : '',
    p12_nombre: config.p12Nombre || '',
    p12_firma_b64: config.p12FirmaB64 || '',
    p12_password: config.p12Password !== undefined ? config.p12Password : '',
    p12_valido_desde: config.p12ValidoDesde || config.validoDesde || '',
    p12_valido_hasta: config.p12ValidoHasta || config.validoHasta || '',
    valido_desde: config.p12ValidoDesde || config.validoDesde || '',
    valido_hasta: config.p12ValidoHasta || config.validoHasta || '',
    p12_subject: config.p12Subject || '',
    p12_issuer: config.p12Issuer || '',
    p12_serial_number: config.p12SerialNumber || '',
    correo: config.correo || userEmail || '',
    telefono: config.telefono ? config.telefono.trim() : '',
    smtp_host: config.smtpHost || '',
    smtp_port: config.smtpPort ? String(config.smtpPort) : '',
    smtp_user: config.smtpUser || '',
    smtp_pass: config.smtpPass || '',
    smtp_from: config.smtpFrom || '',
    usuario_correo: userEmail || config.usuarioCorreo || '',
    empresa_ruc: config.empresaRuc || targetRuc,
    empresa_nombre: config.empresaNombre || config.razonSocial || ''
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

export async function saveEmitterLogoToSupabase(ruc: string, logoB64: string, userEmail?: string): Promise<boolean> {
  let targetRuc = ruc ? ruc.trim() : '';

  const supabase = getSupabase();
  if (supabase && !targetRuc) {
    try {
      const { data: existing } = await supabase.from('emisor_config').select('ruc').limit(1).maybeSingle();
      if (existing?.ruc) {
        targetRuc = existing.ruc;
      }
    } catch {
      // Ignore query error
    }
  }

  if (!targetRuc) return false;

  const payload: Record<string, any> = {
    ruc: targetRuc,
    logo_url: logoB64,
    logo_b64: logoB64,
    usuario_correo: userEmail || ''
  };

  if (supabase && targetRuc) {
    try {
      const { data: existing } = await supabase.from('emisor_config').select('*').eq('ruc', targetRuc).maybeSingle();
      if (existing) {
        if (existing.id && isValidUuid(existing.id)) payload.id = existing.id;
        if (existing.dir_matriz) payload.dir_matriz = existing.dir_matriz;
        if (existing.direccion_matriz) payload.direccion_matriz = existing.direccion_matriz;
        if (existing.razon_social) payload.razon_social = existing.razon_social;
        if (existing.nombre_comercial) payload.nombre_comercial = existing.nombre_comercial;
        if (existing.regimen) payload.regimen = existing.regimen;
        if (existing.regimen_tributario) payload.regimen_tributario = existing.regimen_tributario;
        if (existing.p12_nombre) payload.p12_nombre = existing.p12_nombre;
        if (existing.p12_firma_b64) payload.p12_firma_b64 = existing.p12_firma_b64;
        if (existing.p12_password) payload.p12_password = existing.p12_password;
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
export async function fetchInvoicesFromSupabase(userEmail?: string, userRole?: string, empresaRuc?: string): Promise<Invoice[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.from('facturas').select('*').order('created_at', { ascending: false });

  if (error || !data) return null;

  // Filter strictly by the current user's company / tenant / emitter user (same operation for SUPERADMIN and tenants)
  const filtered = data.filter(item => {
    if (empresaRuc && item.empresa_ruc === empresaRuc) return true;
    if (userEmail && item.usuario_correo && item.usuario_correo.toLowerCase() === userEmail.toLowerCase()) return true;
    if (!empresaRuc && !userEmail) return true;
    return false;
  });

  return filtered.map(item => ({
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
    creadorNombre: item.creador_nombre || item.creadorNombre,
    usuarioCorreo: item.usuario_correo,
    empresaRuc: item.empresa_ruc,
    empresaNombre: item.empresa_nombre
  }));
}

export async function saveInvoiceToSupabase(invoice: Invoice, userEmail?: string): Promise<boolean> {
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
    creador_nombre: invoice.creadorNombre,
    usuario_correo: userEmail || invoice.usuarioCorreo || '',
    empresa_ruc: invoice.empresaRuc || '',
    empresa_nombre: invoice.empresaNombre || ''
  };

  const res = await safeUpsert('facturas', spanishPayload, 'id');

  // Always save line items in 'factura_detalles' table
  if (invoice.detalles && invoice.detalles.length > 0) {
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('factura_detalles').delete().eq('factura_id', invoice.id);
      }

      const lineItems = invoice.detalles.map((d, index) => ({
        id: (d.id && d.id.length > 5) ? d.id : `${invoice.id}-det-${index + 1}`,
        factura_id: invoice.id,
        factura_secuencial: invoice.secuencial,
        producto_id: d.producto?.id || '',
        producto_codigo: d.producto?.codigo || '',
        producto_nombre: d.producto?.nombre || '',
        cantidad: Number(d.cantidad) || 0,
        precio_unitario: Number(d.producto?.precio) || 0,
        descuento: Number(d.descuento) || 0,
        subtotal: Number(d.subtotal) || 0,
        iva_tipo: String(d.producto?.ivaTipo || '4'),
        iva_calculado: Number(d.ivaCalculado) || 0,
        total: Number(d.total) || 0,
        usuario_correo: userEmail || invoice.usuarioCorreo || '',
        empresa_ruc: invoice.empresaRuc || ''
      }));

      for (const item of lineItems) {
        await safeUpsert('factura_detalles', item, 'id');
      }
    } catch (e) {
      console.warn('Aviso guardando factura_detalles en Supabase:', e);
    }
  }

  return res.success;
}

export async function deleteInvoiceFromSupabase(
  id: string,
  secuencial?: string,
  claveAcceso?: string,
  estab: string = '001',
  ptoEmi: string = '001'
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  // 1. Retrieve sequential and clave_acceso if not passed
  let targetSeq = secuencial;
  let targetClave = claveAcceso;
  try {
    const { data: invRow } = await supabase.from('facturas').select('secuencial, clave_acceso').eq('id', id).maybeSingle();
    if (invRow) {
      if (!targetSeq && invRow.secuencial) targetSeq = invRow.secuencial;
      if (!targetClave && invRow.clave_acceso) targetClave = invRow.clave_acceso;
    }
  } catch (e) {
    console.warn('Aviso buscando metadatos de factura antes de eliminar:', e);
  }

  // 2. Automatically delete generated PDF and XMLs from all Supabase Storage buckets
  try {
    await deleteInvoiceFilesFromStorage(targetSeq, targetClave, estab, ptoEmi);
  } catch (storageErr) {
    console.warn('Aviso eliminando archivos de Supabase Storage para factura:', storageErr);
  }

  // 3. Delete details from factura_detalles table to ensure clean cascade
  try {
    await supabase.from('factura_detalles').delete().eq('factura_id', id);
  } catch (e) {
    console.warn('Aviso borrando factura_detalles en Supabase:', e);
  }

  // 4. Delete invoice record from facturas table
  const { error } = await supabase.from('facturas').delete().eq('id', id);
  return !error;
}

// ==========================================
// 6. PROFORMAS & 7. PROFORMA_DETALLES
// ==========================================
export async function fetchProformasFromSupabase(userEmail?: string, userRole?: string, empresaRuc?: string): Promise<Proforma[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('proformas').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;

    // Filter strictly by the current user's company / tenant / emitter user
    const filtered = data.filter(item => {
      if (empresaRuc && (item.empresa_ruc === empresaRuc || item.empresa_datos?.ruc === empresaRuc)) return true;
      if (userEmail && item.usuario_correo && item.usuario_correo.toLowerCase() === userEmail.toLowerCase()) return true;
      if (!empresaRuc && !userEmail) return true;
      return false;
    });

    return filtered.map(item => ({
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
      empresaCorreo: item.empresa_datos?.correo || item.empresa_correo || item.empresaCorreo,
      usuarioCorreo: item.usuario_correo
    }));
  } catch {
    return null;
  }
}

export async function saveProformaToSupabase(proforma: Proforma, userEmail?: string): Promise<boolean> {
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
    },
    usuario_correo: userEmail || proforma.usuarioCorreo || ''
  };

  const res = await safeUpsert('proformas', payload, 'id');

  if (proforma.detalles && proforma.detalles.length > 0) {
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('proforma_detalles').delete().eq('proforma_id', proforma.id);
      }
      const lineItems = proforma.detalles.map((d, idx) => ({
        id: `${proforma.id}-d${idx + 1}`,
        proforma_id: proforma.id,
        producto_codigo: d.producto?.codigo || '',
        producto_nombre: d.producto?.nombre || '',
        cantidad: d.cantidad || 0,
        precio_unitario: d.producto?.precio || 0,
        subtotal: d.subtotal || 0,
        iva_calculado: d.ivaCalculado || 0,
        total: d.total || 0,
        usuario_correo: userEmail || proforma.usuarioCorreo || ''
      }));
      for (const item of lineItems) {
        await safeUpsert('proforma_detalles', item, 'id');
      }
    } catch (e) {
      console.warn('Aviso guardando proforma_detalles:', e);
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
export async function fetchCreditNotesFromSupabase(userEmail?: string, userRole?: string, empresaRuc?: string): Promise<CreditNote[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('notas_credito').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;

    // Filter strictly by the current user's company / tenant / emitter user (same operation for SUPERADMIN and tenants)
    const filtered = data.filter(item => {
      if (empresaRuc && item.empresa_ruc === empresaRuc) return true;
      if (userEmail && item.usuario_correo && item.usuario_correo.toLowerCase() === userEmail.toLowerCase()) return true;
      if (!empresaRuc && !userEmail) return true;
      return false;
    });

    return filtered.map(item => ({
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
      resumenImpuestos: typeof item.resumen_impuestos === 'string' ? JSON.parse(item.resumen_impuestos) : item.resumen_impuestos,
      creadorNombre: item.creador_nombre || item.creadorNombre,
      usuarioCorreo: item.usuario_correo,
      empresaRuc: item.empresa_ruc,
      empresaNombre: item.empresa_nombre
    }));
  } catch {
    return null;
  }
}

export async function saveCreditNoteToSupabase(creditNote: CreditNote, userEmail?: string): Promise<boolean> {
  const payload: Record<string, any> = {
    id: creditNote.id,
    secuencial: creditNote.secuencial,
    fecha_emision: creditNote.fechaEmision,
    factura_modificada_num: creditNote.facturaModificadaSecuencial,
    factura_modificada_clave: creditNote.facturaModificadaClaveAcceso,
    fecha_emision_modificado: creditNote.fechaEmisionModificado,
    motivo: creditNote.razonModificacion,
    cliente_datos: creditNote.cliente,
    detalles: creditNote.detalles,
    clave_acceso: creditNote.claveAcceso,
    xml: creditNote.xml,
    xml_firmado: creditNote.xmlFirmado,
    estado: creditNote.estado || 'Borrador',
    mensajes_sri: creditNote.mensajesSRI,
    fecha_autorizacion: creditNote.fechaAutorizacion,
    numero_autorizacion: creditNote.numeroAutorizacion,
    info_adicional: creditNote.infoAdicional,
    resumen_impuestos: creditNote.resumenImpuestos,
    usuario_correo: userEmail || creditNote.usuarioCorreo || '',
    empresa_ruc: creditNote.empresaRuc || '',
    empresa_nombre: creditNote.empresaNombre || ''
  };

  const res = await safeUpsert('notas_credito', payload, 'id');

  if (creditNote.detalles && creditNote.detalles.length > 0) {
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('nota_credito_detalles').delete().eq('nota_credito_id', creditNote.id);
      }
      const lineItems = creditNote.detalles.map((d, idx) => ({
        id: `${creditNote.id}-d${idx + 1}`,
        nota_credito_id: creditNote.id,
        producto_codigo: d.producto?.codigo || '',
        producto_nombre: d.producto?.nombre || '',
        cantidad: d.cantidad || 0,
        precio_unitario: d.producto?.precio || 0,
        subtotal: d.subtotal || 0,
        iva_calculado: d.ivaCalculado || 0,
        total: d.total || 0,
        usuario_correo: userEmail || creditNote.usuarioCorreo || '',
        empresa_ruc: creditNote.empresaRuc || ''
      }));
      for (const item of lineItems) {
        await safeUpsert('nota_credito_detalles', item, 'id');
      }
    } catch (e) {
      console.warn('Aviso guardando nota_credito_detalles:', e);
    }
  }

  return res.success;
}

export async function deleteCreditNoteFromSupabase(
  id: string,
  secuencial?: string,
  claveAcceso?: string,
  estab: string = '001',
  ptoEmi: string = '001'
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  let targetSeq = secuencial;
  let targetClave = claveAcceso;
  try {
    const { data: ncRow } = await supabase.from('notas_credito').select('secuencial, clave_acceso').eq('id', id).maybeSingle();
    if (ncRow) {
      if (!targetSeq && ncRow.secuencial) targetSeq = ncRow.secuencial;
      if (!targetClave && ncRow.clave_acceso) targetClave = ncRow.clave_acceso;
    }
  } catch (e) {
    console.warn('Aviso buscando metadatos de nota de crédito antes de eliminar:', e);
  }

  // Automatically delete generated PDF and XMLs from storage buckets
  try {
    await deleteCreditNoteFilesFromStorage(targetSeq, targetClave, estab, ptoEmi);
  } catch (storageErr) {
    console.warn('Aviso eliminando archivos de Supabase Storage para nota de crédito:', storageErr);
  }

  try {
    await supabase.from('nota_credito_detalles').delete().eq('nota_credito_id', id);
  } catch (e) {
    console.warn('Aviso borrando nota_credito_detalles en Supabase:', e);
  }

  const { error } = await supabase.from('notas_credito').delete().eq('id', id);
  return !error;
}

// ==========================================
// 8.1. COMPROBANTES DE RETENCIÓN (SRI TIPO 07)
// ==========================================
export async function fetchRetencionesFromSupabase(userEmail?: string, userRole?: string, empresaRuc?: string): Promise<Retention[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('retenciones').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;

    // Filter strictly by the current user's company / tenant / emitter user (same operation for SUPERADMIN and tenants)
    const filtered = data.filter(item => {
      if (empresaRuc && item.empresa_ruc === empresaRuc) return true;
      if (userEmail && item.usuario_correo && item.usuario_correo.toLowerCase() === userEmail.toLowerCase()) return true;
      if (!empresaRuc && !userEmail) return true;
      return false;
    });

    return filtered.map(item => ({
      id: item.id,
      secuencial: item.secuencial,
      fechaEmision: item.fecha_emision,
      periodoFiscal: item.periodo_fiscal || '',
      proveedor: typeof item.proveedor_datos === 'string' ? JSON.parse(item.proveedor_datos) : item.proveedor_datos,
      sustento: typeof item.sustento === 'string' ? JSON.parse(item.sustento) : (item.sustento || {}),
      impuestos: typeof item.impuestos === 'string' ? JSON.parse(item.impuestos) : (item.impuestos || []),
      totalRetenido: Number(item.total_retenido) || 0,
      claveAcceso: item.clave_acceso,
      xml: item.xml,
      xmlFirmado: item.xml_firmado,
      estado: item.estado,
      mensajesSRI: typeof item.mensajes_sri === 'string' ? JSON.parse(item.mensajes_sri) : (item.mensajes_sri || []),
      fechaAutorizacion: item.fecha_autorizacion,
      numeroAutorizacion: item.numero_autorizacion,
      pdfUrl: item.pdf_url,
      xmlUrl: item.xml_url,
      infoAdicional: typeof item.info_adicional === 'string' ? JSON.parse(item.info_adicional) : (item.info_adicional || []),
      creadorNombre: item.creador_nombre,
      usuarioCorreo: item.usuario_correo,
      empresaRuc: item.empresa_ruc,
      empresaNombre: item.empresa_nombre,
      createdAt: item.created_at
    }));
  } catch {
    return null;
  }
}

export async function saveRetencionToSupabase(ret: Retention, userEmail?: string): Promise<{ success: boolean; errorDetails?: string }> {
  const payload: Record<string, any> = {
    id: ret.id,
    secuencial: ret.secuencial,
    fecha_emision: ret.fechaEmision,
    periodo_fiscal: ret.periodoFiscal,
    proveedor_datos: ret.proveedor,
    sustento: ret.sustento,
    impuestos: ret.impuestos,
    total_retenido: ret.totalRetenido,
    clave_acceso: ret.claveAcceso,
    xml: ret.xml,
    xml_firmado: ret.xmlFirmado,
    estado: ret.estado || 'BORRADOR',
    mensajes_sri: ret.mensajesSRI,
    fecha_autorizacion: ret.fechaAutorizacion,
    numero_autorizacion: ret.numeroAutorizacion,
    pdf_url: ret.pdfUrl,
    xml_url: ret.xmlUrl,
    info_adicional: ret.infoAdicional,
    creador_nombre: ret.creadorNombre,
    usuario_correo: userEmail || ret.usuarioCorreo || '',
    empresa_ruc: ret.empresaRuc || '',
    empresa_nombre: ret.empresaNombre || ''
  };

  const res = await safeUpsert('retenciones', payload, 'id');

  // Insert details in retencion_detalles
  if (ret.impuestos && ret.impuestos.length > 0) {
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('retencion_detalles').delete().eq('retencion_id', ret.id);
      }
      const lineItems = ret.impuestos.map((imp, idx) => ({
        id: `${ret.id}-tax-${idx + 1}`,
        retencion_id: ret.id,
        codigo_impuesto: imp.codigo,
        codigo_retencion: imp.codigoRetencion,
        descripcion: imp.descripcion || '',
        base_imponible: imp.baseImponible || 0,
        porcentaje_retener: imp.porcentajeRetener || 0,
        valor_retenido: imp.valorRetenido || 0,
        tipo_doc_sustento: imp.tipoComprobanteSustento || ret.sustento?.tipoComprobante || '01',
        num_doc_sustento: imp.numDocSustento || ret.sustento?.numComprobante || '',
        fecha_doc_sustento: imp.fechaEmisionDocSustento || ret.sustento?.fechaEmision || ret.fechaEmision,
        usuario_correo: userEmail || ret.usuarioCorreo || '',
        empresa_ruc: ret.empresaRuc || ''
      }));
      for (const item of lineItems) {
        await safeUpsert('retencion_detalles', item, 'id');
      }
    } catch (e) {
      console.warn('Aviso guardando retencion_detalles:', e);
    }
  }

  return res;
}

export async function deleteRetencionFromSupabase(
  id: string,
  secuencial?: string,
  claveAcceso?: string,
  estab: string = '001',
  ptoEmi: string = '001'
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  let targetSeq = secuencial;
  let targetClave = claveAcceso;
  try {
    const { data: retRow } = await supabase.from('retenciones').select('secuencial, clave_acceso').eq('id', id).maybeSingle();
    if (retRow) {
      if (!targetSeq && retRow.secuencial) targetSeq = retRow.secuencial;
      if (!targetClave && retRow.clave_acceso) targetClave = retRow.clave_acceso;
    }
  } catch (e) {
    console.warn('Aviso buscando metadatos de retención antes de eliminar:', e);
  }

  // Automatically delete generated PDF and XMLs from storage buckets
  try {
    await deleteRetentionFilesFromStorage(targetSeq, targetClave, estab, ptoEmi);
  } catch (storageErr) {
    console.warn('Aviso eliminando archivos de Supabase Storage para retención:', storageErr);
  }

  try {
    await supabase.from('retencion_detalles').delete().eq('retencion_id', id);
  } catch (e) {
    console.warn('Aviso eliminando retencion_detalles:', e);
  }

  const { error } = await supabase.from('retenciones').delete().eq('id', id);
  return !error;
}

// ==========================================
// 10. USUARIOS_PORTAL
// ==========================================
export async function fetchUsersFromSupabase(userEmail?: string, userRole?: string, empresaRuc?: string): Promise<PortalUser[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('usuarios_portal').select('*').order('created_at', { ascending: true });
    if (error || !data) return null;

    const isSuperAdmin = userRole?.toUpperCase() === 'SUPERADMIN';
    const filtered = !isSuperAdmin
      ? data.filter(item => {
          // Never expose SUPERADMIN users to non-superadmin
          if ((item.role || '').toUpperCase() === 'SUPERADMIN') return false;
          if (empresaRuc && item.empresa_ruc) return item.empresa_ruc === empresaRuc;
          if (userEmail) return item.creador_correo === userEmail || item.correo === userEmail;
          return false;
        })
      : data;

    return filtered.map(item => ({
      id: item.id || item.correo,
      correo: item.correo,
      clave: item.clave_hash || item.clave || 'admin123',
      role: (item.role || 'USER').toUpperCase() as any,
      nombre: item.nombre || item.usuario || item.correo.split('@')[0],
      fechaRegistro: item.created_at || new Date().toISOString(),
      empresaRuc: item.empresa_ruc,
      empresaNombre: item.empresa_nombre,
      creadorCorreo: item.creador_correo
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
      let finalEmpresaRuc = data.empresa_ruc;
      let finalEmpresaNombre = data.empresa_nombre;

      // If user is admin of a company in empresas_inquilinos, discover and link the company
      if (!finalEmpresaRuc) {
        const { data: adminRows } = await supabase
          .from('empresas_inquilinos')
          .select('*')
          .ilike('admin_correo', cleanEmail)
          .order('created_at', { ascending: false })
          .limit(1);

        if (adminRows && adminRows.length > 0) {
          finalEmpresaRuc = adminRows[0].ruc;
          finalEmpresaNombre = adminRows[0].nombre_comercial || adminRows[0].razon_social;
        }
      }

      return {
        id: data.id || `supa-${Date.now()}`,
        correo: data.correo,
        clave: pass,
        role: (data.role || 'USER').toUpperCase() as any,
        nombre: data.nombre || data.usuario || data.correo.split('@')[0],
        fechaRegistro: data.created_at || new Date().toISOString(),
        empresaRuc: finalEmpresaRuc,
        empresaNombre: finalEmpresaNombre,
        creadorCorreo: data.creador_correo
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
    is_temp: false,
    empresa_ruc: user.empresaRuc || '',
    empresa_nombre: user.empresaNombre || '',
    creador_correo: user.creadorCorreo || ''
  };

  await safeUpsert('usuarios_portal', userPayload, 'correo');
}

export async function deleteUserFromSupabase(id: string, email?: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const targetEmail = (email || id).trim().toLowerCase();
  const { error } = await supabase.from('usuarios_portal').delete().eq('correo', targetEmail);
  return !error;
}

// ==========================================
// 11. INVITACIONES
// ==========================================
export async function fetchInvitationsFromSupabase(userEmail?: string, userRole?: string, empresaRuc?: string): Promise<Invitation[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('invitaciones').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;

    const isSuperAdmin = userRole?.toUpperCase() === 'SUPERADMIN';
    const filtered = !isSuperAdmin
      ? data.filter(item => {
          // Never expose SUPERADMIN invitations to non-superadmin
          if ((item.role || '').toUpperCase() === 'SUPERADMIN') return false;
          if (empresaRuc && item.empresa_ruc) return item.empresa_ruc === empresaRuc;
          if (userEmail) return item.creador_correo === userEmail || item.correo === userEmail;
          return false;
        })
      : data;

    return filtered.map(item => ({
      id: item.id,
      correo: item.correo,
      role: item.role as any,
      claveTemporal: item.clave_temporal,
      nombreInvitado: item.nombre_invitado || item.nombre,
      fechaCreacion: item.fecha_invitacion || item.created_at,
      estado: item.estado || 'PENDIENTE',
      empresaRuc: item.empresa_ruc,
      empresaNombre: item.empresa_nombre,
      creadorCorreo: item.creador_correo
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
    nombre_invitado: invite.nombreInvitado,
    empresa_ruc: invite.empresaRuc || '',
    empresa_nombre: invite.empresaNombre || '',
    creador_correo: invite.creadorCorreo || ''
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

export async function deleteInvitationByEmailFromSupabase(email: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const cleanEmail = email.trim().toLowerCase();
  const { error } = await supabase.from('invitaciones').delete().eq('correo', cleanEmail);
  return !error;
}

// ==========================================
// 12. BITACORA_ACTIVIDADES
// ==========================================
export async function fetchActivityLogsFromSupabase(userEmail?: string, userRole?: string, empresaRuc?: string): Promise<ActivityLog[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('bitacora_actividades')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300);

    if (error || !data) return null;

    const isSuperAdmin = userRole?.toUpperCase() === 'SUPERADMIN';
    const filtered = !isSuperAdmin
      ? data.filter(item => {
          if (empresaRuc && item.empresa_ruc) return item.empresa_ruc === empresaRuc;
          if (userEmail) return !item.usuario_correo || item.usuario_correo === userEmail;
          return true;
        })
      : data;

    return filtered.map(item => ({
      id: item.id,
      usuarioCorreo: item.usuario_correo,
      usuarioNombre: item.usuario_nombre,
      usuarioRol: item.usuario_rol,
      fecha: item.fecha || item.created_at,
      accion: item.accion,
      detalles: item.detalles,
      empresaRuc: item.empresa_ruc,
      empresaNombre: item.empresa_nombre
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
    detalles: log.detalles,
    empresa_ruc: log.empresaRuc || '',
    empresa_nombre: log.empresaNombre || ''
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

// ==========================================
// 13. EMPRESAS / INQUILINOS (MULTI-TENANCY)
// ==========================================
export async function fetchEmpresasFromSupabase(): Promise<EmpresaTenant[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('empresas_inquilinos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(item => ({
      id: item.id || `emp-${item.ruc}`,
      ruc: item.ruc,
      razonSocial: item.razon_social || item.razonSocial || '',
      nombreComercial: item.nombre_comercial || item.nombreComercial || '',
      adminCorreo: item.admin_correo || item.adminCorreo || '',
      estado: (item.estado || 'ACTIVO').toUpperCase() as any,
      fechaInicio: item.fecha_inicio || item.fechaInicio || new Date().toISOString().split('T')[0],
      fechaExpiracion: item.fecha_expiracion || item.fechaExpiracion || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      limiteComprobantes: Number(item.limite_comprobantes ?? item.limiteComprobantes ?? 100),
      limiteUsuarios: Number(item.limite_usuarios ?? item.limiteUsuarios ?? 3),
      comprobantesEmitidos: Number(item.comprobantes_emitidos || 0),
      usuariosRegistrados: Number(item.usuarios_registrados || 0),
      featurePermissions: typeof item.feature_permissions === 'string' 
        ? JSON.parse(item.feature_permissions) 
        : (item.feature_permissions || item.featurePermissions || undefined),
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));
  } catch (e) {
    console.warn('Aviso consultando empresas_inquilinos:', e);
    return [];
  }
}

export async function getEmpresaByRuc(ruc: string): Promise<EmpresaTenant | null> {
  const cleanRuc = (ruc || '').trim();
  if (!cleanRuc) return null;

  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('empresas_inquilinos')
      .select('*')
      .eq('ruc', cleanRuc)
      .maybeSingle();

    if (error || !data) return null;

    const [invRes, ncRes, profRes, usrRes] = await Promise.all([
      supabase.from('facturas').select('id', { count: 'exact', head: true }).eq('empresa_ruc', cleanRuc),
      supabase.from('notas_credito').select('id', { count: 'exact', head: true }).eq('empresa_ruc', cleanRuc),
      supabase.from('proformas').select('id', { count: 'exact', head: true }),
      supabase.from('usuarios_portal').select('id', { count: 'exact', head: true }).eq('empresa_ruc', cleanRuc)
    ]);

    const totalDocs = (invRes.count || 0) + (ncRes.count || 0) + (profRes.count || 0);
    const totalUsers = usrRes.count || 0;

    return {
      id: data.id || `emp-${data.ruc}`,
      ruc: data.ruc,
      razonSocial: data.razon_social || data.razonSocial || '',
      nombreComercial: data.nombre_comercial || data.nombreComercial || '',
      adminCorreo: data.admin_correo || data.adminCorreo || '',
      estado: (data.estado || 'ACTIVO').toUpperCase() as any,
      fechaInicio: data.fecha_inicio || data.fechaInicio || new Date().toISOString().split('T')[0],
      fechaExpiracion: data.fecha_expiracion || data.fechaExpiracion || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      limiteComprobantes: Number(data.limite_comprobantes ?? data.limiteComprobantes ?? 100),
      limiteUsuarios: Number(data.limite_usuarios ?? data.limiteUsuarios ?? 3),
      comprobantesEmitidos: totalDocs,
      usuariosRegistrados: totalUsers,
      featurePermissions: typeof data.feature_permissions === 'string' 
        ? JSON.parse(data.feature_permissions) 
        : (data.feature_permissions || data.featurePermissions || undefined),
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (e) {
    console.warn('Aviso getEmpresaByRuc:', e);
    return null;
  }
}

export async function getEmpresaForUser(userEmail?: string, userEmpresaRuc?: string): Promise<EmpresaTenant | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const cleanEmail = (userEmail || '').trim().toLowerCase();
  const cleanRuc = (userEmpresaRuc || '').trim();

  try {
    // 1. If explicit RUC is provided, fetch by RUC
    if (cleanRuc) {
      const byRuc = await getEmpresaByRuc(cleanRuc);
      if (byRuc) return byRuc;
    }

    // 2. Search in usuarios_portal for user's assigned empresa_ruc
    if (cleanEmail) {
      const { data: userRow } = await supabase
        .from('usuarios_portal')
        .select('empresa_ruc, empresa_nombre')
        .eq('correo', cleanEmail)
        .maybeSingle();

      if (userRow?.empresa_ruc) {
        const byUserRuc = await getEmpresaByRuc(userRow.empresa_ruc);
        if (byUserRuc) return byUserRuc;
      }

      // 3. Search in empresas_inquilinos where admin_correo is this email
      const { data: adminRows } = await supabase
        .from('empresas_inquilinos')
        .select('*')
        .ilike('admin_correo', cleanEmail)
        .order('created_at', { ascending: false });

      if (adminRows && adminRows.length > 0) {
        const row = adminRows[0];
        return await getEmpresaByRuc(row.ruc);
      }
    }
  } catch (err) {
    console.warn('Aviso buscando empresa para usuario:', err);
  }
  return null;
}

export async function saveEmpresaToSupabase(empresa: EmpresaTenant): Promise<{ success: boolean; errorDetails?: string }> {
  const payload = {
    id: empresa.id || `emp-${empresa.ruc}`,
    ruc: empresa.ruc.trim(),
    razon_social: empresa.razonSocial.trim(),
    nombre_comercial: empresa.nombreComercial?.trim() || empresa.razonSocial.trim(),
    admin_correo: empresa.adminCorreo.trim().toLowerCase(),
    estado: empresa.estado || 'ACTIVO',
    fecha_inicio: empresa.fechaInicio || new Date().toISOString().split('T')[0],
    fecha_expiracion: empresa.fechaExpiracion,
    limite_comprobantes: Number(empresa.limiteComprobantes) || 100,
    limite_usuarios: Number(empresa.limiteUsuarios) || 3,
    feature_permissions: empresa.featurePermissions || null
  };

  return safeUpsert('empresas_inquilinos', payload, 'ruc');
}

export async function deleteEmpresaFromSupabase(id: string, ruc?: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    let q = supabase.from('empresas_inquilinos').delete();
    if (ruc) {
      q = q.eq('ruc', ruc);
    } else {
      q = q.eq('id', id);
    }
    const { error } = await q;
    return !error;
  } catch {
    return false;
  }
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
    if (data.config && data.config.ruc && data.config.ruc.trim()) {
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
// SUPABASE STORAGE BUCKETS (10 BUCKETS)
// ==========================================
export const SUPABASE_BUCKETS = {
  FACTURAS_PDF: 'facturas-pdf',
  FACTURAS_XML_SIN_FIRMAR: 'facturas-xml-sin-firmar',
  FACTURAS_XML_FIRMADOS: 'facturas-xml-firmados',
  NOTAS_CREDITO_PDF: 'notas-credito-pdf',
  NOTAS_CREDITO_XML_FIRMADOS: 'notas-credito-xml-firmados',
  NOTAS_CREDITO_XML_SIN_FIRMAR: 'notas-credito-xml-sin-firmar',
  RETENCIONES_PDF: 'retenciones-pdf',
  RETENCIONES_XML_FIRMADOS: 'retenciones-xml-firmados',
  RETENCIONES_XML_SIN_FIRMAR: 'retenciones-xml-sin-firmar',
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

export async function uploadRetentionPdf(estab: string = '001', ptoEmi: string = '001', secuencial: string, pdfContent: Blob | File) {
  const cleanEstab = String(estab).padStart(3, '0');
  const cleanPtoEmi = String(ptoEmi).padStart(3, '0');
  const cleanSeq = String(secuencial).padStart(9, '0');
  return uploadToSupabaseBucket(SUPABASE_BUCKETS.RETENCIONES_PDF, `RET ${cleanEstab}-${cleanPtoEmi}-${cleanSeq}.pdf`, pdfContent, 'application/pdf');
}

export async function uploadRetentionXmlFirmado(estab: string = '001', ptoEmi: string = '001', secuencial: string, xmlContent: string) {
  const cleanEstab = String(estab).padStart(3, '0');
  const cleanPtoEmi = String(ptoEmi).padStart(3, '0');
  const cleanSeq = String(secuencial).padStart(9, '0');
  return uploadToSupabaseBucket(SUPABASE_BUCKETS.RETENCIONES_XML_FIRMADOS, `RET ${cleanEstab}-${cleanPtoEmi}-${cleanSeq}_firmado.xml`, xmlContent, 'application/xml');
}

export async function uploadRetentionXmlSinFirmar(estab: string = '001', ptoEmi: string = '001', secuencial: string, xmlContent: string) {
  const cleanEstab = String(estab).padStart(3, '0');
  const cleanPtoEmi = String(ptoEmi).padStart(3, '0');
  const cleanSeq = String(secuencial).padStart(9, '0');
  return uploadToSupabaseBucket(SUPABASE_BUCKETS.RETENCIONES_XML_SIN_FIRMAR, `RET ${cleanEstab}-${cleanPtoEmi}-${cleanSeq}.xml`, xmlContent, 'application/xml');
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
      id: 'superadmin-jhonny',
      usuario: 'Jhonny Vargas',
      correo: 'jhonnyvp5@gmail.com',
      role: 'SUPERADMIN',
      nombre: 'Jhonny Vargas',
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

// =========================================================================
// AUTOMATIC STORAGE DELETION (PDF & XMLs IN BUCKETS)
// =========================================================================

export async function deleteMatchingFilesFromBucket(
  bucketName: string,
  searchTerms: string[],
  directPaths: string[] = []
): Promise<number> {
  const supabase = getSupabase();
  if (!supabase) return 0;

  const validTerms = searchTerms
    .filter(t => t && String(t).trim().length >= 2)
    .map(t => String(t).trim().toLowerCase());

  const deletedSet = new Set<string>();

  try {
    // 1. Direct elimination of standard known paths
    if (directPaths.length > 0) {
      const validDirect = directPaths.filter(p => p && p.trim().length > 0);
      if (validDirect.length > 0) {
        const { data: directRemoved } = await supabase.storage.from(bucketName).remove(validDirect);
        if (directRemoved && Array.isArray(directRemoved)) {
          directRemoved.forEach((f: any) => f?.name && deletedSet.add(f.name));
        }
      }
    }

    // 2. Scan bucket to find any other files generated with matching serial or access key
    if (validTerms.length > 0) {
      const { data: fileList, error: listErr } = await supabase.storage.from(bucketName).list('', {
        limit: 300,
        sortBy: { column: 'created_at', order: 'desc' }
      });

      if (!listErr && fileList && Array.isArray(fileList) && fileList.length > 0) {
        const matchingFiles = fileList
          .filter(file => {
            if (!file?.name) return false;
            const nameLower = file.name.toLowerCase();
            return validTerms.some(term => nameLower.includes(term));
          })
          .map(file => file.name);

        if (matchingFiles.length > 0) {
          const { data: searchRemoved } = await supabase.storage.from(bucketName).remove(matchingFiles);
          if (searchRemoved && Array.isArray(searchRemoved)) {
            searchRemoved.forEach((f: any) => f?.name && deletedSet.add(f.name));
          }
        }
      }
    }

    if (deletedSet.size > 0) {
      console.log(`[Supabase Storage] ✅ Eliminados ${deletedSet.size} archivo(s) del bucket "${bucketName}":`, Array.from(deletedSet));
    }
    return deletedSet.size;
  } catch (err) {
    console.warn(`[Supabase Storage] Aviso al eliminar archivos en el bucket "${bucketName}":`, err);
    return deletedSet.size;
  }
}

/**
 * Elimina automáticamente el PDF y los XMLs (firmados y sin firmar) de los buckets de Facturas en Supabase Storage
 */
export async function deleteInvoiceFilesFromStorage(
  secuencial?: string,
  claveAcceso?: string,
  estab: string = '001',
  ptoEmi: string = '001'
): Promise<{ pdfCount: number; xmlSinFirmarCount: number; xmlFirmadosCount: number }> {
  const cleanEstab = String(estab || '001').padStart(3, '0');
  const cleanPtoEmi = String(ptoEmi || '001').padStart(3, '0');
  const cleanSeq = secuencial ? String(secuencial).padStart(9, '0') : '';
  const seqNum = secuencial ? String(parseInt(secuencial, 10)) : '';

  const searchTerms = [
    cleanSeq,
    seqNum,
    claveAcceso || '',
    `${cleanEstab}-${cleanPtoEmi}-${cleanSeq}`
  ].filter(t => Boolean(t && t.length >= 2));

  const directPdfs = cleanSeq ? [
    `FAC ${cleanEstab}-${cleanPtoEmi}-${cleanSeq}.pdf`,
    `FAC_${cleanEstab}-${cleanPtoEmi}-${cleanSeq}.pdf`,
    `FACTURA_${cleanSeq}.pdf`,
    `FAC_${cleanSeq}.pdf`,
    `${cleanSeq}.pdf`,
    claveAcceso ? `${claveAcceso}.pdf` : ''
  ].filter(Boolean) : [];

  const directXmlsSinFirmar = cleanSeq ? [
    `FAC ${cleanEstab}-${cleanPtoEmi}-${cleanSeq}.xml`,
    `FAC_${cleanEstab}-${cleanPtoEmi}-${cleanSeq}.xml`,
    `FACTURA_${cleanSeq}.xml`,
    `FAC_${cleanSeq}.xml`,
    `${cleanSeq}.xml`,
    claveAcceso ? `${claveAcceso}.xml` : '',
    `SRI_COMPROBANTE_${cleanSeq}.xml`,
    secuencial ? `SRI_COMPROBANTE_${secuencial}.xml` : ''
  ].filter(Boolean) : [];

  const directXmlsFirmados = cleanSeq ? [
    `FAC ${cleanEstab}-${cleanPtoEmi}-${cleanSeq}_firmado.xml`,
    `FAC_${cleanEstab}-${cleanPtoEmi}-${cleanSeq}_firmado.xml`,
    `FACTURA_${cleanSeq}_firmado.xml`,
    `FAC_${cleanSeq}_firmado.xml`,
    `${cleanSeq}_firmado.xml`,
    claveAcceso ? `${claveAcceso}_firmado.xml` : '',
    claveAcceso ? `${claveAcceso}.xml` : '',
    `SRI_COMPROBANTE_${cleanSeq}.xml`,
    secuencial ? `SRI_COMPROBANTE_${secuencial}.xml` : ''
  ].filter(Boolean) : [];

  const [pdfCount, xmlSinFirmarCount, xmlFirmadosCount] = await Promise.all([
    deleteMatchingFilesFromBucket(SUPABASE_BUCKETS.FACTURAS_PDF, searchTerms, directPdfs),
    deleteMatchingFilesFromBucket(SUPABASE_BUCKETS.FACTURAS_XML_SIN_FIRMAR, searchTerms, directXmlsSinFirmar),
    deleteMatchingFilesFromBucket(SUPABASE_BUCKETS.FACTURAS_XML_FIRMADOS, searchTerms, directXmlsFirmados)
  ]);

  return { pdfCount, xmlSinFirmarCount, xmlFirmadosCount };
}

/**
 * Elimina automáticamente el PDF y los XMLs (firmados y sin firmar) de los buckets de Notas de Crédito en Supabase Storage
 */
export async function deleteCreditNoteFilesFromStorage(
  secuencial?: string,
  claveAcceso?: string,
  estab: string = '001',
  ptoEmi: string = '001'
): Promise<{ pdfCount: number; xmlSinFirmarCount: number; xmlFirmadosCount: number }> {
  const cleanEstab = String(estab || '001').padStart(3, '0');
  const cleanPtoEmi = String(ptoEmi || '001').padStart(3, '0');
  const cleanSeq = secuencial ? String(secuencial).padStart(9, '0') : '';
  const seqNum = secuencial ? String(parseInt(secuencial, 10)) : '';

  const searchTerms = [
    cleanSeq,
    seqNum,
    claveAcceso || '',
    `${cleanEstab}-${cleanPtoEmi}-${cleanSeq}`
  ].filter(t => Boolean(t && t.length >= 2));

  const directPdfs = cleanSeq ? [
    `NCT ${cleanEstab}-${cleanPtoEmi}-${cleanSeq}.pdf`,
    `NCT_${cleanEstab}-${cleanPtoEmi}-${cleanSeq}.pdf`,
    `NOTA_CREDITO_${cleanSeq}.pdf`,
    `NCT_${cleanSeq}.pdf`,
    `${cleanSeq}.pdf`,
    claveAcceso ? `${claveAcceso}.pdf` : ''
  ].filter(Boolean) : [];

  const directXmlsSinFirmar = cleanSeq ? [
    `NCT ${cleanEstab}-${cleanPtoEmi}-${cleanSeq}.xml`,
    `NCT_${cleanEstab}-${cleanPtoEmi}-${cleanSeq}.xml`,
    `NOTA_CREDITO_${cleanSeq}.xml`,
    `NCT_${cleanSeq}.xml`,
    `${cleanSeq}.xml`,
    claveAcceso ? `${claveAcceso}.xml` : '',
    `SRI_COMPROBANTE_${cleanSeq}.xml`,
    secuencial ? `SRI_COMPROBANTE_${secuencial}.xml` : ''
  ].filter(Boolean) : [];

  const directXmlsFirmados = cleanSeq ? [
    `NCT ${cleanEstab}-${cleanPtoEmi}-${cleanSeq}_firmado.xml`,
    `NCT_${cleanEstab}-${cleanPtoEmi}-${cleanSeq}_firmado.xml`,
    `NOTA_CREDITO_${cleanSeq}_firmado.xml`,
    `NCT_${cleanSeq}_firmado.xml`,
    `${cleanSeq}_firmado.xml`,
    claveAcceso ? `${claveAcceso}_firmado.xml` : '',
    claveAcceso ? `${claveAcceso}.xml` : '',
    `SRI_COMPROBANTE_${cleanSeq}.xml`,
    secuencial ? `SRI_COMPROBANTE_${secuencial}.xml` : ''
  ].filter(Boolean) : [];

  const [pdfCount, xmlSinFirmarCount, xmlFirmadosCount] = await Promise.all([
    deleteMatchingFilesFromBucket(SUPABASE_BUCKETS.NOTAS_CREDITO_PDF, searchTerms, directPdfs),
    deleteMatchingFilesFromBucket(SUPABASE_BUCKETS.NOTAS_CREDITO_XML_SIN_FIRMAR, searchTerms, directXmlsSinFirmar),
    deleteMatchingFilesFromBucket(SUPABASE_BUCKETS.NOTAS_CREDITO_XML_FIRMADOS, searchTerms, directXmlsFirmados)
  ]);

  return { pdfCount, xmlSinFirmarCount, xmlFirmadosCount };
}

/**
 * Elimina automáticamente el PDF y los XMLs (firmados y sin firmar) de los buckets de Retenciones en Supabase Storage
 */
export async function deleteRetentionFilesFromStorage(
  secuencial?: string,
  claveAcceso?: string,
  estab: string = '001',
  ptoEmi: string = '001'
): Promise<{ pdfCount: number; xmlSinFirmarCount: number; xmlFirmadosCount: number }> {
  const cleanEstab = String(estab || '001').padStart(3, '0');
  const cleanPtoEmi = String(ptoEmi || '001').padStart(3, '0');
  const cleanSeq = secuencial ? String(secuencial).padStart(9, '0') : '';
  const seqNum = secuencial ? String(parseInt(secuencial, 10)) : '';

  const searchTerms = [
    cleanSeq,
    seqNum,
    claveAcceso || '',
    `${cleanEstab}-${cleanPtoEmi}-${cleanSeq}`
  ].filter(t => Boolean(t && t.length >= 2));

  const directPdfs = cleanSeq ? [
    `RET ${cleanEstab}-${cleanPtoEmi}-${cleanSeq}.pdf`,
    `RET_${cleanEstab}-${cleanPtoEmi}-${cleanSeq}.pdf`,
    `RETENCION_${cleanSeq}.pdf`,
    `RET_${cleanSeq}.pdf`,
    `${cleanSeq}.pdf`,
    claveAcceso ? `${claveAcceso}.pdf` : ''
  ].filter(Boolean) : [];

  const directXmlsSinFirmar = cleanSeq ? [
    `RET ${cleanEstab}-${cleanPtoEmi}-${cleanSeq}.xml`,
    `RET_${cleanEstab}-${cleanPtoEmi}-${cleanSeq}.xml`,
    `RETENCION_${cleanSeq}.xml`,
    `RET_${cleanSeq}.xml`,
    `${cleanSeq}.xml`,
    claveAcceso ? `${claveAcceso}.xml` : '',
    `SRI_COMPROBANTE_${cleanSeq}.xml`,
    secuencial ? `SRI_COMPROBANTE_${secuencial}.xml` : ''
  ].filter(Boolean) : [];

  const directXmlsFirmados = cleanSeq ? [
    `RET ${cleanEstab}-${cleanPtoEmi}-${cleanSeq}_firmado.xml`,
    `RET_${cleanEstab}-${cleanPtoEmi}-${cleanSeq}_firmado.xml`,
    `RETENCION_${cleanSeq}_firmado.xml`,
    `RET_${cleanSeq}_firmado.xml`,
    `${cleanSeq}_firmado.xml`,
    claveAcceso ? `${claveAcceso}_firmado.xml` : '',
    claveAcceso ? `${claveAcceso}.xml` : '',
    `SRI_COMPROBANTE_${cleanSeq}.xml`,
    secuencial ? `SRI_COMPROBANTE_${secuencial}.xml` : ''
  ].filter(Boolean) : [];

  const [pdfCount, xmlSinFirmarCount, xmlFirmadosCount] = await Promise.all([
    deleteMatchingFilesFromBucket(SUPABASE_BUCKETS.RETENCIONES_PDF, searchTerms, directPdfs),
    deleteMatchingFilesFromBucket(SUPABASE_BUCKETS.RETENCIONES_XML_SIN_FIRMAR, searchTerms, directXmlsSinFirmar),
    deleteMatchingFilesFromBucket(SUPABASE_BUCKETS.RETENCIONES_XML_FIRMADOS, searchTerms, directXmlsFirmados)
  ]);

  return { pdfCount, xmlSinFirmarCount, xmlFirmadosCount };
}
