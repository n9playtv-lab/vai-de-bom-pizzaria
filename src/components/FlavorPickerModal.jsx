import { useMemo, useState } from 'react'
import { formatCurrency } from '../utils/formatCurrency.js'

const ORDINALS = ['Primeira', 'Segunda', 'Terceira', 'Quarta', 'Quinta', 'Sexta']

// category: { name, pizzaCount, allowHalfHalf, comboPrice }
// flavors: itens (produtos) daquela categoria
// onConfirm(cartLine) -> chamado com { name, price, notes }
export default function FlavorPickerModal({ open, onClose, category, flavors, onConfirm }) {
  const slots = category?.pizzaCount || 1
  const maxPerSlot = category?.allowHalfHalf ? 2 : 1
  const [selections, setSelections] = useState(() => Array.from({ length: slots }, () => ({})))
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  const isCombo = slots > 1

  const slotCounts = selections.map((s) => Object.keys(s).length)
  const allSlotsComplete = slotCounts.every((c) => c >= 1)

  const filteredFlavors = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return flavors
    return flavors.filter((f) => f.name.toLowerCase().includes(term) || (f.description || '').toLowerCase().includes(term))
  }, [flavors, search])

  const totalPrice = useMemo(() => {
    if (isCombo) return category.comboPrice || 0
    // pizzaCount === 1 com meio a meio: preco = maior preco entre os sabores escolhidos
    const chosenIds = Object.keys(selections[0] || {})
    if (chosenIds.length === 0) return 0
    const prices = chosenIds.map((id) => flavors.find((f) => f.id === id)?.price || 0)
    return Math.max(...prices)
  }, [selections, isCombo, category, flavors])

  if (!open) return null

  function toggleFlavor(slotIndex, flavorId) {
    setSelections((prev) => {
      const next = [...prev]
      const current = { ...next[slotIndex] }
      if (current[flavorId]) {
        delete current[flavorId]
      } else {
        if (Object.keys(current).length >= maxPerSlot) return prev
        current[flavorId] = true
      }
      next[slotIndex] = current
      return next
    })
  }

  function handleConfirm() {
    const notes = selections
      .map((slot, i) => {
        const ids = Object.keys(slot)
        const names = ids.map((id) => flavors.find((f) => f.id === id)?.name || '?')
        const label = names.length > 1 ? names.map((n) => `½ ${n}`).join(' + ') : names[0]
        return slots > 1 ? `${i + 1}ª pizza: ${label}` : label
      })
      .join(' | ')

    onConfirm({ name: category.name, price: totalPrice, notes })
    setSelections(Array.from({ length: slots }, () => ({})))
    setSearch('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-paper flex flex-col">
      <div className="px-5 py-4 border-b border-crust/10 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-xl">{category.name}</h2>
          {isCombo && <p className="text-sm text-crust/60">{category.comboDescription}</p>}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => setSearchOpen((v) => !v)} className="text-crust/50 text-lg" aria-label="Buscar sabor">🔍</button>
          <button onClick={onClose} className="text-crust/50 hover:text-crust text-xl leading-none">✕</button>
        </div>
      </div>

      {searchOpen && (
        <div className="px-5 py-3 border-b border-crust/10 flex-shrink-0">
          <input
            autoFocus
            className="input-field"
            placeholder="Buscar sabor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {isCombo && (
        <div className="px-5 py-3 border-b border-crust/10 flex-shrink-0">
          <span className="text-2xl font-semibold text-tomato">{formatCurrency(category.comboPrice)}</span>
        </div>
      )}

      <div className="overflow-y-auto flex-1 max-w-3xl mx-auto w-full">
        {selections.map((slot, slotIndex) => (
          <div key={slotIndex} className="border-b border-crust/10">
            <div className="flex items-center justify-between px-5 py-3 bg-crust/[0.04]">
              <div>
                <h3 className="font-semibold">
                  {slots > 1 ? `Escolha o sabor da ${ORDINALS[slotIndex] || slotIndex + 1}ª Pizza` : 'Escolha o sabor'}
                </h3>
                <p className="text-sm text-crust/50">
                  {maxPerSlot > 1 ? 'Escolha até 2 opções' : 'Escolha 1 opção'}
                </p>
              </div>
              <span className="bg-crust/10 text-crust text-sm px-2 py-1 rounded-sm flex-shrink-0">
                {slotCounts[slotIndex]}/{maxPerSlot}
              </span>
            </div>

            <div className="px-5 divide-y divide-crust/5">
              {filteredFlavors.map((flavor) => {
                const selected = !!slot[flavor.id]
                const full = slotCounts[slotIndex] >= maxPerSlot && !selected
                return (
                  <div key={flavor.id} className="flex gap-3 items-center py-3">
                    {flavor.imageUrl && (
                      <img src={flavor.imageUrl} alt="" className="w-14 h-14 object-cover rounded-sm flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{flavor.name}</p>
                      {flavor.description && <p className="text-xs text-crust/50">{flavor.description}</p>}
                      {!isCombo && <p className="text-xs text-crust/60 mt-0.5">{formatCurrency(flavor.price)}</p>}
                    </div>
                    <button
                      disabled={full}
                      className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center border transition-colors ${
                        selected ? 'bg-tomato text-paper border-tomato' : full ? 'border-crust/10 text-crust/20' : 'border-crust/20 text-crust/40'
                      }`}
                      onClick={() => toggleFlavor(slotIndex, flavor.id)}
                    >
                      {selected ? '✓' : '+'}
                    </button>
                  </div>
                )
              })}
              {filteredFlavors.length === 0 && (
                <p className="text-sm text-crust/40 py-3">Nenhum sabor encontrado.</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 py-4 border-t border-crust/10 flex-shrink-0">
        <button
          disabled={!allSlotsComplete}
          onClick={handleConfirm}
          className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {allSlotsComplete ? `Adicionar ao carrinho — ${formatCurrency(totalPrice)}` : 'Escolha os sabores para continuar'}
        </button>
      </div>
    </div>
  )
}
