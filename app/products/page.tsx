'use client'

import { FormEvent, useEffect, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { ProductTable } from '@/components/ProductTable'
import { supabase } from '@/lib/supabase'
import type { CatalogItem, Product } from '@/lib/types'

const emptyForm = {
  name: '',
  barcode: '',
  price: '',
  cost: '',
  type: '',
  unit_id: '',
  presentation_id: '',
  location: '',
  description: '',
  dose: '',
  stock_quantity: '0',
  min_stock: '10',
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [units, setUnits] = useState<CatalogItem[]>([])
  const [presentations, setPresentations] = useState<CatalogItem[]>([])
  const [productTypes, setProductTypes] = useState<CatalogItem[]>([])
  const [locations, setLocations] = useState<CatalogItem[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  const load = async () => {
    const [productResult, unitResult, presentationResult, typeResult, locationResult] = await Promise.all([
      supabase.from('products').select('*, units:unit_id(id,name), presentations:presentation_id(id,name)').order('name'),
      supabase.from('units').select('*').order('name'),
      supabase.from('presentations').select('*').order('name'),
      supabase.from('product_types').select('*').order('name'),
      supabase.from('locations').select('*').order('name'),
    ])
    setProducts((productResult.data as Product[]) ?? [])
    setUnits((unitResult.data as CatalogItem[]) ?? [])
    setPresentations((presentationResult.data as CatalogItem[]) ?? [])
    setProductTypes((typeResult.data as CatalogItem[]) ?? [])
    setLocations((locationResult.data as CatalogItem[]) ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage('')
    const selectedType = productTypes.find((item) => item.name === form.type)
    const selectedUnit = units.find((item) => item.id === Number(form.unit_id))
    const selectedPresentation = presentations.find((item) => item.id === Number(form.presentation_id))
    const selectedLocation = locations.find((item) => item.name === form.location)

    if (!selectedType || !selectedUnit || !selectedPresentation || !selectedLocation) {
      setMessage('Selecciona tipo, unidad, presentacion y ubicacion desde sus catalogos.')
      return
    }

    const payload = {
      name: form.name.trim(),
      barcode: form.barcode.trim() || null,
      price: Number(form.price),
      cost: form.cost ? Number(form.cost) : null,
      type: form.type.trim(),
      unit_id: form.unit_id ? Number(form.unit_id) : null,
      presentation_id: form.presentation_id ? Number(form.presentation_id) : null,
      presentation: selectedPresentation.name,
      location: form.location.trim(),
      description: form.description.trim(),
      dose: form.dose.trim() || null,
      stock_quantity: Number(form.stock_quantity),
      min_stock: Number(form.min_stock),
    }

    const { error } = editingProductId
      ? await supabase.from('products').update(payload).eq('id', editingProductId)
      : await supabase.from('products').insert(payload)

    if (error) {
      setMessage(error.message)
      return
    }

    setForm(emptyForm)
    setEditingProductId(null)
    setMessage(editingProductId ? 'Producto actualizado correctamente.' : 'Producto registrado correctamente.')
    load()
  }

  const editProduct = (product: Product) => {
    setEditingProductId(product.id)
    setMessage('')
    setForm({
      name: product.name ?? '',
      barcode: product.barcode ?? '',
      price: String(product.price ?? ''),
      cost: product.cost === null || product.cost === undefined ? '' : String(product.cost),
      type: product.type ?? '',
      unit_id: product.unit_id ? String(product.unit_id) : '',
      presentation_id: product.presentation_id ? String(product.presentation_id) : '',
      location: product.location ?? '',
      description: product.description ?? '',
      dose: product.dose ?? '',
      stock_quantity: String(product.stock_quantity ?? 0),
      min_stock: String(product.min_stock ?? 10),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingProductId(null)
    setForm(emptyForm)
    setMessage('')
  }

  return (
    <AppShell title="Productos" subtitle="Registra y actualiza medicamentos con precio, presentacion, ubicacion, dosis y stock minimo.">
      <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold">{editingProductId ? 'Editar producto' : 'Nuevo producto'}</h3>
          {editingProductId ? (
            <button type="button" onClick={cancelEdit} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100">
              Cancelar edicion
            </button>
          ) : null}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Nombre" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
          <Field label="Codigo de barras" value={form.barcode} onChange={(value) => setForm({ ...form, barcode: value })} />
          <Field label="Precio venta" type="number" step="0.01" value={form.price} onChange={(value) => setForm({ ...form, price: value })} required />
          <Field label="Costo" type="number" step="0.01" value={form.cost} onChange={(value) => setForm({ ...form, cost: value })} />
          <TypeSelect label="Tipo" value={form.type} onChange={(value) => setForm({ ...form, type: value })} options={productTypes} required />
          <Select label="Unidad" value={form.unit_id} onChange={(value) => setForm({ ...form, unit_id: value })} options={units} required />
          <Select label="Presentacion" value={form.presentation_id} onChange={(value) => setForm({ ...form, presentation_id: value })} options={presentations} required />
          <TextSelect label="Ubicacion" value={form.location} onChange={(value) => setForm({ ...form, location: value })} options={locations} placeholder="Seleccionar ubicacion" required />
          <Field label="Stock inicial" type="number" value={form.stock_quantity} onChange={(value) => setForm({ ...form, stock_quantity: value })} required />
          <Field label="Stock minimo" type="number" value={form.min_stock} onChange={(value) => setForm({ ...form, min_stock: value })} required />
          <Field label="Dosis" value={form.dose} onChange={(value) => setForm({ ...form, dose: value })} />
          <label className="md:col-span-3">
            <span className="text-sm font-medium text-slate-700">Descripcion</span>
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
            {editingProductId ? 'Actualizar producto' : 'Guardar producto'}
          </button>
          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        </div>
      </form>

      <ProductTable products={products} onEdit={editProduct} />
    </AppShell>
  )
}

function TextSelect({ label, value, onChange, options, placeholder, required }: { label: string; value: string; onChange: (value: string) => void; options: CatalogItem[]; placeholder: string; required?: boolean }) {
  return (
    <label>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} required={required} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.name}>{option.name}</option>
        ))}
      </select>
    </label>
  )
}

function TypeSelect({ label, value, onChange, options, required }: { label: string; value: string; onChange: (value: string) => void; options: CatalogItem[]; required?: boolean }) {
  return (
    <label>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} required={required} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
        <option value="">Seleccionar tipo</option>
        {options.map((option) => (
          <option key={option.id} value={option.name}>{option.name}</option>
        ))}
      </select>
    </label>
  )
}

function Field({ label, value, onChange, type = 'text', required, step }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; step?: string }) {
  return (
    <label>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input type={type} step={step} value={value} onChange={(event) => onChange(event.target.value)} required={required} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
    </label>
  )
}

function Select({ label, value, onChange, options, required }: { label: string; value: string; onChange: (value: string) => void; options: CatalogItem[]; required?: boolean }) {
  return (
    <label>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} required={required} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
        <option value="">Sin seleccionar</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>{option.name}</option>
        ))}
      </select>
    </label>
  )
}
