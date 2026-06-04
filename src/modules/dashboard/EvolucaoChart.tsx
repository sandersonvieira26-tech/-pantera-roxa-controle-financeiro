import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/utils/format'
import type { PontoEvolucao } from './calcEvolucao'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tooltipFormatter = (value: any) =>
  typeof value === 'number' ? formatCurrency(value) : String(value ?? '')

export default function EvolucaoChart({ data }: { data: PontoEvolucao[] }) {
  return (
    <div className="card mt-3">
      <p className="label mb-3">Evolução (6 meses)</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fill: '#CE93D8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#CE93D8', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={tooltipFormatter}
            contentStyle={{ backgroundColor: '#1a0025', border: '1px solid #AA00FF44', borderRadius: 8 }}
            labelStyle={{ color: '#CE93D8' }}
          />
          <Legend wrapperStyle={{ color: '#CE93D8', fontSize: 12 }} />
          <Line type="monotone" dataKey="faturamento" name="Faturamento" stroke="#AA00FF" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="lucro" name="Lucro" stroke="#1D9E75" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
