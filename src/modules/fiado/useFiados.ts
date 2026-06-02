import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { todayISO } from '@/utils/format'
import { acumularFiado } from './fiadoRapido'
import type { Fiado, FiadoInsert, Tamanho } from '@/types'

interface RetiradaRapida {
  nome_cliente: string
  tamanho: Tamanho
  qtd: number
  preco300: number
  preco500: number
}

export const FIADOS_KEY = ['fiados'] as const

export async function fetchFiados(): Promise<Fiado[]> {
  const { data, error } = await supabase
    .from('fiados').select('*')
    .order('pago', { ascending: true })
    .order('data', { ascending: false })
  if (error) throw error
  return data
}

export function useFiados() {
  const qc = useQueryClient()

  const query = useQuery<Fiado[]>({
    queryKey: FIADOS_KEY,
    queryFn: fetchFiados,
  })

  useEffect(() => {
    const channel = supabase.channel('fiados-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fiados' }, () => {
        qc.invalidateQueries({ queryKey: FIADOS_KEY })
        qc.invalidateQueries({ queryKey: ['lucro-mes'] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [qc])

  const add = useMutation({
    mutationFn: async (item: FiadoInsert) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sessão expirada. Faça login novamente.')
      const { error } = await supabase.from('fiados').insert({ ...item, user_id: user.id })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FIADOS_KEY })
      qc.invalidateQueries({ queryKey: ['lucro-mes'] })
    },
  })

  // Registra uma retirada: soma na linha de hoje do cliente (não paga e rápida)
  // ou cria uma nova. Também salva o nome na lista de clientes.
  const addRapido = useMutation({
    mutationFn: async ({ nome_cliente, tamanho, qtd, preco300, preco500 }: RetiradaRapida) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sessão expirada. Faça login novamente.')
      const data = todayISO()

      const { data: existentes, error: selErr } = await supabase
        .from('fiados').select('*')
        .eq('nome_cliente', nome_cliente).eq('data', data).eq('pago', false)
        .or('qtd_300.gt.0,qtd_500.gt.0')
        .limit(1)
      if (selErr) throw selErr
      const existente = (existentes?.[0] as Fiado | undefined) ?? null

      const acc = acumularFiado(existente, tamanho, qtd, preco300, preco500)

      if (existente) {
        const { error } = await supabase.from('fiados')
          .update({ descricao: acc.descricao, valor: acc.valor, qtd_300: acc.qtd_300, qtd_500: acc.qtd_500 })
          .eq('id', existente.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('fiados').insert({
          user_id: user.id, nome_cliente, data, pago: false,
          descricao: acc.descricao, valor: acc.valor, qtd_300: acc.qtd_300, qtd_500: acc.qtd_500,
        })
        if (error) throw error
      }

      await supabase.from('clientes')
        .upsert({ nome: nome_cliente, user_id: user.id }, { onConflict: 'user_id,nome', ignoreDuplicates: true })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FIADOS_KEY })
      qc.invalidateQueries({ queryKey: ['clientes'] })
      qc.invalidateQueries({ queryKey: ['lucro-mes'] })
    },
  })

  const togglePago = useMutation({
    mutationFn: async ({ id, pago }: { id: string; pago: boolean }) => {
      const { error } = await supabase.from('fiados').update({ pago }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FIADOS_KEY })
      qc.invalidateQueries({ queryKey: ['lucro-mes'] })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fiados').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FIADOS_KEY })
      qc.invalidateQueries({ queryKey: ['lucro-mes'] })
    },
  })

  return { ...query, add, addRapido, togglePago, remove }
}
