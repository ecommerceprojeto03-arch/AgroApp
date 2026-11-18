import { useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { formatCurrency } from '../lib/format'
import { confirmCheckout } from '../services/orders'
import type { CheckoutFormData, PaymentMethod } from '../types'

export function Checkout() {
  const { user } = useAuth()
  const {
    groups,
    items,
    subtotal,
    deliveryTotal,
    grandTotal,
    setFulfillment,
    clear,
  } = useCart()
  const navigate = useNavigate()

  const needsAddress = groups.some((g) => g.fulfillment === 'delivery')

  const [form, setForm] = useState<CheckoutFormData>({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    address: user?.address ?? '',
    paymentMethod: 'simulated',
    producerFulfillment: Object.fromEntries(
      groups.map((g) => [g.producerId, g.fulfillment]),
    ),
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const paymentOptions = useMemo(() => {
    const hasDelivery = groups.some((g) => g.fulfillment === 'delivery')
    const hasPickup = groups.some((g) => g.fulfillment === 'pickup')
    const options: { value: PaymentMethod; label: string; hint: string }[] = [
      {
        value: 'simulated',
        label: 'Pagamento simulado',
        hint: 'Registra o pedido como demonstrativo, sem cobrança.',
      },
    ]
    if (hasDelivery) {
      options.unshift({
        value: 'on_delivery',
        label: 'Pagamento na entrega',
        hint: 'Pague ao receber dos produtores com entrega.',
      })
    }
    if (hasPickup) {
      options.unshift({
        value: 'on_pickup',
        label: 'Pagamento na retirada',
        hint: 'Pague ao retirar na propriedade.',
      })
    }
    return options
  }, [groups])

  if (items.length === 0) {
    return <Navigate to="/carrinho" replace />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/checkout' }} />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (needsAddress && form.address.trim().length < 8) {
      setError('Informe o endereço completo para entrega.')
      return
    }

    setSubmitting(true)
    try {
      const producerFulfillment = Object.fromEntries(
        groups.map((g) => [g.producerId, g.fulfillment]),
      )
      const result = await confirmCheckout(
        user!,
        { ...form, producerFulfillment },
        items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          expectedPrice: i.price,
        })),
      )
      clear()
      navigate(`/meus-pedidos?compra=${result.checkout.id}`, {
        state: { justCreated: result },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao confirmar compra')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Checkout demonstrativo</h1>
        <p className="mt-1 text-soil-700">
          Sem cartão de crédito e sem gateway real. Ao confirmar, um pedido
          independente é criado para cada produtor.
        </p>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"
      >
        <div className="space-y-5">
          <section className="rounded-2xl border border-soil-200 bg-white p-5">
            <h2 className="font-display text-lg font-semibold">Dados do consumidor</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium">Nome</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-soil-200 px-3 py-2 outline-none focus:border-leaf-500"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">E-mail</span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl border border-soil-200 px-3 py-2 outline-none focus:border-leaf-500"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Telefone</span>
                <input
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-xl border border-soil-200 px-3 py-2 outline-none focus:border-leaf-500"
                />
              </label>
              {needsAddress && (
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block font-medium">Endereço de entrega</span>
                  <input
                    required
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full rounded-xl border border-soil-200 px-3 py-2 outline-none focus:border-leaf-500"
                    placeholder="Rua, número, bairro, cidade"
                  />
                </label>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-soil-200 bg-white p-5">
            <h2 className="font-display text-lg font-semibold">
              Entrega ou retirada por produtor
            </h2>
            <div className="mt-4 space-y-4">
              {groups.map((group) => (
                <div
                  key={group.producerId}
                  className="rounded-xl border border-soil-100 bg-soil-50/60 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-leaf-700">{group.producerName}</p>
                      <p className="text-sm text-soil-700">
                        Subtotal: {formatCurrency(group.subtotal)}
                        {group.fulfillment === 'delivery'
                          ? ` + entrega ${formatCurrency(group.deliveryFee)}`
                          : ''}
                      </p>
                    </div>
                    <div className="flex rounded-xl border border-soil-200 bg-white p-1 text-sm">
                      <button
                        type="button"
                        onClick={() => setFulfillment(group.producerId, 'pickup')}
                        className={`rounded-lg px-3 py-1.5 font-medium ${
                          group.fulfillment === 'pickup'
                            ? 'bg-leaf-600 text-white'
                            : 'text-soil-700'
                        }`}
                      >
                        Retirada
                      </button>
                      <button
                        type="button"
                        onClick={() => setFulfillment(group.producerId, 'delivery')}
                        className={`rounded-lg px-3 py-1.5 font-medium ${
                          group.fulfillment === 'delivery'
                            ? 'bg-leaf-600 text-white'
                            : 'text-soil-700'
                        }`}
                      >
                        Entrega
                      </button>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-soil-700">
                    {group.items.map((item) => (
                      <li key={item.productId}>
                        {item.name}: {item.quantity} {item.unit} ×{' '}
                        {formatCurrency(item.price)} ={' '}
                        {formatCurrency(item.quantity * item.price)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-soil-200 bg-white p-5">
            <h2 className="font-display text-lg font-semibold">Forma de pagamento</h2>
            <p className="mt-1 text-sm text-soil-700">
              Não solicitamos dados de cartão. Nenhum valor é transferido.
            </p>
            <div className="mt-4 space-y-2">
              {paymentOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${
                    form.paymentMethod === opt.value
                      ? 'border-leaf-600 bg-leaf-500/5'
                      : 'border-soil-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={form.paymentMethod === opt.value}
                    onChange={() =>
                      setForm({ ...form, paymentMethod: opt.value })
                    }
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium">{opt.label}</span>
                    <span className="text-sm text-soil-700">{opt.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-soil-200 bg-white p-5 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-semibold">Resumo</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>Produtos</dt>
              <dd>{formatCurrency(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Entregas</dt>
              <dd>{formatCurrency(deliveryTotal)}</dd>
            </div>
            <div className="flex justify-between border-t border-soil-100 pt-2 font-display text-xl font-bold">
              <dt>Total</dt>
              <dd className="text-leaf-700">{formatCurrency(grandTotal)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-soil-700">
            Serão gerados {groups.length} pedido(s) vinculados a uma compra geral
            (checkoutGroupId).
          </p>
          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full rounded-xl bg-leaf-600 py-3 text-sm font-semibold text-white hover:bg-leaf-700 disabled:opacity-60"
          >
            {submitting ? 'Validando estoque…' : 'Confirmar compra demonstrativa'}
          </button>
          <Link
            to="/carrinho"
            className="mt-2 block text-center text-sm text-soil-700 hover:underline"
          >
            Voltar ao carrinho
          </Link>
        </aside>
      </form>
    </div>
  )
}
