import SummaryCard from '@/components/SummaryCard'
import ParceiroForm from './ParceiroForm'
import ParceiroList from './ParceiroList'
import { useParceiros } from './useParceiros'
import { formatCurrency } from '@/utils/format'

export default function Parceiros() {
  const { data: items = [], add, togglePago, remove } = useParceiros()

  const devem = items.filter(p => !p.pago).reduce((s, p) => s + p.total, 0)
  const acertado = items.filter(p => p.pago).reduce((s, p) => s + p.total, 0)

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <SummaryCard title="Parceiros Devem" value={formatCurrency(devem)} accent="yellow" />
        <SummaryCard title="Já Acertado" value={formatCurrency(acertado)} accent="green" />
      </div>

      <ParceiroForm onSubmit={item => add.mutate(item)} loading={add.isPending} />

      <ParceiroList
        items={items}
        onToggle={(id, pago) => togglePago.mutate({ id, pago })}
        onDelete={id => remove.mutate(id)}
      />
    </div>
  )
}
