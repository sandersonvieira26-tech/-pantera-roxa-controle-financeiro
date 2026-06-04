import { useState } from 'react'
import { Tag, DollarSign } from 'lucide-react'
import SummaryCard from '@/components/SummaryCard'
import PeriodoTabs from '@/components/PeriodoTabs'
import CaixaForm from './CaixaForm'
import CaixaList from './CaixaList'
import CategoriasModal from './CategoriasModal'
import PrecosModal from './PrecosModal'
import { useLancamentos } from './useLancamentos'
import { formatCurrency, filterByPeriod } from '@/utils/format'
import type { Periodo } from '@/types'

export default function Caixa() {
  const { data: items = [], add, remove } = useLancamentos()
  const [showCategorias, setShowCategorias] = useState(false)
  const [showPrecos, setShowPrecos] = useState(false)
  const [periodo, setPeriodo] = useState<Periodo>('mes')
  const [limite, setLimite] = useState(25)

  const visiveis = filterByPeriod(items, periodo)
  const mostrados = visiveis.slice(0, limite)
  const entradas = visiveis.filter(i => i.tipo === 'entrada').reduce((s, i) => s + i.valor, 0)
  const saidas = visiveis.filter(i => i.tipo === 'saida').reduce((s, i) => s + i.valor, 0)
  const saldo = entradas - saidas

  function trocarPeriodo(p: Periodo) {
    setPeriodo(p)
    setLimite(25)
  }

  return (
    <div>
      <PeriodoTabs value={periodo} onChange={trocarPeriodo} />

      <div className="mb-3">
        <SummaryCard primary title="Saldo" value={formatCurrency(saldo)} accent={saldo >= 0 ? 'green' : 'red'} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <SummaryCard title="Entradas" value={formatCurrency(entradas)} accent="green" />
          <SummaryCard title="Saídas" value={formatCurrency(saidas)} accent="red" />
        </div>
      </div>

      <div className="flex justify-end gap-2 mb-3">
        <button onClick={() => setShowPrecos(true)} className="btn-ghost flex items-center gap-2 text-sm">
          <DollarSign size={15} />
          Preços
        </button>
        <button onClick={() => setShowCategorias(true)} className="btn-ghost flex items-center gap-2 text-sm">
          <Tag size={15} />
          Gerenciar categorias
        </button>
      </div>

      {(add.error || remove.error) && (
        <div className="text-expense text-sm bg-expense/10 rounded-lg px-3 py-2 mb-3">
          Erro ao salvar. Verifique sua conexão e tente novamente.
        </div>
      )}

      <CaixaForm onSubmit={item => add.mutate(item)} loading={add.isPending} onOpenPrecos={() => setShowPrecos(true)} />
      <CaixaList items={mostrados} onDelete={id => remove.mutate(id)} />

      {visiveis.length > limite && (
        <button onClick={() => setLimite(l => l + 25)} className="btn-ghost w-full mt-2 text-sm">
          Ver mais ({visiveis.length - limite})
        </button>
      )}

      {showCategorias && <CategoriasModal onClose={() => setShowCategorias(false)} />}
      {showPrecos && <PrecosModal onClose={() => setShowPrecos(false)} />}
    </div>
  )
}
