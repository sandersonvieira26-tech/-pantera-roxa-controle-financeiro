import { describe, it, expect, afterEach, vi } from 'vitest'
import { buildEvolucaoMensal } from '@/modules/dashboard/calcEvolucao'
import type { Lancamento } from '@/types'

afterEach(() => { vi.useRealTimers() })

function lanc(p: Partial<Lancamento>): Lancamento {
  return {
    id: 'x', user_id: 'u', tipo: 'entrada', descricao: 'd', valor: 0,
    data: '2026-06-10', fiado_id: null, categoria_id: null, qtd_300: 0, qtd_500: 0, created_at: '', ...p,
  }
}

describe('buildEvolucaoMensal', () => {
  it('retorna nMeses pontos em ordem cronológica terminando no mês atual', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 15)) // 15/jun/2026
    const r = buildEvolucaoMensal([], [], 6)
    expect(r).toHaveLength(6)
    expect(r.map(p => p.label)).toEqual(['jan', 'fev', 'mar', 'abr', 'mai', 'jun'])
  })

  it('soma faturamento e lucro no mês certo', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 15))
    const lancs = [
      lanc({ tipo: 'entrada', valor: 100, data: '2026-06-05' }),
      lanc({ tipo: 'saida', valor: 40, data: '2026-06-06' }),
      lanc({ tipo: 'entrada', valor: 50, data: '2026-05-20' }),
    ]
    const r = buildEvolucaoMensal(lancs, [], 6)
    const jun = r.find(p => p.label === 'jun')!
    const mai = r.find(p => p.label === 'mai')!
    expect(jun).toMatchObject({ faturamento: 100, lucro: 60 })
    expect(mai).toMatchObject({ faturamento: 50, lucro: 50 })
  })

  it('vira o ano: dezembro do ano anterior aparece', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 10)) // 10/jan/2026
    const r = buildEvolucaoMensal([], [], 3)
    expect(r.map(p => p.label)).toEqual(['nov', 'dez', 'jan'])
  })
})
