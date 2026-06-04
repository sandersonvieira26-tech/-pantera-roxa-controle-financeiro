import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Meta, MetaUpsert } from '@/types'

export const METAS_KEY = ['metas'] as const

export async function fetchMeta(): Promise<Meta | null> {
  const { data, error } = await supabase.from('metas').select('*').maybeSingle()
  if (error) throw error
  return data
}

export function useMetas() {
  const qc = useQueryClient()

  const query = useQuery<Meta | null>({
    queryKey: METAS_KEY,
    queryFn: fetchMeta,
  })

  const upsert = useMutation({
    mutationFn: async (item: MetaUpsert) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sessão expirada. Faça login novamente.')
      const { error } = await supabase.from('metas').upsert(
        { ...item, user_id: user.id, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: METAS_KEY }),
  })

  return { ...query, upsert }
}
