import type { Lancamento, Parceiro } from '@/types'
import { monthRange } from '@/utils/format'
import { calcFaturamento, calcCustos, calcLucro } from '@/modules/relatorio/calcRelatorio'

const MESES_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export interface PontoEvolucao {
  label: string
  faturamento: number
  lucro: number
}

// Série dos últimos nMeses (em ordem cronológica, terminando no mês atual):
// faturamento e lucro de cada mês.
export function buildEvolucaoMensal(
  lancamentos: Lancamento[],
  parceiros: Parceiro[],
  nMeses = 6,
): PontoEvolucao[] {
  const pontos: PontoEvolucao[] = []
  for (let i = nMeses - 1; i >= 0; i--) {
    const r = monthRange(i)
    const l = lancamentos.filter(x => x.data >= r.start && x.data <= r.end)
    const p = parceiros.filter(x => x.data >= r.start && x.data <= r.end)
    const faturamento = calcFaturamento(l, p)
    const mesIdx = parseInt(r.start.slice(5, 7), 10) - 1
    pontos.push({ label: MESES_PT[mesIdx], faturamento, lucro: calcLucro(faturamento, calcCustos(l)) })
  }
  return pontos
}
