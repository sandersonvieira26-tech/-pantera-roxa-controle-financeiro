import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// jspdf-autotable adds lastAutoTable to the jsPDF instance at runtime
// but doesn't extend the TypeScript types — this interface bridges the gap
interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number }
}
import type { Lancamento, Fiado, Parceiro, Categoria } from '@/types'
import { formatCurrency, formatDate } from './format'

// Nome da categoria para exibir numa linha de lançamento.
// Entradas não têm categoria; saídas sem categoria viram "Sem categoria".
function categoriaLabel(l: Lancamento, nomePorId: Map<string, string>): string {
  if (l.tipo !== 'saida') return ''
  return (l.categoria_id && nomePorId.get(l.categoria_id)) || 'Sem categoria'
}

export function exportCSV(lancamentos: Lancamento[], fiados: Fiado[], parceiros: Parceiro[], categorias: Categoria[] = []) {
  const lines: string[] = []
  const nomePorId = new Map(categorias.map(c => [c.id, c.nome]))

  lines.push('LANÇAMENTOS')
  lines.push('Data,Tipo,Categoria,Descrição,Valor')
  lancamentos.forEach(l => {
    lines.push(`${formatDate(l.data)},${l.tipo},"${categoriaLabel(l, nomePorId)}","${l.descricao}",${l.valor.toFixed(2)}`)
  })

  lines.push('')
  lines.push('FIADOS')
  lines.push('Data,Cliente,Descrição,Valor,Status')
  fiados.forEach(f => {
    lines.push(`${formatDate(f.data)},"${f.nome_cliente}","${f.descricao}",${f.valor.toFixed(2)},${f.pago ? 'Pago' : 'Pendente'}`)
  })

  lines.push('')
  lines.push('PARCEIROS')
  lines.push('Data,Parceiro,Quantidade,Valor Unitário,Total,Status')
  parceiros.forEach(p => {
    lines.push(`${formatDate(p.data)},"${p.nome_parceiro}",${p.quantidade},${p.valor_unitario.toFixed(2)},${p.total.toFixed(2)},${p.pago ? 'Acertado' : 'A Receber'}`)
  })

  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pantera-roxa-${new Date().toLocaleDateString('en-CA')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportPDF(lancamentos: Lancamento[], fiados: Fiado[], parceiros: Parceiro[], categorias: Categoria[] = []) {
  const doc = new jsPDF()
  const headerColor: [number, number, number] = [170, 0, 255]
  const today = formatDate(new Date().toLocaleDateString('en-CA'))
  const nomePorId = new Map(categorias.map(c => [c.id, c.nome]))

  doc.setFontSize(22)
  doc.setTextColor(170, 0, 255)
  doc.text('PANTERA ROXA', 14, 18)
  doc.setFontSize(10)
  doc.setTextColor(150, 150, 150)
  doc.text(`Açaí. Sem inventar moda. — Gerado em ${today}`, 14, 25)

  const entradas = lancamentos.filter(l => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0)
  const saidas = lancamentos.filter(l => l.tipo === 'saida').reduce((s, l) => s + l.valor, 0)
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.text(`Faturamento (entradas): ${formatCurrency(entradas)}`, 14, 33)
  doc.text(`Custos (saídas): ${formatCurrency(saidas)}`, 14, 39)
  doc.text(`Lucro: ${formatCurrency(entradas - saidas)}`, 14, 45)

  autoTable(doc, {
    startY: 52,
    head: [['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor']],
    body: lancamentos.map(l => [formatDate(l.data), l.tipo, categoriaLabel(l, nomePorId), l.descricao, formatCurrency(l.valor)]),
    headStyles: { fillColor: headerColor },
    styles: { fontSize: 9 },
  })

  const afterLanc = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 8
  doc.setFontSize(12)
  doc.setTextColor(170, 0, 255)
  doc.text('FIADOS', 14, afterLanc)
  autoTable(doc, {
    startY: afterLanc + 4,
    head: [['Data', 'Cliente', 'Descrição', 'Valor', 'Status']],
    body: fiados.map(f => [formatDate(f.data), f.nome_cliente, f.descricao, formatCurrency(f.valor), f.pago ? 'Pago' : 'Pendente']),
    headStyles: { fillColor: headerColor },
    styles: { fontSize: 9 },
  })

  const afterFiad = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 8
  doc.setFontSize(12)
  doc.setTextColor(170, 0, 255)
  doc.text('PARCEIROS', 14, afterFiad)
  autoTable(doc, {
    startY: afterFiad + 4,
    head: [['Data', 'Parceiro', 'Qtd', 'Un', 'Total', 'Status']],
    body: parceiros.map(p => [formatDate(p.data), p.nome_parceiro, p.quantidade, formatCurrency(p.valor_unitario), formatCurrency(p.total), p.pago ? 'Acertado' : 'A Receber']),
    headStyles: { fillColor: headerColor },
    styles: { fontSize: 9 },
  })

  doc.save(`pantera-roxa-${new Date().toLocaleDateString('en-CA')}.pdf`)
}
