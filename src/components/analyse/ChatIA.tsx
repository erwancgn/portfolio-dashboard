'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const MAX_CLIENT_HISTORY = 8

/**
 * ChatIA — Client Component.
 * Interface de chat avec Gemini pour analyser le portfolio.
 * Appelle POST /api/analyse/chat avec le message et l'historique de la conversation.
 */
export default function ChatIA() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMessage: Message = { role: 'user', content: trimmed }
    const nextHistory = [...messages, userMessage].slice(-MAX_CLIENT_HISTORY)

    setMessages(nextHistory)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/analyse/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history: nextHistory }),
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const data = (await res.json()) as { reply: string }
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "Désolé, une erreur s'est produite. Veuillez réessayer.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  return (
    <section className="glass-card flex flex-col overflow-hidden rounded-[28px]">
      <div className="border-b border-[var(--color-border)] px-5 py-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-dim)]">
          Conversation
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[var(--color-text)]">
          Assistant IA
        </h2>
        <p className="mt-1 text-sm text-[var(--color-text-sub)]">
          Posez vos questions sur votre portfolio
        </p>
      </div>

      {/* Fil de conversation */}
      <div className="min-h-64 max-h-[30rem] flex-1 space-y-3 overflow-y-auto px-5 py-5">
        {messages.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-5 py-8 text-center">
            <p className="text-sm text-[var(--color-text-sub)]">
              Commencez par une question sur la diversification, les risques, vos plus grosses positions ou les arbitrages possibles.
            </p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text)]'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2">
              <span className="text-sm text-[var(--color-text-sub)]">
                Gemini réfléchit…
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Zone de saisie */}
      <div className="flex items-end gap-2 border-t border-[var(--color-border)] px-5 py-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="Écrivez votre message… (Entrée pour envoyer)"
          rows={2}
          className="flex-1 resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-sub)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] disabled:opacity-50"
        />
        <button
          onClick={() => void handleSend()}
          disabled={loading || input.trim() === ''}
          className="rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Envoyer
        </button>
      </div>
    </section>
  )
}
