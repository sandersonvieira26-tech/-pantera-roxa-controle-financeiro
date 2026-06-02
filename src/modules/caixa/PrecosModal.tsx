import { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { usePrecos } from './usePrecos'
import { TAMANHOS } from '@/types'
import type { Tamanho } from '@/types'

interface PrecosModalProps {
  onClose: () => void
}

export default function PrecosModal({ onClose }: PrecosModalProps) {
  const { getPreco, upsert } = usePrecos()
  // Só guarda o que o usuário editou; o resto mostra o preço atual carregado.
  const [editado, setEditado] = useState<Partial<Record<Tamanho, string>>>({})

  const valorCampo = (t: Tamanho) => editado[t] ?? getPreco(t)?.toString() ?? ''

  async function handleSave() {
    const alvos = TAMANHOS
      .map(t => ({ tamanho: t, preco: parseFloat(valorCampo(t)) }))
      .filter(x => Number.isFinite(x.preco) && x.preco > 0)
    try {
      await Promise.all(alvos.map(x => upsert.mutateAsync(x)))
      onClose()
    } catch {
      // Erro fica visível no banner (upsert.error); mantém o modal aberto.
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="card w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl text-white tracking-wide">PREÇOS</h3>
          <button onClick={onClose} className="text-pantera-lavender hover:text-white"><X size={18} /></button>
        </div>

        <p className="text-pantera-lavender text-xs mb-3">Preço de venda de cada tamanho. Usado na venda rápida.</p>

        <div className="space-y-3">
          {TAMANHOS.map(t => (
            <div key={t}>
              <label className="text-[11px] uppercase tracking-widest text-pantera-lavender block mb-1">{t} (R$)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={valorCampo(t)}
                onChange={e => setEditado(v => ({ ...v, [t]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        {upsert.error && (
          <div className="flex items-center gap-2 text-expense text-sm mt-3 bg-expense/10 rounded-lg px-3 py-2">
            <AlertCircle size={15} className="shrink-0" />
            Erro ao salvar. Verifique sua conexão e tente novamente.
          </div>
        )}

        <div className="flex gap-3 justify-end mt-5">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={handleSave} disabled={upsert.isPending} className="btn-primary">
            {upsert.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
