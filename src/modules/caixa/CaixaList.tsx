import { useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Trash2 } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import ConfirmDialog from '@/components/ConfirmDialog'
import { formatCurrency, formatDate } from '@/utils/format'
import type { Lancamento } from '@/types'

interface CaixaListProps {
  items: Lancamento[]
  onDelete: (id: string) => void
}

export default function CaixaList({ items, onDelete }: CaixaListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  if (items.length === 0) {
    return <EmptyState message="Nenhum lançamento ainda" />
  }

  return (
    <>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="card flex items-center gap-3 py-3">
            {item.tipo === 'entrada'
              ? <ArrowDownCircle size={20} className="text-income shrink-0" />
              : <ArrowUpCircle size={20} className="text-expense shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{item.descricao}</p>
              <p className="text-pantera-lavender text-xs">{formatDate(item.data)}</p>
            </div>
            <span className={`font-semibold text-sm shrink-0 ${item.tipo === 'entrada' ? 'text-income' : 'text-expense'}`}>
              {item.tipo === 'entrada' ? '+' : '−'}{formatCurrency(item.valor)}
            </span>
            <button onClick={() => setDeleteId(item.id)} className="btn-danger p-1.5 shrink-0">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      {deleteId && (
        <ConfirmDialog
          title="Excluir lançamento?"
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
