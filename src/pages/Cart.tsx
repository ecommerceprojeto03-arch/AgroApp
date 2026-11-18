import { Link } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { formatCurrency } from '../lib/format'

export function Cart() {
  const {
    groups,
    items,
    subtotal,
    deliveryTotal,
    grandTotal,
    updateQuantity,
    removeItem,
    setFulfillment,
  } = useCart()

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-2xl border border-dashed border-soil-200 bg-white/70 p-8 text-center">
        <h1 className="font-display text-2xl font-bold">Carrinho vazio</h1>
        <p className="text-soil-700">
          Adicione produtos de diferentes produtores na vitrine.
        </p>
        <Link
          to="/"
          className="inline-flex rounded-xl bg-leaf-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-leaf-700"
        >
          Ir à vitrine
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-soil-900">Carrinho</h1>
        <p className="mt-1 text-soil-700">
          Produtos agrupados por agricultor, com subtotais individuais.
        </p>
      </div>

      <div className="space-y-5">
        {groups.map((group) => (
          <section
            key={group.producerId}
            className="overflow-hidden rounded-2xl border border-soil-200 bg-white shadow-sm"
          >
            <header className="flex flex-col gap-3 border-b border-soil-100 bg-soil-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <h2 className="font-display text-lg font-semibold text-leaf-700">
                  {group.producerName}
                </h2>
                <p className="text-sm text-soil-700">
                  Subtotal: {formatCurrency(group.subtotal)}
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
            </header>

            <ul className="divide-y divide-soil-100">
              {group.items.map((item) => (
                <li
                  key={item.productId}
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-14 w-14 rounded-xl object-cover"
                    />
                    <div>
                      <p className="font-medium text-soil-900">{item.name}</p>
                      <p className="text-sm text-soil-700">
                        {formatCurrency(item.price)} / {item.unit}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="flex items-center rounded-lg border border-soil-200">
                      <button
                        type="button"
                        className="px-3 py-1.5 text-lg leading-none"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                      >
                        −
                      </button>
                      <span className="min-w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="px-3 py-1.5 text-lg leading-none"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                    <p className="min-w-20 text-right font-semibold">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="text-sm text-clay-500 hover:underline"
                    >
                      Remover
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {group.fulfillment === 'delivery' && (
              <p className="border-t border-soil-100 px-4 py-2 text-sm text-soil-700 sm:px-5">
                Taxa de entrega: {formatCurrency(group.deliveryFee)}
              </p>
            )}
          </section>
        ))}
      </div>

      <aside className="sticky bottom-4 rounded-2xl border border-soil-200 bg-white p-5 shadow-lg sm:static">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal produtos</dt>
            <dd>{formatCurrency(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Entregas</dt>
            <dd>{formatCurrency(deliveryTotal)}</dd>
          </div>
          <div className="flex justify-between border-t border-soil-100 pt-2 font-display text-xl font-bold">
            <dt>Total geral</dt>
            <dd className="text-leaf-700">{formatCurrency(grandTotal)}</dd>
          </div>
        </dl>
        <Link
          to="/checkout"
          className="mt-4 flex w-full items-center justify-center rounded-xl bg-leaf-600 py-3 text-sm font-semibold text-white hover:bg-leaf-700"
        >
          Finalizar compra
        </Link>
      </aside>
    </div>
  )
}
