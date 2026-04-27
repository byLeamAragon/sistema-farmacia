'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { supabase } from '@/lib/supabase'
import type { CatalogItem } from '@/lib/types'

const catalogs = [
  { table: 'units', title: 'Unidades', placeholder: 'Tableta, ml, frasco...' },
  { table: 'presentations', title: 'Presentaciones', placeholder: 'Caja, blister, ampolla...' },
  { table: 'product_types', title: 'Tipos', placeholder: 'Analgesico, antibiotico...' },
  { table: 'locations', title: 'Ubicaciones', placeholder: 'Estante 1, vitrina, bodega...' },
] as const

export default function CatalogsPage() {
  return (
    <AppShell title="Administracion de catalogos" subtitle="Administra listas reutilizables para registrar productos con datos consistentes.">
      <div className="grid gap-5 lg:grid-cols-4">
        {catalogs.map((catalog) => <CatalogManager key={catalog.table} {...catalog} />)}
      </div>
    </AppShell>
  )
}

function CatalogManager({ table, title, placeholder }: { table: 'units' | 'presentations' | 'product_types' | 'locations'; title: string; placeholder: string }) {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    const { data } = await supabase.from(table).select('*').order('name')
    setItems((data as CatalogItem[]) ?? [])
  }, [table])

  useEffect(() => {
    load()
  }, [load])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage('')
    const clean = name.trim()
    if (!clean) return

    const { error } = await supabase.from(table).insert({ name: clean })
    if (error) {
      setMessage(error.message)
      return
    }

    setName('')
    setMessage('Guardado.')
    load()
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>
      <form onSubmit={submit} className="mt-4 flex gap-2">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder={placeholder} className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Agregar</button>
      </form>
      {message ? <p className="mt-2 text-xs text-slate-500">{message}</p> : null}
      <ul className="mt-4 divide-y divide-slate-100">
        {items.map((item) => <li key={item.id} className="py-2 text-sm">{item.name}</li>)}
      </ul>
      {items.length === 0 ? <p className="mt-4 text-sm text-slate-500">Sin registros.</p> : null}
    </section>
  )
}
