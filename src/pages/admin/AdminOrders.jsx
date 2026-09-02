import { useEffect, useRef, useState } from 'react'
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { Link } from 'react-router-dom'
import { db, auth } from '../../firebase.js'
import { formatCurrency } from '../../utils/formatCurrency.js'

const NEXT_STATUS = {
  pendente: [['aceito', 'Aceitar', 'btn-primary'], ['recusado', 'Recusar', 'btn-outline']],
  aceito: [['saiu_entrega', 'Saiu para entrega', 'btn-primary']],
  saiu_entrega: [['entregue', 'Marcar como entregue', 'btn-primary']],
  entregue: [],
  recusado: [],
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const knownIds = useRef(new Set())
  const firstLoad = useRef(true)

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

      if (!firstLoad.current) {
        const newPending = list.find((o) => o.status === 'pendente' && !knownIds.current.has(o.id))
        if (newPending) playNotificationSound()
      }
      list.forEach((o) => knownIds.current.add(o.id))
      firstLoad.current = false

      setOrders(list)
    })
    return unsub
  }, [])

  function playNotificationSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      osc.start()
      osc.stop(ctx.currentTime + 0.4)
    } catch {}
  }

  async function updateStatus(id, status) {
    await updateDoc(doc(db, 'orders', id), { status })
  }

  const pending = orders.filter((o) => o.status === 'pendente')
  const active = orders.filter((o) => ['aceito', 'saiu_entrega'].includes(o.status))
  const done = orders.filter((o) => ['entregue', 'recusado'].includes(o.status))

  return (
    <div className="min-h-screen bg-paper">
      <AdminNav />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Section title="Novos pedidos" orders={pending} onUpdate={updateStatus} highlight />
        <Section title="Em andamento" orders={active} onUpdate={updateStatus} />
        <Section title="Finalizados" orders={done} onUpdate={updateStatus} collapsedByDefault />
      </main>
    </div>
  )
}

function AdminNav() {
  return (
    <header className="bg-crust text-paper">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex gap-6">
          <Link to="/admin/pedidos" className="font-semibold">Pedidos</Link>
          <Link to="/admin/cardapio" className="text-paper/70 hover:text-paper">Cardápio</Link>
        </div>
        <button onClick={() => signOut(auth)} className="text-paper/70 hover:text-paper text-sm">Sair</button>
      </div>
    </header>
  )
}

function Section({ title, orders, onUpdate, highlight, collapsedByDefault }) {
  const [open, setOpen] = useState(!collapsedByDefault)
  return (
    <section className="mb-8">
      <button className="flex items-center gap-2 mb-3" onClick={() => setOpen(!open)}>
        <h2 className="text-xl">{title}</h2>
        <span className="text-crust/40 text-sm">({orders.length})</span>
      </button>
      {open && (
        <div className="space-y-3">
          {orders.length === 0 && <p className="text-crust/40 text-sm">Nada por aqui.</p>}
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onUpdate={onUpdate} highlight={highlight} />
          ))}
        </div>
      )}
    </section>
  )
}

function OrderCard({ order, onUpdate, highlight }) {
  const actions = NEXT_STATUS[order.status] || []
  return (
    <div className={`border rounded-sm p-4 ${highlight ? 'border-tomato bg-tomato/5' : 'border-crust/10'}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-semibold">{order.customer?.name} — {order.customer?.phone}</p>
          <p className="text-sm text-crust/60">{order.address?.street}, {order.address?.number} · {order.address?.neighborhood}</p>
        </div>
        <span className="text-sm font-semibold">{formatCurrency(order.subtotal)}</span>
      </div>
      <ul className="text-sm text-crust/80 mb-2">
        {order.items?.map((item) => (
          <li key={item.id + item.notes}>{item.qty}x {item.name}</li>
        ))}
      </ul>
      <p className="text-sm mb-3">
        Pagamento: <strong>{order.payment?.method}</strong>
        {order.payment?.method === 'dinheiro' && order.payment?.changeForValue &&
          ` — troco para ${formatCurrency(order.payment.changeForValue)} (troco: ${formatCurrency(order.payment.troco)})`}
      </p>
      <div className="flex gap-2">
        {actions.map(([status, label, cls]) => (
          <button key={status} className={`${cls} text-sm px-4 py-2`} onClick={() => onUpdate(order.id, status)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
