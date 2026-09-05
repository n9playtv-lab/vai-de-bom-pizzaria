import { useState } from 'react'
import { WEEKDAYS } from '../utils/storeHours.js'
import { formatCurrency } from '../utils/formatCurrency.js'

const TABS = ['Sobre', 'Horário', 'Pagamento', 'Entrega']

export default function StoreInfoModal({ open, onClose, settings }) {
  const [tab, setTab] = useState('Sobre')
  if (!open) return null

  const name = settings?.name || 'Vai de Bom Pizzaria'
  const logoUrl = settings?.logoUrl || '/images/logo.webp'
  const phone = settings?.phone || ''
  const instagram = settings?.instagram || ''
  const address = settings?.address || ''
  const pixKey = settings?.pixKey || ''
  const deliveryAreas = Array.isArray(settings?.deliveryAreas) ? settings.deliveryAreas : []
  const freeDeliveryEnabled = !!settings?.freeDeliveryEnabled

  return (
    <div className="fixed inset-0 z-50 bg-paper flex flex-col">
      <div className="px-5 py-4 border-b border-crust/10 flex items-center justify-between flex-shrink-0">
        <h2 className="text-xl">{name}</h2>
        <button onClick={onClose} className="text-crust/50 hover:text-crust text-xl leading-none">✕</button>
      </div>

      <div className="flex border-b border-crust/10 flex-shrink-0 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${tab === t ? 'text-tomato border-b-2 border-tomato' : 'text-crust/50'}`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="overflow-y-auto p-5 flex-1 max-w-3xl mx-auto w-full">
        {tab === 'Sobre' && <SobreTab logoUrl={logoUrl} phone={phone} instagram={instagram} address={address} />}
        {tab === 'Horário' && <HorarioTab hours={settings?.hours} />}
        {tab === 'Pagamento' && <PagamentoTab pixKey={pixKey} />}
        {tab === 'Entrega' && <EntregaTab areas={deliveryAreas} freeDeliveryEnabled={freeDeliveryEnabled} />}
      </div>
    </div>
  )
}

function SobreTab({ logoUrl, phone, instagram, address }) {
  const digits = (phone || '').replace(/\D/g, '')
  const waNumber = digits.startsWith('55') ? digits : `55${digits}`

  return (
    <div className="space-y-5">
      <div className="flex gap-4 items-start">
        <img src={logoUrl} alt="" className="w-16 h-16 rounded-sm object-cover flex-shrink-0" />
        <div className="text-sm space-y-1">
          {phone && <p className="font-semibold">{phone}</p>}
          {instagram && (
            <p className="text-crust/70">📷 @{instagram.replace('@', '')}</p>
          )}
        </div>
      </div>

      {phone && (
        <div>
          <h3 className="font-semibold mb-2">Contato</h3>
          <div className="flex flex-col gap-2">
            <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="btn-outline text-center">
              WhatsApp: {phone}
            </a>
            <a href={`tel:${digits}`} className="btn-outline text-center">
              Ligar: {phone}
            </a>
          </div>
        </div>
      )}

      {address && (
        <div>
          <h3 className="font-semibold mb-1">Endereço</h3>
          <p className="text-sm text-crust/70">{address}</p>
        </div>
      )}

      <div>
        <h3 className="font-semibold mb-1">Categoria</h3>
        <p className="text-sm text-crust/70">Pizza</p>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Entrega e retirada</h3>
        <span className="inline-block border border-crust/20 rounded-sm px-4 py-2 text-sm">🛵 Entrega</span>
      </div>
    </div>
  )
}

function HorarioTab({ hours }) {
  const list = hours || []
  return (
    <div className="divide-y divide-crust/10">
      {WEEKDAYS.map((day, i) => {
        const d = list[i]
        return (
          <div key={day} className="flex justify-between py-3 text-sm">
            <span>{day.replace('-feira', '')}</span>
            <span className={d?.closed ? 'text-crust/40' : 'text-crust'}>
              {d?.closed ? 'Fechado' : `${d?.open || '--:--'} às ${d?.close || '--:--'}`}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function PagamentoTab({ pixKey }) {
  const methods = [
    { icon: '💵', label: 'Dinheiro' },
    { icon: '💳', label: 'Cartão de Débito' },
    { icon: '💳', label: 'Cartão de Crédito' },
    { icon: '◈', label: pixKey ? `Pix (chave: ${pixKey})` : 'Pix' },
  ]
  return (
    <div>
      <h3 className="font-semibold mb-3">Forma de pagamento na entrega</h3>
      <div className="grid grid-cols-2 gap-2">
        {methods.map((m) => (
          <div key={m.label} className="bg-crust/5 rounded-sm px-3 py-3 text-sm flex items-center gap-2">
            <span>{m.icon}</span> {m.label}
          </div>
        ))}
      </div>
    </div>
  )
}

function EntregaTab({ areas, freeDeliveryEnabled }) {
  const [search, setSearch] = useState('')
  const filtered = areas.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <h3 className="font-semibold mb-3">🗺️ Áreas onde entregamos</h3>
      {freeDeliveryEnabled && (
        <p className="text-sm text-basil mb-3">🎉 Frete grátis para todos os bairros no momento!</p>
      )}
      <input
        className="input-field mb-4"
        placeholder="Buscar bairro"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {areas.length === 0 && <p className="text-sm text-crust/50">Nenhum bairro cadastrado ainda.</p>}
      <div className="space-y-2">
        {filtered.map((area) => (
          <div key={area.name} className="flex justify-between items-center bg-crust/5 rounded-sm px-4 py-2.5 text-sm">
            <span>{area.name}</span>
            <span className={freeDeliveryEnabled || !area.fee ? 'text-basil font-medium' : 'text-crust/70'}>
              {freeDeliveryEnabled || !area.fee ? 'Grátis' : formatCurrency(area.fee)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
