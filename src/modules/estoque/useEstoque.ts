import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { EstoqueItem, EstoqueUpsert, Sabor, Tamanho } from '@/types'

const ESTOQUE_KEY = ['estoque'] as const

export function useEstoque() {
  const qc = useQueryClient()

  const query = useQuery<EstoqueItem[]>({
    queryKey: ESTOQUE_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from('estoque').select('*')
      if (error) throw error
      return data
    },
  })

  const upsert = useMutation({
    mutationFn: async (item: EstoqueUpsert) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sessão expirada. Faça login novamente.')
      const { error } = await supabase.from('estoque').upsert(
        { ...item, user_id: user.id, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,sabor,tamanho' },
      )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ESTOQUE_KEY }),
  })

  function getQtd(sabor: Sabor, tamanho: Tamanho): number {
    return query.data?.find(e => e.sabor === sabor && e.tamanho === tamanho)?.quantidade ?? 0
  }

  function adjust(sabor: Sabor, tamanho: Tamanho, delta: number) {
    // Guard: block rapid double-clicks to prevent race condition
    if (upsert.isPending) return
    const current = getQtd(sabor, tamanho)
    const next = Math.max(0, current + delta)
    upsert.mutate({ sabor, tamanho, quantidade: next })
  }

  return { ...query, getQtd, adjust, adjustPending: upsert.isPending }
}
