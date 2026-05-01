'use client'

import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { formatNicaraguaDateForFileName, formatNicaraguaDateTime, getStartOfNicaraguaRange } from '@/lib/date'
import { supabase } from '@/lib/supabase'
import type { SaleItemSummary, SaleSummary, SaleWithItems } from '@/lib/types'

type Range = 'daily' | 'weekly' | 'monthly'

const rangeLabels: Record<Range, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual',
}

export default function ReportsPage() {
  const [range, setRange] = useState<Range>('daily')
  const [sales, setSales] = useState<SaleWithItems[]>([])
  const [exporting, setExporting] = useState(false)

  const fromDate = useMemo(() => getStartOfNicaraguaRange(range), [range])

  useEffect(() => {
    const loadSales = async () => {
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('id,sale_code,total,payment_method,customer_name,created_at')
        .gte('created_at', fromDate)
        .order('created_at', { ascending: false })

      if (salesError || !salesData) {
        setSales([])
        return
      }

      const baseSales = salesData as SaleSummary[]
      if (baseSales.length === 0) {
        setSales([])
        return
      }

      const saleIds = baseSales.map((sale) => sale.id)
      const { data: itemsData } = await supabase
        .from('sale_items')
        .select('id,sale_id,quantity,unit_price,product_id,products(name)')
        .in('sale_id', saleIds)

      const itemsBySaleId = ((itemsData as SaleItemSummary[] | null) ?? []).reduce<Record<number, SaleItemSummary[]>>((accumulator, item) => {
        const saleId = Number(item.sale_id)
        if (!accumulator[saleId]) accumulator[saleId] = []
        accumulator[saleId].push(item)
        return accumulator
      }, {})

      setSales(baseSales.map((sale) => ({ ...sale, sale_items: itemsBySaleId[sale.id] ?? [] })))
    }

    loadSales()
  }, [fromDate])

  const total = sales.reduce((sum, sale) => sum + Number(sale.total), 0)
  const average = sales.length ? total / sales.length : 0

  const exportPdf = async () => {
    setExporting(true)

    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
      const doc = new jsPDF({ orientation: 'landscape' })
      const generatedAt = new Date()
      const fileDate = formatNicaraguaDateForFileName(generatedAt)
      const pdfRows = buildPdfRows(sales)

      doc.setFontSize(18)
      doc.text('Farmacia Ocampo', 14, 18)
      doc.setFontSize(12)
      doc.text(`Reporte de ventas ${rangeLabels[range].toLowerCase()}`, 14, 27)
      doc.setFontSize(10)
      doc.text(`Generado: ${formatNicaraguaDateTime(generatedAt)}`, 14, 35)
      doc.text(`Ventas registradas: ${sales.length}`, 14, 42)
      doc.text(`Total vendido: ${formatCurrency(total)}`, 14, 49)
      doc.text(`Promedio por venta: ${formatCurrency(average)}`, 14, 56)

      autoTable(doc, {
        startY: 64,
        head: [['Fecha', 'Codigo', 'Cliente', 'Producto', 'Cant.', 'Pago', 'Subtotal']],
        body: pdfRows.length > 0 ? pdfRows : [['Sin ventas en este periodo', '', '', '', '', '', '']],
        styles: {
          fontSize: 9,
        },
        headStyles: {
          fillColor: [4, 120, 87],
        },
        columnStyles: {
          0: { cellWidth: 32 },
          1: { cellWidth: 35 },
          2: { cellWidth: 45 },
          3: { cellWidth: 85 },
          4: { cellWidth: 18 },
          5: { cellWidth: 28 },
          6: { cellWidth: 25 },
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
              <th className="px-4 py-3">Productos</th>
              <th className="px-4 py-3">Pago</th>
              <th className="px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id} className="border-b last:border-0">
                <td className="px-4 py-3">{formatNicaraguaDateTime(sale.created_at)}</td>
                <td className="px-4 py-3 font-mono text-xs">{sale.sale_code ?? sale.id}</td>
                <td className="px-4 py-3">{sale.customer_name ?? 'Consumidor final'}</td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    {(sale.sale_items ?? []).length > 0 ? (
                      sale.sale_items?.map((item) => (
                        <p key={item.id} className="text-xs text-slate-700">
                          {item.products?.name ?? 'Producto'} x{item.quantity} - C$ {Number(item.subtotal ?? item.quantity * item.unit_price).toFixed(2)}
                        </p>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">Sin detalle</p>
                    )}
                  </div>
                </td>
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

function formatSaleItems(sale: SaleWithItems) {
  if (!sale.sale_items || sale.sale_items.length === 0) return 'Sin detalle'

  return sale.sale_items
    .map((item) => `${item.products?.name ?? 'Producto'} x${item.quantity} (C$ ${Number(item.subtotal ?? item.quantity * item.unit_price).toFixed(2)})`)
    .join('\n')
}

function buildPdfRows(sales: SaleWithItems[]) {
  return sales.flatMap((sale) => {
    const items = sale.sale_items ?? []

    if (items.length === 0) {
      return [[formatNicaraguaDateTime(sale.created_at), sale.sale_code ?? String(sale.id), sale.customer_name ?? 'Consumidor final', 'Sin detalle', '', sale.payment_method, formatCurrency(Number(sale.total))]]
    }

    return items.map((item) => [
      formatNicaraguaDateTime(sale.created_at),
      sale.sale_code ?? String(sale.id),
      sale.customer_name ?? 'Consumidor final',
      item.products?.name ?? 'Producto',
      String(item.quantity),
      sale.payment_method,
      formatCurrency(Number(item.subtotal ?? item.quantity * item.unit_price)),
    ])
  })
}
