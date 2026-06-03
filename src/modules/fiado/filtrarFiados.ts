import { filterByPeriod } from '@/utils/format'
import type { Fiado, Periodo } from '@/types'

// Pendentes sempre aparecem (são dívida a receber); o período filtra apenas
// os já pagos (histórico). Preserva a ordem original da lista.
export function fiadosVisiveis(items: Fiado[], periodo: Periodo): Fiado[] {
  const pagosNoPeriodo = new Set(
    filterByPeriod(items.filter(f => f.pago), periodo).map(f => f.id),
  )
  return items.filter(f => !f.pago || pagosNoPeriodo.has(f.id))
}
