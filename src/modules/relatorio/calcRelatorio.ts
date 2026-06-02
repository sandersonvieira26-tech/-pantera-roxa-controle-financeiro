import type { Lancamento, Fiado, Parceiro, Categoria } from '@/types'
import { last7Days, shortDate } from '@/utils/format'

export interface CustoCategoria {
  nome: string
  valor: number
  pct: number
}

const SEM_CATEGORIA = 'Sem categoria'

export function calcCustosPorCategoria(
  lancamentos: Lancamento[],
  categorias: Categoria[],
): CustoCategoria[] {
  const nomePorId = new Map(categorias.map(c => [c.id, c.nome]))
  const saidas = lancamentos.filter(l => l.tipo === 'saida')
  const total = saidas.reduce((s, l) => s + l.valor, 0)
  if (total === 0) return []

  const somaPorNome = new Map<string, number>()
  for (const l of saidas) {
    const nome = (l.categoria_id && nomePorId.get(l.categoria_id)) || SEM_CATEGORIA
    somaPorNome.set(nome, (somaPorNome.get(nome) ?? 0) + l.valor)
  }

  return [...somaPorNome.entries()]
    .map(([nome, valor]) => ({ nome, valor, pct: (valor / total) * 100 }))
    .sort((a, b) => b.valor - a.valor)
}

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
