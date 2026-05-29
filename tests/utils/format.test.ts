import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatDate,
  todayISO,
  startOfMonth,
  startOfWeek,
  filterByPeriod,
} from '@/utils/format'

describe('formatCurrency', () => {
  it('formata zero', () => {
    expect(formatCurrency(0)).toMatch(/R\$/)
    expect(formatCurrency(0)).toMatch(/0,00/)
  })
  it('formata milhares com ponto e centavos com vírgula', () => {
    expect(formatCurrency(1234.56)).toMatch(/1\.234,56/)
  })
  it('formata valor negativo', () => {
    expect(formatCurrency(-50.5)).toMatch(/50,50/)
  })
})

describe('formatDate', () => {
  it('converte ISO para formato BR', () => {
    expect(formatDate('2024-12-31')).toBe('31/12/2024')
  })
  it('preserva zeros à esquerda', () => {
    expect(formatDate('2024-01-05')).toBe('05/01/2024')
  })
})

describe('todayISO', () => {
  it('retorna string no formato YYYY-MM-DD', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('startOfMonth', () => {
  it('retorna o primeiro dia do mês atual', () => {
    const result = startOfMonth()
    expect(result).toMatch(/^\d{4}-\d{2}-01$/)
  })
})

describe('filterByPeriod', () => {
  const items = [
    { data: todayISO() },
    { data: '2020-01-01' },
    { data: '2020-06-15' },
  ]

  it('hoje: retorna apenas itens de hoje', () => {
    const result = filterByPeriod(items as { data: string }[], 'hoje')
    expect(result).toHaveLength(1)
    expect(result[0].data).toBe(todayISO())
  })

  it('tudo: retorna todos os itens', () => {
    expect(filterByPeriod(items as { data: string }[], 'tudo')).toHaveLength(3)
  })

  it('semana: retorna item de hoje e exclui 2020', () => {
    const result = filterByPeriod(items as { data: string }[], 'semana')
    expect(result.every(i => i.data >= startOfWeek())).toBe(true)
    expect(result.some(i => i.data === todayISO())).toBe(true)
    expect(result.find(i => i.data === '2020-01-01')).toBeUndefined()
  })

  it('mes: retorna item de hoje e exclui 2020', () => {
    const result = filterByPeriod(items as { data: string }[], 'mes')
    expect(result.every(i => i.data >= startOfMonth())).toBe(true)
    expect(result.some(i => i.data === todayISO())).toBe(true)
    expect(result.find(i => i.data === '2020-06-15')).toBeUndefined()
  })
})
