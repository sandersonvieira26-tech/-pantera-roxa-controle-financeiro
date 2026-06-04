import { useState } from 'react'
import { Trash2, CheckCircle, XCircle } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import ConfirmDialog from '@/components/ConfirmDialog'
import { formatCurrency, formatDate } from '@/utils/format'
import type { Fiado } from '@/types'

interface FiadoListProps {
  items: Fiado[]
  emptyMessage?: string
  onToggle: (id: string, pago: boolean) => void
  onDelete: (id: string) => void
}

export default function FiadoList({ items, emptyMessage = 'Nenhum fiado ainda', onToggle, onDelete }: FiadoListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  if (items.length === 0) {
    return <EmptyState message={emptyMessage} />
  }

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
              <p className="text-white text-sm font-medium">{item.nome_cliente}</p>
              <p className="text-pantera-lavender/70 text-xs truncate mt-0.5">{item.descricao} · {formatDate(item.data)}</p>
            </div>
            <span className={`font-semibold text-sm shrink-0 ${item.pago ? 'text-income' : 'text-pending'}`}>
              {formatCurrency(item.valor)}
            </span>
            <button
              onClick={() => onToggle(item.id, !item.pago)}
              className={`p-1 rounded-lg transition-colors shrink-0 ${item.pago ? 'text-income/60 hover:text-expense' : 'text-pending hover:text-income'}`}
              title={item.pago ? 'Marcar como pendente' : 'Marcar como pago'}
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
          title="Excluir fiado?"
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
