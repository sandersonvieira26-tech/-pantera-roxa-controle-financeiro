import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import Login from '@/modules/auth/Login'
import Header from '@/components/Header'
import NavTabs, { type Tab } from '@/components/NavTabs'
import Caixa from '@/modules/caixa/Caixa'
import Relatorio from '@/modules/relatorio/Relatorio'
import Fiado from '@/modules/fiado/Fiado'
import Parceiros from '@/modules/parceiros/Parceiros'
import Estoque from '@/modules/estoque/Estoque'
import ExportModal from '@/utils/ExportModal'
import LimparTudoDialog from '@/utils/LimparTudoDialog'

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [tab, setTab] = useState<Tab>('caixa')
  const [showExport, setShowExport] = useState(false)
  const [showLimpar, setShowLimpar] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pantera-black">
        <div className="w-8 h-8 border-2 border-pantera-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return <Login />

  return (
    <div className="min-h-screen bg-pantera-black pb-20 sm:pb-0">
      <Header onExport={() => setShowExport(true)} onLimparTudo={() => setShowLimpar(true)} />
      <NavTabs active={tab} onChange={setTab} />

      <main className="max-w-3xl mx-auto px-2 py-3 sm:px-4">
        {tab === 'caixa' && <Caixa />}
        {tab === 'relatorio' && <Relatorio />}
        {tab === 'fiado' && <Fiado />}
        {tab === 'parceiros' && <Parceiros />}
        {tab === 'estoque' && <Estoque />}
      </main>

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
      {showLimpar && <LimparTudoDialog onClose={() => setShowLimpar(false)} />}
    </div>
  )
}
