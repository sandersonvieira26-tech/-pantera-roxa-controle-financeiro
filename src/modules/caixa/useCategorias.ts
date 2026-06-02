import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useId, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { CATEGORIAS_PADRAO } from '@/types'
import type { Categoria } from '@/types'

export const CATEGORIAS_KEY = ['categorias'] as const

export async function fetchCategorias(): Promise<Categoria[]> {
  const { data, error } = await supabase
    .from('categorias').select('*')
    .order('nome', { ascending: true })
  if (error) throw error
  return data
}

export function useCategorias() {
  const qc = useQueryClient()
  const seeded = useRef(false)
  // Nome de canal único por instância: este hook é montado por vários
  // componentes ao mesmo tempo (form, lista, modal) e canais com nome
  // repetido colidem no client do Supabase. useId dá um id estável por instância.
  const channelName = `categorias-rt-${useId()}`

  const query = useQuery<Categoria[]>({
    queryKey: CATEGORIAS_KEY,
    queryFn: fetchCategorias,
  })

  useEffect(() => {
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categorias' }, () => {
        qc.invalidateQueries({ queryKey: CATEGORIAS_KEY })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [qc, channelName])

  // Semeia a lista padrão na primeira vez (idempotente via UNIQUE user_id+nome).
  useEffect(() => {
    if (query.isSuccess && query.data.length === 0 && !seeded.current) {
      seeded.current = true
      ;(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const rows = CATEGORIAS_PADRAO.map(nome => ({ nome, user_id: user.id }))
        await supabase.from('categorias').upsert(rows, { onConflict: 'user_id,nome', ignoreDuplicates: true })
        qc.invalidateQueries({ queryKey: CATEGORIAS_KEY })
      })()
    }
  }, [query.isSuccess, query.data, qc])

  const add = useMutation({
    mutationFn: async (nome: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sessão expirada. Faça login novamente.')
      const { error } = await supabase.from('categorias').insert({ nome, user_id: user.id })
      if (error) {
        if (error.code === '23505') throw new Error('Já existe uma categoria com esse nome.')
        throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CATEGORIAS_KEY }),
  })

  const rename = useMutation({
    mutationFn: async ({ id, nome }: { id: string; nome: string }) => {
      const { error } = await supabase.from('categorias').update({ nome }).eq('id', id)
      if (error) {
        if (error.code === '23505') throw new Error('Já existe uma categoria com esse nome.')
        throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CATEGORIAS_KEY }),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categorias').delete().eq('id', id)
      if (error) {
        if (error.code === '23503') {
          throw new Error('Categoria em uso. Reclassifique os lançamentos antes de apagar.')
        }
        throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CATEGORIAS_KEY }),
  })

  return { ...query, add, rename, remove }
}
