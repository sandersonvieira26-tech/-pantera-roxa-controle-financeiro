import { useState } from 'react'
import SummaryCard from '@/components/SummaryCard'
import RelatorioChart from './RelatorioChart'
import { useRelatorio } from './useRelatorio'
import { formatCurrency } from '@/utils/format'
import type { Periodo } from '@/types'

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' },
  { value: 'tudo', label: 'Tudo' },
]

export default function Relatorio() {
  const [periodo, setPeriodo] = useState<Periodo>('mes')
  const { faturamento, custos, lucro, margem, aReceber, chartData, custosPorCategoria } = useRelatorio(periodo)

  return (
    <div>
      <div className="flex gap-1 mb-4 bg-pantera-card rounded-xl p-1">
        {PERIODOS.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriodo(p.value)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${periodo === p.value ? 'bg-pantera-purple text-white' : 'text-pantera-lavender hover:text-white'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <SummaryCard title="Faturamento" value={formatCurrency(faturamento)} accent="purple" />
        <SummaryCard title="Custos" value={formatCurrency(custos)} accent="red" />
        <SummaryCard title="Lucro" value={formatCurrency(lucro)} accent={lucro >= 0 ? 'green' : 'red'} />
        <SummaryCard
          title="Margem"
          value={margem !== null ? `${margem.toFixed(1)}%` : '—'}
          accent="purple"
        />
      </div>

      <div className="card border-pantera-pink/30 bg-pantera-pink/5">
        <p className="label mb-1">A Receber</p>
        <p className="font-display text-3xl text-pantera-pink">{formatCurrency(aReceber)}</p>
        <p className="text-pantera-lavender text-xs mt-1">Fiados + parceiros pendentes</p>
      </div>

      <RelatorioChart data={chartData} />

      {custosPorCategoria.length > 0 && (
        <div className="card mt-3">
          <p className="label mb-3">Custos por categoria</p>
          <div className="space-y-2.5">
            {custosPorCategoria.map(c => (
              <div key={c.nome}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-white">{c.nome}</span>
                  <span className="text-pantera-lavender">
                    {formatCurrency(c.valor)} <span className="text-pantera-lavender/60">({c.pct.toFixed(0)}%)</span>
                  </span>
                </div>
                <div className="h-1.5 bg-pantera-purple/15 rounded-full overflow-hidden">
                  <div className="h-full bg-expense rounded-full" style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
