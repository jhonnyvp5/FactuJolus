import { ActivityLog, PortalUser } from '../types';

export function logActivity(user: PortalUser, action: string, detalles: string) {
  try {
    const logsRaw = localStorage.getItem('sri_portal_activity_logs');
    const logs: ActivityLog[] = logsRaw ? JSON.parse(logsRaw) : [];
    
    const newLog: ActivityLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      usuarioCorreo: user.correo,
      usuarioNombre: user.nombre || user.correo.split('@')[0].toUpperCase(),
      usuarioRol: user.role,
      fecha: new Date().toISOString(),
      accion: action,
      detalles
    };
    
    // Keep last 500 logs to prevent overflow
    const updated = [newLog, ...logs].slice(0, 500);
    localStorage.setItem('sri_portal_activity_logs', JSON.stringify(updated));
  } catch (e) {
    console.error('Error writing activity log', e);
  }
}

export function getLogs(): ActivityLog[] {
  try {
    const logsRaw = localStorage.getItem('sri_portal_activity_logs');
    return logsRaw ? JSON.parse(logsRaw) : [];
  } catch (e) {
    console.error('Error reading activity logs', e);
    return [];
  }
}
