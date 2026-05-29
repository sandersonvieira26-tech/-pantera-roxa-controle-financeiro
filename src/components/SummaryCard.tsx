interface SummaryCardProps {
  title: string
  value: string
  accent?: 'green' | 'red' | 'yellow' | 'purple'
  size?: 'normal' | 'large'
  primary?: boolean
}

const ACCENTS = {
  green: 'text-income',
  red: 'text-expense',
  yellow: 'text-pending',
  purple: 'text-pantera-pink',
}

export default function SummaryCard({ title, value, accent = 'purple', size = 'normal', primary = false }: SummaryCardProps) {
  return (
    <div className="card p-3">
      <p className="text-[11px] uppercase tracking-widest text-pantera-lavender mb-1">{title}</p>
      <p className={`font-display leading-tight ${ACCENTS[accent]} ${
        primary ? 'text-4xl' : size === 'large' ? 'text-3xl' : 'text-2xl'
      }`}>
        {value}
      </p>
    </div>
  )
}
