import { useState } from 'react'
import type { FormEvent } from 'react'
import { PlusCircle } from 'lucide-react'
import { todayISO, formatCurrency } from '@/utils/format'
import type { ParceiroInsert } from '@/types'

interface ParceiroFormProps {
  onSubmit: (item: ParceiroInsert) => void
  loading: boolean
}

export default function ParceiroForm({ onSubmit, loading }: ParceiroFormProps) {
  const [nome, setNome] = useState('')
  const [quantidade, setQuantidade] = useState('')
  const [valorUnitario, setValorUnitario] = useState('')
  const [data, setData] = useState(todayISO())

  const total = (parseFloat(quantidade) || 0) * (parseFloat(valorUnitario) || 0)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({ nome_parceiro: nome, quantidade: parseInt(quantidade), valor_unitario: parseFloat(valorUnitario), data, pago: false })
    setNome(''); setQuantidade(''); setValorUnitario(''); setData(todayISO())
  }

  return (
    <form onSubmit={handleSubmit} className="card mb-4">
      <h2 className="font-display text-xl text-white tracking-wide mb-3">REGISTRAR ENTREGA</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        <input className="input" placeholder="Nome do parceiro" value={nome} onChange={e => setNome(e.target.value)} required />
        <input className="input" type="date" value={data} onChange={e => setData(e.target.value)} required />
        <input className="input" type="number" min="1" placeholder="Quantidade de garrafas" value={quantidade} onChange={e => setQuantidade(e.target.value)} required />
        <input className="input" type="number" step="0.01" min="0.01" placeholder="Valor por garrafa (R$)" value={valorUnitario} onChange={e => setValorUnitario(e.target.value)} required />
      </div>
      {total > 0 && (
        <p className="text-pantera-lavender text-sm mb-3">
          Total a receber: <span className="text-income font-semibold">{formatCurrency(total)}</span>
        </p>
      )}
      <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
        <PlusCircle size={16} />
        {loading ? 'Salvando...' : 'Registrar'}
      </button>
    </form>
  )
}
