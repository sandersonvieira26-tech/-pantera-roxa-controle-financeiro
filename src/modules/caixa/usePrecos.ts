import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Preco, PrecoUpsert, Tamanho } from '@/types'

export const PRECOS_KEY = ['precos'] as const

export async function fetchPrecos(): Promise<Preco[]> {
  const { data, error } = await supabase.from('precos').select('*')
  if (error) throw error
  return data
}

export function usePrecos() {
  const qc = useQueryClient()

  const query = useQuery<Preco[]>({
    queryKey: PRECOS_KEY,
    queryFn: fetchPrecos,
  })

  const upsert = useMutation({
    mutationFn: async (item: PrecoUpsert) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sessão expirada. Faça login novamente.')
      const { error } = await supabase.from('precos').upsert(
        { ...item, user_id: user.id, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,tamanho' },
      )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PRECOS_KEY }),
  })

  function getPreco(tamanho: Tamanho): number | undefined {
    return query.data?.find(p => p.tamanho === tamanho)?.preco
  }

  return { ...query, upsert, getPreco }
}
