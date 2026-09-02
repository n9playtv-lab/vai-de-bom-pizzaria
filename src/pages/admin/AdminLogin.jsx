import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../firebase.js'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/admin/pedidos')
    } catch (err) {
      setError('E-mail ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-crust flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="bg-paper rounded-sm p-8 w-full max-w-sm">
        <h1 className="text-2xl mb-1">Painel da Pizzaria</h1>
        <p className="text-crust/60 text-sm mb-6">Entre com sua conta de administrador</p>
        <div className="space-y-3">
          <input className="input-field" type="email" placeholder="E-mail" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
          <input className="input-field" type="password" placeholder="Senha" value={password}
            onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-tomato text-sm mt-3">{error}</p>}
        <button disabled={loading} className="btn-primary w-full mt-5">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
