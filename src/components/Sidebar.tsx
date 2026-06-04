import { Home, Wallet, BarChart2, Clock, Users, Package, LogOut, Download, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/utils/format'
import { useLucroMes } from '@/hooks/useLucroMes'
import type { Tab } from '@/types'

const TABS: { id: Tab; label: string; Icon: typeof Wallet }[] = [
  { id: 'inicio', label: 'Início', Icon: Home },
  { id: 'caixa', label: 'Caixa', Icon: Wallet },
  { id: 'relatorio', label: 'Relatório', Icon: BarChart2 },
  { id: 'fiado', label: 'Fiado', Icon: Clock },
  { id: 'parceiros', label: 'Parceiros', Icon: Users },
  { id: 'estoque', label: 'Estoque', Icon: Package },
]

interface SidebarProps {
  active: Tab
  onChange: (tab: Tab) => void
  onExport: () => void
  onLimparTudo: () => void
}

export default function Sidebar({ active, onChange, onExport, onLimparTudo }: SidebarProps) {
  const { data: lucro } = useLucroMes()

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <aside className="hidden sm:flex flex-col w-56 min-h-screen sticky top-0 bg-pantera-darker border-r border-pantera-purple/20">
      {/* Marca */}
      <div className="px-4 py-5">
        <h1 className="font-display text-xl text-pantera-purple tracking-wider leading-none">
          PANTERA ROXA
        </h1>
        <p className="text-pantera-lavender/70 text-xs mt-1">Açaí. Sem inventar moda.</p>
      </div>

      {/* Navegação */}
      <nav className="border-t border-pantera-purple/20 py-2 flex-1">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors border-l-2
              ${active === id
                ? 'bg-pantera-purple/15 text-white border-pantera-purple'
                : 'border-transparent text-pantera-lavender hover:text-white hover:bg-white/5'}`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      {/* Lucro do mês */}
      {lucro !== undefined && (
        <div className="border-t border-pantera-purple/20 px-4 py-3">
          <span className="text-[10px] uppercase tracking-widest text-pantera-lavender block">Lucro mês</span>
          <span className={`font-display text-xl leading-tight ${lucro >= 0 ? 'text-income' : 'text-expense'}`}>
            {formatCurrency(lucro)}
          </span>
        </div>
      )}

      {/* Ações */}
      <div className="border-t border-pantera-purple/20 py-2">
        <button
          onClick={onExport}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-pantera-lavender hover:text-white hover:bg-white/5 transition-colors"
        >
          <Download size={16} />
          Exportar
        </button>
        <button
          onClick={onLimparTudo}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-expense/70 hover:text-expense hover:bg-white/5 transition-colors"
        >
          <Trash2 size={16} />
          Limpar tudo
        </button>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-pantera-lavender hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  )
}
