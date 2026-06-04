import { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { useMetas } from './useMetas'

interface MetaModalProps {
  onClose: () => void
}

type Campo = 'faturamento' | 'lucro'

export default function MetaModal({ onClose }: MetaModalProps) {
  const { data: meta, upsert } = useMetas()
  // Só guarda o que o usuário editou; o resto mostra o valor atual carregado.
  const [editado, setEditado] = useState<Partial<Record<Campo, string>>>({})

  const valorCampo = (c: Campo) =>
    editado[c] ?? (c === 'faturamento' ? meta?.meta_faturamento : meta?.meta_lucro)?.toString() ?? ''

  function parse(c: Campo): number {
    const n = parseFloat(valorCampo(c))
    return Number.isFinite(n) && n >= 0 ? n : 0
  }

  async function handleSave() {
    try {
      await upsert.mutateAsync({ meta_faturamento: parse('faturamento'), meta_lucro: parse('lucro') })
      onClose()
    } catch {
      // Erro fica visível no banner; mantém o modal aberto.
    }
  }

  const campos: { campo: Campo; label: string }[] = [
    { campo: 'faturamento', label: 'Meta de faturamento (R$)' },
    { campo: 'lucro', label: 'Meta de lucro (R$)' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="card w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl text-white tracking-wide">META DO MÊS</h3>
          <button onClick={onClose} className="text-pantera-lavender hover:text-white"><X size={18} /></button>
        </div>

        <p className="text-pantera-lavender text-xs mb-3">Defina suas metas mensais. Deixe 0 pra não acompanhar.</p>

        <div className="space-y-3">
          {campos.map(({ campo, label }) => (
            <div key={campo}>
              <label className="text-[11px] uppercase tracking-widest text-pantera-lavender block mb-1">{label}</label>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={valorCampo(campo)}
                onChange={e => setEditado(v => ({ ...v, [campo]: e.target.value }))}
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
