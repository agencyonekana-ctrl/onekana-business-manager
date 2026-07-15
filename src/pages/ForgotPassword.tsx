import { useState, type FormEvent } from 'react'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { AuthPanel } from '../components/auth/AuthPanel'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { remoteApi } from '../services/remote-api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError(false)
    try {
      await remoteApi.auth.forgotPassword({ email })
      setSent(true)
    } catch {
      setError(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthPanel title="Mot de passe oublié" description="Indiquez votre adresse e-mail pour recevoir un lien sécurisé.">
      {sent ? (
        <div role="status" className="flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <span>Si ce compte existe, un e-mail vient d’être envoyé. Le lien restera valable 30 minutes.</span>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5" aria-busy={submitting}>
          {error ? <div role="alert" className="flex gap-2 rounded-lg border border-primary/20 bg-primary/[0.05] p-3 text-sm"><AlertCircle className="h-4 w-4 shrink-0 text-primary" />Service momentanément indisponible.</div> : null}
          <div className="space-y-2">
            <label htmlFor="recovery-email" className="text-sm font-bold">Adresse e-mail</label>
            <Input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={(event) => { setEmail(event.target.value); setError(false) }} disabled={submitting} className="h-12" />
          </div>
          <Button type="submit" className="h-12 w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? 'Envoi en cours...' : 'Recevoir le lien'}
          </Button>
        </form>
      )}
    </AuthPanel>
  )
}
