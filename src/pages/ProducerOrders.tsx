import { useCallback, useEffect, useState } from 'react'
import { StatusBadge } from '../components/StatusBadge'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency, formatDateTime } from '../lib/format'
import { listProducerOrders, updateOrderStatus } from '../services/orders'
import {
  ORDER_STATUS_LABELS,
  PRODUCER_ALLOWED_TRANSITIONS,
  type Order,
  type OrderStatus,
} from '../types'

const PAYMENT_LABELS = {
  on_delivery: 'Pagamento na entrega',
  on_pickup: 'Pagamento na retirada',
  simulated: 'Pagamento simulado',
} as const

export function ProducerOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setOrders(await listProducerOrders(user.uid))
  }, [user])

  useEffect(() => {
    void (async () => {
      try {
        await load()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos')
      } finally {
        setLoading(false)
      }
    })()
  }, [load])

  async function handleStatus(order: Order, status: OrderStatus) {
    if (!user) return
    setUpdatingId(order.id)
    setError('')
    try {
      await updateOrderStatus(order.id, user.uid, status)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar status')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Pedidos recebidos</h1>
        <p className="mt-1 text-soil-700">
          Somente pedidos da sua propriedade ({user?.farmName || user?.name}).
          Atualizar um pedido não afeta os demais produtores da mesma compra.
        </p>
      </div>

      {loading && <p className="text-soil-700">Carregando…</p>}
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      {!loading && orders.length === 0 && (
        <div className="rounded-2xl border border-dashed border-soil-200 bg-white/70 p-8 text-center text-soil-700">
          Nenhum pedido recebido ainda.
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order) => {
          const nextStatuses = PRODUCER_ALLOWED_TRANSITIONS[order.status]
          return (
            <article
              key={order.id}
              className="rounded-2xl border border-soil-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-display text-xl font-semibold">{order.id}</h2>
                  <p className="text-sm text-soil-700">
                    {formatDateTime(order.createdAt)} · Compra {order.checkoutGroupId}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <span className="font-display text-lg font-bold text-leaf-700">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-soil-900">Consumidor</dt>
                  <dd className="text-soil-700">
                    {order.consumerName}
                    <br />
                    {order.consumerPhone} · {order.consumerEmail}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-soil-900">Recebimento</dt>
                  <dd className="text-soil-700">
                    {order.fulfillment === 'delivery' ? 'Entrega' : 'Retirada'}
                    {order.address ? ` · ${order.address}` : ''}
                    <br />
                    {PAYMENT_LABELS[order.paymentMethod]}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[28rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-soil-100 text-soil-700">
                      <th className="py-2 pr-3 font-medium">Produto</th>
                      <th className="py-2 pr-3 font-medium">Qtd.</th>
                      <th className="py-2 pr-3 font-medium">Preço</th>
                      <th className="py-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.productId} className="border-b border-soil-50">
                        <td className="py-2 pr-3">{item.name}</td>
                        <td className="py-2 pr-3">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-2 pr-3">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-2">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {nextStatuses.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="self-center text-sm text-soil-700">Atualizar para:</span>
                  {nextStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={updatingId === order.id}
                      onClick={() => void handleStatus(order, status)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                        status === 'cancelado'
                          ? 'border border-red-200 text-red-700 hover:bg-red-50'
                          : 'bg-leaf-600 text-white hover:bg-leaf-700'
                      } disabled:opacity-60`}
                    >
                      {ORDER_STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
