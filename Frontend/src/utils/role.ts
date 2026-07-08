import type { UserRole } from '../types';

export function getUserRole(user: any): UserRole | null {
  if (!user) {
    console.log('[ROLE] getUserRole - user is null/undefined');
    return null;
  }
  console.log('[ROLE] getUserRole - user.role value:', user.role);
  if (user.role === 'citizen' || user.role === 'officer') {
    return user.role as UserRole;
  }
  if (user.role === 'user') return 'citizen';
  if (user.role === 'official') return 'officer';
  console.log('[ROLE] getUserRole - unrecognized role:', user.role, 'returning null');
  return null;
}

export function isCitizen(user: any): boolean {
  return getUserRole(user) === 'citizen';
}

export function isOfficer(user: any): boolean {
  return getUserRole(user) === 'officer';
}

export function isOfficerOrAdmin(user: any): boolean {
  return getUserRole(user) === 'officer';
}

export interface NavItem {
  name: string;
  path: string;
  roles: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { name: 'Report Pollution', path: '/citizen/report', roles: ['citizen'] },
  { name: 'My Reports', path: '/citizen/reports', roles: ['citizen'] },
  { name: 'Hotspot Map', path: '/citizen/map', roles: ['citizen'] },
  { name: 'AQI', path: '/citizen/aqi', roles: ['citizen'] },
  { name: 'Profile', path: '/citizen/profile', roles: ['citizen'] },
  { name: 'Dashboard', path: '/officer/dashboard', roles: ['officer'] },
  { name: 'All Reports', path: '/officer/reports', roles: ['officer'] },
  { name: 'Hotspot Intelligence', path: '/officer/hotspots', roles: ['officer'] },
  { name: 'Analytics', path: '/officer/analytics', roles: ['officer'] },
  { name: 'Profile', path: '/officer/profile', roles: ['officer'] },
];

export function getNavItemsForRole(user: any): NavItem[] {
  const role = getUserRole(user);
  console.log('[ROLE] getNavItemsForRole called - user role:', role);
  if (!role) {
    return NAV_ITEMS.filter(item => item.path === '/');
  }
  return NAV_ITEMS.filter(item => item.roles.includes(role));
}

export function canAccessRoute(user: any, path: string): boolean {
  const item = NAV_ITEMS.find(n => n.path === path);
  if (!item) return false;
  const role = getUserRole(user);
  if (!role) return item.roles.includes('citizen');
  return item.roles.includes(role);
}