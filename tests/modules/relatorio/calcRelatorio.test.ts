import { describe, it, expect } from 'vitest'
import {
  calcFaturamento,
  calcCustos,
  calcLucro,
  calcMargem,
  calcAReceber,
  buildChartData,
  calcCustosPorCategoria,
} from '@/modules/relatorio/calcRelatorio'
import type { Lancamento, Fiado, Parceiro, Categoria } from '@/types'

const today = new Date().toLocaleDateString('en-CA')

const lancamentos: Lancamento[] = [
  { id: '1', user_id: 'u', tipo: 'entrada', descricao: 'venda', valor: 100, data: today, fiado_id: null, categoria_id: null, created_at: '' },
  { id: '2', user_id: 'u', tipo: 'saida', descricao: 'compra', valor: 40, data: today, fiado_id: null, categoria_id: null, created_at: '' },
]

const fiados: Fiado[] = [
  { id: '3', user_id: 'u', nome_cliente: 'Ana', descricao: 'x', valor: 30, data: today, pago: true, qtd_300: 0, qtd_500: 0, created_at: '' },
  { id: '4', user_id: 'u', nome_cliente: 'Bob', descricao: 'y', valor: 20, data: today, pago: false, qtd_300: 0, qtd_500: 0, created_at: '' },
]

const parceiros: Parceiro[] = [
  { id: '5', user_id: 'u', nome_parceiro: 'Barbearia', quantidade: 10, valor_unitario: 10, total: 100, data: today, pago: true, created_at: '' },
  { id: '6', user_id: 'u', nome_parceiro: 'Mercado', quantidade: 5, valor_unitario: 10, total: 50, data: today, pago: false, created_at: '' },
]

describe('calcFaturamento', () => {
  it('soma entradas + parceiros pagos (fiado pago NÃO soma aqui)', () => {
    expect(calcFaturamento(lancamentos, parceiros)).toBe(200) // 100 + 100
  })
  it('não conta parceiros pendentes', () => {
    const soSaida: Lancamento[] = [lancamentos[1]]
    expect(calcFaturamento(soSaida, [parceiros[1]])).toBe(0)
  })
  it('conta a entrada vinda de um fiado pago uma única vez (sem dobra)', () => {
    // O trigger cria uma entrada com fiado_id; ela conta como entrada normal.
    const comFiado: Lancamento[] = [
      ...lancamentos,
      { id: '7', user_id: 'u', tipo: 'entrada', descricao: 'Fiado pago — Ana', valor: 30, data: today, fiado_id: '3', categoria_id: null, created_at: '' },
    ]
    expect(calcFaturamento(comFiado, parceiros)).toBe(230) // 100 + 30 (fiado) + 100
  })
})

describe('calcCustos', () => {
  it('soma apenas saídas', () => {
    expect(calcCustos(lancamentos)).toBe(40)
  })
})

describe('calcLucro', () => {
  it('faturamento menos custos', () => {
    expect(calcLucro(230, 40)).toBe(190)
  })
  it('pode ser negativo', () => {
    expect(calcLucro(0, 100)).toBe(-100)
  })
})

describe('calcMargem', () => {
  it('retorna percentual com 1 decimal', () => {
    expect(calcMargem(190, 230)).toBeCloseTo(82.6, 1)
  })
  it('retorna null quando faturamento é zero', () => {
    expect(calcMargem(-100, 0)).toBeNull()
  })
})

describe('calcAReceber', () => {
  it('soma fiados pendentes + parceiros pendentes', () => {
    expect(calcAReceber(fiados, parceiros)).toBe(70) // 20 + 50
  })
})

describe('calcCustosPorCategoria', () => {
  const categorias: Categoria[] = [
    { id: 'c1', user_id: 'u', nome: 'Insumo', created_at: '' },
    { id: 'c2', user_id: 'u', nome: 'Embalagem', created_at: '' },
  ]
  const saidas: Lancamento[] = [
    { id: 's1', user_id: 'u', tipo: 'saida', descricao: 'polpa', valor: 60, data: today, fiado_id: null, categoria_id: 'c1', created_at: '' },
    { id: 's2', user_id: 'u', tipo: 'saida', descricao: 'garrafa', valor: 30, data: today, fiado_id: null, categoria_id: 'c2', created_at: '' },
    { id: 's3', user_id: 'u', tipo: 'saida', descricao: 'avulso', valor: 10, data: today, fiado_id: null, categoria_id: null, created_at: '' },
    { id: 's4', user_id: 'u', tipo: 'entrada', descricao: 'venda', valor: 999, data: today, fiado_id: null, categoria_id: null, created_at: '' },
  ]

  it('agrupa por categoria, calcula % e ordena do maior pro menor', () => {
    const r = calcCustosPorCategoria(saidas, categorias)
    expect(r).toEqual([
      { nome: 'Insumo', valor: 60, pct: 60 },
      { nome: 'Embalagem', valor: 30, pct: 30 },
      { nome: 'Sem categoria', valor: 10, pct: 10 },
    ])
  })

  it('ignora entradas (só conta saídas)', () => {
    const r = calcCustosPorCategoria(saidas, categorias)
    expect(r.reduce((s, c) => s + c.valor, 0)).toBe(100)
  })

  it('retorna lista vazia quando não há saídas', () => {
    expect(calcCustosPorCategoria([lancamentos[0]], categorias)).toEqual([])
  })

  it('categoria_id órfão (sem nome) cai em "Sem categoria"', () => {
    const orfao: Lancamento[] = [
      { id: 'x', user_id: 'u', tipo: 'saida', descricao: 'z', valor: 50, data: today, fiado_id: null, categoria_id: 'inexistente', created_at: '' },
    ]
    expect(calcCustosPorCategoria(orfao, categorias)).toEqual([{ nome: 'Sem categoria', valor: 50, pct: 100 }])
  })
})

describe('buildChartData', () => {
  it('retorna 7 entradas', () => {
    expect(buildChartData(lancamentos, parceiros)).toHaveLength(7)
  })
  it('hoje tem faturamento 200 e lucro 160', () => {
    const data = buildChartData(lancamentos, parceiros)
    const todayEntry = data.find(d => d.isoDate === today)
    expect(todayEntry?.faturamento).toBe(200) // 100 entrada + 100 parceiro pago
    expect(todayEntry?.lucro).toBe(160) // 200 - 40 custos
  })
})
