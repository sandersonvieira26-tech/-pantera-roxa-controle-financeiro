import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { startOfMonth } from '@/utils/format'
import type { Lancamento, Parceiro } from '@/types'

export const LUCRO_MES_KEY = ['lucro-mes'] as const

export function useLucroMes() {
  return useQuery({
    queryKey: LUCRO_MES_KEY,
    queryFn: async () => {
      const mesStart = startOfMonth()
      // Fiados pagos não são somados aqui: o trigger já os transforma em
      // entradas de `lancamentos` (contadas abaixo). Evita contagem dupla.
      const [{ data: lanc }, { data: parc }] = await Promise.all([
        supabase.from('lancamentos').select('tipo,valor,data').gte('data', mesStart),
        supabase.from('parceiros').select('total,data,pago').gte('data', mesStart),
      ])
      const entradas = (lanc as Lancamento[] || [])
        .filter(l => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0)
      const saidas = (lanc as Lancamento[] || [])
        .filter(l => l.tipo === 'saida').reduce((s, l) => s + l.valor, 0)
      const parceiros = (parc as Parceiro[] || [])
        .filter(p => p.pago).reduce((s, p) => s + p.total, 0)
      return (entradas + parceiros) - saidas
    },
    staleTime: 0,
  })
}
