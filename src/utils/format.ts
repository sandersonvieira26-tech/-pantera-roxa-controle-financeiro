import type { Periodo } from '@/types'

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

// Retorna YYYY-MM-DD no fuso horário LOCAL do usuário.
// NÃO usar toISOString() — ela retorna UTC e produz a data errada
// no Brasil (UTC-3) após as 21h.
function localDateISO(d = new Date()): string {
  return d.toLocaleDateString('en-CA') // en-CA produz YYYY-MM-DD
}

export function todayISO(): string {
  return localDateISO()
}

export function startOfMonth(): string {
  const d = new Date()
  d.setDate(1)
  return localDateISO(d)
}

export function startOfWeek(): string {
  const d = new Date()
  const day = d.getDay() // 0=dom, 1=seg, ..., 6=sab
  const diff = day === 0 ? 6 : day - 1 // dias desde segunda-feira (semana BR)
  d.setDate(d.getDate() - diff)
  return localDateISO(d)
}

export function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return localDateISO(d)
  })
}

export function filterByPeriod<T extends { data: string }>(
  items: T[],
  periodo: Periodo,
): T[] {
  if (periodo === 'tudo') return items
  if (periodo === 'hoje') return items.filter(i => i.data === todayISO())
  if (periodo === 'semana') return items.filter(i => i.data >= startOfWeek())
  // mes
  return items.filter(i => i.data >= startOfMonth())
}

export function shortDate(isoDate: string): string {
  const [, month, day] = isoDate.split('-')
  return `${day}/${month}`
}

// Primeiro e último dia (ISO local) de um mês. mesesAtras=0 → mês atual,
// 1 → mês passado. O construtor Date normaliza a virada de ano.
export function monthRange(mesesAtras = 0): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - mesesAtras, 1)
  const end = new Date(now.getFullYear(), now.getMonth() - mesesAtras + 1, 0)
  return { start: localDateISO(start), end: localDateISO(end) }
}
