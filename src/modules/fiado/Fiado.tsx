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
      <div className="grid grid-cols-2 gap-3 mb-4">
        <SummaryCard title="A Receber" value={formatCurrency(pendente)} accent="yellow" />
        <SummaryCard title="Já Recebido" value={formatCurrency(recebido)} accent="green" />
      </div>

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
