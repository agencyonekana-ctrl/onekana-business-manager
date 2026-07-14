import { useEffect, useState } from 'react'
import { CheckCircle2, ClipboardCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { geographicReviewsApi } from '../../services/geographic-reviews-api'
import type { GeographicEntityType, GeographicReview, GeographicReviewStatus } from '../../types/geography'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'

type GeographicReviewDialogProps = {
  open: boolean
  entityType: GeographicEntityType
  externalId: string
  label: string
  review?: GeographicReview
  onOpenChange: (open: boolean) => void
  onSaved: (review: GeographicReview) => void
}

export function GeographicReviewDialog({ open, entityType, externalId, label, review, onOpenChange, onSaved }: GeographicReviewDialogProps) {
  const [status, setStatus] = useState<GeographicReviewStatus>('to_review')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setStatus(review?.status ?? 'to_review')
      setNote(review?.note ?? '')
    }
  }, [open, review])

  async function save() {
    setSaving(true)
    try {
      const saved = await geographicReviewsApi.save(entityType, externalId, { status, note })
      onSaved(saved)
      onOpenChange(false)
      toast.success('Contrôle enregistré')
    } catch {
      toast.error('Impossible d’enregistrer ce contrôle')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-primary" />Contrôler {label}</DialogTitle></DialogHeader>
        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="review-status">État du contrôle</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as GeographicReviewStatus)}>
              <SelectTrigger id="review-status"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="to_review">À vérifier</SelectItem><SelectItem value="verified">Vérifié</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-note">Note interne</Label>
            <Textarea id="review-note" value={note} onChange={(event) => setNote(event.target.value)} rows={5} maxLength={2000} placeholder="Précisez ce qui a été contrôlé ou ce qui reste à confirmer." />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button type="button" onClick={save} disabled={saving} className="gap-2"><CheckCircle2 className="h-4 w-4" />{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
