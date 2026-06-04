import { useState } from 'react'
import { Search, Users } from 'lucide-react'
import SummaryCard from '@/components/SummaryCard'
import PeriodoTabs from '@/components/PeriodoTabs'
import FiadoForm from './FiadoForm'
import FiadoList from './FiadoList'
import ClientesModal from './ClientesModal'
import PrecosModal from '@/modules/caixa/PrecosModal'
import { fiadosVisiveis } from './filtrarFiados'
import { useFiados } from './useFiados'
import { formatCurrency, filterByPeriod } from '@/utils/format'
import type { Periodo } from '@/types'

export default function Fiado() {
  const { data: items = [], add, addRapido, togglePago, remove } = useFiados()
  const [search, setSearch] = useState('')
  const [showClientes, setShowClientes] = useState(false)
  const [showPrecos, setShowPrecos] = useState(false)
  const [periodo, setPeriodo] = useState<Periodo>('mes')
  const [limite, setLimite] = useState(25)

  const visiveis = fiadosVisiveis(items, periodo)
  const buscados = search
    ? visiveis.filter(f => f.nome_cliente.toLowerCase().includes(search.toLowerCase()))
    : visiveis
  const mostrados = buscados.slice(0, limite)
  // A Receber = todos os pendentes (dívida real). Já Recebido = pagos no período.
  const pendente = items.filter(f => !f.pago).reduce((s, f) => s + f.valor, 0)
  const recebido = filterByPeriod(items.filter(f => f.pago), periodo).reduce((s, f) => s + f.valor, 0)

  function trocarPeriodo(p: Periodo) {
    setPeriodo(p)
    setLimite(25)
  }

  function trocarBusca(s: string) {
    setSearch(s)
    setLimite(25)
  }

  return (
    <div>
      <PeriodoTabs value={periodo} onChange={trocarPeriodo} />

      <div className="mb-3">
        <SummaryCard primary title="A Receber" value={formatCurrency(pendente)} accent="yellow" />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <SummaryCard title="Já Recebido" value={formatCurrency(recebido)} accent="green" />
          <SummaryCard title="Total" value={formatCurrency(pendente + recebido)} accent="purple" />
        </div>
      </div>

      <div className="flex justify-end mb-3">
        <button onClick={() => setShowClientes(true)} className="btn-ghost flex items-center gap-2 text-sm">
          <Users size={15} />
          Clientes
        </button>
      </div>

      {(add.error || addRapido.error || togglePago.error || remove.error) && (
        <div className="text-expense text-sm bg-expense/10 rounded-lg px-3 py-2 mb-3">
          Erro ao salvar. Verifique sua conexão e tente novamente.
        </div>
      )}

      <FiadoForm
        onSubmit={item => add.mutate(item)}
        onSubmitRapido={r => addRapido.mutate(r)}
        loading={add.isPending}
        loadingRapido={addRapido.isPending}
        onOpenPrecos={() => setShowPrecos(true)}
      />

      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-pantera-lavender" />
        <input
          className="input pl-9"
          placeholder="Buscar por nome do cliente..."
          value={search}
          onChange={e => trocarBusca(e.target.value)}
        />
      </div>

      <FiadoList
        items={mostrados}
        emptyMessage={search ? 'Nenhum cliente encontrado' : 'Nenhum fiado ainda'}
        onToggle={(id, pago) => togglePago.mutate({ id, pago })}
        onDelete={id => remove.mutate(id)}
      />

      {buscados.length > limite && (
        <button onClick={() => setLimite(l => l + 25)} className="btn-ghost w-full mt-2 text-sm">
          Ver mais ({buscados.length - limite})
        </button>
      )}

      {showClientes && <ClientesModal onClose={() => setShowClientes(false)} />}
      {showPrecos && <PrecosModal onClose={() => setShowPrecos(false)} />}
    </div>
  )
}
