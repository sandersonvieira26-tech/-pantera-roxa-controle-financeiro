import type { Periodo } from '@/types'

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' },
  { value: 'tudo', label: 'Tudo' },
]

interface PeriodoTabsProps {
  value: Periodo
  onChange: (periodo: Periodo) => void
}

export default function PeriodoTabs({ value, onChange }: PeriodoTabsProps) {
  return (
    <div className="flex gap-1 mb-3 bg-pantera-card rounded-xl p-1">
      {PERIODOS.map(p => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors
            ${value === p.value ? 'bg-pantera-purple text-white' : 'text-pantera-lavender hover:text-white'}`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
