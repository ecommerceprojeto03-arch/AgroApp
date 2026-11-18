import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { Account } from './pages/Account'
import { Admin } from './pages/Admin'
import { Cart } from './pages/Cart'
import { Checkout } from './pages/Checkout'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { MyOrders } from './pages/MyOrders'
import { ProducerOrders } from './pages/ProducerOrders'
import { ProducerProducts } from './pages/ProducerProducts'
import { Register } from './pages/Register'

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="carrinho" element={<Cart />} />
              <Route path="login" element={<Login />} />
              <Route path="cadastro" element={<Register />} />
              <Route
                path="conta"
                element={
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                }
              />
              <Route
                path="checkout"
                element={
                  <ProtectedRoute role="consumer">
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="meus-pedidos"
                element={
                  <ProtectedRoute role="consumer">
                    <MyOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="produtor/pedidos"
                element={
                  <ProtectedRoute role="producer">
                    <ProducerOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="produtor/produtos"
                element={
                  <ProtectedRoute role="producer">
                    <ProducerProducts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin"
                element={
                  <ProtectedRoute role="admin">
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}
