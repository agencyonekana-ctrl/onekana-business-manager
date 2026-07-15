import { useState, type FormEvent } from 'react'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { AuthPanel } from '../components/auth/AuthPanel'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { ApiError } from '../services/api-client'
import { remoteApi } from '../services/remote-api'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (password !== confirmation) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await remoteApi.auth.resetPassword({ token, password })
      setDone(true)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Le lien ne peut pas être utilisé.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthPanel title="Nouveau mot de passe" description="Choisissez un mot de passe unique pour votre espace ONEKANA.">
      {!token ? (
        <div role="alert" className="flex gap-3 rounded-lg border border-primary/20 bg-primary/[0.05] p-4 text-sm"><AlertCircle className="h-5 w-5 shrink-0 text-primary" />Ce lien est incomplet ou invalide.</div>
      ) : done ? (
        <div role="status" className="flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><CheckCircle2 className="h-5 w-5 shrink-0" />Votre mot de passe a été mis à jour. Vous pouvez vous connecter.</div>
      ) : (
        <form onSubmit={submit} className="space-y-5" aria-busy={submitting}>
          {error ? <div role="alert" className="flex gap-2 rounded-lg border border-primary/20 bg-primary/[0.05] p-3 text-sm"><AlertCircle className="h-4 w-4 shrink-0 text-primary" />{error}</div> : null}
          <PasswordField id="new-password" label="Nouveau mot de passe" value={password} setValue={setPassword} disabled={submitting} />
          <PasswordField id="confirm-password" label="Confirmer le mot de passe" value={confirmation} setValue={setConfirmation} disabled={submitting} />
          <p className="text-xs leading-5 text-muted-foreground">12 caractères minimum, avec une majuscule, une minuscule et un chiffre.</p>
          <Button type="submit" className="h-12 w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? 'Mise à jour...' : 'Enregistrer le mot de passe'}
          </Button>
        </form>
      )}
    </AuthPanel>
  )
}

function PasswordField({ id, label, value, setValue, disabled }: { id: string, label: string, value: string, setValue: (value: string) => void, disabled: boolean }) {
  return <div className="space-y-2"><label htmlFor={id} className="text-sm font-bold">{label}</label><Input id={id} type="password" autoComplete="new-password" minLength={12} required value={value} onChange={(event) => setValue(event.target.value)} disabled={disabled} className="h-12" /></div>
}
