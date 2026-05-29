import { useState } from 'react'
import { Trash2, CheckCircle, XCircle } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import ConfirmDialog from '@/components/ConfirmDialog'
import { formatCurrency, formatDate } from '@/utils/format'
import type { Parceiro } from '@/types'

interface ParceiroListProps {
  items: Parceiro[]
  onToggle: (id: string, pago: boolean) => void
  onDelete: (id: string) => void
}

export default function ParceiroList({ items, onToggle, onDelete }: ParceiroListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  if (items.length === 0) return <EmptyState message="Nenhuma entrega registrada ainda" />

  return (
    <>
      <div className="space-y-1.5">
        {items.map(item => (
          <div
            key={item.id}
            className={`bg-pantera-card rounded-xl py-2.5 px-3 flex items-center gap-3 border-l-4 transition-colors duration-300 animate-fadeIn
              ${item.pago ? 'border-income' : 'border-pending'}`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">{item.nome_parceiro}</p>
              <p className="text-pantera-lavender/70 text-xs mt-0.5">
                {item.quantidade}un × {formatCurrency(item.valor_unitario)} · {formatDate(item.data)}
              </p>
            </div>
            <span className={`font-semibold text-sm shrink-0 ${item.pago ? 'text-income' : 'text-pending'}`}>
              {formatCurrency(item.total)}
            </span>
            <button
              onClick={() => onToggle(item.id, !item.pago)}
              className={`p-1 rounded-lg transition-colors shrink-0 ${item.pago ? 'text-income/60 hover:text-expense' : 'text-pending hover:text-income'}`}
            >
              {item.pago ? <XCircle size={16} /> : <CheckCircle size={16} />}
            </button>
            <button onClick={() => setDeleteId(item.id)} className="btn-danger p-1 shrink-0">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      {deleteId && (
        <ConfirmDialog
          title="Excluir entrega?"
          message="Essa ação não pode ser desfeita."
          confirmLabel="Excluir"
          danger
          onConfirm={() => { onDelete(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </>
  )
}
