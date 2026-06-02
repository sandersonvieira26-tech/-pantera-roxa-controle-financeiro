import { useState } from 'react'
import type { FormEvent } from 'react'
import { PlusCircle, Minus, Plus, AlertCircle } from 'lucide-react'
import { todayISO } from '@/utils/format'
import { usePrecos } from '@/modules/caixa/usePrecos'
import { useClientes } from './useClientes'
import { TAMANHOS } from '@/types'
import type { FiadoInsert, Tamanho } from '@/types'

export interface RetiradaRapidaInput {
  nome_cliente: string
  tamanho: Tamanho
  qtd: number
  preco300: number
  preco500: number
}

interface FiadoFormProps {
  onSubmit: (item: FiadoInsert) => void
  onSubmitRapido: (r: RetiradaRapidaInput) => void
  loading: boolean
  loadingRapido: boolean
  onOpenPrecos: () => void
}

export default function FiadoForm({ onSubmit, onSubmitRapido, loading, loadingRapido, onOpenPrecos }: FiadoFormProps) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState(todayISO())

  // Fiado rápido
  const [rNome, setRNome] = useState('')
  const [rTamanho, setRTamanho] = useState<Tamanho | null>(null)
  const [rQtd, setRQtd] = useState(1)

  const { data: clientes = [] } = useClientes()
  const { getPreco } = usePrecos()

  const precoFaltando = rTamanho !== null && getPreco(rTamanho) === undefined
  const podeAdicionar = rNome.trim() !== '' && rTamanho !== null && !precoFaltando

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({ nome_cliente: nome, descricao, valor: parseFloat(valor), data, pago: false })
    setNome(''); setDescricao(''); setValor(''); setData(todayISO())
  }

  function handleAddRapido() {
    if (!podeAdicionar || rTamanho === null) return
    onSubmitRapido({
      nome_cliente: rNome.trim(),
      tamanho: rTamanho,
      qtd: rQtd,
      preco300: getPreco('300ml') ?? 0,
      preco500: getPreco('500ml') ?? 0,
    })
    setRNome(''); setRTamanho(null); setRQtd(1)
  }

  return (
    <div className="mb-3 space-y-3">
      {/* Fiado rápido */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg text-white tracking-wide">FIADO RÁPIDO</h2>
          <button type="button" onClick={onOpenPrecos} className="text-pantera-lavender hover:text-white text-xs underline">
            Preços
          </button>
        </div>

        <label className="text-[11px] uppercase tracking-widest text-pantera-lavender block mb-1">Cliente</label>
        <input
          className="input mb-3"
          placeholder="Nome do cliente"
          list="clientes-salvos"
          value={rNome}
          onChange={e => setRNome(e.target.value)}
        />
        <datalist id="clientes-salvos">
          {clientes.map(c => <option key={c.id} value={c.nome} />)}
        </datalist>

        <div className="flex flex-wrap items-center gap-2">
          {TAMANHOS.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setRTamanho(t)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-colors
                ${rTamanho === t
                  ? 'bg-pantera-purple text-white border-pantera-purple'
                  : 'border-pantera-purple/20 text-pantera-lavender hover:border-pantera-purple/40'}`}
            >
              {t}
            </button>
          ))}
          <div className="flex items-center gap-1 ml-auto">
            <button type="button" onClick={() => setRQtd(q => Math.max(1, q - 1))} className="btn-ghost p-1.5" aria-label="Diminuir">
              <Minus size={14} />
            </button>
            <span className="w-8 text-center text-white font-semibold">{rQtd}</span>
            <button type="button" onClick={() => setRQtd(q => q + 1)} className="btn-ghost p-1.5" aria-label="Aumentar">
              <Plus size={14} />
            </button>
          </div>
        </div>

        {precoFaltando && (
          <div className="flex items-center gap-2 text-pending text-xs mt-2">
            <AlertCircle size={13} className="shrink-0" />
            <span>Preço de {rTamanho} não definido. <button type="button" onClick={onOpenPrecos} className="underline">Definir agora</button></span>
          </div>
        )}

        <button
          type="button"
          onClick={handleAddRapido}
          disabled={!podeAdicionar || loadingRapido}
          className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusCircle size={16} />
          {loadingRapido ? 'Salvando...' : 'Adicionar retirada'}
        </button>
      </div>

      {/* Fiado manual */}
      <form onSubmit={handleSubmit} className="card">
        <h2 className="font-display text-lg text-white tracking-wide mb-3">REGISTRAR FIADO (MANUAL)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-[11px] uppercase tracking-widest text-pantera-lavender block mb-1">Cliente</label>
            <input className="input" placeholder="Nome do cliente" value={nome} onChange={e => setNome(e.target.value)} required />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-widest text-pantera-lavender block mb-1">Descrição</label>
            <input className="input" placeholder="Ex: 2x 500ml banana" value={descricao} onChange={e => setDescricao(e.target.value)} required />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-widest text-pantera-lavender block mb-1">Valor (R$)</label>
            <input className="input" type="number" step="0.01" min="0.01" placeholder="0,00" value={valor} onChange={e => setValor(e.target.value)} required />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-widest text-pantera-lavender block mb-1">Data</label>
            <input className="input" type="date" value={data} onChange={e => setData(e.target.value)} required />
          </div>
        </div>
        <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
          <PlusCircle size={16} />
          {loading ? 'Salvando...' : 'Registrar'}
        </button>
      </form>
    </div>
  )
}
