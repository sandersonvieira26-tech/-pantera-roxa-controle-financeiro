import { useState } from 'react'
import { Trash2 } from 'lucide-react'
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
      <div className="space-y-1.5">
        {items.map(item => (
          <div
            key={item.id}
            className={`bg-pantera-card rounded-xl py-2.5 px-3 flex items-center gap-3 border-l-4 transition-colors duration-300 animate-fadeIn
              ${item.tipo === 'entrada' ? 'border-income' : 'border-expense'}`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{item.descricao}</p>
              <p className="text-pantera-lavender/70 text-xs">{formatDate(item.data)}</p>
            </div>
            <span className={`font-semibold text-sm shrink-0 ${item.tipo === 'entrada' ? 'text-income' : 'text-expense'}`}>
              {item.tipo === 'entrada' ? '+' : '−'}{formatCurrency(item.valor)}
            </span>
            <button onClick={() => setDeleteId(item.id)} className="btn-danger p-1 shrink-0">
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
