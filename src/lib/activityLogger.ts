import { ActivityLog, PortalUser } from '../types';
import { saveActivityLogToSupabase } from './supabase';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function logActivity(user: PortalUser, action: string, detalles: string) {
  try {
    const logsRaw = localStorage.getItem('sri_portal_activity_logs');
    const logs: ActivityLog[] = logsRaw ? JSON.parse(logsRaw) : [];
    
    const newLog: ActivityLog = {
      id: generateUUID(),
      usuarioCorreo: user.correo,
      usuarioNombre: user.nombre || user.correo.split('@')[0].toUpperCase(),
      usuarioRol: user.role,
      fecha: new Date().toISOString(),
      accion: action,
      detalles,
      empresaRuc: user.empresaRuc || '',
      empresaNombre: user.empresaNombre || ''
    };
    
    // Keep last 500 logs to prevent overflow
    const updated = [newLog, ...logs].slice(0, 500);
    localStorage.setItem('sri_portal_activity_logs', JSON.stringify(updated));

    // Async push to Supabase table 'bitacora_actividades'
    saveActivityLogToSupabase(newLog).catch(err => console.warn('Aviso log Supabase:', err));
  } catch (e) {
    console.error('Error writing activity log', e);
  }
}

export function getLogs(userEmail?: string, userRole?: string, empresaRuc?: string): ActivityLog[] {
  try {
    const logsRaw = localStorage.getItem('sri_portal_activity_logs');
    const allLogs: ActivityLog[] = logsRaw ? JSON.parse(logsRaw) : [];
    
    const isSuperAdmin = userRole?.toUpperCase() === 'SUPERADMIN';
    if (isSuperAdmin) {
      return allLogs;
    }

    return allLogs.filter(log => {
      if (empresaRuc && log.empresaRuc) {
        return log.empresaRuc === empresaRuc;
      }
      if (userEmail) {
        return log.usuarioCorreo === userEmail;
      }
      return true;
    });
  } catch (e) {
    console.error('Error reading activity logs', e);
    return [];
  }
}
