/**
 * Admin Permissions Types
 * Sistema de permisos granulares para administradores
 */

export enum Permission {
  // Gestión de Administradores
  MANAGE_ADMINS = 'manage_admins',
  
  // Moderación de Contenido
  MODERATE_USERS = 'moderate_users',
  MODERATE_LISTINGS = 'moderate_listings',
  VIEW_USER_DETAILS = 'view_user_details',
  SUSPEND_USERS = 'suspend_users',
  DELETE_LISTINGS = 'delete_listings',
  
  // Gestión de Planes
  EDIT_PLANS = 'edit_plans',
  CREATE_PLANS = 'create_plans',
  DELETE_PLANS = 'delete_plans',
  VIEW_SUBSCRIPTIONS = 'view_subscriptions',
  
  // Configuración de Pagos
  MANAGE_CULQI_ACCOUNTS = 'manage_culqi_accounts',
  VIEW_PAYMENT_HISTORY = 'view_payment_history',
  
  // Analíticas
  VIEW_ANALYTICS = 'view_analytics',
  EXPORT_REPORTS = 'export_reports',
}

export interface AdminRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  color: string;
  icon?: string;
}

export interface AdminUser {
  id?: string;
  email: string;
  name?: string;
  role: AdminRole;
  permissions: Permission[]; // Permisos específicos adicionales
  addedDate: string;
  addedBy?: string;
  lastLogin?: string;
  isActive: boolean;
}

// Roles Predefinidos
export const ADMIN_ROLES: Record<string, AdminRole> = {
  SUPER_ADMIN: {
    id: 'super_admin',
    name: 'Super Administrador',
    description: 'Acceso completo al sistema',
    permissions: Object.values(Permission),
    color: 'purple',
    icon: '👑',
  },
  
  MODERATOR: {
    id: 'moderator',
    name: 'Moderador',
    description: 'Gestión de usuarios y publicaciones',
    permissions: [
      Permission.MODERATE_USERS,
      Permission.MODERATE_LISTINGS,
      Permission.VIEW_USER_DETAILS,
      Permission.SUSPEND_USERS,
      Permission.DELETE_LISTINGS,
      Permission.VIEW_ANALYTICS,
    ],
    color: 'blue',
    icon: '🛡️',
  },
  
  PLANS_MANAGER: {
    id: 'plans_manager',
    name: 'Gestor de Planes',
    description: 'Administración de planes y suscripciones',
    permissions: [
      Permission.EDIT_PLANS,
      Permission.CREATE_PLANS,
      Permission.DELETE_PLANS,
      Permission.VIEW_SUBSCRIPTIONS,
      Permission.VIEW_ANALYTICS,
    ],
    color: 'green',
    icon: '💎',
  },
  
  FINANCE_MANAGER: {
    id: 'finance_manager',
    name: 'Gestor Financiero',
    description: 'Gestión de pagos y cuentas Culqi',
    permissions: [
      Permission.MANAGE_CULQI_ACCOUNTS,
      Permission.VIEW_PAYMENT_HISTORY,
      Permission.VIEW_SUBSCRIPTIONS,
      Permission.VIEW_ANALYTICS,
      Permission.EXPORT_REPORTS,
    ],
    color: 'yellow',
    icon: '💰',
  },
  
  VIEWER: {
    id: 'viewer',
    name: 'Observador',
    description: 'Solo lectura de analíticas',
    permissions: [
      Permission.VIEW_ANALYTICS,
      Permission.VIEW_USER_DETAILS,
      Permission.VIEW_SUBSCRIPTIONS,
    ],
    color: 'gray',
    icon: '👁️',
  },
};

// Descripciones de permisos
export const PERMISSION_LABELS: Record<Permission, { label: string; description: string; category: string }> = {
  [Permission.MANAGE_ADMINS]: {
    label: 'Gestionar Administradores',
    description: 'Agregar, editar y eliminar administradores',
    category: 'Administración',
  },
  [Permission.MODERATE_USERS]: {
    label: 'Moderar Usuarios',
    description: 'Revisar y moderar cuentas de usuario',
    category: 'Moderación',
  },
  [Permission.MODERATE_LISTINGS]: {
    label: 'Moderar Publicaciones',
    description: 'Revisar y moderar propiedades publicadas',
    category: 'Moderación',
  },
  [Permission.VIEW_USER_DETAILS]: {
    label: 'Ver Detalles de Usuarios',
    description: 'Acceder a información detallada de usuarios',
    category: 'Moderación',
  },
  [Permission.SUSPEND_USERS]: {
    label: 'Suspender Usuarios',
    description: 'Suspender o desactivar cuentas de usuario',
    category: 'Moderación',
  },
  [Permission.DELETE_LISTINGS]: {
    label: 'Eliminar Publicaciones',
    description: 'Eliminar publicaciones de propiedades',
    category: 'Moderación',
  },
  [Permission.EDIT_PLANS]: {
    label: 'Editar Planes',
    description: 'Modificar planes de suscripción existentes',
    category: 'Planes',
  },
  [Permission.CREATE_PLANS]: {
    label: 'Crear Planes',
    description: 'Crear nuevos planes de suscripción',
    category: 'Planes',
  },
  [Permission.DELETE_PLANS]: {
    label: 'Eliminar Planes',
    description: 'Eliminar planes de suscripción',
    category: 'Planes',
  },
  [Permission.VIEW_SUBSCRIPTIONS]: {
    label: 'Ver Suscripciones',
    description: 'Acceder a información de suscripciones',
    category: 'Planes',
  },
  [Permission.MANAGE_CULQI_ACCOUNTS]: {
    label: 'Gestionar Cuentas Culqi',
    description: 'Configurar cuentas destino de Culqi',
    category: 'Pagos',
  },
  [Permission.VIEW_PAYMENT_HISTORY]: {
    label: 'Ver Historial de Pagos',
    description: 'Acceder al historial de transacciones',
    category: 'Pagos',
  },
  [Permission.VIEW_ANALYTICS]: {
    label: 'Ver Analíticas',
    description: 'Acceder al dashboard de analíticas',
    category: 'Analíticas',
  },
  [Permission.EXPORT_REPORTS]: {
    label: 'Exportar Reportes',
    description: 'Exportar reportes en PDF/Excel',
    category: 'Analíticas',
  },
};

// Helper function para verificar permisos
export function hasPermission(admin: AdminUser, permission: Permission): boolean {
  return admin.permissions.includes(permission);
}

// Helper function para verificar múltiples permisos (requiere todos)
export function hasAllPermissions(admin: AdminUser, permissions: Permission[]): boolean {
  return permissions.every(permission => admin.permissions.includes(permission));
}

// Helper function para verificar al menos un permiso
export function hasAnyPermission(admin: AdminUser, permissions: Permission[]): boolean {
  return permissions.some(permission => admin.permissions.includes(permission));
}
