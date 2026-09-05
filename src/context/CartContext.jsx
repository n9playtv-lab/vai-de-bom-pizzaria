import { createContext, useContext, useMemo, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([]) // {id, name, price, qty, notes}
  const [customer, setCustomer] = useState({ name: '', phone: '' })
  const [address, setAddress] = useState({
    cep: '', city: '', street: '', number: '', neighborhood: '', complement: '', reference: '',
  })
  const [payment, setPayment] = useState({ method: '', changeFor: '' })

  function addItem(product, qty = 1, notes = '') {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id && i.notes === notes)
      if (existing) {
        return prev.map((i) => (i === existing ? { ...i, qty: i.qty + qty } : i))
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, qty, notes }]
    })
  }

  function updateQty(id, notes, qty) {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => !(i.id === id && i.notes === notes))
        : prev.map((i) => (i.id === id && i.notes === notes ? { ...i, qty } : i)),
    )
  }

  function removeItem(id, notes) {
    setItems((prev) => prev.filter((i) => !(i.id === id && i.notes === notes)))
  }

  function clearCart() {
    setItems([])
    setPayment({ method: '', changeFor: '' })
  }

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.qty, 0), [items])
  const totalCount = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items])

  const value = {
    items, addItem, updateQty, removeItem, clearCart, subtotal, totalCount,
    customer, setCustomer, address, setAddress, payment, setPayment,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart deve ser usado dentro de <CartProvider>')
  return ctx
}
