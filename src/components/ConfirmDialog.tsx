import { X } from 'lucide-react'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export default function ConfirmDialog({
  title, message, confirmLabel = 'Confirmar', onConfirm, onCancel, danger = false,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="card w-full max-w-sm">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-display text-xl text-white tracking-wide">{title}</h3>
          <button onClick={onCancel} className="text-pantera-lavender hover:text-white">
            <X size={18} />
          </button>
        </div>
        <p className="text-pantera-lavender text-sm mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-ghost">Cancelar</button>
          <button
            onClick={onConfirm}
            className={danger ? 'btn-danger px-4 py-2 rounded-lg font-semibold' : 'btn-primary'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
