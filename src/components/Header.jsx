export default function Header({ onCartClick, cartCount }) {
  return (
    <header className="sticky top-0 z-30 bg-crust text-paper">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl leading-tight">Vai de Bom</h1>
          <p className="text-xs tracking-wide text-gold">Pizzaria — Abreu e Lima, PE</p>
        </div>
        <button
          onClick={onCartClick}
          className="relative border border-paper/40 rounded-sm px-4 py-2 text-sm hover:border-gold transition-colors"
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
  )
}
