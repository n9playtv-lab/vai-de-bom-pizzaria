import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { Link } from 'react-router-dom'
import { db, auth } from '../../firebase.js'
import ImageUploadField from '../../components/ImageUploadField.jsx'
import { WEEKDAYS, defaultHours } from '../../utils/storeHours.js'

const SETTINGS_DOC = doc(db, 'settings', 'general')

const EMPTY = {
  coverUrl: '', logoUrl: '', name: '', tagline: '', rating: '5.0',
  cnpj: '', address: '', phone: '',
  hours: defaultHours(), statusOverride: 'auto',
}

export default function AdminSettings() {
  const [form, setForm] = useState(EMPTY)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(SETTINGS_DOC, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setForm((f) => ({ ...f, ...data, hours: data.hours || defaultHours() }))
      }
    })
    return unsub
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    await setDoc(SETTINGS_DOC, form, { merge: true })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function updateDay(index, patch) {
    const hours = [...form.hours]
    hours[index] = { ...hours[index], ...patch }
    setForm({ ...form, hours })
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
        <form onSubmit={handleSave} className="space-y-8">

          {/* Abrir / fechar manual */}
          <section className="border border-crust/10 rounded-sm p-4">
            <h2 className="font-semibold mb-3">Status da loja</h2>
            <div className="space-y-2">
              {[
                ['auto', 'Automático (segue o horário abaixo)'],
                ['open', 'Forçar ABERTO agora'],
                ['closed', 'Forçar FECHADO agora'],
              ].map(([value, label]) => (
                <label key={value} className={`flex items-center gap-3 border rounded-sm px-4 py-3 cursor-pointer ${form.statusOverride === value ? 'border-tomato bg-tomato/5' : 'border-crust/20'}`}>
                  <input type="radio" name="statusOverride" checked={form.statusOverride === value}
                    onChange={() => setForm({ ...form, statusOverride: value })} />
                  {label}
                </label>
              ))}
            </div>
          </section>

          {/* Horario de funcionamento */}
          <section className="border border-crust/10 rounded-sm p-4">
            <h2 className="font-semibold mb-3">Horário de funcionamento</h2>
            <div className="space-y-3">
              {WEEKDAYS.map((day, i) => (
                <div key={day} className="flex items-center gap-2 text-sm">
                  <span className="w-28 flex-shrink-0">{day}</span>
                  <label className="flex items-center gap-1 flex-shrink-0">
                    <input type="checkbox" checked={!form.hours[i].closed}
                      onChange={(e) => updateDay(i, { closed: !e.target.checked })} />
                    Aberto
                  </label>
                  {!form.hours[i].closed && (
                    <>
                      <input type="time" className="input-field py-1.5 px-2 text-sm" value={form.hours[i].open}
                        onChange={(e) => updateDay(i, { open: e.target.value })} />
                      <span>às</span>
                      <input type="time" className="input-field py-1.5 px-2 text-sm" value={form.hours[i].close}
                        onChange={(e) => updateDay(i, { close: e.target.value })} />
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Imagens */}
          <section className="space-y-4">
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
          </section>

          {/* Dados gerais */}
          <section className="space-y-3">
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
            <div>
              <label className="text-sm text-crust/70 block mb-1">Avaliação (nota exibida na capa)</label>
              <input className="input-field" value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })} placeholder="5.0" />
            </div>
          </section>

          {/* Rodape */}
          <section className="space-y-3">
            <h2 className="font-semibold">Informações do rodapé</h2>
            <input className="input-field" placeholder="CNPJ" value={form.cnpj}
              onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
            <input className="input-field" placeholder="Endereço completo" value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <input className="input-field" placeholder="Telefone" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </section>

          <button className="btn-primary w-full">{saved ? 'Salvo ✓' : 'Salvar alterações'}</button>
        </form>
      </main>
    </div>
  )
}
