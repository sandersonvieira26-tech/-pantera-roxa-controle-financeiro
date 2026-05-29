import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Parceiro, ParceiroInsert } from '@/types'

export const PARCEIROS_KEY = ['parceiros'] as const

export async function fetchParceiros(): Promise<Parceiro[]> {
  const { data, error } = await supabase
    .from('parceiros').select('*')
    .order('pago', { ascending: true })
    .order('data', { ascending: false })
  if (error) throw error
  return data
}

export function useParceiros() {
  const qc = useQueryClient()

  const query = useQuery<Parceiro[]>({
    queryKey: PARCEIROS_KEY,
    queryFn: fetchParceiros,
  })

  useEffect(() => {
    const channel = supabase.channel('parceiros-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parceiros' }, () => {
        qc.invalidateQueries({ queryKey: PARCEIROS_KEY })
        qc.invalidateQueries({ queryKey: ['lucro-mes'] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [qc])

  const add = useMutation({
    mutationFn: async (item: ParceiroInsert) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sessão expirada. Faça login novamente.')
      const { error } = await supabase.from('parceiros').insert({ ...item, user_id: user.id })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PARCEIROS_KEY })
      qc.invalidateQueries({ queryKey: ['lucro-mes'] })
    },
  })

  const togglePago = useMutation({
    mutationFn: async ({ id, pago }: { id: string; pago: boolean }) => {
      const { error } = await supabase.from('parceiros').update({ pago }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PARCEIROS_KEY })
      qc.invalidateQueries({ queryKey: ['lucro-mes'] })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('parceiros').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PARCEIROS_KEY })
      qc.invalidateQueries({ queryKey: ['lucro-mes'] })
    },
  })

  return { ...query, add, togglePago, remove }
}
