import type { UserRole } from '../types';

export function getUserRole(user: any): UserRole | null {
  if (!user) return null;
  if (user.role === 'citizen' || user.role === 'officer' || user.role === 'admin') {
    return user.role as UserRole;
  }
  if (user.role === 'user') return 'citizen';
  if (user.role === 'official') return 'officer';
  return null;
}

export function isCitizen(user: any): boolean {
  return getUserRole(user) === 'citizen';
}

export function isOfficer(user: any): boolean {
  return getUserRole(user) === 'officer';
}

export function isAdmin(user: any): boolean {
  return getUserRole(user) === 'admin';
}

export function isOfficerOrAdmin(user: any): boolean {
  const role = getUserRole(user);
  return role === 'officer' || role === 'admin';
}

export interface NavItem {
  name: string;
  path: string;
  roles: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { name: 'Home', path: '/', roles: ['citizen', 'officer', 'admin'] },
  { name: 'Report', path: '/report', roles: ['citizen'] },
  { name: 'Dashboard', path: '/dashboard', roles: ['citizen', 'officer', 'admin'] },
  { name: 'Map', path: '/map', roles: ['citizen', 'officer', 'admin'] },
  { name: 'Hotspots', path: '/hotspots', roles: ['citizen', 'officer', 'admin'] },
  { name: 'Alerts', path: '/alerts', roles: ['officer', 'admin'] },
  { name: 'Prediction', path: '/prediction', roles: ['officer', 'admin'] },
  { name: 'Analytics', path: '/analytics', roles: ['admin'] },
  { name: 'Users', path: '/users', roles: ['admin'] },
  { name: 'Settings', path: '/settings', roles: ['admin'] },
  { name: 'Logs', path: '/logs', roles: ['admin'] },
  { name: 'About', path: '/about', roles: ['citizen', 'officer', 'admin'] },
  { name: 'Profile', path: '/profile', roles: ['citizen', 'officer', 'admin'] },
];

export function getNavItemsForRole(user: any): NavItem[] {
  const role = getUserRole(user);
  if (!role) {
    return NAV_ITEMS.filter(item =>
      item.path === '/' || item.path === '/report' || item.path === '/dashboard' || item.path === '/map' || item.path === '/hotspots' || item.path === '/about'
    );
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