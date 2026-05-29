import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/utils/format'

interface ChartEntry { label: string; faturamento: number; lucro: number }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tooltipFormatter = (value: any) =>
  typeof value === 'number' ? formatCurrency(value) : String(value ?? '')

export default function RelatorioChart({ data }: { data: ChartEntry[] }) {
  return (
    <div className="card mt-4">
      <p className="label mb-3">Últimos 7 dias</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fill: '#CE93D8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#CE93D8', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={tooltipFormatter}
            contentStyle={{ backgroundColor: '#1a0025', border: '1px solid #AA00FF44', borderRadius: 8 }}
            labelStyle={{ color: '#CE93D8' }}
          />
          <Legend wrapperStyle={{ color: '#CE93D8', fontSize: 12 }} />
          <Bar dataKey="faturamento" name="Faturamento" fill="#AA00FF" radius={[4, 4, 0, 0]} />
          <Bar dataKey="lucro" name="Lucro" fill="#1D9E75" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
