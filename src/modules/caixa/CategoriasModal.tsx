import { useState } from 'react'
import { X, Plus, Pencil, Trash2, Check, AlertCircle } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import { useCategorias } from './useCategorias'

interface CategoriasModalProps {
  onClose: () => void
}

export default function CategoriasModal({ onClose }: CategoriasModalProps) {
  const { data: categorias = [], add, rename, remove } = useCategorias()
  const [novo, setNovo] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editNome, setEditNome] = useState('')

  const erro = add.error || rename.error || remove.error

  // Limpa erros de outras ações pra não deixar banner "fantasma" na tela.
  function resetErros() {
    add.reset()
    rename.reset()
    remove.reset()
  }

  function handleAdd() {
    const nome = novo.trim()
    if (!nome) return
    resetErros()
    add.mutate(nome, { onSuccess: () => setNovo('') })
  }

  function startEdit(id: string, nome: string) {
    resetErros()
    setEditId(id)
    setEditNome(nome)
  }

  function saveEdit() {
    const nome = editNome.trim()
    if (editId && nome) {
      resetErros()
      rename.mutate({ id: editId, nome }, { onSuccess: () => setEditId(null) })
    }
  }

  function handleRemove(id: string) {
    resetErros()
    remove.mutate(id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="card w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl text-white tracking-wide">CATEGORIAS</h3>
          <button onClick={onClose} className="text-pantera-lavender hover:text-white"><X size={18} /></button>
        </div>

        <div className="flex gap-2 mb-3">
          <input
            className="input"
            placeholder="Nova categoria"
            value={novo}
            onChange={e => setNovo(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
          />
          <button onClick={handleAdd} disabled={add.isPending || !novo.trim()} className="btn-primary px-3 shrink-0">
            <Plus size={16} />
          </button>
        </div>

        {erro && (
          <div className="flex items-center gap-2 text-expense text-sm mb-3 bg-expense/10 rounded-lg px-3 py-2">
            <AlertCircle size={15} className="shrink-0" />
            {erro.message}
          </div>
        )}

        {categorias.length === 0 ? (
          <EmptyState message="Nenhuma categoria" />
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {categorias.map(c => (
              <div key={c.id} className="bg-pantera-card rounded-xl py-2 px-3 flex items-center gap-2">
                {editId === c.id ? (
                  <>
                    <input
                      className="input py-1"
                      value={editNome}
                      autoFocus
                      onChange={e => setEditNome(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); saveEdit() } }}
                    />
                    <button onClick={saveEdit} disabled={rename.isPending || !editNome.trim()} className="text-income hover:text-income/70 p-1 shrink-0">
                      <Check size={16} />
                    </button>
                    <button onClick={() => setEditId(null)} className="text-pantera-lavender hover:text-white p-1 shrink-0">
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-white text-sm truncate">{c.nome}</span>
                    <button onClick={() => startEdit(c.id, c.nome)} className="text-pantera-lavender hover:text-white p-1 shrink-0" title="Renomear">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleRemove(c.id)} className="btn-danger p-1 shrink-0" title="Apagar">
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
