import { useState } from 'react'
import type { FormEvent } from 'react'
import { PlusCircle, Minus, Plus, AlertCircle } from 'lucide-react'
import { todayISO } from '@/utils/format'
import { useCategorias } from './useCategorias'
import { usePrecos } from './usePrecos'
import { montarVendaRapida } from './vendaRapida'
import { TAMANHOS } from '@/types'
import type { LancamentoInsert, Tamanho } from '@/types'

interface CaixaFormProps {
  onSubmit: (item: LancamentoInsert) => void
  loading: boolean
  onOpenPrecos: () => void
}

export default function CaixaForm({ onSubmit, loading, onOpenPrecos }: CaixaFormProps) {
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState(todayISO())
  const [categoriaId, setCategoriaId] = useState('')
  const [tamanho, setTamanho] = useState<Tamanho | null>(null)
  const [qtd, setQtd] = useState(1)

  const { data: categorias = [] } = useCategorias()
  const { getPreco } = usePrecos()

  const precoFaltando = tamanho !== null && getPreco(tamanho) === undefined

  // Preenche descrição e valor a partir de tamanho + quantidade.
  function aplicarVendaRapida(t: Tamanho, q: number) {
    const venda = montarVendaRapida(t, q, getPreco(t))
    setDescricao(venda.descricao)
    setValor(venda.valor === null ? '' : String(venda.valor))
  }

  function selecionarTamanho(t: Tamanho) {
    setTamanho(t)
    aplicarVendaRapida(t, qtd)
  }

  function mudarQtd(delta: number) {
    const q = Math.max(1, qtd + delta)
    setQtd(q)
    if (tamanho !== null) aplicarVendaRapida(tamanho, q)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({
      tipo,
      descricao,
      valor: parseFloat(valor),
      data,
      categoria_id: tipo === 'saida' && categoriaId ? categoriaId : null,
      // Venda rápida (entrada) grava a quantidade por tamanho pro contador de garrafas.
      qtd_300: tipo === 'entrada' && tamanho === '300ml' ? qtd : 0,
      qtd_500: tipo === 'entrada' && tamanho === '500ml' ? qtd : 0,
    })
    setDescricao('')
    setValor('')
    setData(todayISO())
    setCategoriaId('')
    setTamanho(null)
    setQtd(1)
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

      {tipo === 'entrada' && (
        <div className="mb-3 rounded-lg border border-pantera-purple/20 p-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] uppercase tracking-widest text-pantera-lavender">Venda rápida</label>
            <button type="button" onClick={onOpenPrecos} className="text-pantera-lavender hover:text-white text-xs underline">
              Preços
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {TAMANHOS.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => selecionarTamanho(t)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-colors
                  ${tamanho === t
                    ? 'bg-pantera-purple text-white border-pantera-purple'
                    : 'border-pantera-purple/20 text-pantera-lavender hover:border-pantera-purple/40'}`}
              >
                {t}
              </button>
            ))}
            <div className="flex items-center gap-1 ml-auto">
              <button type="button" onClick={() => mudarQtd(-1)} className="btn-ghost p-1.5" aria-label="Diminuir">
                <Minus size={14} />
              </button>
              <span className="w-8 text-center text-white font-semibold">{qtd}</span>
              <button type="button" onClick={() => mudarQtd(1)} className="btn-ghost p-1.5" aria-label="Aumentar">
                <Plus size={14} />
              </button>
            </div>
          </div>
          {precoFaltando && (
            <div className="flex items-center gap-2 text-pending text-xs mt-2">
              <AlertCircle size={13} className="shrink-0" />
              <span>Preço de {tamanho} não definido. <button type="button" onClick={onOpenPrecos} className="underline">Definir agora</button></span>
            </div>
          )}
        </div>
      )}

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
