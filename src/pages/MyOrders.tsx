import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { StatusBadge } from '../components/StatusBadge'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency, formatDateTime } from '../lib/format'
import { listConsumerOrders } from '../services/orders'
import type { Order } from '../types'

export function MyOrders() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const highlight = params.get('compra')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    void (async () => {
      try {
        setOrders(await listConsumerOrders(user.uid))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos')
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  const grouped = useMemo(() => {
    const map = new Map<string, Order[]>()
    for (const order of orders) {
      const list = map.get(order.checkoutGroupId) ?? []
      list.push(order)
      map.set(order.checkoutGroupId, list)
    }
    return Array.from(map.entries()).map(([checkoutGroupId, groupOrders]) => ({
      checkoutGroupId,
      orders: groupOrders,
      total: groupOrders.reduce((s, o) => s + o.total, 0),
      createdAt: groupOrders[0]?.createdAt ?? '',
    }))
  }, [orders])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Meus pedidos</h1>
        <p className="mt-1 text-soil-700">
          Compras agrupadas com pedidos individuais por produtor.
        </p>
      </div>

      {highlight && (
        <div className="rounded-xl border border-leaf-500/40 bg-leaf-500/10 px-4 py-3 text-sm text-leaf-700">
          Compra <strong>{highlight}</strong> registrada com sucesso (demonstrativo).
        </div>
      )}

      {loading && <p className="text-soil-700">Carregando…</p>}
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      {!loading && grouped.length === 0 && (
        <div className="rounded-2xl border border-dashed border-soil-200 bg-white/70 p-8 text-center">
          <p className="text-soil-700">Você ainda não possui pedidos.</p>
          <Link
            to="/"
            className="mt-3 inline-flex rounded-xl bg-leaf-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Ir à vitrine
          </Link>
        </div>
      )}

      <div className="space-y-5">
        {grouped.map((group) => (
          <section
            key={group.checkoutGroupId}
            className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
              highlight === group.checkoutGroupId
                ? 'border-leaf-600 ring-2 ring-leaf-500/20'
                : 'border-soil-200'
            }`}
          >
            <header className="flex flex-col gap-1 border-b border-soil-100 bg-soil-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <h2 className="font-display text-lg font-semibold">
                  {group.checkoutGroupId}
                </h2>
                <p className="text-sm text-soil-700">
                  {formatDateTime(group.createdAt)} · {group.orders.length} pedido(s)
                </p>
              </div>
              <p className="font-display text-xl font-bold text-leaf-700">
                {formatCurrency(group.total)}
              </p>
            </header>

            <ul className="divide-y divide-soil-100">
              {group.orders.map((order) => (
                <li key={order.id} className="space-y-3 px-4 py-4 sm:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-soil-900">
                        {order.id} · {order.producerName}
                      </p>
                      <p className="text-sm text-soil-700">
                        {order.fulfillment === 'delivery' ? 'Entrega' : 'Retirada'}
                        {order.deliveryFee > 0
                          ? ` · taxa ${formatCurrency(order.deliveryFee)}`
                          : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={order.status} />
                      <span className="font-semibold">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </div>
                  <ul className="text-sm text-soil-700">
                    {order.items.map((item) => (
                      <li key={item.productId}>
                        {item.name}: {item.quantity} {item.unit} ×{' '}
                        {formatCurrency(item.unitPrice)}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
