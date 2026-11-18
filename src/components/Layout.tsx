import { Link, NavLink, Outlet } from 'react-router-dom'
import { ROLE_LABELS } from '../lib/roles'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap text-sm font-medium transition ${
    isActive ? 'text-leaf-700' : 'text-soil-700 hover:text-leaf-600'
  }`

export function Layout() {
  const { user, logout } = useAuth()
  const { totalItems } = useCart()
  const isConsumer = !user || user.role === 'consumer'
  const isProducer = user?.role === 'producer'
  const isAdmin = user?.role === 'admin'

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-soil-200/80 bg-soil-50/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            to={
              isProducer
                ? '/produtor/produtos'
                : isAdmin
                  ? '/admin'
                  : '/'
            }
            className="font-display text-xl font-bold tracking-tight text-leaf-700 sm:text-2xl"
          >
            AgroTech
          </Link>

          <nav className="hidden items-center gap-5 md:flex">
            {isConsumer && (
              <>
                <NavLink to="/" end className={linkClass}>
                  Vitrine
                </NavLink>
                <NavLink to="/carrinho" className={linkClass}>
                  Carrinho
                  {totalItems > 0 && (
                    <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-leaf-600 px-1.5 text-xs text-white">
                      {totalItems}
                    </span>
                  )}
                </NavLink>
                {user?.role === 'consumer' && (
                  <NavLink to="/meus-pedidos" className={linkClass}>
                    Meus pedidos
                  </NavLink>
                )}
              </>
            )}

            {isProducer && (
              <>
                <NavLink to="/produtor/produtos" className={linkClass}>
                  Meus produtos
                </NavLink>
                <NavLink to="/produtor/pedidos" className={linkClass}>
                  Pedidos recebidos
                </NavLink>
              </>
            )}

            {isAdmin && (
              <NavLink to="/admin" className={linkClass}>
                Painel admin
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {isConsumer && (
              <Link
                to="/carrinho"
                className="relative rounded-lg border border-soil-200 bg-white px-3 py-2 text-sm font-medium text-soil-700 md:hidden"
              >
                Carrinho
                {totalItems > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-leaf-600 px-1 text-xs text-white">
                    {totalItems}
                  </span>
                )}
              </Link>
            )}
            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/conta" className="hidden text-right sm:block">
                  <p className="max-w-[10rem] truncate text-sm font-medium text-soil-900">
                    {user.farmName || user.name}
                  </p>
                  <span className="inline-flex rounded-full bg-leaf-600/15 px-2 py-0.5 text-xs font-semibold text-leaf-700">
                    Papel: {ROLE_LABELS[user.role]}
                  </span>
                </Link>
                <Link
                  to="/conta"
                  className="rounded-lg border border-soil-200 bg-white px-3 py-2 text-sm font-medium text-soil-700 sm:hidden"
                >
                  Conta
                </Link>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="rounded-lg bg-soil-900 px-3 py-2 text-sm font-medium text-white hover:bg-soil-700"
                >
                  Sair
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="rounded-lg bg-leaf-600 px-3 py-2 text-sm font-medium text-white hover:bg-leaf-700"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>

        <nav className="flex gap-4 overflow-x-auto border-t border-soil-200/60 px-4 py-2 md:hidden">
          {isConsumer && (
            <>
              <NavLink to="/" end className={linkClass}>
                Vitrine
              </NavLink>
              {user?.role === 'consumer' && (
                <NavLink to="/meus-pedidos" className={linkClass}>
                  Meus pedidos
                </NavLink>
              )}
            </>
          )}
          {isProducer && (
            <>
              <NavLink to="/produtor/produtos" className={linkClass}>
                Meus produtos
              </NavLink>
              <NavLink to="/produtor/pedidos" className={linkClass}>
                Pedidos recebidos
              </NavLink>
            </>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          )}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-soil-200 bg-white/60 py-6 text-center text-sm text-soil-700">
        AgroTech — conexão direta entre campo e mesa.
      </footer>
    </div>
  )
}
