import { Routes, Route } from 'react-router-dom'
import Menu from './pages/Menu.jsx'
import Checkout from './pages/Checkout.jsx'
import OrderStatus from './pages/OrderStatus.jsx'
import AdminLogin from './pages/admin/AdminLogin.jsx'
import AdminOrders from './pages/admin/AdminOrders.jsx'
import AdminMenuEditor from './pages/admin/AdminMenuEditor.jsx'
import RequireAdmin from './components/RequireAdmin.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Menu />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/pedido/:orderId" element={<OrderStatus />} />

      <Route path="/admin" element={<AdminLogin />} />
      <Route
        path="/admin/pedidos"
        element={
          <RequireAdmin>
            <AdminOrders />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/cardapio"
        element={
          <RequireAdmin>
            <AdminMenuEditor />
          </RequireAdmin>
        }
      />
    </Routes>
  )
}
