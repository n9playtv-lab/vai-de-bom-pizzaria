import { useEffect, useState } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, arrayUnion, arrayRemove } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { Link } from 'react-router-dom'
import { db, auth } from '../../firebase.js'
import { formatCurrency } from '../../utils/formatCurrency.js'
import ImageUploadField from '../../components/ImageUploadField.jsx'

const EMPTY_CATEGORY = { name: '', type: 'pizza', pizzaCount: 1, allowHalfHalf: false, comboPrice: '', comboDescription: '', imageUrl: '', order: 0 }
const EMPTY_ITEM = { name: '', description: '', price: '', imageUrl: '', type: 'pizza', available: true, order: 0 }
const TYPE_LABELS = { pizza: 'Pizza', calzone: 'Calzone', bebida: 'Bebida' }

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
    const q = query(collection(db, 'menu'), orderBy('order'))
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
      imageUrl: catForm.imageUrl || '',
      pizzaCount: ['pizza', 'calzone'].includes(catForm.type) ? Math.max(1, Number(catForm.pizzaCount) || 1) : 1,
      allowHalfHalf: ['pizza', 'calzone'].includes(catForm.type) ? !!catForm.allowHalfHalf : false,
      comboPrice: 0,
      comboDescription: '',
    }
    if (['pizza', 'calzone'].includes(catForm.type) && payload.pizzaCount > 1) {
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
    const hasItems = products.some((p) => (p.categoryIds || []).includes(cat.id))
    if (hasItems) {
      alert('Essa categoria ainda tem sabores vinculados. Desmarque ela nos itens antes de excluir.')
      return
    }
    if (confirm(`Remover a categoria "${cat.name}"?`)) await deleteDoc(doc(db, 'categories', cat.id))
  }

  // ---------- Itens / sabores (biblioteca reutilizavel) ----------
  async function handleItemSubmit(e) {
    e.preventDefault()
    const payload = {
      name: itemForm.name,
      description: itemForm.description,
      price: parseFloat(String(itemForm.price).replace(',', '.')) || 0,
      imageUrl: itemForm.imageUrl,
      type: itemForm.type,
      available: itemForm.available !== false,
      order: Number(itemForm.order) || 0,
    }
    if (editingItemId) {
      await updateDoc(doc(db, 'menu', editingItemId), payload)
    } else {
      // vincula automaticamente a todas as categorias do tipo escolhido
      const categoryIds = categories.filter((c) => c.type === itemForm.type).map((c) => c.id)
      await addDoc(collection(db, 'menu'), { ...payload, categoryIds })
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
    if (confirm('Remover este sabor/item da biblioteca?')) await deleteDoc(doc(db, 'menu', id))
  }

  async function toggleCategoryForItem(product, catId) {
    const has = (product.categoryIds || []).includes(catId)
    await updateDoc(doc(db, 'menu', product.id), {
      categoryIds: has ? arrayRemove(catId) : arrayUnion(catId),
    })
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
          <h2 className="text-xl mb-2">{editingCatId ? 'Editar categoria' : '1. Criar categoria'}</h2>

          <input className="input-field" placeholder="Nome da categoria (ex: Pizzas G, Clone de Pizza, Bebidas)"
            value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} required />

          <ImageUploadField
            label="Imagem da categoria (opcional, aparece no card do cardápio)"
            value={catForm.imageUrl}
            onChange={(url) => setCatForm({ ...catForm, imageUrl: url })}
            folder="categories"
          />

          <div>
            <label className="text-sm text-crust/70 block mb-1">Tipo</label>
            <div className="flex gap-2">
              {[['pizza', 'Pizza'], ['calzone', 'Calzone'], ['bebida', 'Bebida']].map(([value, label]) => (
                <label key={value} className={`flex-1 text-center border rounded-sm px-3 py-2 cursor-pointer text-sm ${catForm.type === value ? 'border-tomato bg-tomato/5' : 'border-crust/20'}`}>
                  <input type="radio" className="hidden" checked={catForm.type === value}
                    onChange={() => setCatForm({ ...catForm, type: value })} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {['pizza', 'calzone'].includes(catForm.type) && (
            <>
              <div>
                <label className="text-sm text-crust/70 block mb-1">
                  Quantos {catForm.type === 'calzone' ? 'calzones' : 'pizzas'} por pedido nessa categoria?
                </label>
                <input type="number" min="1" className="input-field" value={catForm.pizzaCount}
                  onChange={(e) => setCatForm({ ...catForm, pizzaCount: e.target.value })} />
                <p className="text-xs text-crust/40 mt-1">Ex: categoria normal = 1. "Clone de pizza" (duas pizzas por pedido) = 2.</p>
              </div>

              <div>
                <label className="text-sm text-crust/70 block mb-1">
                  Permitir {catForm.type === 'calzone' ? 'calzone' : 'pizza'} meio a meio (até 2 sabores)?
                </label>
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
                  <p className="text-sm text-crust/60">Como são {catForm.pizzaCount} por pedido, essa categoria aparece no cardápio como um combo com preço fixo (o cliente só escolhe os sabores).</p>
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
                  <span className="text-crust/40"> · {['pizza', 'calzone'].includes(cat.type) ? `${TYPE_LABELS[cat.type]} · ${cat.pizzaCount}x` : 'Bebida'}{cat.allowHalfHalf ? ' · meio a meio' : ''}</span>
                </div>
                <div className="flex gap-3">
                  <button className="text-crust/60 hover:text-crust" onClick={() => startEditCat(cat)}>Editar</button>
                  <button className="text-tomato" onClick={() => removeCat(cat)}>Excluir</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CRIAR / EDITAR SABOR (biblioteca reutilizavel) */}
        <form onSubmit={handleItemSubmit} className="border border-crust/10 rounded-sm p-5 mb-8 space-y-3">
          <h2 className="text-xl mb-2">2. {editingItemId ? 'Editar sabor' : 'Criar sabor / item'}</h2>
          <p className="text-sm text-crust/50 -mt-2">Cada sabor é criado uma única vez. Ele já entra automaticamente em todas as categorias do tipo escolhido.</p>

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

          <div>
            <label className="text-sm text-crust/70 block mb-1">Qual categoria se encaixa?</label>
            <div className="flex gap-2">
              {[['pizza', 'Pizza'], ['calzone', 'Calzone'], ['bebida', 'Bebida']].map(([value, label]) => (
                <label key={value} className={`flex-1 text-center border rounded-sm px-3 py-2 cursor-pointer text-sm ${itemForm.type === value ? 'border-tomato bg-tomato/5' : 'border-crust/20'}`}>
                  <input type="radio" className="hidden" checked={itemForm.type === value}
                    onChange={() => setItemForm({ ...itemForm, type: value })} />
                  {label}
                </label>
              ))}
            </div>
            {!editingItemId && (
              <p className="text-xs text-crust/40 mt-1">
                Vai entrar em: {categories.filter((c) => c.type === itemForm.type).map((c) => c.name).join(', ') || 'nenhuma categoria desse tipo ainda'}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-primary">{editingItemId ? 'Salvar alterações' : 'Criar sabor'}</button>
            {editingItemId && (
              <button type="button" className="btn-outline" onClick={() => { setEditingItemId(null); setItemForm(EMPTY_ITEM) }}>
                Cancelar
              </button>
            )}
          </div>
        </form>

        {/* LISTA DE SABORES + VINCULO COM CATEGORIAS */}
        <h2 className="text-xl mb-3">3. Sabores cadastrados</h2>
        {categories.length === 0 && (
          <p className="text-sm text-crust/50 mb-3">Crie uma categoria acima antes de vincular os sabores.</p>
        )}
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className="border border-crust/10 rounded-sm px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium">{p.name} {p.type && <span className="text-crust/40 text-xs font-normal">· {TYPE_LABELS[p.type]}</span>}</p>
                  <p className="text-sm text-crust/60">{formatCurrency(p.price)}</p>
                </div>
                <div className="flex gap-2 text-sm flex-shrink-0">
                  <button className="text-crust/60 hover:text-crust" onClick={() => toggleAvailable(p)}>
                    {p.available !== false ? 'Pausar' : 'Reativar'}
                  </button>
                  <button className="text-crust/60 hover:text-crust" onClick={() => startEditItem(p)}>Editar</button>
                  <button className="text-tomato" onClick={() => removeItem(p.id)}>Excluir</button>
                </div>
              </div>
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {categories.map((cat) => {
                    const active = (p.categoryIds || []).includes(cat.id)
                    return (
                      <button
                        key={cat.id}
                        onClick={() => toggleCategoryForItem(p, cat.id)}
                        className={`text-xs px-3 py-1.5 rounded-full border ${active ? 'bg-tomato text-paper border-tomato' : 'border-crust/20 text-crust/50'}`}
                      >
                        {active ? '✓ ' : '+ '}{cat.name}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
          {products.length === 0 && <p className="text-sm text-crust/40">Nenhum sabor criado ainda.</p>}
        </div>
      </main>
    </div>
  )
}
