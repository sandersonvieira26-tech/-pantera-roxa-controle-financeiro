import { describe, it, expect } from 'vitest'
import { montarVendaRapida } from '@/modules/caixa/vendaRapida'

describe('montarVendaRapida', () => {
  it('monta descrição e calcula valor = preço × quantidade', () => {
    expect(montarVendaRapida('500ml', 2, 12)).toEqual({ descricao: '2x 500ml', valor: 24 })
  })

  it('quantidade 1', () => {
    expect(montarVendaRapida('300ml', 1, 8)).toEqual({ descricao: '1x 300ml', valor: 8 })
  })

  it('valor é null quando o preço não foi definido', () => {
    expect(montarVendaRapida('500ml', 3)).toEqual({ descricao: '3x 500ml', valor: null })
  })
})
