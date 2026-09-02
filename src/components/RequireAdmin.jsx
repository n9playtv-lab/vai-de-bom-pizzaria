import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase.js'

export default function RequireAdmin({ children }) {
  const [status, setStatus] = useState('loading') // loading | in | out

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setStatus(user ? 'in' : 'out'))
    return unsub
  }, [])

  if (status === 'loading') return <div className="p-8 text-center">Carregando...</div>
  if (status === 'out') return <Navigate to="/admin" replace />
  return children
}
