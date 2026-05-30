export interface Lancamento {
  id: string
  user_id: string
  tipo: 'entrada' | 'saida'
  descricao: string
  valor: number
  data: string // YYYY-MM-DD
  created_at: string
}

export type LancamentoInsert = Omit<Lancamento, 'id' | 'user_id' | 'created_at'>

export interface Fiado {
  id: string
  user_id: string
  nome_cliente: string
  descricao: string
  valor: number
  data: string
  pago: boolean
  created_at: string
}

export type FiadoInsert = Omit<Fiado, 'id' | 'user_id' | 'created_at'>

export interface Parceiro {
  id: string
  user_id: string
  nome_parceiro: string
  quantidade: number
  valor_unitario: number
  total: number // coluna gerada pelo banco
  data: string
  pago: boolean
  created_at: string
}

export type ParceiroInsert = Omit<Parceiro, 'id' | 'user_id' | 'created_at' | 'total'>

export interface EstoqueItem {
  id: string
  user_id: string
  sabor: 'banana' | 'morango' | 'maracuja'
  tamanho: '300ml' | '500ml'
  quantidade: number
  updated_at: string
}

export type EstoqueUpsert = Pick<EstoqueItem, 'sabor' | 'tamanho' | 'quantidade'>

export type Periodo = 'hoje' | 'semana' | 'mes' | 'tudo'

export const SABORES = ['banana', 'morango', 'maracuja'] as const
export const TAMANHOS = ['300ml', '500ml'] as const
export type Sabor = typeof SABORES[number]
export type Tamanho = typeof TAMANHOS[number]

export const SABOR_LABELS: Record<Sabor, string> = {
  banana: 'Banana',
  morango: 'Morango',
  maracuja: 'Maracujá',
}

export type Tab = 'caixa' | 'relatorio' | 'fiado' | 'parceiros' | 'estoque'

export const TAB_LABELS: Record<Tab, string> = {
  caixa: 'CAIXA',
  relatorio: 'RELATÓRIO',
  fiado: 'FIADO',
  parceiros: 'PARCEIROS',
  estoque: 'ESTOQUE',
}
