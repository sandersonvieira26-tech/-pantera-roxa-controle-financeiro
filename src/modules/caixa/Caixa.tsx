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
      <div className="mb-3">
        <SummaryCard primary title="Saldo" value={formatCurrency(saldo)} accent={saldo >= 0 ? 'green' : 'red'} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <SummaryCard title="Entradas" value={formatCurrency(entradas)} accent="green" />
          <SummaryCard title="Saídas" value={formatCurrency(saidas)} accent="red" />
        </div>
      </div>

      {(add.error || remove.error) && (
        <div className="text-expense text-sm bg-expense/10 rounded-lg px-3 py-2 mb-3">
          Erro ao salvar. Verifique sua conexão e tente novamente.
        </div>
      )}

      <CaixaForm onSubmit={item => add.mutate(item)} loading={add.isPending} />
      <CaixaList items={items} onDelete={id => remove.mutate(id)} />
    </div>
  )
}
