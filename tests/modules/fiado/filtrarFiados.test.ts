import { describe, it, expect } from 'vitest'
import { fiadosVisiveis } from '@/modules/fiado/filtrarFiados'
import type { Fiado } from '@/types'

const hoje = new Date().toLocaleDateString('en-CA')

function fiado(p: Partial<Fiado>): Fiado {
  return {
    id: 'x', user_id: 'u', nome_cliente: 'C', descricao: 'd', valor: 10,
    data: hoje, pago: false, qtd_300: 0, qtd_500: 0, created_at: '', ...p,
  }
}

const pendenteAntigo = fiado({ id: 'p-old', pago: false, data: '2020-01-01' })
const pendenteHoje = fiado({ id: 'p-hoje', pago: false, data: hoje })
const pagoAntigo = fiado({ id: 'g-old', pago: true, data: '2020-01-01' })
const pagoHoje = fiado({ id: 'g-hoje', pago: true, data: hoje })

const todos = [pendenteAntigo, pendenteHoje, pagoAntigo, pagoHoje]

describe('fiadosVisiveis', () => {
  it('"hoje": mostra TODOS os pendentes + só os pagos de hoje', () => {
    const ids = fiadosVisiveis(todos, 'hoje').map(f => f.id)
    expect(ids).toEqual(['p-old', 'p-hoje', 'g-hoje'])
  })

  it('"tudo": mostra tudo', () => {
    const ids = fiadosVisiveis(todos, 'tudo').map(f => f.id)
    expect(ids).toEqual(['p-old', 'p-hoje', 'g-old', 'g-hoje'])
  })

  it('pendente antigo nunca some, mesmo filtrando', () => {
    expect(fiadosVisiveis(todos, 'hoje').some(f => f.id === 'p-old')).toBe(true)
  })

  it('preserva a ordem original', () => {
    const ids = fiadosVisiveis(todos, 'tudo').map(f => f.id)
    expect(ids).toEqual(todos.map(f => f.id))
  })
})
