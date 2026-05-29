import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Lancamento, LancamentoInsert } from '@/types'

export const LANCAMENTOS_KEY = ['lancamentos'] as const

export async function fetchLancamentos(): Promise<Lancamento[]> {
  const { data, error } = await supabase
    .from('lancamentos')
    .select('*')
    .order('data', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export function useLancamentos() {
  const qc = useQueryClient()

  const query = useQuery({ queryKey: LANCAMENTOS_KEY, queryFn: fetchLancamentos })

  useEffect(() => {
    const channel = supabase
      .channel('lancamentos-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lancamentos' }, () => {
        qc.invalidateQueries({ queryKey: LANCAMENTOS_KEY })
        qc.invalidateQueries({ queryKey: ['lucro-mes'] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [qc])

  const add = useMutation({
    mutationFn: async (item: LancamentoInsert) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sessão expirada. Faça login novamente.')
      const { error } = await supabase.from('lancamentos').insert({ ...item, user_id: user.id })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LANCAMENTOS_KEY })
      qc.invalidateQueries({ queryKey: ['lucro-mes'] })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lancamentos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LANCAMENTOS_KEY })
      qc.invalidateQueries({ queryKey: ['lucro-mes'] })
    },
  })

  return { ...query, add, remove }
}
