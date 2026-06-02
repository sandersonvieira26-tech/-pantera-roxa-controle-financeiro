import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useId } from 'react'
import { supabase } from '@/lib/supabase'
import type { Cliente } from '@/types'

export const CLIENTES_KEY = ['clientes'] as const

export async function fetchClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('clientes').select('*')
    .order('nome', { ascending: true })
  if (error) throw error
  return data
}

export function useClientes() {
  const qc = useQueryClient()
  // Canal único por instância: o hook é montado em mais de um componente.
  const channelName = `clientes-rt-${useId()}`

  const query = useQuery<Cliente[]>({
    queryKey: CLIENTES_KEY,
    queryFn: fetchClientes,
  })

  useEffect(() => {
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => {
        qc.invalidateQueries({ queryKey: CLIENTES_KEY })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [qc, channelName])

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clientes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENTES_KEY }),
  })

  return { ...query, remove }
}
