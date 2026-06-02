import { describe, it, expect } from 'vitest'
import { acumularFiado } from '@/modules/fiado/fiadoRapido'

const P300 = 8
const P500 = 15

describe('acumularFiado', () => {
  it('primeira retirada: uma linha "Nx tamanho"', () => {
    expect(acumularFiado(null, '500ml', 1, P300, P500)).toEqual({
      qtd_300: 0, qtd_500: 1, descricao: '1x 500ml', valor: 15,
    })
  })

  it('soma o mesmo tamanho na linha existente', () => {
    const atual = { qtd_300: 0, qtd_500: 1 }
    expect(acumularFiado(atual, '500ml', 2, P300, P500)).toEqual({
      qtd_300: 0, qtd_500: 3, descricao: '3x 500ml', valor: 45,
    })
  })

  it('soma tamanho diferente: descrição combinada (500ml primeiro) e valor somado', () => {
    const atual = { qtd_300: 0, qtd_500: 1 }
    expect(acumularFiado(atual, '300ml', 1, P300, P500)).toEqual({
      qtd_300: 1, qtd_500: 1, descricao: '1x 500ml + 1x 300ml', valor: 23,
    })
  })

  it('arredonda o valor para centavos', () => {
    expect(acumularFiado(null, '300ml', 3, 8.33, P500).valor).toBe(24.99)
  })
})
