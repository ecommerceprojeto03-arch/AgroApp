import { ROLE_LABELS } from '../lib/roles'
import type { UserRole } from '../types'

export { ROLE_LABELS, homePathForRole, normalizeRole } from '../lib/roles'

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'consumer', label: ROLE_LABELS.consumer },
  { value: 'producer', label: ROLE_LABELS.producer },
  { value: 'admin', label: ROLE_LABELS.admin },
]

export function RolePicker({
  value,
  onChange,
}: {
  value: UserRole
  onChange: (role: UserRole) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl border border-soil-200 p-1 text-sm">
      {ROLES.map((role) => (
        <button
          key={role.value}
          type="button"
          onClick={() => onChange(role.value)}
          className={`rounded-lg py-2 font-medium ${
            value === role.value ? 'bg-leaf-600 text-white' : 'text-soil-700'
          }`}
        >
          {role.label}
        </button>
      ))}
    </div>
  )
}
