export default function Header({ onCartClick, cartCount, settings }) {
  const name = settings?.name || 'Vai de Bom'
  const tagline = settings?.tagline || 'Pizzaria — Abreu e Lima, PE'

  return (
    <div>
      {settings?.coverUrl && (
        <div className="w-full h-40 sm:h-56 overflow-hidden">
          <img src={settings.coverUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <header className="sticky top-0 z-30 bg-crust text-paper">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {settings?.logoUrl && (
              <img src={settings.logoUrl} alt={name} className="w-11 h-11 rounded-full object-cover border-2 border-gold flex-shrink-0" />
            )}
            <div>
              <h1 className="text-2xl leading-tight">{name}</h1>
              <p className="text-xs tracking-wide text-gold">{tagline}</p>
            </div>
          </div>
          <button
            onClick={onCartClick}
            className="relative border border-paper/40 rounded-sm px-4 py-2 text-sm hover:border-gold transition-colors flex-shrink-0"
          >
            Carrinho
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-tomato text-paper text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>
    </div>
  )
}
