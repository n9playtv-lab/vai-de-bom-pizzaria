import { useEffect, useState } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { Link } from 'react-router-dom'
import { db, auth } from '../../firebase.js'
import { formatCurrency } from '../../utils/formatCurrency.js'
import ImageUploadField from '../../components/ImageUploadField.jsx'

const EMPTY_FORM = { name: '', description: '', price: '', category: '', imageUrl: '', available: true, order: 0 }

export default function AdminMenuEditor() {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'menu'), orderBy('category'), orderBy('order'))
    const unsub = onSnapshot(q, (snap) => setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
    return unsub
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = { ...form, price: parseFloat(String(form.price).replace(',', '.')) || 0, order: Number(form.order) || 0 }
    if (editingId) {
      await updateDoc(doc(db, 'menu', editingId), payload)
    } else {
      await addDoc(collection(db, 'menu'), payload)
    }
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  function startEdit(product) {
    setEditingId(product.id)
    setForm({ ...EMPTY_FORM, ...product })
  }

  async function toggleAvailable(product) {
    await updateDoc(doc(db, 'menu', product.id), { available: !(product.available !== false) })
  }

  async function remove(id) {
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
        <form onSubmit={handleSubmit} className="border border-crust/10 rounded-sm p-5 mb-8 space-y-3">
          <h2 className="text-xl mb-2">{editingId ? 'Editar item' : 'Novo item'}</h2>
          <div className="flex gap-3">
            <input className="input-field" placeholder="Categoria (ex: Pizzas salgadas)" value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })} required />
            <input className="input-field w-24" placeholder="Ordem" type="number" value={form.order}
              onChange={(e) => setForm({ ...form, order: e.target.value })} />
          </div>
          <input className="input-field" placeholder="Nome (ex: Pizza de Mussarela)" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input-field" placeholder="Descrição (ingredientes)" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input className="input-field" placeholder="Preço (ex: 39,90)" value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          <ImageUploadField
            label="Foto do item (opcional)"
            value={form.imageUrl}
            onChange={(url) => setForm({ ...form, imageUrl: url })}
            folder="menu"
          />
          <div className="flex gap-3">
            <button type="submit" className="btn-primary">{editingId ? 'Salvar alterações' : 'Adicionar ao cardápio'}</button>
            {editingId && (
              <button type="button" className="btn-outline" onClick={() => { setEditingId(null); setForm(EMPTY_FORM) }}>
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
                <button className="text-crust/60 hover:text-crust" onClick={() => startEdit(p)}>Editar</button>
                <button className="text-tomato" onClick={() => remove(p.id)}>Excluir</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
