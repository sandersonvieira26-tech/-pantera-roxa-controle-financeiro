interface SummaryCardProps {
  title: string
  value: string
  accent?: 'green' | 'red' | 'yellow' | 'purple'
  size?: 'normal' | 'large'
}

const ACCENTS = {
  green: 'text-income',
  red: 'text-expense',
  yellow: 'text-pending',
  purple: 'text-pantera-pink',
}

export default function SummaryCard({ title, value, accent = 'purple', size = 'normal' }: SummaryCardProps) {
  return (
    <div className="card">
      <p className="label mb-1">{title}</p>
      <p className={`font-display leading-tight ${ACCENTS[accent]} ${size === 'large' ? 'text-3xl' : 'text-2xl'}`}>
        {value}
      </p>
    </div>
  )
}
