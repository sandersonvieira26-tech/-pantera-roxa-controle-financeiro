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
      <div className="mb-3">
        <SummaryCard primary title="Parceiros Devem" value={formatCurrency(devem)} accent="yellow" />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <SummaryCard title="Já Acertado" value={formatCurrency(acertado)} accent="green" />
          <SummaryCard title="Total" value={formatCurrency(devem + acertado)} accent="purple" />
        </div>
      </div>

      {(add.error || togglePago.error || remove.error) && (
        <div className="text-expense text-sm bg-expense/10 rounded-lg px-3 py-2 mb-3">
          Erro ao salvar. Verifique sua conexão e tente novamente.
        </div>
      )}

      <ParceiroForm onSubmit={item => add.mutate(item)} loading={add.isPending} />
      <ParceiroList
        items={items}
        onToggle={(id, pago) => togglePago.mutate({ id, pago })}
        onDelete={id => remove.mutate(id)}
      />
    </div>
  )
}
