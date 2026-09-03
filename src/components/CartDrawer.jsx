import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { formatCurrency } from '../utils/formatCurrency.js'

export default function CartDrawer({ open, onClose, storeOpen = true }) {
  const { items, updateQty, subtotal } = useCart()
  const navigate = useNavigate()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-paper flex flex-col">
      <div className="px-5 py-4 border-b border-crust/10 flex items-center justify-between flex-shrink-0">
        <h2 className="text-xl">Seu pedido</h2>
        <button onClick={onClose} className="text-crust/60 hover:text-crust">Fechar</button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 max-w-3xl mx-auto w-full">
        {items.length === 0 && (
          <p className="text-crust/60 text-sm">Seu carrinho está vazio. Escolha uma pizza no cardápio.</p>
        )}
        {items.map((item) => (
          <div key={item.id + item.notes} className="flex justify-between gap-3">
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              {item.notes && <p className="text-xs text-crust/60">{item.notes}</p>}
              <p className="text-sm text-crust/70">{formatCurrency(item.price)}</p>
              <div className="flex items-center gap-2 mt-1">
                <button
                  className="w-7 h-7 border border-crust/20 rounded-sm"
                  onClick={() => updateQty(item.id, item.notes, item.qty - 1)}
                >
                  −
                </button>
                <span className="w-6 text-center">{item.qty}</span>
                <button
                  className="w-7 h-7 border border-crust/20 rounded-sm"
                  onClick={() => updateQty(item.id, item.notes, item.qty + 1)}
                >
                  +
                </button>
              </div>
            </div>
            <p className="font-medium">{formatCurrency(item.price * item.qty)}</p>
          </div>
        ))}
      </div>

      <div className="px-5 py-4 border-t border-crust/10 space-y-3 flex-shrink-0">
        <div className="flex justify-between text-lg max-w-3xl mx-auto w-full">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <button
          disabled={items.length === 0 || !storeOpen}
          onClick={() => { onClose(); navigate('/checkout') }}
          className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {storeOpen ? 'Revisar pedido' : 'Pizzaria fechada no momento'}
        </button>
      </div>
    </div>
  )
}
