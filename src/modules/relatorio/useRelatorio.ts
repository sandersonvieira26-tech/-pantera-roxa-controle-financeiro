import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { filterByPeriod } from '@/utils/format'
import { calcFaturamento, calcCustos, calcLucro, calcMargem, calcAReceber, buildChartData } from './calcRelatorio'
import { fetchLancamentos, LANCAMENTOS_KEY } from '@/modules/caixa/useLancamentos'
import type { Lancamento, Fiado, Parceiro, Periodo } from '@/types'

// These will be replaced with proper imports from useFiados/useParceiros once Tasks 11-12 are done.
async function fetchFiadosLocal(): Promise<Fiado[]> {
  const { data, error } = await supabase.from('fiados').select('*')
    .order('pago', { ascending: true }).order('data', { ascending: false })
  if (error) throw error
  return data
}

async function fetchParceirosLocal(): Promise<Parceiro[]> {
  const { data, error } = await supabase.from('parceiros').select('*')
    .order('pago', { ascending: true }).order('data', { ascending: false })
  if (error) throw error
  return data
}

export function useRelatorio(periodo: Periodo) {
  const qc = useQueryClient()

  const { data: allLanc = [] } = useQuery<Lancamento[]>({
    queryKey: LANCAMENTOS_KEY,
    queryFn: fetchLancamentos,
  })

  const { data: allFiad = [] } = useQuery<Fiado[]>({
    queryKey: ['fiados'],
    queryFn: fetchFiadosLocal,
  })

  const { data: allParc = [] } = useQuery<Parceiro[]>({
    queryKey: ['parceiros'],
    queryFn: fetchParceirosLocal,
  })

  useEffect(() => {
    // Includes 'lancamentos' so changes in Caixa module update Relatório in real-time
    const subs = ['lancamentos', 'fiados', 'parceiros'].map(table =>
      supabase.channel(`${table}-relatorio`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          qc.invalidateQueries({ queryKey: [table] })
        })
        .subscribe()
    )
    return () => { subs.forEach(s => supabase.removeChannel(s)) }
  }, [qc])

  const lanc = filterByPeriod(allLanc, periodo)
  const fiad = filterByPeriod(allFiad, periodo)
  const parc = filterByPeriod(allParc, periodo)

  const faturamento = calcFaturamento(lanc, fiad, parc)
  const custos = calcCustos(lanc)
  const lucro = calcLucro(faturamento, custos)
  const margem = calcMargem(lucro, faturamento)
  const aReceber = calcAReceber(allFiad, allParc)
  const chartData = buildChartData(allLanc, allFiad, allParc)

  return { faturamento, custos, lucro, margem, aReceber, chartData }
}
