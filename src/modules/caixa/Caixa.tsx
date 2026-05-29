import SummaryCard from '@/components/SummaryCard'
import CaixaForm from './CaixaForm'
import CaixaList from './CaixaList'
import { useLancamentos } from './useLancamentos'
import { formatCurrency } from '@/utils/format'

export default function Caixa() {
  const { data: items = [], add, remove } = useLancamentos()

  const entradas = items.filter(i => i.tipo === 'entrada').reduce((s, i) => s + i.valor, 0)
  const saidas = items.filter(i => i.tipo === 'saida').reduce((s, i) => s + i.valor, 0)
  const saldo = entradas - saidas

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <SummaryCard title="Entradas" value={formatCurrency(entradas)} accent="green" />
        <SummaryCard title="Saídas" value={formatCurrency(saidas)} accent="red" />
        <SummaryCard title="Saldo" value={formatCurrency(saldo)} accent={saldo >= 0 ? 'green' : 'red'} />
      </div>

      <CaixaForm
        onSubmit={item => add.mutate(item)}
        loading={add.isPending}
      />

      <CaixaList
        items={items}
        onDelete={id => remove.mutate(id)}
      />
    </div>
  )
}
