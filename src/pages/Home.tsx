import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { homePathForRole } from '../lib/roles'
import { useAuth } from '../contexts/AuthContext'
import { listActiveProducts } from '../services/products'
import type { Product } from '../types'

export function Home() {
  const { user, loading: authLoading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user && user.role !== 'consumer') return
    void (async () => {
      try {
        setProducts(await listActiveProducts())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar produtos')
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  if (!authLoading && user && user.role !== 'consumer') {
    return <Navigate to={homePathForRole(user.role)} replace />
  }

  const producers = [...new Set(products.map((p) => p.producerName))]

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-leaf-700 px-6 py-10 text-white sm:px-10 sm:py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1400&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative max-w-xl space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-sun-400">
            Direto do produtor
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-5xl">
            AgroTech
          </h1>
          <p className="text-base text-white/90 sm:text-lg">
            Compre de vários agricultores no mesmo carrinho. E leve a qualidade dos
            produtos orgânicos para dentro de sua casa.
          </p>
        </div>
      </section>

      {loading && <p className="text-soil-700">Carregando vitrine…</p>}
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      {!loading && !error && (
        <>
          <div className="flex flex-wrap gap-2 text-sm text-soil-700">
            <span className="font-medium">{products.length} produtos</span>
            <span>·</span>
            <span>{producers.length} produtores</span>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
