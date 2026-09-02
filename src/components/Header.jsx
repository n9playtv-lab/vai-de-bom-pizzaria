export default function Header({ onCartClick, cartCount, settings }) {
  const name = settings?.name || 'Vai de Bom'
  const tagline = settings?.tagline || 'Pizzaria — Abreu e Lima, PE'
  const coverUrl = settings?.coverUrl || '/images/cover.webp'
  const logoUrl = settings?.logoUrl || '/images/logo.webp'

  return (
    <div>
      <div className="w-full h-40 sm:h-52 overflow-hidden">
        <img src={coverUrl} alt="" className="w-full h-full object-cover" />
      </div>

      <div className="bg-paper border-b border-crust/10">
        <div className="max-w-3xl mx-auto px-4">
          <img
            src={logoUrl}
            alt={name}
            className="w-20 h-20 rounded-full object-cover border-4 border-paper shadow-md -mt-10 relative z-10"
          />

          <div className="pt-2 pb-1">
            <h1 className="text-2xl leading-tight text-crust">{name}</h1>
            <p className="text-sm text-crust/60">{tagline}</p>
          </div>

          <div className="flex items-center justify-between pb-3 pt-1">
            <span className="inline-flex items-center gap-1.5 text-sm text-basil font-medium">
              <span className="w-2 h-2 rounded-full bg-basil inline-block" />
              Aberto agora
            </span>
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
