import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useCart } from '../context/CartContext.jsx'
import { formatCurrency } from '../utils/formatCurrency.js'
import Header from '../components/Header.jsx'
import CartDrawer from '../components/CartDrawer.jsx'

export default function Menu() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [cartOpen, setCartOpen] = useState(false)
  const [settings, setSettings] = useState(null)
  const { addItem, totalCount } = useCart()

  useEffect(() => {
    const q = query(collection(db, 'menu'), orderBy('category'), orderBy('order'))
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
      if (snap.exists()) setSettings(snap.data())
    })
    return unsub
  }, [])

  const byCategory = products
    .filter((p) => p.available !== false)
    .reduce((acc, p) => {
      acc[p.category] = acc[p.category] || []
      acc[p.category].push(p)
      return acc
    }, {})

  return (
    <div className="min-h-screen bg-paper">
      <Header onCartClick={() => setCartOpen(true)} cartCount={totalCount} settings={settings} />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {loading && <p className="text-crust/60">Carregando cardápio...</p>}

        {!loading && products.length === 0 && (
          <div className="border border-dashed border-crust/30 rounded-sm p-6 text-crust/70">
            Nenhum item no cardápio ainda. Entre no painel admin em <code>/admin</code> para cadastrar as pizzas.
          </div>
        )}

        {Object.entries(byCategory).map(([category, list]) => (
          <section key={category} className="mb-10">
            <h2 className="text-3xl mb-4">{category}</h2>
            <div className="space-y-5">
              {list.map((product) => (
                <MenuItem key={product.id} product={product} onAdd={addItem} />
              ))}
            </div>
          </section>
        ))}
      </main>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  )
}

function MenuItem({ product, onAdd }) {
  const [added, setAdded] = useState(false)

  function handleAdd() {
    onAdd(product, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  return (
    <div className="flex gap-4">
      {product.imageUrl && (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-20 h-20 object-cover rounded-sm flex-shrink-0"
        />
      )}
      <div className="flex-1">
        <div className="menu-row">
          <span className="font-medium">{product.name}</span>
          <span className="dots" />
          <span>{formatCurrency(product.price)}</span>
        </div>
        {product.description && (
          <p className="text-sm text-crust/60 mt-1">{product.description}</p>
        )}
        <button
          onClick={handleAdd}
          className="mt-2 text-sm font-medium text-tomato hover:text-tomatodark"
        >
          {added ? 'Adicionado ✓' : '+ Adicionar'}
        </button>
      </div>
    </div>
  )
}
