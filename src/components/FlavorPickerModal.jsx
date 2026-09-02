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

  const isCombo = slots > 1

  const slotTotals = selections.map((s) => Object.values(s).reduce((a, b) => a + b, 0))
  const allSlotsComplete = slotTotals.every((t) => t === maxPerSlot)

  const totalPrice = useMemo(() => {
    if (isCombo) return category.comboPrice || 0
    // pizzaCount === 1 com meio a meio: preco = maior preco entre os sabores escolhidos
    const chosenIds = Object.keys(selections[0] || {})
    if (chosenIds.length === 0) return 0
    const prices = chosenIds.map((id) => flavors.find((f) => f.id === id)?.price || 0)
    return Math.max(...prices)
  }, [selections, isCombo, category, flavors])

  if (!open) return null

  function setQty(slotIndex, flavorId, qty) {
    setSelections((prev) => {
      const next = [...prev]
      const slot = { ...next[slotIndex] }
      if (qty <= 0) delete slot[flavorId]
      else slot[flavorId] = qty
      next[slotIndex] = slot
      return next
    })
  }

  function currentQty(slotIndex, flavorId) {
    return selections[slotIndex]?.[flavorId] || 0
  }

  function slotRemaining(slotIndex) {
    return maxPerSlot - slotTotals[slotIndex]
  }

  function selectSingle(slotIndex, flavorId) {
    setSelections((prev) => {
      const next = [...prev]
      next[slotIndex] = { [flavorId]: 1 }
      return next
    })
  }

  function handleConfirm() {
    const notes = selections
      .map((slot, i) => {
        const parts = Object.entries(slot).map(([id, qty]) => {
          const flavor = flavors.find((f) => f.id === id)
          const label = flavor ? flavor.name : '?'
          return maxPerSlot > 1 && qty === 1 && Object.keys(slot).length > 1 ? `½ ${label}` : label
        })
        return slots > 1 ? `${i + 1}ª pizza: ${parts.join(' + ')}` : parts.join(' + ')
      })
      .join(' | ')

    onConfirm({
      name: category.name,
      price: totalPrice,
      notes,
    })
    setSelections(Array.from({ length: slots }, () => ({})))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-paper flex flex-col">
      <div className="px-5 py-4 border-b border-crust/10 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-xl">{category.name}</h2>
          {isCombo && <p className="text-sm text-crust/60">{category.comboDescription}</p>}
        </div>
        <button onClick={onClose} className="text-crust/50 hover:text-crust text-xl leading-none">✕</button>
      </div>

      {isCombo && (
        <div className="px-5 py-3 border-b border-crust/10 flex-shrink-0">
          <span className="text-2xl font-semibold text-tomato">{formatCurrency(category.comboPrice)}</span>
        </div>
      )}

      <div className="overflow-y-auto flex-1 max-w-3xl mx-auto w-full">
        {selections.map((slot, slotIndex) => (
          <div key={slotIndex} className="px-5 py-4 border-b border-crust/10">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="font-semibold">
                  {slots > 1 ? `Escolha o sabor da ${ORDINALS[slotIndex] || slotIndex + 1}ª Pizza` : 'Escolha o sabor'}
                </h3>
                <p className="text-sm text-crust/50">
                  {maxPerSlot > 1 ? 'Escolha até 2 opções' : 'Escolha 1 opção'}
                </p>
              </div>
              <span className="bg-crust/10 text-crust text-sm px-2 py-1 rounded-sm flex-shrink-0">
                {slotTotals[slotIndex]}/{maxPerSlot}
              </span>
            </div>

            <div className="space-y-3 mt-3">
              {flavors.map((flavor) => {
                const qty = currentQty(slotIndex, flavor.id)
                const remaining = slotRemaining(slotIndex)
                return (
                  <div key={flavor.id} className="flex gap-3 items-center">
                    {flavor.imageUrl && (
                      <img src={flavor.imageUrl} alt="" className="w-14 h-14 object-cover rounded-sm flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{flavor.name}</p>
                      {flavor.description && <p className="text-xs text-crust/50">{flavor.description}</p>}
                      {!isCombo && <p className="text-xs text-crust/60 mt-0.5">{formatCurrency(flavor.price)}</p>}
                    </div>

                    {maxPerSlot > 1 ? (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          className="w-7 h-7 border border-crust/20 rounded-sm disabled:opacity-30"
                          disabled={qty === 0}
                          onClick={() => setQty(slotIndex, flavor.id, qty - 1)}
                        >−</button>
                        <span className="w-5 text-center text-sm">{qty}</span>
                        <button
                          className="w-7 h-7 border border-crust/20 rounded-sm disabled:opacity-30"
                          disabled={remaining === 0}
                          onClick={() => setQty(slotIndex, flavor.id, qty + 1)}
                        >+</button>
                      </div>
                    ) : (
                      <button
                        className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center border ${qty > 0 ? 'bg-tomato text-paper border-tomato' : 'border-crust/20 text-crust/40'}`}
                        onClick={() => selectSingle(slotIndex, flavor.id)}
                      >
                        {qty > 0 ? '✓' : '+'}
                      </button>
                    )}
                  </div>
                )
              })}
              {flavors.length === 0 && (
                <p className="text-sm text-crust/40">Nenhum sabor cadastrado nessa categoria ainda.</p>
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
