import EstoqueCell from './EstoqueCell'
import { useEstoque } from './useEstoque'
import { SABORES, TAMANHOS } from '@/types'

export default function Estoque() {
  const { getQtd, adjust, adjustPending } = useEstoque()

  return (
    <div>
      <h2 className="font-display text-2xl text-white tracking-wide mb-4">ESTOQUE</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SABORES.map(sabor =>
          TAMANHOS.map(tamanho => (
            <EstoqueCell
              key={`${sabor}-${tamanho}`}
              sabor={sabor}
              tamanho={tamanho}
              quantidade={getQtd(sabor, tamanho)}
              onAdjust={adjust}
              disabled={adjustPending}
            />
          ))
        )}
      </div>
    </div>
  )
}
