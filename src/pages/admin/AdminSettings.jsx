import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { Link } from 'react-router-dom'
import { db, auth } from '../../firebase.js'
import ImageUploadField from '../../components/ImageUploadField.jsx'

const SETTINGS_DOC = doc(db, 'settings', 'general')

export default function AdminSettings() {
  const [form, setForm] = useState({ coverUrl: '', logoUrl: '', name: '', tagline: '' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(SETTINGS_DOC, (snap) => {
      if (snap.exists()) setForm((f) => ({ ...f, ...snap.data() }))
    })
    return unsub
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    await setDoc(SETTINGS_DOC, form, { merge: true })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-crust text-paper">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex gap-6">
            <Link to="/admin/pedidos" className="text-paper/70 hover:text-paper">Pedidos</Link>
            <Link to="/admin/cardapio" className="text-paper/70 hover:text-paper">Cardápio</Link>
            <Link to="/admin/configuracoes" className="font-semibold">Configurações</Link>
          </div>
          <button onClick={() => signOut(auth)} className="text-paper/70 hover:text-paper text-sm">Sair</button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl mb-6">Aparência da pizzaria</h1>
        <form onSubmit={handleSave} className="space-y-5">
          <ImageUploadField
            label="Banner de capa (topo do site)"
            value={form.coverUrl}
            onChange={(url) => setForm({ ...form, coverUrl: url })}
            folder="settings"
          />
          <ImageUploadField
            label="Logo / foto de perfil"
            value={form.logoUrl}
            onChange={(url) => setForm({ ...form, logoUrl: url })}
            folder="settings"
          />
          <div>
            <label className="text-sm text-crust/70 block mb-1">Nome da pizzaria</label>
            <input className="input-field" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Vai de Bom" />
          </div>
          <div>
            <label className="text-sm text-crust/70 block mb-1">Frase abaixo do nome</label>
            <input className="input-field" value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Pizzaria — Abreu e Lima, PE" />
          </div>
          <button className="btn-primary w-full">{saved ? 'Salvo ✓' : 'Salvar alterações'}</button>
        </form>
      </main>
    </div>
  )
}
