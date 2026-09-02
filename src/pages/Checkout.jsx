import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from 'firebase/firestore'
import { useEffect } from 'react'
import { db } from '../firebase.js'
import { useCart } from '../context/CartContext.jsx'
import { formatCurrency } from '../utils/formatCurrency.js'
import { getStoreStatus } from '../utils/storeHours.js'

const STEPS = ['Revisão', 'Entrega', 'Pagamento']

export default function Checkout() {
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [storeOpen, setStoreOpen] = useState(true)
  const navigate = useNavigate()
  const cart = useCart()
  const { items, subtotal, customer, setCustomer, address, setAddress, payment, setPayment, clearCart } = cart

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
      setStoreOpen(getStoreStatus(snap.exists() ? snap.data() : null).open)
    })
    return unsub
  }, [])

  async function handleConfirm() {
    if (!storeOpen) {
      setError('A pizzaria está fechada no momento. Tente novamente durante o horário de funcionamento.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const changeForValue = payment.method === 'dinheiro' && payment.changeFor
        ? parseFloat(payment.changeFor.replace(',', '.'))
        : null
      const troco = changeForValue ? Math.max(changeForValue - subtotal, 0) : null

      const orderRef = await addDoc(collection(db, 'orders'), {
        items,
        subtotal,
        customer,
        address,
        payment: { ...payment, changeForValue, troco },
        status: 'pendente', // pendente | aceito | recusado | saiu_entrega | entregue
        createdAt: serverTimestamp(),
      })
      clearCart()
      navigate(`/pedido/${orderRef.id}`)
    } catch (e) {
      console.error(e)
      setError('Não deu pra enviar o pedido agora. Tenta de novo em instantes.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-lg mx-auto px-4 py-8">
        <ol className="flex items-center gap-2 mb-8 text-sm">
          {STEPS.map((label, i) => (
            <li key={label} className={`flex items-center gap-2 ${i === step ? 'text-tomato font-semibold' : 'text-crust/40'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${i === step ? 'border-tomato' : 'border-crust/30'}`}>
                {i + 1}
              </span>
              {label}
              {i < STEPS.length - 1 && <span className="w-4 h-px bg-crust/20 ml-2" />}
            </li>
          ))}
        </ol>

        {step === 0 && <StepReview cart={cart} onNext={() => setStep(1)} />}
        {step === 1 && (
          <StepAddress
            customer={customer} setCustomer={setCustomer}
            address={address} setAddress={setAddress}
            onBack={() => setStep(0)} onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepPayment
            payment={payment} setPayment={setPayment} subtotal={subtotal}
            onBack={() => setStep(1)} onConfirm={handleConfirm}
            submitting={submitting} error={error} storeOpen={storeOpen}
          />
        )}
      </div>
    </div>
  )
}

function StepReview({ cart, onNext }) {
  const { items, subtotal, updateQty } = cart
  return (
    <div>
      <h2 className="text-2xl mb-4">Revise seu pedido</h2>
      {items.length === 0 && <p className="text-crust/60">Seu carrinho está vazio.</p>}
      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div key={item.id + item.notes} className="flex justify-between items-center">
            <div>
              <p className="font-medium">{item.qty}x {item.name}</p>
              {item.notes && <p className="text-xs text-crust/60">{item.notes}</p>}
            </div>
            <div className="flex items-center gap-3">
              <span>{formatCurrency(item.price * item.qty)}</span>
              <button className="text-tomato text-sm" onClick={() => updateQty(item.id, item.notes, 0)}>Remover</button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-lg font-semibold border-t border-crust/10 pt-4 mb-6">
        <span>Subtotal</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      <button disabled={items.length === 0} onClick={onNext} className="btn-primary w-full disabled:opacity-40">
        Continuar
      </button>
    </div>
  )
}

function StepAddress({ customer, setCustomer, address, setAddress, onBack, onNext }) {
  const valid = customer.name && customer.phone && address.street && address.number && address.neighborhood

  return (
    <div>
      <h2 className="text-2xl mb-4">Dados de entrega</h2>
      <div className="space-y-3">
        <input className="input-field" placeholder="Seu nome"
          value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
        <input className="input-field" placeholder="WhatsApp (DDD + número)"
          value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
        <div className="flex gap-3">
          <input className="input-field flex-1" placeholder="Rua"
            value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
          <input className="input-field w-24" placeholder="Nº"
            value={address.number} onChange={(e) => setAddress({ ...address, number: e.target.value })} />
        </div>
        <input className="input-field" placeholder="Bairro"
          value={address.neighborhood} onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })} />
        <input className="input-field" placeholder="Complemento (opcional)"
          value={address.complement} onChange={(e) => setAddress({ ...address, complement: e.target.value })} />
        <input className="input-field" placeholder="Ponto de referência (opcional)"
          value={address.reference} onChange={(e) => setAddress({ ...address, reference: e.target.value })} />
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onBack} className="btn-outline flex-1">Voltar</button>
        <button disabled={!valid} onClick={onNext} className="btn-primary flex-1 disabled:opacity-40">Continuar</button>
      </div>
    </div>
  )
}

function StepPayment({ payment, setPayment, subtotal, onBack, onConfirm, submitting, error, storeOpen }) {
  const changeForValue = payment.changeFor ? parseFloat(payment.changeFor.replace(',', '.')) : null
  const troco = payment.method === 'dinheiro' && changeForValue ? changeForValue - subtotal : null
  const trocoInvalido = troco !== null && troco < 0
  const valid = payment.method && (payment.method !== 'dinheiro' || (changeForValue && !trocoInvalido))

  const options = [
    { id: 'pix', label: 'Pix na entrega' },
    { id: 'cartao', label: 'Cartão na entrega' },
    { id: 'dinheiro', label: 'Dinheiro' },
  ]

  return (
    <div>
      <h2 className="text-2xl mb-4">Forma de pagamento</h2>
      <div className="space-y-2 mb-4">
        {options.map((opt) => (
          <label key={opt.id} className={`flex items-center gap-3 border rounded-sm px-4 py-3 cursor-pointer ${payment.method === opt.id ? 'border-tomato bg-tomato/5' : 'border-crust/20'}`}>
            <input type="radio" name="payment" checked={payment.method === opt.id}
              onChange={() => setPayment({ ...payment, method: opt.id, changeFor: '' })} />
            {opt.label}
          </label>
        ))}
      </div>

      {payment.method === 'dinheiro' && (
        <div className="mb-4">
          <label className="text-sm text-crust/70 block mb-1">Vai pagar com quanto?</label>
          <input
            className="input-field"
            inputMode="decimal"
            placeholder="Ex: 50,00"
            value={payment.changeFor}
            onChange={(e) => setPayment({ ...payment, changeFor: e.target.value })}
          />
          {changeForValue != null && !isNaN(changeForValue) && (
            <p className={`text-sm mt-2 ${trocoInvalido ? 'text-tomato' : 'text-basil'}`}>
              {trocoInvalido ? 'Valor menor que o total do pedido.' : `Troco: ${formatCurrency(troco)}`}
            </p>
          )}
        </div>
      )}

      <div className="flex justify-between text-lg font-semibold border-t border-crust/10 pt-4 mb-4">
        <span>Total</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>

      {error && <p className="text-tomato text-sm mb-3">{error}</p>}
      {!storeOpen && <p className="text-tomato text-sm mb-3">A pizzaria está fechada no momento.</p>}

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-outline flex-1">Voltar</button>
        <button disabled={!valid || submitting || !storeOpen} onClick={onConfirm} className="btn-primary flex-1 disabled:opacity-40">
          {submitting ? 'Enviando...' : 'Confirmar pedido'}
        </button>
      </div>
    </div>
  )
}
