export function returnPath(value: string | null) {
  if (value === '/account/reset-password' || (value && /^\/events\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\?track=[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12})?(?:#registration)?$/.test(value))) return value;
  return '/account/dashboard';
}
