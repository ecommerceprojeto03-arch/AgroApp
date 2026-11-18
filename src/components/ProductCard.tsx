import { useState } from 'react'
import { useCart } from '../contexts/CartContext'
import { formatCurrency } from '../lib/format'
import type { Product } from '../types'

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  function handleAdd() {
    addItem(product, 1)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1200)
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-soil-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="aspect-[4/3] overflow-hidden bg-soil-100">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-leaf-600">
          {product.producerName}
        </p>
        <h3 className="font-display text-lg font-semibold text-soil-900">{product.name}</h3>
        <p className="line-clamp-2 flex-1 text-sm text-soil-700">{product.description}</p>
        <div className="mt-2 flex items-end justify-between gap-3">
          <div>
            <p className="font-display text-xl font-bold text-leaf-700">
              {formatCurrency(product.price)}
              <span className="text-sm font-sans font-normal text-soil-700">
                {' '}
                / {product.unit}
              </span>
            </p>
            <p className="text-xs text-soil-700">Estoque: {product.stock}</p>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={product.stock <= 0}
            className="rounded-xl bg-leaf-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-leaf-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {added ? 'Adicionado!' : 'Adicionar'}
          </button>
        </div>
      </div>
    </article>
  )
}
