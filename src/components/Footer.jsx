export default function Footer({ settings }) {
  const name = settings?.name || 'Vai de Bom'
  const year = new Date().getFullYear()
  const cnpj = settings?.cnpj
  const address = settings?.address
  const phone = settings?.phone

  return (
    <footer className="bg-crust text-paper/70 mt-10">
      <div className="max-w-3xl mx-auto px-4 py-6 text-sm space-y-2">
        <p className="text-paper">{name} Pizzaria — Abreu e Lima — {year}. Todos os direitos reservados</p>
        {(cnpj || address || phone) && (
          <p>
            {cnpj && <>CNPJ: {cnpj}</>}
            {cnpj && (address || phone) && ' | '}
            {address}
            {address && phone && ' | '}
            {phone}
          </p>
        )}
      </div>
    </footer>
  )
}
