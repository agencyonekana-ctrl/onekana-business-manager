import { FormEvent, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LockKeyhole, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/use-auth'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

type LocationState = {
  from?: {
    pathname?: string
  }
}

export default function Login() {
  const { login, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as LocationState | null)?.from?.pathname || '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && isAuthenticated) {
    return <Navigate to={from} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)

    try {
      await login({ email, password })
      toast.success('Connexion reussie')
      navigate(from, { replace: true })
    } catch {
      toast.error('Identifiants invalides ou service temporairement indisponible')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f6] px-4 py-6 sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-2xl shadow-black/10 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-[#111111] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
          <div className="absolute -bottom-32 left-12 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <div className="flex h-20 w-64 items-center rounded-3xl bg-white px-5 py-3 shadow-sm">
              <img src="/logo%20onekana.png" alt="ONEKANA" className="h-full w-full object-contain" />
            </div>

            <div className="mt-16 max-w-xl">
              <p className="text-sm font-black uppercase tracking-wide text-primary">Portail ONEKANA</p>
              <h1 className="mt-4 text-5xl font-black uppercase leading-tight">
                Bienvenue dans votre espace de travail.
              </h1>
              <p className="mt-5 text-base leading-7 text-white/70">
                Retrouvez les outils ONEKANA dont vous avez besoin pour suivre l'activite, les operations et les informations importantes.
              </p>
            </div>
          </div>

          <div className="relative grid gap-3 sm:grid-cols-3">
            {['Suivi', 'Operations', 'Finance'].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <div className="text-xs font-black uppercase tracking-wide text-white/45">Espace</div>
                <div className="mt-2 text-sm font-bold">{item}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <div className="flex h-16 w-52 items-center rounded-2xl border border-border bg-white px-4 py-2 shadow-sm">
                <img src="/logo%20onekana.png" alt="ONEKANA" className="h-full w-full object-contain" />
              </div>
            </div>

            <div className="mb-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <LockKeyhole className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">Connexion</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Entrez vos identifiants pour continuer.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-bold text-foreground">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-bold text-foreground">
                  Mot de passe
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="h-12 rounded-xl pr-11"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="h-12 w-full rounded-xl font-black uppercase" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Se connecter
              </Button>
            </form>

            <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
              Besoin d'aide pour acceder a votre espace ? Contactez votre responsable ONEKANA.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
