import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { filterByPeriod } from '@/utils/format'
import { calcFaturamento, calcCustos, calcLucro, calcMargem, calcAReceber, buildChartData, calcCustosPorCategoria } from './calcRelatorio'
import { fetchLancamentos, LANCAMENTOS_KEY } from '@/modules/caixa/useLancamentos'
import { fetchCategorias, CATEGORIAS_KEY } from '@/modules/caixa/useCategorias'
import { fetchFiados, FIADOS_KEY } from '@/modules/fiado/useFiados'
import { fetchParceiros, PARCEIROS_KEY } from '@/modules/parceiros/useParceiros'
import type { Lancamento, Fiado, Parceiro, Categoria, Periodo } from '@/types'

export function useRelatorio(periodo: Periodo) {
  const qc = useQueryClient()

  const { data: allLanc = [] } = useQuery<Lancamento[]>({
    queryKey: LANCAMENTOS_KEY,
    queryFn: fetchLancamentos,
  })

  const { data: allFiad = [] } = useQuery<Fiado[]>({
    queryKey: FIADOS_KEY,
    queryFn: fetchFiados,
  })

  const { data: allParc = [] } = useQuery<Parceiro[]>({
    queryKey: PARCEIROS_KEY,
    queryFn: fetchParceiros,
  })

  const { data: categorias = [] } = useQuery<Categoria[]>({
    queryKey: CATEGORIAS_KEY,
    queryFn: fetchCategorias,
  })

  useEffect(() => {
    // Includes 'lancamentos' so changes in Caixa module update Relatório in real-time
    const subs = ['lancamentos', 'fiados', 'parceiros', 'categorias'].map(table =>
      supabase.channel(`${table}-relatorio`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          qc.invalidateQueries({ queryKey: [table] })
        })
        .subscribe()
    )
    return () => { subs.forEach(s => supabase.removeChannel(s)) }
  }, [qc])

  const lanc = filterByPeriod(allLanc, periodo)
  const parc = filterByPeriod(allParc, periodo)

  const faturamento = calcFaturamento(lanc, parc)
  const custos = calcCustos(lanc)
  const lucro = calcLucro(faturamento, custos)
  const margem = calcMargem(lucro, faturamento)
  const aReceber = calcAReceber(allFiad, allParc)
  const chartData = buildChartData(allLanc, allParc)
  const custosPorCategoria = calcCustosPorCategoria(lanc, categorias)

  return { faturamento, custos, lucro, margem, aReceber, chartData, custosPorCategoria }
}
