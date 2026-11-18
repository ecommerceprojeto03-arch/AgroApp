import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ROLE_LABELS } from '../lib/roles'

export function Account() {
  const { user, updateProfile } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [farmName, setFarmName] = useState(user?.farmName ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  if (!user) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      await updateProfile({ name, phone, farmName })
      setMessage('Dados atualizados.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Minha conta</h1>
        <p className="mt-1 text-soil-700">
          Tipo de conta definido no cadastro e não pode ser alterado.
        </p>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4 rounded-2xl border border-soil-200 bg-white p-6 shadow-sm"
      >
        <div className="rounded-xl border border-soil-100 bg-soil-50/80 px-3 py-3 text-sm">
          <p className="text-soil-700">Tipo de conta</p>
          <p className="font-semibold text-leaf-700">{ROLE_LABELS[user.role]}</p>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Nome</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-soil-200 px-3 py-2 outline-none focus:border-leaf-500"
          />
        </label>

        {user.role === 'producer' && (
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Nome da propriedade</span>
            <input
              required
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              className="w-full rounded-xl border border-soil-200 px-3 py-2 outline-none focus:border-leaf-500"
              placeholder="Ex.: Fazenda Boa Esperança"
            />
          </label>
        )}

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Telefone</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-soil-200 px-3 py-2 outline-none focus:border-leaf-500"
          />
        </label>

        <p className="text-xs text-soil-700">E-mail: {user.email}</p>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        )}
        {message && (
          <p className="rounded-lg bg-leaf-500/10 px-3 py-2 text-sm text-leaf-700">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-leaf-600 py-2.5 text-sm font-semibold text-white hover:bg-leaf-700 disabled:opacity-60"
        >
          {loading ? 'Salvando…' : 'Salvar dados'}
        </button>
      </form>
    </div>
  )
}
