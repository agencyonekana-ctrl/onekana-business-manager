import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/use-auth'
import { ApiError } from '../services/api-client'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

type LocationState = {
  from?: {
    pathname?: string
  }
}

function loginErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 422) {
      return 'Adresse e-mail ou mot de passe incorrect.'
    }
    if (error.status === 429) {
      return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.'
    }
  }

  return 'Connexion momentanément indisponible. Veuillez réessayer.'
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!loading && isAuthenticated) {
    return <Navigate to={from} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || loading) return

    setSubmitting(true)
    setErrorMessage(null)

    try {
      await login({ email, password })
      navigate(from, { replace: true })
    } catch (error) {
      setErrorMessage(loginErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  function updateEmail(value: string) {
    setEmail(value)
    if (errorMessage) setErrorMessage(null)
  }

  function updatePassword(value: string) {
    setPassword(value)
    if (errorMessage) setErrorMessage(null)
  }

  const busy = submitting || loading

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,1.28fr)_minmax(420px,1fr)]">
      <section className="login-visual relative h-60 overflow-hidden bg-black sm:h-72 lg:sticky lg:top-0 lg:h-screen" aria-label="ONEKANA en action">
        <img
          src="/login-ooh.webp"
          alt="Équipe ONEKANA lors d’une activation publicitaire urbaine"
          className="h-full w-full object-cover object-center"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-black/35" aria-hidden="true" />

        <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-8 lg:p-12">
          <img
            src="/logo%20onekana.png"
            alt="ONEKANA Agency"
            className="h-14 w-44 rounded-lg bg-white object-contain px-3 py-2 shadow-sm sm:h-16 sm:w-52"
          />

          <div className="max-w-2xl pb-1 text-white lg:pb-2">
            <div className="mb-4 h-1 w-12 rounded-full bg-primary" aria-hidden="true" />
            <h1 className="max-w-xl text-2xl font-black leading-tight sm:text-3xl lg:text-5xl">
              Votre espace de travail, simplement.
            </h1>
            <p className="mt-3 hidden max-w-lg text-sm leading-6 text-white/85 sm:block lg:text-base lg:leading-7">
              Retrouvez vos outils et vos activités dans un environnement sécurisé.
            </p>
          </div>
        </div>
      </section>

      <section className="login-form flex min-h-[calc(100vh-15rem)] items-center justify-center border-l border-black/5 bg-[#fdfdfd] px-5 py-10 sm:min-h-[calc(100vh-18rem)] sm:px-10 lg:min-h-screen lg:px-14">
        <div className="w-full max-w-[420px]">
          <div className="mb-9">
            <div className="mb-5 h-1 w-10 rounded-full bg-primary" aria-hidden="true" />
            <h2 id="login-title" className="text-3xl font-black text-foreground sm:text-4xl">Connexion</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Accédez à votre espace ONEKANA.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} aria-labelledby="login-title" aria-busy={busy}>
            {errorMessage ? (
              <div id="login-error" role="alert" aria-live="assertive" className="flex gap-3 rounded-lg border border-primary/20 bg-primary/[0.05] px-4 py-3 text-sm text-foreground">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            ) : null}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-bold text-foreground">
                Adresse e-mail
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                value={email}
                onChange={(event) => updateEmail(event.target.value)}
                required
                disabled={busy}
                aria-describedby={errorMessage ? 'login-error' : undefined}
                className="h-12 rounded-lg bg-white px-4 shadow-none transition-[border-color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-bold text-foreground">
                Mot de passe
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => updatePassword(event.target.value)}
                  required
                  disabled={busy}
                  aria-describedby={errorMessage ? 'login-error' : undefined}
                  className="h-12 rounded-lg bg-white px-4 pr-12 shadow-none transition-[border-color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-primary/20"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50"
                  onClick={() => setShowPassword((current) => !current)}
                  disabled={busy}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex items-center justify-end pt-1">
                <Link to="/forgot-password" className="text-xs font-semibold text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            <Button type="submit" className="h-12 w-full rounded-lg font-bold shadow-sm shadow-primary/15 transition-[background-color,box-shadow,transform] duration-200 hover:shadow-md hover:shadow-primary/15 active:translate-y-px" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {loading ? 'Vérification...' : submitting ? 'Connexion en cours...' : 'Se connecter'}
            </Button>
          </form>

          <p className="mt-8 border-t border-border pt-5 text-center text-xs leading-5 text-muted-foreground">
            Besoin d’aide ? Contactez votre responsable ONEKANA.
          </p>
        </div>
      </section>
    </main>
  )
}
