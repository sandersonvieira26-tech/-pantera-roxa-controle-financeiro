interface EmptyStateProps {
  message: string
  icon?: React.ReactNode
}

export default function EmptyState({ message, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-pantera-lavender/60">
      {icon && <div className="mb-3 opacity-40">{icon}</div>}
      <p className="text-sm">{message}</p>
    </div>
  )
}
