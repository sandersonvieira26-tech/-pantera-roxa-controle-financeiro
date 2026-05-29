import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Fiado, FiadoInsert } from '@/types'

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

  return { ...query, add, togglePago, remove }
}
