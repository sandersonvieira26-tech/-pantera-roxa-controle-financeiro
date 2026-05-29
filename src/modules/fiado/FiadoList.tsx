import { useState } from 'react'
import { Trash2, CheckCircle, XCircle } from 'lucide-react'
import Badge from '@/components/Badge'
import EmptyState from '@/components/EmptyState'
import ConfirmDialog from '@/components/ConfirmDialog'
import { formatCurrency, formatDate } from '@/utils/format'
import type { Fiado } from '@/types'

interface FiadoListProps {
  items: Fiado[]
  search: string
  onToggle: (id: string, pago: boolean) => void
  onDelete: (id: string) => void
}

export default function FiadoList({ items, search, onToggle, onDelete }: FiadoListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = search
    ? items.filter(f => f.nome_cliente.toLowerCase().includes(search.toLowerCase()))
    : items

  if (filtered.length === 0) {
    return <EmptyState message={search ? 'Nenhum cliente encontrado' : 'Nenhum fiado ainda'} />
  }

  return (
    <>
      <div className="space-y-2">
        {filtered.map(item => (
          <div key={item.id} className="card flex items-center gap-3 py-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white text-sm font-medium">{item.nome_cliente}</span>
                <Badge variant={item.pago ? 'paid' : 'pending'}>{item.pago ? 'PAGO' : 'PENDENTE'}</Badge>
              </div>
              <p className="text-pantera-lavender text-xs truncate mt-0.5">{item.descricao} · {formatDate(item.data)}</p>
            </div>
            <span className="font-semibold text-sm text-white shrink-0">{formatCurrency(item.valor)}</span>
            <button
              onClick={() => onToggle(item.id, !item.pago)}
              className={`p-1.5 rounded-lg transition-colors shrink-0 ${item.pago ? 'text-income/60 hover:text-expense' : 'text-pending hover:text-income'}`}
              title={item.pago ? 'Marcar como pendente' : 'Marcar como pago'}
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
