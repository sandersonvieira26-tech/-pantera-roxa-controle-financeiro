import { useState } from 'react'
import { X, FileText, FileSpreadsheet, AlertCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { exportCSV, exportPDF } from './export'
import { fetchLancamentos, LANCAMENTOS_KEY } from '@/modules/caixa/useLancamentos'
import { fetchFiados, FIADOS_KEY } from '@/modules/fiado/useFiados'
import { fetchParceiros, PARCEIROS_KEY } from '@/modules/parceiros/useParceiros'
import type { Lancamento, Fiado, Parceiro } from '@/types'

interface ExportModalProps {
  onClose: () => void
}

export default function ExportModal({ onClose }: ExportModalProps) {
  const [loading, setLoading] = useState<'csv' | 'pdf' | null>(null)

  const { data: lancamentos = [], isError: lancError } = useQuery<Lancamento[]>({ queryKey: LANCAMENTOS_KEY, queryFn: fetchLancamentos })
  const { data: fiados = [], isError: fiadError } = useQuery<Fiado[]>({ queryKey: FIADOS_KEY, queryFn: fetchFiados })
  const { data: parceiros = [], isError: parcError } = useQuery<Parceiro[]>({ queryKey: PARCEIROS_KEY, queryFn: fetchParceiros })
  const hasError = lancError || fiadError || parcError

  async function handleExport(format: 'csv' | 'pdf') {
    setLoading(format)
    try {
      if (format === 'csv') exportCSV(lancamentos, fiados, parceiros)
      else exportPDF(lancamentos, fiados, parceiros)
      onClose()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="card w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl text-white tracking-wide">EXPORTAR DADOS</h3>
          <button onClick={onClose} className="text-pantera-lavender hover:text-white"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleExport('csv')}
            disabled={loading !== null || !!hasError}
            className="w-full card hover:border-income/50 transition-colors flex items-center gap-3 p-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet size={24} className="text-income" />
            <div className="text-left">
              <p className="text-white font-medium">CSV</p>
              <p className="text-pantera-lavender text-xs">Excel / Google Sheets</p>
            </div>
          </button>

          <button
            onClick={() => handleExport('pdf')}
            disabled={loading !== null || !!hasError}
            className="w-full card hover:border-pantera-purple/50 transition-colors flex items-center gap-3 p-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText size={24} className="text-pantera-purple" />
            <div className="text-left">
              <p className="text-white font-medium">PDF</p>
              <p className="text-pantera-lavender text-xs">Relatório formatado</p>
            </div>
          </button>
        </div>

        {hasError && (
          <div className="flex items-center gap-2 text-expense text-sm mt-3 bg-expense/10 rounded-lg px-3 py-2">
            <AlertCircle size={15} />
            Erro ao carregar dados. Verifique sua conexão e tente novamente.
          </div>
        )}
        {loading && (
          <p className="text-pantera-lavender text-sm text-center mt-3">
            Gerando {loading.toUpperCase()}...
          </p>
        )}
      </div>
    </div>
  )
}
