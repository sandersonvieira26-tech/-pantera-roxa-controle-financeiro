import { Target, ArrowUp, ArrowDown } from 'lucide-react'
import { formatCurrency } from '@/utils/format'
import type { Meta } from '@/types'

interface RelatorioMetaProps {
  mesAtual: { faturamento: number; lucro: number }
  variacao: { faturamento: number | null; lucro: number | null }
  meta: Meta | null | undefined
  onOpenMeta: () => void
}

function BarraMeta({ label, atual, meta }: { label: string; atual: number; meta: number }) {
  const pct = meta > 0 ? Math.max(0, Math.min(100, (atual / meta) * 100)) : 0
  const atingiu = meta > 0 && atual >= meta
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-white">{label}</span>
        <span className="text-pantera-lavender">
          {meta > 0
            ? <>{formatCurrency(atual)} / {formatCurrency(meta)} <span className="text-pantera-lavender/60">({pct.toFixed(0)}%)</span></>
            : <span className="text-pantera-lavender/60">defina sua meta</span>}
        </span>
      </div>
      <div className="h-1.5 bg-pantera-purple/15 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${atingiu ? 'bg-income' : 'bg-pantera-purple'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function Variacao({ label, pct }: { label: string; pct: number | null }) {
  if (pct === null) {
    return <span className="text-pantera-lavender text-sm">{label} <span className="text-pantera-lavender/60">—</span></span>
  }
  const sobe = pct >= 0
  return (
    <span className="text-sm text-pantera-lavender flex items-center gap-1">
      {label}
      <span className={`flex items-center gap-0.5 font-semibold ${sobe ? 'text-income' : 'text-expense'}`}>
        {sobe ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
        {Math.abs(pct).toFixed(0)}%
      </span>
    </span>
  )
}

export default function RelatorioMeta({ mesAtual, variacao, meta, onOpenMeta }: RelatorioMetaProps) {
  return (
    <div className="card mb-3">
      <div className="flex items-center justify-between mb-3">
        <p className="label">Mês atual</p>
        <button onClick={onOpenMeta} className="text-pantera-lavender hover:text-white flex items-center gap-1.5 text-xs">
          <Target size={14} />
          Meta
        </button>
      </div>

      <div className="space-y-2.5">
        <BarraMeta label="Faturamento" atual={mesAtual.faturamento} meta={meta?.meta_faturamento ?? 0} />
        <BarraMeta label="Lucro" atual={mesAtual.lucro} meta={meta?.meta_lucro ?? 0} />
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 pt-3 border-t border-pantera-purple/15">
        <span className="text-pantera-lavender/60 text-xs uppercase tracking-widest w-full">vs mês passado</span>
        <Variacao label="Faturamento" pct={variacao.faturamento} />
        <Variacao label="Lucro" pct={variacao.lucro} />
      </div>
    </div>
  )
}
