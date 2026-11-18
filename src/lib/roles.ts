import type { UserRole } from '../types'

export const ROLE_LABELS: Record<UserRole, string> = {
  consumer: 'Consumidor',
  producer: 'Produtor',
  admin: 'Admin',
}

export function homePathForRole(role: UserRole): string {
  if (role === 'producer') return '/produtor/produtos'
  if (role === 'admin') return '/admin'
  return '/'
}

export function normalizeRole(value: unknown): UserRole | null {
  const role = String(value ?? '')
    .trim()
    .toLowerCase()
  if (role === 'consumer' || role === 'producer' || role === 'admin') return role
  return null
}
