import { useState } from 'react'
import { Trash2, CheckCircle, XCircle } from 'lucide-react'
import Badge from '@/components/Badge'
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
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="card flex items-center gap-3 py-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white text-sm font-medium">{item.nome_parceiro}</span>
                <Badge variant={item.pago ? 'paid' : 'receivable'}>{item.pago ? 'ACERTADO' : 'A RECEBER'}</Badge>
              </div>
              <p className="text-pantera-lavender text-xs mt-0.5">
                {item.quantidade}un × {formatCurrency(item.valor_unitario)} · {formatDate(item.data)}
              </p>
            </div>
            <span className="font-semibold text-sm text-income shrink-0">{formatCurrency(item.total)}</span>
            <button
              onClick={() => onToggle(item.id, !item.pago)}
              className={`p-1.5 rounded-lg transition-colors shrink-0 ${item.pago ? 'text-income/60 hover:text-expense' : 'text-pending hover:text-income'}`}
            >
              {item.pago ? <XCircle size={18} /> : <CheckCircle size={18} />}
            </button>
            <button onClick={() => setDeleteId(item.id)} className="btn-danger p-1.5 shrink-0">
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
