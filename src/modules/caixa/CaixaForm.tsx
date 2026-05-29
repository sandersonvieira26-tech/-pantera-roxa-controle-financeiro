import { useState } from 'react'
import type { FormEvent } from 'react'
import { PlusCircle } from 'lucide-react'
import { todayISO } from '@/utils/format'
import type { LancamentoInsert } from '@/types'

interface CaixaFormProps {
  onSubmit: (item: LancamentoInsert) => void
  loading: boolean
}

export default function CaixaForm({ onSubmit, loading }: CaixaFormProps) {
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState(todayISO())

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({ tipo, descricao, valor: parseFloat(valor), data })
    setDescricao('')
    setValor('')
    setData(todayISO())
  }

  return (
    <form onSubmit={handleSubmit} className="card mb-4">
      <h2 className="font-display text-xl text-white tracking-wide mb-3">NOVO LANÇAMENTO</h2>

      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setTipo('entrada')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors
            ${tipo === 'entrada' ? 'bg-income/20 text-income border-income/50' : 'border-pantera-purple/20 text-pantera-lavender hover:border-income/30'}`}
        >
          + Entrada
        </button>
        <button
          type="button"
          onClick={() => setTipo('saida')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors
            ${tipo === 'saida' ? 'bg-expense/20 text-expense border-expense/50' : 'border-pantera-purple/20 text-pantera-lavender hover:border-expense/30'}`}
        >
          − Saída
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        <input
          className="input sm:col-span-1"
          placeholder="Descrição"
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          required
        />
        <input
          className="input"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Valor (R$)"
          value={valor}
          onChange={e => setValor(e.target.value)}
          required
        />
        <input
          className="input"
          type="date"
          value={data}
          onChange={e => setData(e.target.value)}
          required
        />
      </div>

      <button type="submit" className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2" disabled={loading}>
        <PlusCircle size={16} />
        {loading ? 'Salvando...' : 'Adicionar'}
      </button>
    </form>
  )
}
