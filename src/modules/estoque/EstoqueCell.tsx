import { Plus, Minus } from 'lucide-react'
import type { Sabor, Tamanho } from '@/types'
import { SABOR_LABELS } from '@/types'

interface EstoqueCellProps {
  sabor: Sabor
  tamanho: Tamanho
  quantidade: number
  onAdjust: (sabor: Sabor, tamanho: Tamanho, delta: number) => void
  disabled?: boolean
}

export default function EstoqueCell({ sabor, tamanho, quantidade, onAdjust, disabled }: EstoqueCellProps) {
  return (
    <div className="card flex flex-col items-center gap-2 py-4">
      <p className="font-display text-lg text-white tracking-wide">{SABOR_LABELS[sabor]}</p>
      <p className="text-pantera-lavender text-xs">{tamanho}</p>
      <p className={`font-display text-4xl ${quantidade === 0 ? 'text-expense' : 'text-pantera-pink'}`}>
        {quantidade}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onAdjust(sabor, tamanho, -1)}
          disabled={quantidade === 0 || disabled}
          className="w-8 h-8 rounded-lg bg-expense/10 text-expense hover:bg-expense/20 transition-colors disabled:opacity-30 flex items-center justify-center"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => onAdjust(sabor, tamanho, 1)}
          disabled={disabled}
          className="w-8 h-8 rounded-lg bg-income/10 text-income hover:bg-income/20 transition-colors disabled:opacity-30 flex items-center justify-center"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}
