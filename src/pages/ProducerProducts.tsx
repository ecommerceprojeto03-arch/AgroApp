import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { isDemoMode } from '../lib/firebase'
import { formatCurrency } from '../lib/format'
import { listProducerProducts, saveProduct } from '../services/products'
import { seedProducerCatalog } from '../services/seedFirebase'
import type { Product } from '../types'

const emptyForm = {
  name: '',
  description: '',
  price: '',
  unit: 'kg',
  stock: '',
  imageUrl: '',
  active: true,
}

export function ProducerProducts() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)

  async function reload() {
    if (!user) return
    setProducts(await listProducerProducts(user.uid))
  }

  useEffect(() => {
    void (async () => {
      try {
        await reload()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar produtos')
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function handleSeed() {
    if (!user) return
    setSeeding(true)
    setError('')
    setMessage('')
    try {
      const created = await seedProducerCatalog(user)
      setMessage(
        created > 0
          ? `${created} produtos de exemplo cadastrados.`
          : 'Você já possui produtos — seed ignorado.',
      )
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no seed')
    } finally {
      setSeeding(false)
    }
  }

  function startEdit(product: Product) {
    setEditingId(product.id)
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      unit: product.unit,
      stock: String(product.stock),
      imageUrl: product.imageUrl,
      active: product.active,
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setError('')
    setMessage('')

    if (!form.imageUrl.startsWith('https://')) {
      setError('A imagem deve ser um link HTTPS (sem upload).')
      return
    }

    try {
      await saveProduct({
        id: editingId ?? undefined,
        producerId: user.uid,
        producerName: user.farmName || user.name,
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        unit: form.unit.trim(),
        stock: Number(form.stock),
        imageUrl: form.imageUrl.trim(),
        active: form.active,
      })
      setForm(emptyForm)
      setEditingId(null)
      setMessage(editingId ? 'Produto atualizado.' : 'Produto cadastrado.')
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar produto')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Meus produtos</h1>
          <p className="mt-1 text-soil-700">
            Cadastre por link HTTPS — sem Firebase Storage / upload.
          </p>
        </div>
        {!isDemoMode && (
          <button
            type="button"
            disabled={seeding}
            onClick={() => void handleSeed()}
            className="rounded-xl border border-leaf-600 px-4 py-2 text-sm font-semibold text-leaf-700 hover:bg-leaf-500/10 disabled:opacity-60"
          >
            {seeding ? 'Populando…' : 'Popular catálogo demo'}
          </button>
        )}
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="grid gap-3 rounded-2xl border border-soil-200 bg-white p-5 sm:grid-cols-2"
      >
        <h2 className="font-display text-lg font-semibold sm:col-span-2">
          {editingId ? 'Editar produto' : 'Novo produto'}
        </h2>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Nome</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-xl border border-soil-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Unidade</span>
          <input
            required
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            className="w-full rounded-xl border border-soil-200 px-3 py-2"
            placeholder="kg, unidade, bandeja…"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block font-medium">Descrição</span>
          <textarea
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-xl border border-soil-200 px-3 py-2"
            rows={2}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Preço (R$)</span>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full rounded-xl border border-soil-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Estoque</span>
          <input
            required
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className="w-full rounded-xl border border-soil-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block font-medium">URL da imagem (HTTPS)</span>
          <input
            required
            type="url"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            className="w-full rounded-xl border border-soil-200 px-3 py-2"
            placeholder="https://…"
          />
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          Produto ativo na vitrine
        </label>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 sm:col-span-2">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-lg bg-leaf-500/10 px-3 py-2 text-sm text-leaf-700 sm:col-span-2">
            {message}
          </p>
        )}
        <div className="flex gap-2 sm:col-span-2">
          <button
            type="submit"
            className="rounded-xl bg-leaf-600 px-4 py-2 text-sm font-semibold text-white hover:bg-leaf-700"
          >
            {editingId ? 'Salvar' : 'Cadastrar'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null)
                setForm(emptyForm)
              }}
              className="rounded-xl border border-soil-200 px-4 py-2 text-sm"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="text-soil-700">Carregando…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-soil-200 bg-white">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-soil-100 bg-soil-50/80 text-soil-700">
              <tr>
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">Preço</th>
                <th className="px-4 py-3 font-medium">Estoque</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-soil-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.imageUrl}
                        alt=""
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {formatCurrency(p.price)} / {p.unit}
                  </td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3">{p.active ? 'Ativo' : 'Inativo'}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => startEdit(p)}
                      className="text-leaf-700 hover:underline"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-soil-700">
                    Nenhum produto cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
