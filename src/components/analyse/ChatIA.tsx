'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

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
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/analyse/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history: messages }),
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
    <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <h2 className="text-base font-semibold text-[var(--color-text)]">
          Assistant IA
        </h2>
        <p className="text-xs text-[var(--color-text-sub)] mt-0.5">
          Posez vos questions sur votre portfolio
        </p>
      </div>

      {/* Fil de conversation */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-64 max-h-96">
        {messages.length === 0 && (
          <p className="text-sm text-[var(--color-text-sub)] text-center mt-8">
            Bonjour ! Posez-moi une question sur votre portfolio.
          </p>
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
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-text)]'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[var(--color-bg-secondary)] rounded-xl px-3 py-2">
              <span className="text-sm text-[var(--color-text-sub)]">
                Gemini réfléchit…
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Zone de saisie */}
      <div className="px-4 py-3 border-t border-[var(--color-border)] flex gap-2 items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="Écrivez votre message… (Entrée pour envoyer)"
          rows={2}
          className="flex-1 resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text)] placeholder:text-[var(--color-text-sub)] text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] disabled:opacity-50"
        />
        <button
          onClick={() => void handleSend()}
          disabled={loading || input.trim() === ''}
          className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Envoyer
        </button>
      </div>
    </section>
  )
}
