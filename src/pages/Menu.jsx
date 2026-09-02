import { useEffect, useMemo, useRef, useState } from 'react'
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useCart } from '../context/CartContext.jsx'
import { formatCurrency } from '../utils/formatCurrency.js'
import { getStoreStatus } from '../utils/storeHours.js'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import CartDrawer from '../components/CartDrawer.jsx'

export default function Menu() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [cartOpen, setCartOpen] = useState(false)
  const [settings, setSettings] = useState(null)
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('')
  const { addItem, totalCount } = useCart()
  const sectionRefs = useRef({})

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

  const storeStatus = useMemo(() => getStoreStatus(settings), [settings])

  const categories = useMemo(() => {
    const set = new Set(products.filter((p) => p.available !== false).map((p) => p.category))
    return [...set]
  }, [products])

  const byCategory = useMemo(() => {
    const term = search.trim().toLowerCase()
    return products
      .filter((p) => p.available !== false)
      .filter((p) => !term || p.name.toLowerCase().includes(term) || (p.description || '').toLowerCase().includes(term))
      .reduce((acc, p) => {
        acc[p.category] = acc[p.category] || []
        acc[p.category].push(p)
        return acc
      }, {})
  }, [products, search])

  function scrollToCategory(cat) {
    setActiveCategory(cat)
    setCategoryMenuOpen(false)
    sectionRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Header onCartClick={() => setCartOpen(true)} cartCount={totalCount} settings={settings} />

      <div className="sticky top-0 z-20 bg-paper border-b border-crust/10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex gap-2">
          <div className="relative flex-1">
            <button
              onClick={() => setCategoryMenuOpen((v) => !v)}
              className="input-field flex items-center justify-between text-left"
            >
              <span>{activeCategory || 'Categorias'}</span>
              <span className="text-crust/40">{categoryMenuOpen ? '▲' : '▼'}</span>
            </button>
            {categoryMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-paper border border-crust/15 rounded-sm shadow-lg z-30 max-h-72 overflow-y-auto">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => scrollToCategory(cat)}
                    className="w-full text-left px-4 py-3 hover:bg-crust/5 border-b border-crust/5 last:border-0"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className="w-12 h-12 flex-shrink-0 flex items-center justify-center border border-crust/25 rounded-sm text-crust/60 hover:border-tomato"
            aria-label="Buscar"
          >
            🔍
          </button>
        </div>
        {searchOpen && (
          <div className="max-w-3xl mx-auto px-4 pb-3">
            <input
              autoFocus
              className="input-field"
              placeholder="Buscar no cardápio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}
      </div>

      <main className="max-w-3xl mx-auto px-4 py-8 flex-1 w-full">
        {loading && <p className="text-crust/60">Carregando cardápio...</p>}

        {!loading && products.length === 0 && (
          <div className="border border-dashed border-crust/30 rounded-sm p-6 text-crust/70">
            Nenhum item no cardápio ainda. Entre no painel admin em <code>/admin</code> para cadastrar as pizzas.
          </div>
        )}

        {!loading && products.length > 0 && Object.keys(byCategory).length === 0 && (
          <p className="text-crust/60">Nenhum item encontrado para "{search}".</p>
        )}

        {Object.entries(byCategory).map(([category, list]) => (
          <section
            key={category}
            ref={(el) => (sectionRefs.current[category] = el)}
            className="mb-10 scroll-mt-32"
          >
            <h2 className="text-3xl mb-4">{category}</h2>
            <div className="space-y-5">
              {list.map((product) => (
                <MenuItem key={product.id} product={product} onAdd={addItem} storeOpen={storeStatus.open} />
              ))}
            </div>
          </section>
        ))}
      </main>

      <Footer settings={settings} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} storeOpen={storeStatus.open} />
    </div>
  )
}

function MenuItem({ product, onAdd, storeOpen }) {
  const [added, setAdded] = useState(false)

  function handleAdd() {
    if (!storeOpen) return
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
          disabled={!storeOpen}
          className="mt-2 text-sm font-medium text-tomato hover:text-tomatodark disabled:text-crust/30 disabled:cursor-not-allowed"
        >
          {!storeOpen ? 'Pizzaria fechada' : added ? 'Adicionado ✓' : '+ Adicionar'}
        </button>
      </div>
    </div>
  )
}
