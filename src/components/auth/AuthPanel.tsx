import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function AuthPanel({ title, description, children }: { title: string, description: string, children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f5f5] px-5 py-10">
      <section className="w-full max-w-md rounded-lg border border-border bg-white p-6 shadow-sm sm:p-8">
        <img src="/logo%20onekana.png" alt="ONEKANA Agency" className="mb-8 h-14 w-44 object-contain object-left" />
        <div className="mb-8 h-1 w-10 rounded-full bg-primary" aria-hidden="true" />
        <h1 className="text-3xl font-black text-foreground">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="mt-7">{children}</div>
        <Link to="/login" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
          <ArrowLeft className="h-4 w-4" /> Retour à la connexion
        </Link>
      </section>
    </main>
  )
}
