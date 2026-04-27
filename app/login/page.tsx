'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    const credentials = {
      email: email.trim(),
      password,
    }

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword(credentials)
      setLoading(false)

      if (error) {
        setMessage(error.message)
        return
      }

      router.replace('/dashboard')
      return
    }

    const { error } = await supabase.auth.signUp(credentials)
    setLoading(false)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Usuario registrado. Si Supabase pide confirmacion, revisa el correo antes de iniciar sesion.')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">Farmacia Ocampo</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">{mode === 'login' ? 'Iniciar sesion' : 'Registrar usuario'}</h1>
          <p className="mt-1 text-sm text-slate-600">Accede con correo y contraseña para administrar inventario, ventas y reportes.</p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-md bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setMessage('')
            }}
            className={`rounded-md px-3 py-2 text-sm font-semibold ${mode === 'login' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'}`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register')
              setMessage('')
            }}
            className={`rounded-md px-3 py-2 text-sm font-semibold ${mode === 'register' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'}`}
          >
            Crear usuario
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Correo</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="usuario@farmacia.com"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Minimo 6 caracteres"
            />
          </label>

          <button disabled={loading} className="w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400">
            {loading ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Crear usuario'}
          </button>
        </form>

        {message ? <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-700">{message}</p> : null}
      </section>
    </main>
  )
}
