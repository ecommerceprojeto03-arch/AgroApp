import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { RolePicker } from '../components/RolePicker'
import { homePathForRole } from '../lib/roles'
import { useAuth } from '../contexts/AuthContext'
import type { UserRole } from '../types'

export function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<UserRole>('consumer')
  const [name, setName] = useState('')
  const [farmName, setFarmName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to={homePathForRole(user.role)} replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register({ email, password, name, role, phone, farmName })
      navigate(homePathForRole(role))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no cadastro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold">Criar conta</h1>
        <p className="mt-1 text-soil-700">
          Escolha o tipo agora — depois do cadastro o papel não muda.
        </p>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4 rounded-2xl border border-soil-200 bg-white p-6 shadow-sm"
      >
        <div>
          <p className="mb-2 text-sm font-medium">Tipo de conta</p>
          <RolePicker value={role} onChange={setRole} />
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

        {role === 'producer' && (
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Nome da propriedade</span>
            <input
              required
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              className="w-full rounded-xl border border-soil-200 px-3 py-2 outline-none focus:border-leaf-500"
            />
          </label>
        )}

        <label className="block text-sm">
          <span className="mb-1 block font-medium">E-mail</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-soil-200 px-3 py-2 outline-none focus:border-leaf-500"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Telefone</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-soil-200 px-3 py-2 outline-none focus:border-leaf-500"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Senha</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-soil-200 px-3 py-2 outline-none focus:border-leaf-500"
          />
        </label>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-leaf-600 py-2.5 text-sm font-semibold text-white hover:bg-leaf-700 disabled:opacity-60"
        >
          {loading ? 'Criando…' : 'Cadastrar'}
        </button>
      </form>

      <p className="text-center text-sm text-soil-700">
        Já tem conta?{' '}
        <Link to="/login" className="font-medium text-leaf-700 hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}
