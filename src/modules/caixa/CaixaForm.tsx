import { useState } from 'react'
import type { FormEvent } from 'react'
import { PlusCircle } from 'lucide-react'
import { todayISO } from '@/utils/format'
import { useCategorias } from './useCategorias'
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
  const [categoriaId, setCategoriaId] = useState('')

  const { data: categorias = [] } = useCategorias()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({
      tipo,
      descricao,
      valor: parseFloat(valor),
      data,
      categoria_id: tipo === 'saida' && categoriaId ? categoriaId : null,
    })
    setDescricao('')
    setValor('')
    setData(todayISO())
    setCategoriaId('')
  }

  return (
    <form onSubmit={handleSubmit} className="card mb-3">
      <h2 className="font-display text-lg text-white tracking-wide mb-3">NOVO LANÇAMENTO</h2>

      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setTipo('entrada')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors
            ${tipo === 'entrada'
              ? 'bg-income text-white border-income'
              : 'border-pantera-purple/20 text-pantera-lavender hover:border-income/30'}`}
        >
          + Entrada
        </button>
        <button
          type="button"
          onClick={() => setTipo('saida')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors
            ${tipo === 'saida'
              ? 'bg-expense text-white border-expense'
              : 'border-pantera-purple/20 text-pantera-lavender hover:border-expense/30'}`}
        >
          − Saída
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        <div className="sm:col-span-1">
          <label className="text-[11px] uppercase tracking-widest text-pantera-lavender block mb-1">Descrição</label>
          <input
            className="input"
            placeholder="Ex: Venda 2x 500ml banana"
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-widest text-pantera-lavender block mb-1">Valor (R$)</label>
          <input
            className="input"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0,00"
            value={valor}
            onChange={e => setValor(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-widest text-pantera-lavender block mb-1">Data</label>
          <input
            className="input"
            type="date"
            value={data}
            onChange={e => setData(e.target.value)}
            required
          />
        </div>
      </div>

      {tipo === 'saida' && (
        <div className="mb-3">
          <label className="text-[11px] uppercase tracking-widest text-pantera-lavender block mb-1">Categoria</label>
          <select
            className="input"
            value={categoriaId}
            onChange={e => setCategoriaId(e.target.value)}
          >
            <option value="">Sem categoria</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
      )}

      <button type="submit" className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2" disabled={loading}>
        <PlusCircle size={16} />
        {loading ? 'Salvando...' : 'Adicionar'}
      </button>
    </form>
  )
}
