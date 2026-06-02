import { X, Trash2, AlertCircle } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import { useClientes } from './useClientes'

interface ClientesModalProps {
  onClose: () => void
}

export default function ClientesModal({ onClose }: ClientesModalProps) {
  const { data: clientes = [], remove } = useClientes()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="card w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl text-white tracking-wide">CLIENTES</h3>
          <button onClick={onClose} className="text-pantera-lavender hover:text-white"><X size={18} /></button>
        </div>

        <p className="text-pantera-lavender text-xs mb-3">Nomes salvos ao registrar fiados. Apague aqui os que estiverem errados.</p>

        {remove.error && (
          <div className="flex items-center gap-2 text-expense text-sm mb-3 bg-expense/10 rounded-lg px-3 py-2">
            <AlertCircle size={15} className="shrink-0" />
            Erro ao apagar. Tente novamente.
          </div>
        )}

        {clientes.length === 0 ? (
          <EmptyState message="Nenhum cliente salvo" />
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {clientes.map(c => (
              <div key={c.id} className="bg-pantera-card rounded-xl py-2 px-3 flex items-center gap-2">
                <span className="flex-1 text-white text-sm truncate">{c.nome}</span>
                <button
                  onClick={() => { remove.reset(); remove.mutate(c.id) }}
                  className="btn-danger p-1 shrink-0"
                  title="Apagar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
