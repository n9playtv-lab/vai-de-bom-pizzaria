import { useEffect, useState } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { Link } from 'react-router-dom'
import { db, auth } from '../../firebase.js'
import { formatCurrency } from '../../utils/formatCurrency.js'
import ImageUploadField from '../../components/ImageUploadField.jsx'

const EMPTY_CATEGORY = { name: '', type: 'pizza', pizzaCount: 1, allowHalfHalf: false, comboPrice: '', comboDescription: '', order: 0 }
const EMPTY_ITEM = { name: '', description: '', price: '', category: '', imageUrl: '', available: true, order: 0 }

export default function AdminMenuEditor() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [catForm, setCatForm] = useState(EMPTY_CATEGORY)
  const [editingCatId, setEditingCatId] = useState(null)
  const [itemForm, setItemForm] = useState(EMPTY_ITEM)
  const [editingItemId, setEditingItemId] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('order'))
    const unsub = onSnapshot(q, (snap) => setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
    return unsub
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'menu'), orderBy('category'), orderBy('order'))
    const unsub = onSnapshot(q, (snap) => setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
    return unsub
  }, [])

  // ---------- Categorias ----------
  async function handleCatSubmit(e) {
    e.preventDefault()
    const payload = {
      name: catForm.name,
      type: catForm.type,
      order: Number(catForm.order) || 0,
      pizzaCount: catForm.type === 'pizza' ? Math.max(1, Number(catForm.pizzaCount) || 1) : 1,
      allowHalfHalf: catForm.type === 'pizza' ? !!catForm.allowHalfHalf : false,
      comboPrice: 0,
      comboDescription: '',
    }
    if (catForm.type === 'pizza' && payload.pizzaCount > 1) {
      payload.comboPrice = parseFloat(String(catForm.comboPrice).replace(',', '.')) || 0
      payload.comboDescription = catForm.comboDescription || ''
    }
    if (editingCatId) {
      await updateDoc(doc(db, 'categories', editingCatId), payload)
    } else {
      await addDoc(collection(db, 'categories'), payload)
    }
    setCatForm(EMPTY_CATEGORY)
    setEditingCatId(null)
  }

  function startEditCat(cat) {
    setEditingCatId(cat.id)
    setCatForm({ ...EMPTY_CATEGORY, ...cat })
  }

  async function removeCat(cat) {
    const hasItems = products.some((p) => p.category === cat.name)
    if (hasItems) {
      alert('Essa categoria ainda tem itens cadastrados. Exclua ou mude os itens dela primeiro.')
      return
    }
    if (confirm(`Remover a categoria "${cat.name}"?`)) await deleteDoc(doc(db, 'categories', cat.id))
  }

  // ---------- Itens / sabores ----------
  async function handleItemSubmit(e) {
    e.preventDefault()
    const payload = { ...itemForm, price: parseFloat(String(itemForm.price).replace(',', '.')) || 0, order: Number(itemForm.order) || 0 }
    if (editingItemId) {
      await updateDoc(doc(db, 'menu', editingItemId), payload)
    } else {
      await addDoc(collection(db, 'menu'), payload)
    }
    setItemForm(EMPTY_ITEM)
    setEditingItemId(null)
  }

  function startEditItem(product) {
    setEditingItemId(product.id)
    setItemForm({ ...EMPTY_ITEM, ...product })
  }

  async function toggleAvailable(product) {
    await updateDoc(doc(db, 'menu', product.id), { available: !(product.available !== false) })
  }

  async function removeItem(id) {
    if (confirm('Remover este item do cardápio?')) await deleteDoc(doc(db, 'menu', id))
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-crust text-paper">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex gap-6">
            <Link to="/admin/pedidos" className="text-paper/70 hover:text-paper">Pedidos</Link>
            <Link to="/admin/cardapio" className="font-semibold">Cardápio</Link>
            <Link to="/admin/configuracoes" className="text-paper/70 hover:text-paper">Configurações</Link>
          </div>
          <button onClick={() => signOut(auth)} className="text-paper/70 hover:text-paper text-sm">Sair</button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">

        {/* CRIAR CATEGORIA */}
        <form onSubmit={handleCatSubmit} className="border border-crust/10 rounded-sm p-5 mb-6 space-y-3">
          <h2 className="text-xl mb-2">{editingCatId ? 'Editar categoria' : 'Criar categoria'}</h2>

          <input className="input-field" placeholder="Nome da categoria (ex: Pizzas G, Clone de Pizza, Bebidas)"
            value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} required />

          <div>
            <label className="text-sm text-crust/70 block mb-1">Tipo</label>
            <div className="flex gap-2">
              {[['pizza', 'Pizza'], ['bebida', 'Bebida']].map(([value, label]) => (
                <label key={value} className={`flex-1 text-center border rounded-sm px-3 py-2 cursor-pointer text-sm ${catForm.type === value ? 'border-tomato bg-tomato/5' : 'border-crust/20'}`}>
                  <input type="radio" className="hidden" checked={catForm.type === value}
                    onChange={() => setCatForm({ ...catForm, type: value })} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {catForm.type === 'pizza' && (
            <>
              <div>
                <label className="text-sm text-crust/70 block mb-1">Quantas pizzas por pedido nessa categoria?</label>
                <input type="number" min="1" className="input-field" value={catForm.pizzaCount}
                  onChange={(e) => setCatForm({ ...catForm, pizzaCount: e.target.value })} />
                <p className="text-xs text-crust/40 mt-1">Ex: categoria normal = 1. "Clone de pizza" (duas pizzas por pedido) = 2.</p>
              </div>

              <div>
                <label className="text-sm text-crust/70 block mb-1">Permitir pizza meio a meio (até 2 sabores por pizza)?</label>
                <div className="flex gap-2">
                  {[[true, 'Sim'], [false, 'Não']].map(([value, label]) => (
                    <label key={label} className={`flex-1 text-center border rounded-sm px-3 py-2 cursor-pointer text-sm ${catForm.allowHalfHalf === value ? 'border-tomato bg-tomato/5' : 'border-crust/20'}`}>
                      <input type="radio" className="hidden" checked={catForm.allowHalfHalf === value}
                        onChange={() => setCatForm({ ...catForm, allowHalfHalf: value })} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {Number(catForm.pizzaCount) > 1 && (
                <div className="border-t border-crust/10 pt-3 space-y-3">
                  <p className="text-sm text-crust/60">Como são {catForm.pizzaCount} pizzas por pedido, essa categoria aparece no cardápio como um combo com preço fixo (o cliente só escolhe os sabores).</p>
                  <input className="input-field" placeholder="Preço do combo (ex: 59,90)" value={catForm.comboPrice}
                    onChange={(e) => setCatForm({ ...catForm, comboPrice: e.target.value })} required />
                  <input className="input-field" placeholder="Descrição do combo (ex: Escolha duas pizzas por 59,90)" value={catForm.comboDescription}
                    onChange={(e) => setCatForm({ ...catForm, comboDescription: e.target.value })} />
                </div>
              )}
            </>
          )}

          <div className="flex gap-3">
            <button type="submit" className="btn-primary">{editingCatId ? 'Salvar categoria' : 'Criar categoria'}</button>
            {editingCatId && (
              <button type="button" className="btn-outline" onClick={() => { setEditingCatId(null); setCatForm(EMPTY_CATEGORY) }}>
                Cancelar
              </button>
            )}
          </div>
        </form>

        {categories.length > 0 && (
          <div className="mb-8 space-y-2">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between border border-crust/10 rounded-sm px-4 py-3 text-sm">
                <div>
                  <span className="font-medium">{cat.name}</span>
                  <span className="text-crust/40"> · {cat.type === 'pizza' ? `Pizza · ${cat.pizzaCount}x` : 'Bebida'}{cat.allowHalfHalf ? ' · meio a meio' : ''}</span>
                </div>
                <div className="flex gap-3">
                  <button className="text-crust/60 hover:text-crust" onClick={() => startEditCat(cat)}>Editar</button>
                  <button className="text-tomato" onClick={() => removeCat(cat)}>Excluir</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* NOVO ITEM / SABOR */}
        <form onSubmit={handleItemSubmit} className="border border-crust/10 rounded-sm p-5 mb-8 space-y-3">
          <h2 className="text-xl mb-2">{editingItemId ? 'Editar item' : 'Novo item / sabor'}</h2>

          <select className="input-field" value={itemForm.category} required
            onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}>
            <option value="">Selecione a categoria...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>

          <input className="input-field" placeholder="Nome (ex: Pizza de Mussarela)" value={itemForm.name}
            onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} required />
          <input className="input-field" placeholder="Descrição (ingredientes)" value={itemForm.description}
            onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} />
          <input className="input-field" placeholder="Preço (ex: 39,90)" value={itemForm.price}
            onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} required />
          <ImageUploadField
            label="Foto do item (opcional)"
            value={itemForm.imageUrl}
            onChange={(url) => setItemForm({ ...itemForm, imageUrl: url })}
            folder="menu"
          />

          <div className="flex gap-3">
            <button type="submit" className="btn-primary">{editingItemId ? 'Salvar alterações' : 'Adicionar ao cardápio'}</button>
            {editingItemId && (
              <button type="button" className="btn-outline" onClick={() => { setEditingItemId(null); setItemForm(EMPTY_ITEM) }}>
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="flex items-center justify-between border border-crust/10 rounded-sm px-4 py-3">
              <div>
                <p className="font-medium">{p.name} <span className="text-crust/40 text-sm">· {p.category}</span></p>
                <p className="text-sm text-crust/60">{formatCurrency(p.price)}</p>
              </div>
              <div className="flex gap-2 text-sm">
                <button className="text-crust/60 hover:text-crust" onClick={() => toggleAvailable(p)}>
                  {p.available !== false ? 'Pausar' : 'Reativar'}
                </button>
                <button className="text-crust/60 hover:text-crust" onClick={() => startEditItem(p)}>Editar</button>
                <button className="text-tomato" onClick={() => removeItem(p.id)}>Excluir</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
