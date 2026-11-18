import { ORDER_STATUS_LABELS, type OrderStatus } from '../types'

const COLORS: Record<OrderStatus, string> = {
  pendente: 'bg-amber-100 text-amber-900',
  confirmado: 'bg-sky-100 text-sky-900',
  em_preparacao: 'bg-violet-100 text-violet-900',
  pronto_retirada: 'bg-teal-100 text-teal-900',
  em_transporte: 'bg-indigo-100 text-indigo-900',
  entregue: 'bg-leaf-500/20 text-leaf-700',
  cancelado: 'bg-red-100 text-red-800',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${COLORS[status]}`}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  )
}
