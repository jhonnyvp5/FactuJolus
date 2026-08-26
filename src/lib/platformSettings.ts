import { PlatformCustomizationSettings, CustomMenuItem, MenuGroup, SriWsEndpointsConfig } from '../types';
import { getSupabase } from './supabase';

export const PLATFORM_SETTINGS_STORAGE_KEY = 'sri_platform_custom_settings';

export const DEFAULT_SRI_WS_ENDPOINTS: SriWsEndpointsConfig = {
  recepcionPruebas: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
  autorizacionPruebas: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl',
  recepcionProduccion: 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
  autorizacionProduccion: 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl',
};

export const DEFAULT_PLATFORM_SETTINGS: PlatformCustomizationSettings = {
  id: 'global_platform_settings',
  updatedAt: new Date().toISOString(),
  updatedBy: 'SUPERADMIN',

  // SRI Web Service Dynamic Endpoints (Configurable exclusively by SUPERADMIN)
  sriWsEndpoints: { ...DEFAULT_SRI_WS_ENDPOINTS },

  // Visual Identity & Branding
  platformName: 'ORIONNX SERVICES',
  platformTagline: 'Facturación Electrónica SRI',
  systemBadge: 'Emisión Oficial Ecuador • Estándar XAdES-BES',
  logoUrl: '',
  faviconUrl: '',
  loginWelcomeHeading: 'Facturación Electrónica Inteligente',
  loginWelcomeSubheading: 'Accede a la plataforma líder para emisión de comprobantes, retenciones y gestión tributaria SRI en Ecuador.',
  footerCopyright: '© 2026 ORIONNX • Sistema Tributario SRI',
  footerLegalText: 'XAdES-BES Firmado y Conexiones Offline Oficial de Ecuador SRI habilitadas.',

  // Layout & Menu Architecture (Hostinger & Figma Style)
  menuLayout: 'topbar-classic',
  contentLayoutWidth: 'contained-lg',
  density: 'comfortable',
  menuGroups: [
    { id: 'group-facturacion', name: 'Facturación SRI', iconName: 'FileText', order: 1, visible: true, color: 'blue' },
    { id: 'group-catalogos', name: 'Catálogos', iconName: 'Package', order: 2, visible: true, color: 'emerald' },
    { id: 'group-admin', name: 'Administración', iconName: 'ShieldCheck', order: 3, visible: true, color: 'purple' },
  ],
  customMenuItems: [
    { id: 'menu-history', key: 'history', label: 'Facturas & Notas', iconName: 'FileText', visible: true, order: 1, requiredRole: 'ALL', groupId: 'group-facturacion' },
    { id: 'menu-invoice', key: 'new-invoice', label: 'Nueva Factura', iconName: 'PlusCircle', visible: true, order: 2, requiredRole: 'ALL', groupId: 'group-facturacion' },
    { id: 'menu-nc', key: 'new-nc', label: 'Nota Crédito', iconName: 'Receipt', visible: true, order: 3, requiredRole: 'ALL', groupId: 'group-facturacion' },
    { id: 'menu-retentions', key: 'retentions', label: 'Retenciones', iconName: 'Coins', visible: true, order: 4, requiredRole: 'ALL', groupId: 'group-facturacion' },
    { id: 'menu-proformas', key: 'proformas', label: 'Proformas', iconName: 'FileSpreadsheet', visible: true, order: 5, requiredRole: 'ALL', groupId: 'group-facturacion' },
    { id: 'menu-products', key: 'products', label: 'Productos', iconName: 'Package', visible: true, order: 6, requiredRole: 'ALL', groupId: 'group-catalogos' },
    { id: 'menu-clients', key: 'clients', label: 'Clientes', iconName: 'Users', visible: true, order: 7, requiredRole: 'ALL', groupId: 'group-catalogos' },
    { id: 'menu-profile', key: 'profile', label: 'Mi Perfil', iconName: 'User', visible: true, order: 8, requiredRole: 'ALL' },
    { id: 'menu-settings', key: 'settings', label: 'Configuración', iconName: 'Settings', visible: true, order: 9, requiredRole: 'ALL' },
    { id: 'menu-users', key: 'users', label: 'Usuarios', iconName: 'ShieldCheck', visible: true, order: 10, requiredRole: 'ADMIN', groupId: 'group-admin' },
    { id: 'menu-tenants', key: 'tenants', label: 'Empresas', iconName: 'Building2', visible: true, order: 11, requiredRole: 'SUPERADMIN', groupId: 'group-admin' },
    { id: 'menu-customizer', key: 'customizer', label: 'Diseño & Menús', iconName: 'Palette', visible: true, order: 12, requiredRole: 'ALL', groupId: 'group-admin' },
    { id: 'menu-supabase', key: 'supabase', label: 'Supabase', iconName: 'Database', visible: true, order: 13, requiredRole: 'SUPERADMIN', groupId: 'group-admin' },
  ],

  // Global Theme & Advanced Colors Engine
  primaryColorName: 'blue',
  customPrimaryHex: '#2563eb',
  customSecondaryHex: '#4f46e5',
  customNavbarBgHex: '#ffffff',
  customSidebarBgHex: '#0f172a',
  customCardBgHex: '#ffffff',
  customTextColorHex: '#0f172a',
  customButtonColorHex: '#2563eb',
  customButtonTextColorHex: '#ffffff',
  buttonBorderRadius: 'xl',
  enableCustomColorPalette: false,
  accentGradient: 'blue-indigo',
  headerStyle: 'modern-white',
  borderRadiusStyle: 'xl',

  // Global Text & Button Names / Microcopy Overrides
  textOverrides: {
    btn_new_invoice: 'Emitir Factura',
    btn_sign_transmit: 'Firmar y Transmitir al SRI',
    btn_save_draft: 'Guardar Borrador',
    btn_new_nc: 'Emitir Nota de Crédito',
    btn_new_retention: 'Nueva Retención',
    btn_new_proforma: 'Generar Proforma',
    btn_new_client: 'Nuevo Cliente',
    btn_new_product: 'Nuevo Producto',
    btn_download_ride: 'Descargar RIDE (PDF)',
    btn_download_xml: 'Descargar XML Firmado',
    btn_send_email: 'Enviar Comprobante por Correo',
    btn_plans: 'Ver Planes de Facturación',
    btn_login: 'Ingresar al Sistema',
    btn_logout: 'Salir',
    title_history: 'Historial de Comprobantes',
    subtitle_history: 'Consulta, reenvío y descarga de comprobantes emitidos ante el SRI',
    title_new_invoice: 'Emisión de Factura Electrónica',
    subtitle_new_invoice: 'Genera facturas con cálculo automático de impuestos y firma digital XAdES-BES',
    title_new_nc: 'Emisión de Nota de Crédito',
    subtitle_new_nc: 'Modifica o anula valores de facturas autorizadas previamente por el SRI',
    title_retentions: 'Comprobantes de Retención Electrónica',
    subtitle_retentions: 'Emisión de retenciones en la fuente de Impuesto a la Renta e IVA',
    title_proformas: 'Cotizaciones y Proformas Comerciales',
    subtitle_proformas: 'Crea proformas con conversión directa a factura electrónica',
    title_products: 'Catálogo de Productos y Servicios',
    subtitle_products: 'Administra precios, tarifas IVA y códigos principales',
    title_clients: 'Directorio de Clientes',
    subtitle_clients: 'Gestiona datos tributarios de clientes para emisión rápida',
  },

  // Screen-by-Screen Builder & Component Customizations
  screenCustomizations: {
    'history': {
      screenId: 'history',
      title: 'Historial de Facturas & Notas',
      subtitle: 'Comprobantes autorizados en línea por el SRI con acceso directo a RIDE y XML.',
      badge: 'SRI XAdES-BES',
      iconName: 'History',
      sections: [
        { id: 'sec-kpis', name: 'Tarjetas de Métricas & Resumen', visible: true, order: 1 },
        { id: 'sec-search-filters', name: 'Barra de Búsqueda y Filtros', visible: true, order: 2 },
        { id: 'sec-table-invoices', name: 'Tabla de Facturas Emitidas', visible: true, order: 3 },
        { id: 'sec-table-nc', name: 'Tabla de Notas de Crédito', visible: true, order: 4 },
      ],
      customBlocks: []
    },
    'new-invoice': {
      screenId: 'new-invoice',
      title: 'Emisión de Factura Electrónica',
      subtitle: 'Formulario oficial de facturación con validación de RUC/Cédula y cálculo automático de IVA.',
      badge: 'Emisión SRI',
      iconName: 'PlusCircle',
      sections: [
        { id: 'sec-emitter-bar', name: 'Cabecera de Emisor & Secuencial', visible: true, order: 1 },
        { id: 'sec-client-picker', name: 'Selector de Cliente & Datos Fiscales', visible: true, order: 2 },
        { id: 'sec-items-table', name: 'Detalle de Productos & Servicios', visible: true, order: 3 },
        { id: 'sec-payment-taxes', name: 'Formas de Pago y Resumen de Totales', visible: true, order: 4 },
        { id: 'sec-additional-info', name: 'Campos de Información Adicional', visible: true, order: 5 },
      ],
      customBlocks: []
    },
    'new-nc': {
      screenId: 'new-nc',
      title: 'Nota de Crédito Electrónica',
      subtitle: 'Anulación o ajuste de montos de comprobantes autorizados.',
      badge: 'Documento Tributario',
      iconName: 'Receipt',
      sections: [
        { id: 'sec-nc-header', name: 'Datos de la Factura a Modificar', visible: true, order: 1 },
        { id: 'sec-nc-details', name: 'Detalle de Ítems Modificados', visible: true, order: 2 },
        { id: 'sec-nc-summary', name: 'Totales y Motivo de Modificación', visible: true, order: 3 }
      ]
    },
    'retentions': {
      screenId: 'retentions',
      title: 'Gestor de Retenciones SRI',
      subtitle: 'Emisión y control de comprobantes de retención en la fuente de IVA e Impuesto a la Renta.',
      badge: 'Retención Oficial',
      iconName: 'Coins',
      sections: [
        { id: 'sec-ret-stats', name: 'Resumen de Retenciones del Mes', visible: true, order: 1 },
        { id: 'sec-ret-form', name: 'Formulario de Nueva Retención', visible: true, order: 2 },
        { id: 'sec-ret-history', name: 'Listado de Retenciones Emitidas', visible: true, order: 3 }
      ]
    },
    'proformas': {
      screenId: 'proformas',
      title: 'Cotizaciones y Proformas Comerciales',
      subtitle: 'Presupuestos para clientes con conversión a factura en 1 clic.',
      badge: 'Ventas & Cotizaciones',
      iconName: 'FileSpreadsheet',
      sections: [
        { id: 'sec-prof-form', name: 'Generador de Cotización', visible: true, order: 1 },
        { id: 'sec-prof-list', name: 'Historial de Cotizaciones Emitidas', visible: true, order: 2 }
      ]
    },
    'products': {
      screenId: 'products',
      title: 'Catálogo de Productos y Servicios',
      subtitle: 'Inventario, listas de precios, impuestos IVA diferenciados y códigos de barras.',
      badge: 'Inventario Activo',
      iconName: 'Package',
      sections: [
        { id: 'sec-prod-header', name: 'Búsqueda y Acciones de Creación', visible: true, order: 1 },
        { id: 'sec-prod-grid', name: 'Cuadrícula y Lista de Productos', visible: true, order: 2 }
      ]
    },
    'clients': {
      screenId: 'clients',
      title: 'Directorio de Clientes',
      subtitle: 'Base de datos de compradores con validación de identificación ecuatoriana.',
      badge: 'Clientes SRI',
      iconName: 'Users',
      sections: [
        { id: 'sec-cli-header', name: 'Búsqueda y Registro de Clientes', visible: true, order: 1 },
        { id: 'sec-cli-list', name: 'Tabla de Directorio de Clientes', visible: true, order: 2 }
      ]
    }
  },

  // Custom Visual Containers & Blocks (Hostinger / Figma Drag-and-Build)
  customContainers: [
    {
      id: 'container-welcome-hero',
      title: 'Banner de Bienvenida',
      type: 'hero-banner',
      columnSpan: 'col-12',
      order: 1,
      visible: true,
      showInDashboard: true,
      showInLogin: false,
      style: {
        bgType: 'gradient',
        gradient: 'from-slate-900 via-indigo-950 to-blue-900',
        textColor: '#ffffff',
        borderRadius: '3xl',
        shadow: 'xl',
        padding: 'lg',
      },
      content: {
        heroBadge: 'SISTEMA AUTORIZADO SRI',
        heroTitle: 'Centro de Control de Facturación Electrónica',
        heroSubtitle: 'Emite facturas válidas ante el SRI con firma digital XAdES-BES, gestiona clientes, retenciones e inventario en tiempo real.',
        heroButtonText: 'Emitir Nueva Factura',
        heroButtonUrl: '#new-invoice',
      }
    },
    {
      id: 'container-fast-kpis',
      title: 'Métricas Rápidas',
      type: 'stat-metrics',
      columnSpan: 'col-12',
      order: 2,
      visible: true,
      showInDashboard: true,
      showInLogin: false,
      style: {
        bgType: 'card',
        borderRadius: '2xl',
        shadow: 'sm',
        padding: 'md',
      },
      content: {
        metrics: [
          { id: 'm-1', label: 'Esquema SRI Activo', value: 'XAdES-BES 2.1', subtext: 'Validación en línea', iconName: 'ShieldCheck', color: '#10b981', trend: '100% Operativo' },
          { id: 'm-2', label: 'Tarifa IVA Vigente', value: '15% / 0%', subtext: 'Desglose automático', iconName: 'Coins', color: '#3b82f6', trend: 'Actualizado 2026' },
          { id: 'm-3', label: 'Almacenamiento Cloud', value: 'Supabase + Offline', subtext: 'Respaldo automático', iconName: 'Database', color: '#8b5cf6', trend: 'Sincronizado' },
          { id: 'm-4', label: 'Soporte Tributario', value: '24/7 WhatsApp', subtext: 'Atención personalizada', iconName: 'MessageCircle', color: '#ec4899', trend: 'Activo' },
        ]
      }
    }
  ],

  // Custom Code & Scripts
  customCss: '/* Custom Platform CSS - Escribe tus reglas CSS personalizadas aquí */\n',
  customHeadHtml: '',
  customFooterHtml: '',

  // Plans Catalog Config
  plansCatalogHeading: 'Elige el Plan Perfecto para tu Negocio',
  plansCatalogSubheading: 'Emisión instantánea con firma XAdES-BES, catálogo de clientes, productos y autorización automática con el SRI de Ecuador.',
  plansAnnualDiscountText: 'AHORRA 25% EN PLAN ANUAL',

  // Top Announcement Banner
  topBanner: {
    enabled: true,
    badgeText: 'NOVEDAD SRI',
    badgeColor: 'sky',
    message: 'Sistema actualizado con esquema XAdES-BES 2.1, Retenciones Electrónicas y tarifa IVA 15% vigente.',
    linkText: 'Ver Noticias SRI',
    linkUrl: '#news',
    isDismissible: true,
    bgColor: '#1e293b',
  },

  // Promotional Banner
  promoBanner: {
    enabled: true,
    title: '¡Potencia tu negocio con facturación ilimitada!',
    subtitle: 'Activa tu plan corporativo con soporte preferencial para firmas electrónicas y emisión masiva sin límites.',
    discountText: '30% OFF en Plan Anual',
    buttonText: 'Ver Planes Disponibles',
    buttonUrl: '#plans',
    gradientTheme: 'blue-indigo',
  },

  // Login Slides
  loginSlides: [
    {
      id: 'slide-1',
      url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1400&auto=format&fit=crop',
      alt: 'Asesora Profesional de Facturación SRI',
      tagline: 'Emisión Rápida & Firma XAdES-BES',
      subtitle: 'Cumplimiento tributario en tiempo real con validación inmediata ante el SRI.',
      active: true,
    },
    {
      id: 'slide-2',
      url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1400&auto=format&fit=crop',
      alt: 'Equipo de Gestión Contable y Comercial',
      tagline: 'Facturas, Notas de Crédito & Proformas',
      subtitle: 'Centraliza todos tus comprobantes electrónicos y cotizaciones comerciales en un solo panel.',
      active: true,
    },
    {
      id: 'slide-3',
      url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1400&auto=format&fit=crop',
      alt: 'Consultor de Negocios y Finanzas',
      tagline: 'Validación en Línea con SRI Ecuador',
      subtitle: 'Comprobantes autorizados de forma segura con respaldo cloud automático.',
      active: true,
    },
    {
      id: 'slide-4',
      url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1400&auto=format&fit=crop',
      alt: 'Punto de Venta y Comercio Digital',
      tagline: 'Catastro RIMPE & Seguridad Tributaria',
      subtitle: 'Adaptado a Negocios Populares, Emprendedores y Régimen General.',
      active: true,
    },
  ],

  // Custom Curated News
  customNews: [
    {
      id: 'news-1',
      title: 'Actualización en el Esquema de Comprobantes Electrónicos Off-line SRI',
      summary: 'El SRI ratifica los lineamientos técnicos oficiales del estándar XAdES-BES 2.1 para la emisión, firma digital y autorización inmediata de facturas electrónicas y notas de crédito.',
      category: 'Facturación Electrónica',
      badgeColor: 'blue',
      date: '14 de Agosto 2026',
      publishedAt: new Date().toISOString(),
      url: 'https://www.sri.gob.ec/web/intersri/noticias7',
      isHighlight: true,
      source: 'Servicio de Rentas Internas (SRI)',
      active: true,
    },
    {
      id: 'news-2',
      title: 'Vigencia de la Tarifa del 15% del IVA en Bienes y Servicios en Ecuador',
      summary: 'Directrices del SRI sobre el desglose tributario, cálculo automático y código de impuesto IVA 15% (código 4) para todos los emisores del territorio ecuatoriano.',
      category: 'Tributario & IVA',
      badgeColor: 'emerald',
      date: '08 de Agosto 2026',
      publishedAt: new Date().toISOString(),
      url: 'https://www.sri.gob.ec/web/intersri/noticias7',
      isHighlight: true,
      source: 'SRI Ecuador',
      active: true,
    },
    {
      id: 'news-3',
      title: 'Nuevo Módulo de Retenciones Electrónicas (Tipo 07)',
      summary: 'Habilitada la emisión automatizada de comprobantes de retención en la fuente de Impuesto a la Renta e IVA con descarga de RIDE en PDF.',
      category: 'Retenciones SRI',
      badgeColor: 'purple',
      date: '02 de Agosto 2026',
      publishedAt: new Date().toISOString(),
      url: 'https://www.sri.gob.ec',
      isHighlight: false,
      source: 'ORIONNX News',
      active: true,
    },
  ],

  // Billing Plans
  billingPlans: [
    {
      id: 'plan-basic',
      name: 'Plan Emprendedor',
      tagline: 'Ideal para personas naturales y pequeños negocios RIMPE.',
      priceMonthly: 9.99,
      priceYearly: 89.99,
      invoiceLimit: 120,
      userLimit: 1,
      features: [
        'Hasta 120 facturas electrónicas / mes',
        'Firma electrónica XAdES-BES',
        'Notas de Crédito y Proformas',
        'RIDE en PDF personalizado con Logo',
        'Catálogo de Clientes y Productos',
        'Soporte por WhatsApp y Correo',
      ],
      isPopular: false,
      isRecommended: false,
      buttonText: 'Contratar Plan',
      active: true,
      colorScheme: 'blue',
      whatsappMessage: 'Hola, deseo contratar el Plan Emprendedor de Facturación SRI ($9.99/mes).',
    },
    {
      id: 'plan-pro',
      name: 'Plan Pyme Pro',
      tagline: 'Para negocios en crecimiento que requieren mayor volumen y control.',
      priceMonthly: 19.99,
      priceYearly: 179.99,
      invoiceLimit: 600,
      userLimit: 3,
      features: [
        'Hasta 600 comprobantes electrónicos / mes',
        'Módulo de Retenciones Electrónicas',
        'Hasta 3 Usuarios con roles y permisos',
        'Envío automático de PDF y XML por correo',
        'Historial con exportación a Excel / CSV',
        'Soporte prioritario por WhatsApp',
      ],
      isPopular: true,
      isRecommended: false,
      badge: 'MÁS POPULAR',
      buttonText: 'Contratar Plan Pro',
      active: true,
      colorScheme: 'indigo',
      whatsappMessage: 'Hola, deseo contratar el Plan Pyme Pro de Facturación SRI ($19.99/mes).',
    },
    {
      id: 'plan-enterprise',
      name: 'Plan Ilimitado VIP',
      tagline: 'Máxima potencia para empresas consolidadas y franquicias.',
      priceMonthly: 39.99,
      priceYearly: 359.99,
      invoiceLimit: 0, // Ilimitado
      userLimit: 0, // Ilimitado
      features: [
        'Comprobantes Electrónicos Ilimitados',
        'Usuarios y Puntos de Emisión Ilimitados',
        'Retenciones, Proformas y Notas de Crédito',
        'Integración con Base de Datos Supabase Cloud',
        'Personalización de Marca y Dominio',
        'Soporte Técnico VIP Dedicado 24/7',
      ],
      isPopular: false,
      isRecommended: true,
      badge: 'RECOMENDADO',
      buttonText: 'Contratar Ilimitado',
      active: true,
      colorScheme: 'purple',
      whatsappMessage: 'Hola, deseo contratar el Plan Ilimitado VIP de Facturación SRI ($39.99/mes).',
    },
  ],

  // Social Media & Contact Links
  socialLinks: {
    whatsapp: 'https://wa.me/593995831920?text=Hola%2C%20solicito%20informaci%C3%B3n%20sobre%20el%20sistema%20de%20facturaci%C3%B3n%20SRI',
    facebook: 'https://facebook.com/orionnx',
    instagram: 'https://instagram.com/orionnx.ec',
    tiktok: 'https://tiktok.com/@orionnx_factura',
    youtube: 'https://youtube.com',
    linkedin: 'https://linkedin.com/company/orionnx',
    twitterX: 'https://x.com/orionnx',
    telegram: 'https://t.me/orionnx_sri',
    website: 'https://orionnx.com',
    email: 'contacto@orionnx.com',
    phone: '+593 99 583 1920',
  },

  // Module Visibility Flags
  modules: {
    showSriNewsInLogin: true,
    showPlansInLogin: true,
    showPlansInApp: true,
    showTopAnnouncementBar: true,
    showPromotionalBanner: true,
    showSocialLinksInFooter: true,
    showSocialLinksInLogin: true,
    showSimulatorIndicator: true,
    allowPublicRegistration: false,
  },
};

/**
 * Loads Platform Settings from Supabase with LocalStorage fallback
 */
export async function loadPlatformSettings(): Promise<PlatformCustomizationSettings> {
  // 1. Try local cache first for instant UI response
  let cached: PlatformCustomizationSettings | null = null;
  const localRaw = localStorage.getItem(PLATFORM_SETTINGS_STORAGE_KEY);
  if (localRaw) {
    try {
      cached = JSON.parse(localRaw);
    } catch (e) {
      console.warn('Error reading cached platform settings:', e);
    }
  }

  // 2. Try fetching from Supabase table `platform_settings`
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('id', 'global_platform_settings')
        .single();

      if (!error && data && data.settings_json) {
        const parsed = typeof data.settings_json === 'string' ? JSON.parse(data.settings_json) : data.settings_json;
        const merged: PlatformCustomizationSettings = {
          ...DEFAULT_PLATFORM_SETTINGS,
          ...parsed,
          topBanner: { ...DEFAULT_PLATFORM_SETTINGS.topBanner, ...(parsed.topBanner || {}) },
          promoBanner: { ...DEFAULT_PLATFORM_SETTINGS.promoBanner, ...(parsed.promoBanner || {}) },
          socialLinks: { ...DEFAULT_PLATFORM_SETTINGS.socialLinks, ...(parsed.socialLinks || {}) },
          modules: { ...DEFAULT_PLATFORM_SETTINGS.modules, ...(parsed.modules || {}) },
          loginSlides: parsed.loginSlides && parsed.loginSlides.length > 0 ? parsed.loginSlides : DEFAULT_PLATFORM_SETTINGS.loginSlides,
          billingPlans: parsed.billingPlans && parsed.billingPlans.length > 0 ? parsed.billingPlans : DEFAULT_PLATFORM_SETTINGS.billingPlans,
          customNews: parsed.customNews && parsed.customNews.length > 0 ? parsed.customNews : DEFAULT_PLATFORM_SETTINGS.customNews,
          menuGroups: parsed.menuGroups && parsed.menuGroups.length > 0 ? parsed.menuGroups : DEFAULT_PLATFORM_SETTINGS.menuGroups,
          customMenuItems: parsed.customMenuItems && parsed.customMenuItems.length > 0 ? parsed.customMenuItems : DEFAULT_PLATFORM_SETTINGS.customMenuItems,
          customContainers: parsed.customContainers && parsed.customContainers.length > 0 ? parsed.customContainers : DEFAULT_PLATFORM_SETTINGS.customContainers,
        };
        localStorage.setItem(PLATFORM_SETTINGS_STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
    }
  } catch (err) {
    console.warn('Could not fetch platform settings from Supabase, using local settings:', err);
  }

  if (cached) {
    return {
      ...DEFAULT_PLATFORM_SETTINGS,
      ...cached,
      topBanner: { ...DEFAULT_PLATFORM_SETTINGS.topBanner, ...(cached.topBanner || {}) },
      promoBanner: { ...DEFAULT_PLATFORM_SETTINGS.promoBanner, ...(cached.promoBanner || {}) },
      socialLinks: { ...DEFAULT_PLATFORM_SETTINGS.socialLinks, ...(cached.socialLinks || {}) },
      modules: { ...DEFAULT_PLATFORM_SETTINGS.modules, ...(cached.modules || {}) },
      loginSlides: cached.loginSlides && cached.loginSlides.length > 0 ? cached.loginSlides : DEFAULT_PLATFORM_SETTINGS.loginSlides,
      billingPlans: cached.billingPlans && cached.billingPlans.length > 0 ? cached.billingPlans : DEFAULT_PLATFORM_SETTINGS.billingPlans,
      customNews: cached.customNews && cached.customNews.length > 0 ? cached.customNews : DEFAULT_PLATFORM_SETTINGS.customNews,
      menuGroups: cached.menuGroups && cached.menuGroups.length > 0 ? cached.menuGroups : DEFAULT_PLATFORM_SETTINGS.menuGroups,
      customMenuItems: cached.customMenuItems && cached.customMenuItems.length > 0 ? cached.customMenuItems : DEFAULT_PLATFORM_SETTINGS.customMenuItems,
      customContainers: cached.customContainers && cached.customContainers.length > 0 ? cached.customContainers : DEFAULT_PLATFORM_SETTINGS.customContainers,
    };
  }

  return DEFAULT_PLATFORM_SETTINGS;
}

/**
 * Tenant Menu Settings Storage Key
 */
export function getTenantMenuStorageKey(tenantId: string): string {
  const cleanId = tenantId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `sri_tenant_menu_settings_${cleanId}`;
}

/**
 * Loads menu configuration specific to a tenant/company
 */
export async function loadTenantMenuSettings(
  tenantId?: string,
  baseSettings?: PlatformCustomizationSettings
): Promise<Partial<PlatformCustomizationSettings> | null> {
  if (!tenantId) return null;

  const storageKey = getTenantMenuStorageKey(tenantId);
  const localCached = localStorage.getItem(storageKey);
  let tenantConfig: Partial<PlatformCustomizationSettings> | null = null;

  if (localCached) {
    try {
      tenantConfig = JSON.parse(localCached);
    } catch (e) {
      console.warn('Error parsing local tenant menu settings:', e);
    }
  }

  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('settings_json')
        .eq('id', `tenant_menu_${tenantId}`)
        .single();

      if (!error && data && data.settings_json) {
        tenantConfig = { ...tenantConfig, ...data.settings_json };
        localStorage.setItem(storageKey, JSON.stringify(tenantConfig));
      }
    }
  } catch (err) {
    // Silently fallback to local cached
  }

  return tenantConfig;
}

/**
 * Saves menu configuration specific to a tenant/company
 */
export async function saveTenantMenuSettings(
  tenantId: string,
  menuSettings: {
    menuLayout?: 'topbar-classic' | 'sidebar-left' | 'sidebar-right' | 'compact-dock' | 'floating-island';
    headerStyle?: 'modern-white' | 'glassmorphism' | 'solid-dark' | 'gradient-accent' | 'minimal-transparent' | 'gradient-glass' | 'dark-slate' | 'minimal-clean';
    contentLayoutWidth?: 'contained-sm' | 'contained-lg' | 'full-width' | 'fluid';
    density?: 'compact' | 'comfortable' | 'spacious';
    customMenuItems?: CustomMenuItem[];
    menuGroups?: MenuGroup[];
    primaryColorName?: string;
    customPrimaryHex?: string;
    customNavbarBgHex?: string;
    buttonBorderRadius?: string;
    [key: string]: any;
  },
  userEmail?: string
): Promise<{ success: boolean; message: string }> {
  if (!tenantId) {
    return { success: false, message: 'Identificador de inquilino requerido' };
  }

  const storageKey = getTenantMenuStorageKey(tenantId);
  const payload = {
    ...menuSettings,
    updatedAt: new Date().toISOString(),
    updatedBy: userEmail || tenantId,
  };

  // 1. Save to LocalStorage immediately
  localStorage.setItem(storageKey, JSON.stringify(payload));

  // 2. Persist to Supabase if connected
  try {
    const supabase = getSupabase();
    if (supabase) {
      const record = {
        id: `tenant_menu_${tenantId}`,
        updated_at: payload.updatedAt,
        updated_by: payload.updatedBy,
        settings_json: payload,
      };

      const { error } = await supabase
        .from('platform_settings')
        .upsert(record, { onConflict: 'id' });

      if (error) {
        console.warn('Notice saving tenant platform_settings in Supabase:', error.message);
      }
    }
    return { success: true, message: '¡Menú personalizado guardado para esta empresa exitosamente!' };
  } catch (err: any) {
    console.warn('Error saving tenant settings to Supabase:', err);
    return { success: true, message: 'Menú personalizado guardado localmente para esta empresa.' };
  }
}

/**
 * Saves Platform Settings to Supabase and LocalStorage
 */
export async function savePlatformSettings(
  settings: PlatformCustomizationSettings,
  userEmail?: string
): Promise<{ success: boolean; message: string }> {
  const updatedSettings: PlatformCustomizationSettings = {
    ...settings,
    updatedAt: new Date().toISOString(),
    updatedBy: userEmail || 'SUPERADMIN',
  };

  // 1. Save to LocalStorage immediately
  localStorage.setItem(PLATFORM_SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));

  // 2. Persist to Supabase if connected
  try {
    const supabase = getSupabase();
    if (supabase) {
      const payload = {
        id: 'global_platform_settings',
        updated_at: updatedSettings.updatedAt,
        updated_by: updatedSettings.updatedBy,
        settings_json: updatedSettings,
      };

      const { error } = await supabase
        .from('platform_settings')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        console.warn('Notice saving platform_settings in Supabase:', error.message);
        return {
          success: true,
          message: 'Configuración guardada localmente. (Nota: Para sincronización en la nube, asegúrate de que la tabla `platform_settings` exista en Supabase).',
        };
      }
    }
    return { success: true, message: '¡Configuración de la plataforma guardada y aplicada exitosamente!' };
  } catch (err: any) {
    console.warn('Error saving to Supabase:', err);
    return { success: true, message: 'Configuración guardada localmente con éxito.' };
  }
}
