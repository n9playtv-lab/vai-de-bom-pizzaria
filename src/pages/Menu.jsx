import { useEffect, useMemo, useRef, useState } from 'react'
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useCart } from '../context/CartContext.jsx'
import { formatCurrency } from '../utils/formatCurrency.js'
import { getStoreStatus } from '../utils/storeHours.js'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import CartDrawer from '../components/CartDrawer.jsx'
import FlavorPickerModal from '../components/FlavorPickerModal.jsx'

export default function Menu() {
  const [products, setProducts] = useState([])
  const [categoryDocs, setCategoryDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [cartOpen, setCartOpen] = useState(false)
  const [settings, setSettings] = useState(null)
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('')
  const [pickerCategory, setPickerCategory] = useState(null)
  const { addItem, totalCount } = useCart()
  const sectionRefs = useRef({})

  useEffect(() => {
    const q = query(collection(db, 'menu'), orderBy('order'))
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('order'))
    const unsub = onSnapshot(q, (snap) => setCategoryDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
    return unsub
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
      if (snap.exists()) setSettings(snap.data())
    })
    return unsub
  }, [])

  const storeStatus = useMemo(() => getStoreStatus(settings), [settings])

  const byCategory = useMemo(() => {
    const term = search.trim().toLowerCase()
    const map = {}
    categoryDocs.forEach((cat) => {
      const items = products.filter((p) =>
        p.available !== false &&
        (p.categoryIds || []).includes(cat.id) &&
        (!term || p.name.toLowerCase().includes(term) || (p.description || '').toLowerCase().includes(term)),
      )
      if (items.length > 0) map[cat.name] = { category: cat, items }
    })
    return map
  }, [products, categoryDocs, search])

  const categories = useMemo(() => Object.keys(byCategory), [byCategory])

  function scrollToCategory(cat) {
    setActiveCategory(cat)
    setCategoryMenuOpen(false)
    sectionRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handlePickerConfirm(cartLine) {
    addItem({ id: `${cartLine.name}-${Date.now()}`, name: cartLine.name, price: cartLine.price }, 1, cartLine.notes)
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Header onCartClick={() => setCartOpen(true)} cartCount={totalCount} settings={settings} />

      <div className="sticky top-0 z-20 bg-paper border-b border-crust/10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex gap-2">
          <div className="relative flex-1">
            <button
              onClick={() => setCategoryMenuOpen((v) => !v)}
              className="w-full flex items-center justify-between text-left text-sm border border-crust/20 rounded-sm px-3 py-2.5 bg-paper text-crust/70"
            >
              <span>{activeCategory || 'Categorias'}</span>
              <span className="text-crust/40 text-xs">{categoryMenuOpen ? '▲' : '▼'}</span>
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
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center border border-crust/20 rounded-sm text-crust/50 text-sm"
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

        {!loading && products.length > 0 && categories.length === 0 && (
          <p className="text-crust/60">Nenhum item encontrado{search ? ` para "${search}"` : ''}.</p>
        )}

        {Object.entries(byCategory).map(([categoryName, { category: catConfig, items: list }]) => {
          const isSpecial = ['pizza', 'calzone'].includes(catConfig?.type) && (catConfig.pizzaCount > 1 || catConfig.allowHalfHalf)

          return (
            <section
              key={categoryName}
              ref={(el) => (sectionRefs.current[categoryName] = el)}
              className="mb-10 scroll-mt-32"
            >
              <h2 className="text-3xl mb-4">{categoryName}</h2>

              {isSpecial ? (
                <SpecialCategoryCard
                  category={catConfig}
                  flavors={list}
                  storeOpen={storeStatus.open}
                  onOpenPicker={() => setPickerCategory(catConfig)}
                />
              ) : (
                <div className="space-y-5">
                  {list.map((product) => (
                    <MenuItem key={product.id} product={product} onAdd={addItem} storeOpen={storeStatus.open} />
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </main>

      <Footer settings={settings} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} storeOpen={storeStatus.open} />

      {pickerCategory && (
        <FlavorPickerModal
          open={!!pickerCategory}
          onClose={() => setPickerCategory(null)}
          category={pickerCategory}
          flavors={byCategory[pickerCategory.name]?.items || []}
          onConfirm={handlePickerConfirm}
        />
      )}
    </div>
  )
}

const DEFAULT_CATEGORY_IMAGES = {
  'Clone de Pizzas': '/images/clone-de-pizzas.jpg',
}

function SpecialCategoryCard({ category, flavors, storeOpen, onOpenPicker }) {
  const isCombo = category.pizzaCount > 1
  const minPrice = flavors.length ? Math.min(...flavors.map((f) => f.price)) : 0
  const imageUrl = category.imageUrl || DEFAULT_CATEGORY_IMAGES[category.name]

  return (
    <button
      onClick={onOpenPicker}
      disabled={!storeOpen}
      className="w-full text-left bg-paper shadow-[0_2px_10px_rgba(43,27,18,0.1)] rounded-sm p-4 flex gap-4 items-center hover:shadow-[0_2px_14px_rgba(43,27,18,0.16)] transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex-1 min-w-0">
        {isCombo ? (
          <>
            {category.comboDescription && <p className="text-crust/60 text-sm mb-2">{category.comboDescription}</p>}
            <p className="text-2xl font-semibold text-tomato">{formatCurrency(category.comboPrice)}</p>
          </>
        ) : (
          <>
            <p className="text-crust/60 text-sm mb-1">
              {category.allowHalfHalf ? 'Pode ser meio a meio — toque para montar' : 'Toque para escolher o sabor'}
            </p>
            <p className="text-xl font-semibold text-tomato">A partir de {formatCurrency(minPrice)}</p>
          </>
        )}
        {!storeOpen && <p className="text-xs text-crust/40 mt-2">Pizzaria fechada no momento</p>}
      </div>
      {imageUrl && (
        <img src={imageUrl} alt={category.name} className="w-24 h-24 object-cover rounded-sm flex-shrink-0" />
      )}
    </button>
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
    <button
      onClick={handleAdd}
      disabled={!storeOpen}
      className="w-full text-left bg-paper shadow-[0_2px_10px_rgba(43,27,18,0.1)] rounded-sm p-4 flex gap-4 items-center hover:shadow-[0_2px_14px_rgba(43,27,18,0.16)] transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex-1 min-w-0">
        <p className="font-semibold">{product.name}</p>
        {product.description && (
          <p className="text-sm text-crust/60 mt-1">{product.description}</p>
        )}
        <p className={`text-lg font-semibold mt-1 ${added ? 'text-basil' : 'text-tomato'}`}>
          {added ? 'Adicionado ✓' : formatCurrency(product.price)}
        </p>
      </div>
      {product.imageUrl && (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-24 h-24 object-cover rounded-sm flex-shrink-0"
        />
      )}
    </button>
  )
}
