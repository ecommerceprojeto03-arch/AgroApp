import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { RolePicker } from '../components/RolePicker'
import { homePathForRole } from '../lib/roles'
import { useAuth } from '../contexts/AuthContext'
import { isDemoMode } from '../lib/firebase'
import { DEMO_ACCOUNTS } from '../lib/demoStore'
import { ProfileIncompleteError } from '../services/auth'
import type { UserRole } from '../types'

export function Login() {
  const { user, login, completeProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from || '/'

  const [email, setEmail] = useState<string>(
    isDemoMode ? DEMO_ACCOUNTS[0].email : 'ecommerceprojeto03@gmail.com',
  )
  const [password, setPassword] = useState<string>(isDemoMode ? 'demo123' : '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [pending, setPending] = useState<{ uid: string; email: string } | null>(
    null,
  )
  const [role, setRole] = useState<UserRole>('consumer')
  const [name, setName] = useState('')
  const [farmName, setFarmName] = useState('')
  const [phone, setPhone] = useState('')

  if (user) {
    return <Navigate to={homePathForRole(user.role)} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const profile = await login(email, password)
      navigate(from !== '/' ? from : homePathForRole(profile.role), {
        replace: true,
      })
    } catch (err) {
      if (err instanceof ProfileIncompleteError) {
        setPending({ uid: err.uid, email: err.email })
        setError('')
      } else {
        const message =
          err instanceof Error ? mapFirebaseError(err.message) : 'Falha no login'
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleCompleteProfile(e: FormEvent) {
    e.preventDefault()
    if (!pending) return
    setError('')
    setLoading(true)
    try {
      await completeProfile({
        uid: pending.uid,
        email: pending.email,
        name,
        role,
        phone,
        farmName,
      })
      navigate(homePathForRole(role), { replace: true })
    } catch (err) {
      setError(
        err instanceof Error
          ? mapFirebaseError(err.message)
          : 'Falha ao salvar perfil',
      )
    } finally {
      setLoading(false)
    }
  }

  if (pending) {
    return (
      <div className="mx-auto max-w-md space-y-6">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold">Finalizar cadastro</h1>
          <p className="mt-1 text-soil-700">
            Conta Auth em <strong>{pending.email}</strong> ainda sem perfil.
            Escolha o tipo <strong>uma vez</strong> — depois não poderá alterar.
          </p>
        </div>

        <form
          onSubmit={(e) => void handleCompleteProfile(e)}
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
            <span className="mb-1 block font-medium">Telefone</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-soil-200 px-3 py-2 outline-none focus:border-leaf-500"
            />
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-leaf-600 py-2.5 text-sm font-semibold text-white hover:bg-leaf-700 disabled:opacity-60"
          >
            {loading ? 'Salvando…' : 'Salvar perfil e continuar'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold">Entrar</h1>
        <p className="mt-1 text-soil-700">
          {isDemoMode
            ? 'Acesse como consumidor ou produtor.'
            : 'Firebase Authentication (e-mail e senha).'}
        </p>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4 rounded-2xl border border-soil-200 bg-white p-6 shadow-sm"
      >
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
          <span className="mb-1 block font-medium">Senha</span>
          <input
            type="password"
            required
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
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      {!isDemoMode && (
        <div className="rounded-2xl border border-leaf-500/30 bg-leaf-500/5 p-4 text-sm text-soil-700">
          <p className="font-semibold text-soil-900">Conta Firebase</p>
          <p className="mt-1">
            Use <code className="text-xs">ecommerceprojeto03@gmail.com</code> e a
            senha definida no Authentication. No primeiro acesso, complete o perfil
            (consumidor ou produtor).
          </p>
        </div>
      )}

      {isDemoMode && (
        <div className="rounded-2xl border border-sun-400/40 bg-sun-400/10 p-4 text-sm">
          <p className="font-semibold text-soil-900">Contas demonstrativas</p>
          <ul className="mt-2 space-y-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <li key={acc.email}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(acc.email)
                    setPassword(acc.password)
                  }}
                  className="w-full rounded-lg border border-soil-200 bg-white px-3 py-2 text-left hover:border-leaf-500"
                >
                  <span className="font-medium">{acc.label}</span>
                  <span className="mt-0.5 block text-xs text-soil-700">
                    {acc.email} / {acc.password}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-center text-sm text-soil-700">
        Não tem conta?{' '}
        <Link to="/cadastro" className="font-medium text-leaf-700 hover:underline">
          Cadastre-se
        </Link>
      </p>
    </div>
  )
}

function mapFirebaseError(message: string): string {
  if (
    message.includes('auth/invalid-credential') ||
    message.includes('auth/wrong-password') ||
    message.includes('INVALID_LOGIN_CREDENTIALS') ||
    message.includes('invalid-credential')
  ) {
    return 'E-mail ou senha incorretos. No Console do Firebase → Authentication → Usuários, redefina a senha ou exclua e recrie o usuário.'
  }
  if (message.includes('auth/user-not-found')) {
    return 'Usuário não encontrado.'
  }
  if (message.includes('auth/too-many-requests')) {
    return 'Muitas tentativas. Aguarde e tente novamente.'
  }
  if (message.includes('permission-denied') || message.includes('Missing or insufficient permissions')) {
    return 'Permissão negada no Firestore. Publique as regras em firestore.rules.'
  }
  return message
}
