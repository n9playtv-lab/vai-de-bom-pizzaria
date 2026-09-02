import { useRef, useState } from 'react'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase.js'

// Campo de imagem: mostra preview do que já existe, permite tirar foto ou
// escolher da galeria, sobe pro Firebase Storage e devolve a URL via onChange.
export default function ImageUploadField({ label, value, onChange, folder = 'uploads' }) {
  const inputRef = useRef(null)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState('')

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')

    if (file.size > 8 * 1024 * 1024) {
      setError('Imagem muito grande (máximo 8MB).')
      return
    }

    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`
    const storageRef = ref(storage, `${folder}/${safeName}`)
    const task = uploadBytesResumable(storageRef, file)

    setProgress(0)
    task.on(
      'state_changed',
      (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err) => {
        console.error(err)
        setError('Falha no upload. Tenta de novo.')
        setProgress(null)
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        onChange(url)
        setProgress(null)
      },
    )
  }

  return (
    <div>
      {label && <label className="text-sm text-crust/70 block mb-1">{label}</label>}

      {value && (
        <img src={value} alt="" className="w-full h-32 object-cover rounded-sm mb-2 border border-crust/10" />
      )}

      <div className="flex gap-2">
        <button
          type="button"
          className="btn-outline text-sm px-4 py-2"
          onClick={() => inputRef.current?.click()}
        >
          {value ? 'Trocar imagem' : 'Escolher imagem'}
        </button>
        {value && (
          <button type="button" className="text-tomato text-sm" onClick={() => onChange('')}>
            Remover
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {progress !== null && (
        <div className="w-full bg-crust/10 rounded-sm h-2 mt-2 overflow-hidden">
          <div className="bg-tomato h-2 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && <p className="text-tomato text-sm mt-1">{error}</p>}
    </div>
  )
}
