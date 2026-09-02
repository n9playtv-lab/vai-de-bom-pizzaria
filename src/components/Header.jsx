import { getStoreStatus } from '../utils/storeHours.js'

export default function Header({ onCartClick, cartCount, settings }) {
  const name = settings?.name || 'Vai de Bom Pizzaria'
  const coverUrl = settings?.coverUrl || '/images/cover.webp'
  const logoUrl = settings?.logoUrl || '/images/logo.webp'
  const rating = settings?.rating || '5.0'
  const status = getStoreStatus(settings)

  return (
    <div>
      <div className="relative w-full h-40 sm:h-52 overflow-hidden">
        <img src={coverUrl} alt="" className="w-full h-full object-cover" />
        <div className="absolute top-3 right-3 bg-crust/90 text-paper rounded-full px-3 py-1.5 flex items-center gap-1 text-sm font-semibold">
          <span className="text-gold">★</span> {rating}
        </div>
      </div>

      <div className="bg-paper border-b border-crust/10">
        <div className="max-w-3xl mx-auto px-4 flex flex-col items-center text-center">
          <img
            src={logoUrl}
            alt={name}
            className="w-24 h-24 rounded-full object-cover border-4 border-paper shadow-md -mt-12 relative z-10"
          />

          <h1 className="text-2xl leading-tight text-crust mt-2">{name}</h1>

          <div className="flex items-center gap-2 py-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.open ? 'bg-basil' : 'bg-tomato'}`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${status.open ? 'bg-basil' : 'bg-tomato'}`} />
            </span>
            <span className={`text-sm font-medium ${status.open ? 'text-basil' : 'text-tomato'}`}>
              {status.open ? (status.closeLabel ? `Aberto até ${status.closeLabel}` : 'Aberto agora') : 'Fechado'}
            </span>
          </div>

          {!status.open && (
            <span className="text-xs text-crust/50 border-t border-crust/10 pt-2 pb-1 w-full">Indisponível para pedidos no momento</span>
          )}

          <div className="w-full flex justify-end pb-3 pt-1">
            <button
              onClick={onCartClick}
              className="relative border border-crust/20 rounded-sm px-4 py-2 text-sm text-crust hover:border-tomato transition-colors flex-shrink-0"
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
    </div>
  )
}
