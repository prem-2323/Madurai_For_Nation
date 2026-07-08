export function getStoredUser(): any | null {
  try {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function getEffectiveUser(user: any): any | null {
  return user ?? getStoredUser();
}

export function getPostLoginPath(user: any): string {
  const role = user?.role;
  if (role === 'officer' || role === 'official') {
    return '/officer/dashboard';
  }
  return '/citizen/report';
}
