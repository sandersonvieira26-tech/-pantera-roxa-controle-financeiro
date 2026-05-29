interface BadgeProps {
  variant: 'pending' | 'paid' | 'receivable'
  children: React.ReactNode
}

const VARIANTS = {
  pending: 'bg-pending/20 text-pending border border-pending/30',
  paid: 'bg-income/20 text-income border border-income/30',
  receivable: 'bg-pending/20 text-pending border border-pending/30',
}

export default function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${VARIANTS[variant]}`}>
      {children}
    </span>
  )
}
