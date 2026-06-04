import EvolucaoChart from './EvolucaoChart'
import { useDashboard } from './useDashboard'
import { formatCurrency } from '@/utils/format'
import type { Tab } from '@/types'

interface DashboardProps {
  onNavigate: (tab: Tab) => void
}

function DashCard({ title, value, accent, onClick }: {
  title: string
  value: string
  accent: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="card p-3 text-left w-full enabled:hover:border-pantera-purple/40 transition-colors disabled:cursor-default"
    >
      <p className="text-[11px] uppercase tracking-widest text-pantera-lavender mb-1">{title}</p>
      <p className={`font-display leading-tight text-2xl ${accent}`}>{value}</p>
    </button>
  )
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { vendasHoje, saldoMes, aReceber, lucroMes, metaLucro, contagemHoje, evolucao } = useDashboard()

  const pctMeta = metaLucro > 0 ? Math.max(0, Math.min(100, (lucroMes / metaLucro) * 100)) : 0

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <DashCard title="Vendas de hoje" value={formatCurrency(vendasHoje)} accent="text-income" onClick={() => onNavigate('caixa')} />
        <DashCard title="Saldo do mês" value={formatCurrency(saldoMes)} accent={saldoMes >= 0 ? 'text-income' : 'text-expense'} onClick={() => onNavigate('caixa')} />
        <DashCard title="A Receber" value={formatCurrency(aReceber)} accent="text-pending" onClick={() => onNavigate('fiado')} />
        <DashCard title="Lucro do mês" value={formatCurrency(lucroMes)} accent={lucroMes >= 0 ? 'text-income' : 'text-expense'} onClick={() => onNavigate('relatorio')} />
      </div>

      {/* Progresso da meta de lucro */}
      <div className="card mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-white">Meta de lucro</span>
          <span className="text-pantera-lavender">
            {metaLucro > 0
              ? <>{formatCurrency(lucroMes)} / {formatCurrency(metaLucro)} <span className="text-pantera-lavender/60">({pctMeta.toFixed(0)}%)</span></>
              : <button onClick={() => onNavigate('relatorio')} className="text-pantera-lavender/60 underline">defina no Relatório</button>}
          </span>
        </div>
        <div className="h-1.5 bg-pantera-purple/15 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${metaLucro > 0 && lucroMes >= metaLucro ? 'bg-income' : 'bg-pantera-purple'}`} style={{ width: `${pctMeta}%` }} />
        </div>
      </div>

      {/* Conferência do dia */}
      <div className="card mb-3">
        <p className="label mb-1">Hoje</p>
        <p className="text-white text-lg font-semibold">
          {contagemHoje.vendas} {contagemHoje.vendas === 1 ? 'venda' : 'vendas'}
          <span className="text-pantera-lavender/60"> • </span>
          {contagemHoje.garrafas} {contagemHoje.garrafas === 1 ? 'garrafa' : 'garrafas'}
        </p>
        <p className="text-pantera-lavender text-xs mt-1">Venda rápida + fiado rápido</p>
      </div>

      <EvolucaoChart data={evolucao} />
    </div>
  )
}
