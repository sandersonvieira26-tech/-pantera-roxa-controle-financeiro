import { useState } from 'react'
import type { FormEvent } from 'react'
import { PlusCircle } from 'lucide-react'
import { todayISO } from '@/utils/format'
import type { FiadoInsert } from '@/types'

interface FiadoFormProps {
  onSubmit: (item: FiadoInsert) => void
  loading: boolean
}

export default function FiadoForm({ onSubmit, loading }: FiadoFormProps) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState(todayISO())

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({ nome_cliente: nome, descricao, valor: parseFloat(valor), data, pago: false })
    setNome(''); setDescricao(''); setValor(''); setData(todayISO())
  }

  return (
    <form onSubmit={handleSubmit} className="card mb-4">
      <h2 className="font-display text-xl text-white tracking-wide mb-3">REGISTRAR FIADO</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        <input className="input" placeholder="Nome do cliente" value={nome} onChange={e => setNome(e.target.value)} required />
        <input className="input" placeholder="Descrição (ex: 2x 500ml banana)" value={descricao} onChange={e => setDescricao(e.target.value)} required />
        <input className="input" type="number" step="0.01" min="0.01" placeholder="Valor (R$)" value={valor} onChange={e => setValor(e.target.value)} required />
        <input className="input" type="date" value={data} onChange={e => setData(e.target.value)} required />
      </div>
      <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
        <PlusCircle size={16} />
        {loading ? 'Salvando...' : 'Registrar'}
      </button>
    </form>
  )
}
