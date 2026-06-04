import { describe, it, expect, afterEach, vi } from 'vitest'
import { monthRange } from '@/utils/format'

afterEach(() => { vi.useRealTimers() })

describe('monthRange', () => {
  it('mês atual: começa no dia 01 e termina depois do início', () => {
    const { start, end } = monthRange(0)
    expect(start).toMatch(/^\d{4}-\d{2}-01$/)
    expect(end >= start).toBe(true)
  })

  it('mês passado fica inteiramente antes do mês atual', () => {
    const atual = monthRange(0)
    const passado = monthRange(1)
    expect(passado.start < atual.start).toBe(true)
    expect(passado.end < atual.start).toBe(true)
  })

  it('vira o ano corretamente em janeiro', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 15)) // 15/jan/2026
    expect(monthRange(0)).toEqual({ start: '2026-01-01', end: '2026-01-31' })
    expect(monthRange(1)).toEqual({ start: '2025-12-01', end: '2025-12-31' })
  })

  it('calcula fevereiro (28 dias em 2026)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 1, 10)) // 10/fev/2026
    expect(monthRange(0)).toEqual({ start: '2026-02-01', end: '2026-02-28' })
  })
})
