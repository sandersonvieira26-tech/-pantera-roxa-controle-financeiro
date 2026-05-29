import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import Login from '@/modules/auth/Login'
import Header from '@/components/Header'
import NavTabs, { type Tab } from '@/components/NavTabs'

// Placeholder components - will be replaced in Tasks 9-13
const Caixa = () => <div className="p-4 text-pantera-lavender">Módulo Caixa (em breve)</div>
const Relatorio = () => <div className="p-4 text-pantera-lavender">Módulo Relatório (em breve)</div>
const Fiado = () => <div className="p-4 text-pantera-lavender">Módulo Fiado (em breve)</div>
const Parceiros = () => <div className="p-4 text-pantera-lavender">Módulo Parceiros (em breve)</div>
const Estoque = () => <div className="p-4 text-pantera-lavender">Módulo Estoque (em breve)</div>
const ExportModal = ({ onClose }: { onClose: () => void }) => <div onClick={onClose} className="fixed inset-0 bg-black/50 flex items-center justify-center"><div className="card">Export (em breve) <button onClick={onClose}>X</button></div></div>
const LimparTudoDialog = ({ onClose }: { onClose: () => void }) => <div onClick={onClose} className="fixed inset-0 bg-black/50 flex items-center justify-center"><div className="card">Limpar (em breve) <button onClick={onClose}>X</button></div></div>

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

      <main className="max-w-3xl mx-auto px-4 py-4">
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
