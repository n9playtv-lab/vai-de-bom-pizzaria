import { useState } from 'react'
import { getStoreStatus } from '../utils/storeHours.js'
import StoreInfoModal from './StoreInfoModal.jsx'

export default function Header({ onCartClick, cartCount, settings }) {
  const [infoOpen, setInfoOpen] = useState(false)
  const name = settings?.name || 'Vai de Bom Pizzaria'
  const coverUrl = settings?.coverUrl || '/images/cover.webp'
  const logoUrl = settings?.logoUrl || '/images/logo.webp'
  const rating = settings?.rating || '5.0'
  const status = getStoreStatus(settings)

  const timeText = status.open
    ? (status.closeLabel ? `Aberto até ${status.closeLabel}` : 'Aberto agora')
    : (status.opensAt ? `Fechado, abrimos ${status.opensLabel} às ${status.opensAt}` : 'Fechado')

  return (
    <div>
      <div className="relative w-full h-40 sm:h-52 overflow-hidden">
        <img src={coverUrl} alt="" className="w-full h-full object-cover" />
        <div className="absolute top-3 right-3 bg-crust/90 text-paper rounded-full px-3 py-1.5 flex items-center gap-1 text-sm font-semibold">
          <span className="text-gold">★</span> {rating}
        </div>
      </div>

      <div className="bg-paper rounded-t-3xl -mt-6 relative z-10 shadow-[0_-4px_16px_rgba(0,0,0,0.1)]">
        <div className="max-w-3xl mx-auto px-4 flex flex-col items-center text-center">
          <img
            src={logoUrl}
            alt={name}
            className="w-24 h-24 rounded-full object-cover border-4 border-paper shadow-md -mt-12 relative z-10"
          />

          <h1 className="text-2xl leading-tight text-crust mt-2 mb-1">{name}</h1>

          <button onClick={() => setInfoOpen(true)} className="w-full flex items-center justify-between py-2.5">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.open ? 'bg-basil' : 'bg-tomato'}`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${status.open ? 'bg-basil' : 'bg-tomato'}`} />
              </span>
              <span className={`text-sm font-medium ${status.open ? 'text-basil' : 'text-tomato'}`}>
                {timeText}
              </span>
            </span>
            <span className="text-crust/30 text-lg">›</span>
          </button>

          <button
            onClick={() => setInfoOpen(true)}
            className="w-full flex items-center justify-between py-2.5 border-t border-crust/10"
          >
            <span className={`text-sm ${status.open ? 'text-basil font-medium' : 'text-crust/60'}`}>
              {status.open ? 'Delivery Disponível' : 'Indisponível para pedidos'}
            </span>
            <span className="text-crust/30 text-lg">›</span>
          </button>

          <div className="w-full flex justify-end pb-3 pt-1 border-t border-crust/10">
            <button
              onClick={onCartClick}
              className="relative border border-crust/20 rounded-sm px-4 py-2 mt-3 text-sm text-crust hover:border-tomato transition-colors flex-shrink-0"
            >
              Carrinho
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-tomato text-paper text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <StoreInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} settings={settings} />
    </div>
  )
}
