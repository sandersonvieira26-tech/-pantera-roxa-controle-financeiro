import { useState } from 'react'
import { Search } from 'lucide-react'
import SummaryCard from '@/components/SummaryCard'
import FiadoForm from './FiadoForm'
import FiadoList from './FiadoList'
import { useFiados } from './useFiados'
import { formatCurrency } from '@/utils/format'

export default function Fiado() {
  const { data: items = [], add, togglePago, remove } = useFiados()
  const [search, setSearch] = useState('')

  const pendente = items.filter(f => !f.pago).reduce((s, f) => s + f.valor, 0)
  const recebido = items.filter(f => f.pago).reduce((s, f) => s + f.valor, 0)

  return (
    <div>
      <div className="mb-3">
        <SummaryCard primary title="A Receber" value={formatCurrency(pendente)} accent="yellow" />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <SummaryCard title="Já Recebido" value={formatCurrency(recebido)} accent="green" />
          <SummaryCard title="Total" value={formatCurrency(pendente + recebido)} accent="purple" />
        </div>
      </div>

      {(add.error || togglePago.error || remove.error) && (
        <div className="text-expense text-sm bg-expense/10 rounded-lg px-3 py-2 mb-3">
          Erro ao salvar. Verifique sua conexão e tente novamente.
        </div>
      )}

      <FiadoForm onSubmit={item => add.mutate(item)} loading={add.isPending} />

      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-pantera-lavender" />
        <input
          className="input pl-9"
          placeholder="Buscar por nome do cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <FiadoList
        items={items}
        search={search}
        onToggle={(id, pago) => togglePago.mutate({ id, pago })}
        onDelete={id => remove.mutate(id)}
      />
    </div>
  )
}
