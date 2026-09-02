import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase.js'
import { formatCurrency } from '../utils/formatCurrency.js'

const STATUS_INFO = {
  pendente: { label: 'Recebemos seu pedido', desc: 'A pizzaria já foi avisada e vai confirmar em instantes.', color: 'text-gold' },
  aceito: { label: 'Pedido aceito!', desc: 'Sua pizza está sendo preparada.', color: 'text-basil' },
  recusado: { label: 'Pedido não pôde ser aceito', desc: 'Entre em contato com a pizzaria para mais detalhes.', color: 'text-tomato' },
  saiu_entrega: { label: 'Saiu para entrega', desc: 'O entregador está a caminho.', color: 'text-basil' },
  entregue: { label: 'Pedido entregue', desc: 'Bom apetite! 🍕', color: 'text-basil' },
}

export default function OrderStatus() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'orders', orderId), (snap) => {
      if (snap.exists()) setOrder({ id: snap.id, ...snap.data() })
    })
    return unsub
  }, [orderId])

  if (!order) return <div className="p-8 text-center text-crust/60">Carregando pedido...</div>

  const info = STATUS_INFO[order.status] || STATUS_INFO.pendente

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-lg mx-auto px-4 py-10">
        <p className="text-sm text-crust/50 mb-1">Pedido #{order.id.slice(0, 6).toUpperCase()}</p>
        <h1 className={`text-3xl mb-2 ${info.color}`}>{info.label}</h1>
        <p className="text-crust/70 mb-8">{info.desc}</p>

        <div className="border border-crust/10 rounded-sm p-5 mb-6">
          <h2 className="font-semibold mb-3">Itens</h2>
          {order.items.map((item) => (
            <div key={item.id + item.notes} className="flex justify-between text-sm mb-1">
              <span>{item.qty}x {item.name}</span>
              <span>{formatCurrency(item.price * item.qty)}</span>
            </div>
          ))}
          <div className="flex justify-between font-semibold border-t border-crust/10 mt-3 pt-3">
            <span>Total</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
        </div>

        <div className="border border-crust/10 rounded-sm p-5 mb-6 text-sm">
          <p><strong>Entrega:</strong> {order.address.street}, {order.address.number} — {order.address.neighborhood}</p>
          <p><strong>Pagamento:</strong> {order.payment.method === 'dinheiro' ? `Dinheiro (troco para ${formatCurrency(order.payment.changeForValue)})` : order.payment.method}</p>
        </div>

        <Link to="/" className="btn-outline block text-center">Voltar ao cardápio</Link>
      </div>
    </div>
  )
}
