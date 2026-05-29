import { LogOut, Download, Trash2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatCurrency, startOfMonth } from '@/utils/format'
import type { Lancamento, Fiado, Parceiro } from '@/types'

function useLucroMes() {
  return useQuery({
    queryKey: ['lucro-mes'],
    queryFn: async () => {
      const mesStart = startOfMonth()
      const [{ data: lanc }, { data: fiad }, { data: parc }] = await Promise.all([
        supabase.from('lancamentos').select('tipo,valor,data').gte('data', mesStart),
        supabase.from('fiados').select('valor,data,pago').gte('data', mesStart),
        supabase.from('parceiros').select('total,data,pago').gte('data', mesStart),
      ])
      const entradas = (lanc as Lancamento[] || [])
        .filter(l => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0)
      const saidas = (lanc as Lancamento[] || [])
        .filter(l => l.tipo === 'saida').reduce((s, l) => s + l.valor, 0)
      const fiados = (fiad as Fiado[] || [])
        .filter(f => f.pago).reduce((s, f) => s + f.valor, 0)
      const parceiros = (parc as Parceiro[] || [])
        .filter(p => p.pago).reduce((s, p) => s + p.total, 0)
      return (entradas + fiados + parceiros) - saidas
    },
    staleTime: 0,
  })
}

interface HeaderProps {
  onExport: () => void
  onLimparTudo: () => void
}

export default function Header({ onExport, onLimparTudo }: HeaderProps) {
  const { data: lucro } = useLucroMes()

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <header className="bg-pantera-darker border-b border-pantera-purple/20 px-4 py-2 sticky top-0 z-40">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl text-pantera-purple tracking-wider leading-none">
            PANTERA ROXA
          </h1>
          <p className="text-pantera-lavender text-xs hidden sm:block mt-0.5">
            Açaí. Sem inventar moda.
          </p>
        </div>

        {lucro !== undefined && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-pantera-lavender">Lucro mês</span>
            <span className={`font-display text-lg leading-tight ${lucro >= 0 ? 'text-income' : 'text-expense'}`}>
              {formatCurrency(lucro)}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <button onClick={onExport} className="btn-ghost p-2" title="Exportar dados">
            <Download size={18} />
          </button>
          <button onClick={onLimparTudo} className="btn-ghost p-2 text-expense/70 hover:text-expense" title="Limpar tudo">
            <Trash2 size={18} />
          </button>
          <button onClick={handleSignOut} className="btn-ghost p-2" title="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
