import { Wallet, BarChart2, Clock, Users, Package } from 'lucide-react'
import type { Tab } from '@/types'

const TABS: { id: Tab; label: string; Icon: typeof Wallet }[] = [
  { id: 'caixa', label: 'Caixa', Icon: Wallet },
  { id: 'relatorio', label: 'Relatório', Icon: BarChart2 },
  { id: 'fiado', label: 'Fiado', Icon: Clock },
  { id: 'parceiros', label: 'Parceiros', Icon: Users },
  { id: 'estoque', label: 'Estoque', Icon: Package },
]

interface NavTabsProps {
  active: Tab
  onChange: (tab: Tab) => void
}

export default function NavTabs({ active, onChange }: NavTabsProps) {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md bg-pantera-black/90 border-t border-pantera-purple/20">
      <div className="flex">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors
              ${active === id ? 'text-pantera-pink' : 'text-pantera-lavender'}`}
          >
            <span className={`inline-flex rounded-full p-1 transition-colors ${active === id ? 'bg-pantera-purple/20' : ''}`}>
              <Icon size={22} />
            </span>
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
