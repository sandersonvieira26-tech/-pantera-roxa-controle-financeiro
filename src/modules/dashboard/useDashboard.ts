import { useQuery } from '@tanstack/react-query'
import { todayISO, monthRange } from '@/utils/format'
import {
  calcFaturamento, calcCustos, calcLucro, calcAReceber, contarVendas,
} from '@/modules/relatorio/calcRelatorio'
import { buildEvolucaoMensal } from './calcEvolucao'
import { fetchLancamentos, LANCAMENTOS_KEY } from '@/modules/caixa/useLancamentos'
import { fetchFiados, FIADOS_KEY } from '@/modules/fiado/useFiados'
import { fetchParceiros, PARCEIROS_KEY } from '@/modules/parceiros/useParceiros'
import { fetchMeta, METAS_KEY } from '@/modules/relatorio/useMetas'
import type { Lancamento, Fiado, Parceiro, Meta } from '@/types'

export function useDashboard() {
  const { data: lancamentos = [] } = useQuery<Lancamento[]>({ queryKey: LANCAMENTOS_KEY, queryFn: fetchLancamentos })
  const { data: fiados = [] } = useQuery<Fiado[]>({ queryKey: FIADOS_KEY, queryFn: fetchFiados })
  const { data: parceiros = [] } = useQuery<Parceiro[]>({ queryKey: PARCEIROS_KEY, queryFn: fetchParceiros })
  const { data: meta } = useQuery<Meta | null>({ queryKey: METAS_KEY, queryFn: fetchMeta })

  const hoje = todayISO()
  const mes = monthRange(0)
  const lancMes = lancamentos.filter(l => l.data >= mes.start && l.data <= mes.end)

  const vendasHoje = lancamentos
    .filter(l => l.tipo === 'entrada' && l.data === hoje).reduce((s, l) => s + l.valor, 0)

  const entradasMes = lancMes.filter(l => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0)
  const saidasMes = lancMes.filter(l => l.tipo === 'saida').reduce((s, l) => s + l.valor, 0)
  const saldoMes = entradasMes - saidasMes

  const faturamentoMes = calcFaturamento(lancMes, parceiros.filter(p => p.data >= mes.start && p.data <= mes.end))
  const lucroMes = calcLucro(faturamentoMes, calcCustos(lancMes))

  const aReceber = calcAReceber(fiados, parceiros)
  const contagemHoje = contarVendas(lancamentos, fiados, 'hoje')
  const evolucao = buildEvolucaoMensal(lancamentos, parceiros, 6)

  return {
    vendasHoje,
    saldoMes,
    aReceber,
    lucroMes,
    metaLucro: meta?.meta_lucro ?? 0,
    contagemHoje,
    evolucao,
  }
}
