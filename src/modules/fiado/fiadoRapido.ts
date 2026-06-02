import type { Tamanho } from '@/types'

export interface AcumuladoFiado {
  qtd_300: number
  qtd_500: number
  descricao: string
  valor: number
}

// Soma uma retirada (tamanho + quantidade) ao acumulado de hoje do cliente.
// `atual` é o acumulado existente, ou null quando é a primeira retirada do dia.
// Recalcula descrição ("2x 500ml + 1x 300ml") e valor com os preços atuais.
export function acumularFiado(
  atual: { qtd_300: number; qtd_500: number } | null,
  tamanho: Tamanho,
  qtd: number,
  preco300: number,
  preco500: number,
): AcumuladoFiado {
  const base = atual ?? { qtd_300: 0, qtd_500: 0 }
  const qtd_300 = base.qtd_300 + (tamanho === '300ml' ? qtd : 0)
  const qtd_500 = base.qtd_500 + (tamanho === '500ml' ? qtd : 0)

  const partes: string[] = []
  if (qtd_500 > 0) partes.push(`${qtd_500}x 500ml`)
  if (qtd_300 > 0) partes.push(`${qtd_300}x 300ml`)

  const valor = Math.round((qtd_300 * preco300 + qtd_500 * preco500) * 100) / 100
  return { qtd_300, qtd_500, descricao: partes.join(' + '), valor }
}
