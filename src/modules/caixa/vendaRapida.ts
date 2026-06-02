import type { Tamanho } from '@/types'

export interface VendaRapida {
  descricao: string
  valor: number | null // null quando o preço do tamanho ainda não foi definido
}

// Monta descrição e valor de uma venda à vista a partir de tamanho, quantidade
// e preço unitário. Não valida; a tela garante quantidade >= 1.
export function montarVendaRapida(tamanho: Tamanho, qtd: number, preco?: number): VendaRapida {
  return {
    descricao: `${qtd}x ${tamanho}`,
    // Arredonda para centavos pra evitar artefatos de ponto flutuante (ex: 8.33 * 3).
    valor: preco === undefined ? null : Math.round(preco * qtd * 100) / 100,
  }
}
