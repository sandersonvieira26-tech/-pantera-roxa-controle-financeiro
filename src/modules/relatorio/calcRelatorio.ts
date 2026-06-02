import type { Lancamento, Fiado, Parceiro } from '@/types'
import { last7Days, shortDate } from '@/utils/format'

export function calcFaturamento(
  lancamentos: Lancamento[],
  parceiros: Parceiro[],
): number {
  // Fiados pagos NÃO somam aqui: viram entrada em `lancamentos` (via trigger),
  // já contadas abaixo. Somá-los de novo contaria o dinheiro em dobro.
  const entradas = lancamentos.filter(l => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0)
  const parceirosPagos = parceiros.filter(p => p.pago).reduce((s, p) => s + p.total, 0)
  return entradas + parceirosPagos
}

export function calcCustos(lancamentos: Lancamento[]): number {
  return lancamentos.filter(l => l.tipo === 'saida').reduce((s, l) => s + l.valor, 0)
}

export function calcLucro(faturamento: number, custos: number): number {
  return faturamento - custos
}

export function calcMargem(lucro: number, faturamento: number): number | null {
  if (faturamento === 0) return null
  return (lucro / faturamento) * 100
}

export function calcAReceber(fiados: Fiado[], parceiros: Parceiro[]): number {
  const fiadosPendentes = fiados.filter(f => !f.pago).reduce((s, f) => s + f.valor, 0)
  const parceirosPendentes = parceiros.filter(p => !p.pago).reduce((s, p) => s + p.total, 0)
  return fiadosPendentes + parceirosPendentes
}

export function buildChartData(
  lancamentos: Lancamento[],
  parceiros: Parceiro[],
) {
  return last7Days().map(isoDate => {
    const dayLanc = lancamentos.filter(l => l.data === isoDate)
    const dayParc = parceiros.filter(p => p.data === isoDate)
    const faturamento = calcFaturamento(dayLanc, dayParc)
    const custos = calcCustos(dayLanc)
    return { isoDate, label: shortDate(isoDate), faturamento, lucro: calcLucro(faturamento, custos) }
  })
}
