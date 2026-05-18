import { FormEvent, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LockKeyhole, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/use-auth'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent } from '../components/ui/card'

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
  const [email, setEmail] = useState('admin@onekana.local')
  const [password, setPassword] = useState('password')
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
    <div className="min-h-screen bg-[#f7f7f7] px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-border bg-white shadow-2xl shadow-black/5 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden bg-[#151313] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="flex h-20 w-64 items-center rounded-3xl bg-white px-5 py-3">
                <img src="/logo%20onekana.png" alt="ONEKANA" className="h-full w-full object-contain" />
              </div>
              <div className="mt-14 max-w-lg">
                <p className="text-sm font-black uppercase tracking-wide text-primary">Back Office</p>
                <h1 className="mt-4 text-5xl font-black uppercase leading-tight">
                  Piloter la regie, les ventes et les operations ONEKANA.
                </h1>
                <p className="mt-5 text-base leading-7 text-white/70">
                  Connectez-vous avec votre compte autorise. Les menus affiches dependent de votre profil et de vos droits.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm text-white/70">
              Espace interne reserve aux equipes autorisees ONEKANA.
            </div>
          </section>

          <section className="flex items-center justify-center p-6 sm:p-10">
            <Card className="w-full max-w-md border-0 shadow-none">
              <CardContent className="p-0">
                <div className="mb-8 lg:hidden">
                  <div className="flex h-16 w-52 items-center rounded-2xl border border-border bg-white px-4 py-2 shadow-sm">
                    <img src="/logo%20onekana.png" alt="ONEKANA" className="h-full w-full object-contain" />
                  </div>
                </div>

                <div className="mb-7">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <LockKeyhole className="h-6 w-6" />
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">Connexion</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Accedez a votre espace de gestion ONEKANA.
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
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-bold text-foreground">
                      Mot de passe
                    </label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      className="h-11"
                    />
                  </div>

                  <Button type="submit" className="h-11 w-full rounded-xl font-black uppercase" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Se connecter
                  </Button>
                </form>

                <p className="mt-6 rounded-2xl border border-border bg-muted/40 p-4 text-xs leading-5 text-muted-foreground">
                  Compte local de depart : <span className="font-semibold">admin@onekana.local</span> /{' '}
                  <span className="font-semibold">password</span>
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  )
}
