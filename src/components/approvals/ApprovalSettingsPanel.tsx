import { useEffect, useState } from 'react'
import { Clock3, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { approvalApi } from '../../services/approval-api'
import type { ApprovalSettings } from '../../types/approvals'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

const defaults: ApprovalSettings = { requestDueHours: 24, campaignDueHours: 24, userDueHours: 48, documentDueHours: 48, importSinceDays: 30 }

export function ApprovalSettingsPanel() {
  const [values, setValues] = useState(defaults)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    approvalApi.settings()
      .then(setValues)
      .catch(() => toast.error('Les délais de validation sont temporairement indisponibles.'))
      .finally(() => setLoading(false))
  }, [])

  function setField(field: keyof ApprovalSettings, value: string) {
    setValues((current) => ({ ...current, [field]: Number(value) }))
  }

  async function save() {
    setSaving(true)
    try {
      const updated = await approvalApi.updateSettings({
        requestDueHours: values.requestDueHours,
        campaignDueHours: values.campaignDueHours,
        userDueHours: values.userDueHours,
        documentDueHours: values.documentDueHours,
        importSinceDays: values.importSinceDays,
      })
      setValues(updated)
      toast.success('Délais de validation enregistrés.')
    } catch {
      toast.error('Les délais n’ont pas pu être enregistrés.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary"><Clock3 className="h-5 w-5" /></div>
        <CardTitle>Délais de traitement</CardTitle>
        <CardDescription>Définissez le temps accordé avant qu’un dossier apparaisse comme prioritaire.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <DurationField id="requestDueHours" label="Demandes clients" value={values.requestDueHours} onChange={(value) => setField('requestDueHours', value)} disabled={loading || saving} />
          <DurationField id="campaignDueHours" label="Campagnes reçues" value={values.campaignDueHours} onChange={(value) => setField('campaignDueHours', value)} disabled={loading || saving} />
          <DurationField id="userDueHours" label="Comptes utilisateurs" value={values.userDueHours} onChange={(value) => setField('userDueHours', value)} disabled={loading || saving} />
          <DurationField id="documentDueHours" label="Documents" value={values.documentDueHours} onChange={(value) => setField('documentDueHours', value)} disabled={loading || saving} />
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="importSinceDays">Période reprise lors de la première actualisation</Label>
            <div className="flex items-center gap-2"><Input id="importSinceDays" type="number" min={1} max={365} value={values.importSinceDays} disabled={loading || saving} onChange={(event) => setField('importSinceDays', event.target.value)} /><span className="text-sm text-muted-foreground">jours</span></div>
          </div>
        </div>
        <Button onClick={save} disabled={loading || saving} className="gap-2"><Save className="h-4 w-4" />{saving ? 'Enregistrement...' : 'Enregistrer les délais'}</Button>
      </CardContent>
    </Card>
  )
}

function DurationField({ id, label, value, onChange, disabled }: { id: string; label: string; value: number; onChange: (value: string) => void; disabled: boolean }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><div className="flex items-center gap-2"><Input id={id} type="number" min={1} max={720} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} /><span className="text-sm text-muted-foreground">heures</span></div></div>
}
