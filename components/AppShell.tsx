'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import logo from '@/logo.png'

const navigation = [
  { href: '/dashboard', label: 'Panel' },
  { href: '/products', label: 'Productos' },
  { href: '/search', label: 'Consulta' },
  { href: '/sales', label: 'Ventas' },
  { href: '/inventory', label: 'Inventario' },
  { href: '/alerts', label: 'Alertas' },
  { href: '/reports', label: 'Reportes' },
  { href: '/catalogs', label: 'Admin catalogos' },
]

export function AppShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/login')
        return
      }

      setEmail(data.user.email ?? '')
      setLoading(false)
    })
  }, [router])

  const logout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
        Cargando sistema...
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white px-5 py-6 lg:block">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 transition hover:border-emerald-200 hover:bg-emerald-50/40"
        >
          <Image src={logo} alt="Logo de Farmacia Ocampo" className="h-14 w-14 rounded-xl object-contain" priority />
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">Farmacia</p>
            <h1 className="text-2xl font-bold">Ocampo</h1>
          </div>
        </Link>
        <nav className="mt-8 space-y-1">
          {navigation.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm font-medium ${
                  active ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
            <Link href="/dashboard" className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 lg:hidden">
              <Image src={logo} alt="Logo de Farmacia Ocampo" className="h-12 w-12 rounded-xl object-contain" priority />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Farmacia</p>
                <p className="text-lg font-bold text-slate-950">Ocampo</p>
              </div>
            </Link>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">{title}</h2>
                {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden text-sm text-slate-500 sm:inline">{email}</span>
                <button onClick={logout} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100">
                  Salir
                </button>
              </div>
            </div>
            <nav className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${
                    pathname === item.href ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
