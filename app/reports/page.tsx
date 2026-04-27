'use client'

import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { supabase } from '@/lib/supabase'
import type { SaleSummary } from '@/lib/types'

type Range = 'daily' | 'weekly' | 'monthly'

const rangeLabels: Record<Range, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual',
}

export default function ReportsPage() {
  const [range, setRange] = useState<Range>('daily')
  const [sales, setSales] = useState<SaleSummary[]>([])
  const [exporting, setExporting] = useState(false)

  const fromDate = useMemo(() => {
    const date = new Date()
    if (range === 'daily') date.setHours(0, 0, 0, 0)
    if (range === 'weekly') date.setDate(date.getDate() - 6)
    if (range === 'monthly') date.setMonth(date.getMonth() - 1)
    return date.toISOString()
  }, [range])

  useEffect(() => {
    supabase
      .from('sales')
      .select('id,sale_code,total,payment_method,customer_name,created_at')
      .gte('created_at', fromDate)
      .order('created_at', { ascending: false })
      .then(({ data }) => setSales((data as SaleSummary[]) ?? []))
  }, [fromDate])

  const total = sales.reduce((sum, sale) => sum + Number(sale.total), 0)
  const average = sales.length ? total / sales.length : 0

  const exportPdf = async () => {
    setExporting(true)

    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
      const doc = new jsPDF()
      const generatedAt = new Date()
      const fileDate = generatedAt.toISOString().slice(0, 10)

      doc.setFontSize(18)
      doc.text('Farmacia Ocampo', 14, 18)
      doc.setFontSize(12)
      doc.text(`Reporte de ventas ${rangeLabels[range].toLowerCase()}`, 14, 27)
      doc.setFontSize(10)
      doc.text(`Generado: ${generatedAt.toLocaleString('es-NI')}`, 14, 35)
      doc.text(`Ventas registradas: ${sales.length}`, 14, 42)
      doc.text(`Total vendido: ${formatCurrency(total)}`, 14, 49)
      doc.text(`Promedio por venta: ${formatCurrency(average)}`, 14, 56)

      autoTable(doc, {
        startY: 64,
        head: [['Fecha', 'Codigo', 'Cliente', 'Pago', 'Total']],
        body:
          sales.length > 0
            ? sales.map((sale) => [
                new Date(sale.created_at).toLocaleString('es-NI'),
                sale.sale_code ?? String(sale.id),
                sale.customer_name ?? 'Consumidor final',
                sale.payment_method,
                formatCurrency(Number(sale.total)),
              ])
            : [['Sin ventas en este periodo', '', '', '', '']],
        styles: {
          fontSize: 9,
        },
        headStyles: {
          fillColor: [4, 120, 87],
        },
      })

      doc.save(`reporte-ventas-${range}-${fileDate}.pdf`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <AppShell title="Reportes de ventas" subtitle="Consulta ventas diarias, semanales y mensuales.">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {Object.entries(rangeLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setRange(key as Range)}
                className={`rounded-md px-4 py-2 text-sm font-semibold ${range === key ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={exportPdf}
            disabled={exporting}
            className="rounded-md border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
          >
            {exporting ? 'Generando PDF...' : 'Descargar PDF'}
          </button>
        </div>
        <div className="mt-3 text-sm text-slate-500">El PDF se genera con el mismo periodo que ves en pantalla.</div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <Metric label={`Ventas (${rangeLabels[range].toLowerCase()})`} value={sales.length.toString()} />
        <Metric label="Total vendido" value={`C$ ${total.toFixed(2)}`} />
        <Metric label="Promedio por venta" value={`C$ ${average.toFixed(2)}`} />
      </section>

      <section className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Codigo</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Pago</th>
              <th className="px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id} className="border-b last:border-0">
                <td className="px-4 py-3">{new Date(sale.created_at).toLocaleString('es-NI')}</td>
                <td className="px-4 py-3 font-mono text-xs">{sale.sale_code ?? sale.id}</td>
                <td className="px-4 py-3">{sale.customer_name ?? 'Consumidor final'}</td>
                <td className="px-4 py-3">{sale.payment_method}</td>
                <td className="px-4 py-3 font-medium">C$ {Number(sale.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sales.length === 0 ? <p className="p-5 text-sm text-slate-500">No hay ventas en este periodo.</p> : null}
      </section>
    </AppShell>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
    </div>
  )
}

function formatCurrency(value: number) {
  return `C$ ${value.toFixed(2)}`
}
