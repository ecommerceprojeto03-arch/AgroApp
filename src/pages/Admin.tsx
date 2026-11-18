import { useEffect, useState } from 'react'
import { StatusBadge } from '../components/StatusBadge'
import { formatCurrency, formatDateTime } from '../lib/format'
import { isDemoMode } from '../lib/firebase'
import { listAllProducts } from '../services/products'
import type { Order, Product, UserProfile } from '../types'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'

export function Admin() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const productList = await listAllProducts()
        setProducts(productList)

        if (isDemoMode) {
          // No modo demo, agregamos pedidos via storage local
          const raw = localStorage.getItem('agrotech_orders')
          const allOrders = raw ? (JSON.parse(raw) as Order[]) : []
          setOrders(allOrders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
          const rawUsers = localStorage.getItem('agrotech_users')
          setUsers(rawUsers ? (JSON.parse(rawUsers) as UserProfile[]) : [])
        } else if (db) {
          const [ordersSnap, usersSnap] = await Promise.all([
            getDocs(collection(db, 'orders')),
            getDocs(collection(db, 'users')),
          ])
          setOrders(
            ordersSnap.docs
              .map((d) => ({ id: d.id, ...d.data() }) as Order)
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
          )
          setUsers(usersSnap.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar painel')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const totalSales = orders
    .filter((o) => o.status !== 'cancelado')
    .reduce((s, o) => s + Number(o.total || 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Painel admin</h1>
        <p className="mt-1 text-soil-700">
          Visão geral do MVP: usuários, produtos e pedidos de todos os produtores.
        </p>
      </div>

      {loading && <p className="text-soil-700">Carregando…</p>}
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      {!loading && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Usuários" value={String(users.length)} />
            <Stat label="Produtos" value={String(products.length)} />
            <Stat label="Pedidos / volume" value={`${orders.length} · ${formatCurrency(totalSales)}`} />
          </div>

          <section className="rounded-2xl border border-soil-200 bg-white p-5">
            <h2 className="font-display text-lg font-semibold">Usuários</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead className="border-b border-soil-100 text-soil-700">
                  <tr>
                    <th className="py-2 pr-3 font-medium">Nome</th>
                    <th className="py-2 pr-3 font-medium">E-mail</th>
                    <th className="py-2 font-medium">Papel</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.uid} className="border-b border-soil-50">
                      <td className="py-2 pr-3">{u.name}</td>
                      <td className="py-2 pr-3">{u.email}</td>
                      <td className="py-2 capitalize">{roleLabel(u.role)}</td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-soil-700">
                        Nenhum usuário no Firestore ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-soil-200 bg-white p-5">
            <h2 className="font-display text-lg font-semibold">Pedidos recentes</h2>
            <ul className="mt-3 divide-y divide-soil-100">
              {orders.slice(0, 20).map((order) => (
                <li
                  key={order.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {order.id} · {order.producerName}
                    </p>
                    <p className="text-sm text-soil-700">
                      {order.consumerName} · {formatDateTime(order.createdAt)} ·{' '}
                      {order.checkoutGroupId}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <span className="font-semibold">{formatCurrency(order.total)}</span>
                  </div>
                </li>
              ))}
              {orders.length === 0 && (
                <li className="py-6 text-center text-soil-700">Nenhum pedido ainda.</li>
              )}
            </ul>
          </section>

          <section className="rounded-2xl border border-soil-200 bg-white p-5">
            <h2 className="font-display text-lg font-semibold">Produtos</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {products.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-soil-100 px-3 py-2 text-sm"
                >
                  <span>
                    <span className="font-medium">{p.name}</span>
                    <span className="mt-0.5 block text-xs text-soil-700">
                      {p.producerName} · estoque {p.stock}
                    </span>
                  </span>
                  <span className="font-semibold text-leaf-700">
                    {formatCurrency(p.price)}
                  </span>
                </li>
              ))}
              {products.length === 0 && (
                <li className="text-soil-700 sm:col-span-2">Nenhum produto cadastrado.</li>
              )}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-soil-200 bg-white p-4">
      <p className="text-sm text-soil-700">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-leaf-700">{value}</p>
    </div>
  )
}

function roleLabel(role: string): string {
  if (role === 'consumer') return 'Consumidor'
  if (role === 'producer') return 'Produtor'
  if (role === 'admin') return 'Admin'
  return role
}
