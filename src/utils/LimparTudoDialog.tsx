import { useState, useRef, useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'

interface LimparTudoDialogProps {
  onClose: () => void
}

export default function LimparTudoDialog({ onClose }: LimparTudoDialogProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const mountedRef = useRef(true)
  useEffect(() => () => { mountedRef.current = false }, [])

  async function handleLimpar() {
    if (confirmText !== 'LIMPAR') return
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sessão expirada.')
      const uid = user.id

      const results = await Promise.all([
        supabase.from('lancamentos').delete().eq('user_id', uid),
        supabase.from('fiados').delete().eq('user_id', uid),
        supabase.from('parceiros').delete().eq('user_id', uid),
        supabase.from('estoque').delete().eq('user_id', uid),
      ])

      const err = results.find(r => r.error)?.error
      if (err) throw err

      await queryClient.invalidateQueries()
      if (mountedRef.current) onClose()
    } catch (e: any) {
      if (mountedRef.current) setError('Erro ao limpar dados. Tente novamente.')
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="card w-full max-w-sm border-expense/30">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-expense" />
            <h3 className="font-display text-xl text-expense tracking-wide">LIMPAR TUDO</h3>
          </div>
          <button onClick={onClose} className="text-pantera-lavender hover:text-white"><X size={18} /></button>
        </div>

        {step === 1 && (
          <>
            <p className="text-pantera-lavender text-sm mb-5">
              Essa ação apaga <strong className="text-white">todos os dados</strong> do app (lançamentos, fiados, parceiros e estoque). Essa ação <strong className="text-expense">não pode ser desfeita</strong>.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={onClose} className="btn-ghost">Cancelar</button>
              <button onClick={() => setStep(2)} className="btn-danger px-4 py-2 rounded-lg font-semibold">
                Continuar
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-pantera-lavender text-sm mb-3">
              Digite <strong className="text-expense">LIMPAR</strong> para confirmar:
            </p>
            <input
              className="input mb-4"
              placeholder="Digite LIMPAR"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              autoFocus
            />
            {error && <p className="text-expense text-sm mb-3">{error}</p>}
            <div className="flex gap-3 justify-end">
              <button onClick={onClose} className="btn-ghost">Cancelar</button>
              <button
                onClick={handleLimpar}
                disabled={confirmText !== 'LIMPAR' || loading}
                className="btn-danger px-4 py-2 rounded-lg font-semibold disabled:opacity-40"
              >
                {loading ? 'Limpando...' : 'Apagar tudo'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
