'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async () => {
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage({ text: error.message, type: 'error' })
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  const handleSignUp = async () => {
    setLoading(true)
    setMessage(null)
  
    const { data, error } = await supabase.auth.signUp({ email, password })
  
    if (error) {
      setMessage({ text: error.message, type: 'error' })
      setLoading(false)
      return
    }
  
    // Si l'utilisateur est créé et confirmé automatiquement → redirect dashboard
    if (data.session) {
      router.push('/dashboard')
      router.refresh()
      return
    }
  
    // Fallback si confirmation email requise (prod)
    setMessage({ text: 'Compte créé. Connecte-toi.', type: 'success' })
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--color-bg-primary)]">
      <div className="w-full max-w-md rounded-2xl p-10 bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl text-2xl mb-3 bg-[var(--color-accent)]">
            📈
          </div>
          <h1 className="text-xl font-extrabold text-[var(--color-text)]">
            Portfolio Dashboard
          </h1>
          <p className="text-sm mt-1 text-[var(--color-text-sub)]">
            Connecte-toi pour acceder a ton portfolio
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--color-text-sub)]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ton@email.com"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text)]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-[var(--color-text-sub)]">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="password"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text)]"
            />
          </div>
          {message && (
            <div className={[
              'rounded-lg px-3 py-2.5 text-sm font-medium border',
              message.type === 'success'
                ? 'bg-[var(--color-green-bg)] border-[var(--color-green)] text-[var(--color-green-text)]'
                : 'bg-[var(--color-red-bg)] border-[var(--color-red)] text-[var(--color-red-text)]'
            ].join(' ')}>
              {message.text}
            </div>
          )}
          <button
            onClick={handleLogin}
            disabled={loading || !email || !password}
            className={[
              'w-full py-3 rounded-lg font-bold text-sm text-white mt-1',
              loading ? 'bg-[var(--color-accent-hover)] cursor-not-allowed' : 'bg-[var(--color-accent)] cursor-pointer',
              (!email || !password) ? 'cursor-not-allowed' : ''
            ].join(' ')}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-[var(--color-border)]" />
            <span className="text-xs text-[var(--color-text-dim)]">ou</span>
            <div className="flex-1 h-px bg-[var(--color-border)]" />
          </div>
          <button
            onClick={handleSignUp}
            disabled={loading || !email || !password}
            className={[
              'w-full py-3 rounded-lg font-semibold text-sm bg-transparent border border-[var(--color-border)] text-[var(--color-text-sub)]',
              loading || !email || !password ? 'cursor-not-allowed' : 'cursor-pointer'
            ].join(' ')}
          >
            Creer un compte
          </button>
        </div>
      </div>
    </div>
  )
}