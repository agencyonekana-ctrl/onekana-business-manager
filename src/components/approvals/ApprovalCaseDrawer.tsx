import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, MessageSquareText, RotateCcw, Send, UserRoundCheck, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { approvalApi } from '../../services/approval-api'
import type { ApprovalAssignee, ApprovalCase, ApprovalPriority, ApprovalStatus } from '../../types/approvals'
import { can } from '../../lib/access-control'
import { useAuth } from '../../hooks/use-auth'
import { ApprovalPriorityBadge, ApprovalStatusBadge } from './ApprovalBadges'
import { approvalResourceLabels } from './approval-labels'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet'
import { Textarea } from '../ui/textarea'

type Props = { caseId: string | null; open: boolean; onOpenChange: (open: boolean) => void; onChanged?: () => void }

const transitions: Partial<Record<ApprovalStatus, Array<{ status: ApprovalStatus; label: string; icon: typeof CheckCircle2; variant?: 'default' | 'outline' }>>> = {
  pending: [{ status: 'in_review', label: 'Prendre en charge', icon: UserRoundCheck }],
  in_review: [
    { status: 'approved', label: 'Valider', icon: CheckCircle2 },
    { status: 'needs_information', label: 'Demander des informations', icon: MessageSquareText, variant: 'outline' },
    { status: 'rejected', label: 'Refuser', icon: XCircle, variant: 'outline' },
  ],
  needs_information: [
    { status: 'in_review', label: 'Reprendre le contrôle', icon: RotateCcw },
    { status: 'rejected', label: 'Refuser', icon: XCircle, variant: 'outline' },
  ],
  approved: [{ status: 'archived', label: 'Archiver', icon: CheckCircle2, variant: 'outline' }],
  rejected: [{ status: 'archived', label: 'Archiver', icon: CheckCircle2, variant: 'outline' }],
  archived: [{ status: 'in_review', label: 'Rouvrir', icon: RotateCcw, variant: 'outline' }],
}

export function ApprovalCaseDrawer({ caseId, open, onOpenChange, onChanged }: Props) {
  const { user } = useAuth()
  const [item, setItem] = useState<ApprovalCase | null>(null)
  const [assignees, setAssignees] = useState<ApprovalAssignee[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reason, setReason] = useState('')
  const [comment, setComment] = useState('')
  const canAssign = can(user, 'approvals.assign')
  const canDecide = can(user, 'approvals.decide')

  useEffect(() => {
    if (!open || !caseId) return
    setLoading(true)
    Promise.all([approvalApi.get(caseId), approvalApi.assignees()])
      .then(([detail, users]) => { setItem(detail); setAssignees(users.filter((entry) => entry.isActive !== false)) })
      .catch(() => toast.error('Le dossier ne peut pas être chargé.'))
      .finally(() => setLoading(false))
  }, [caseId, open])

  const events = useMemo(() => item?.events ?? [], [item])

  async function update(changes: { priority?: ApprovalPriority; assignedTo?: string | null; dueAt?: string | null }) {
    if (!item) return
    setSaving(true)
    try { const updated = await approvalApi.update(item.id, { ...changes, version: item.version }); setItem({ ...item, ...updated }); onChanged?.() }
    catch { toast.error('La modification n’a pas pu être enregistrée.') }
    finally { setSaving(false) }
  }

  async function transition(status: ApprovalStatus) {
    if (!item) return
    if (['needs_information', 'rejected'].includes(status) && !reason.trim()) { toast.error('Indiquez le motif de cette décision.'); return }
    if (item.status === 'archived' && status === 'in_review' && !reason.trim()) { toast.error('Indiquez le motif de la réouverture.'); return }
    setSaving(true)
    try { const updated = await approvalApi.transition(item.id, { status, version: item.version, reason: reason.trim() || undefined }); setItem({ ...item, ...updated }); setReason(''); onChanged?.(); toast.success('Décision enregistrée.') }
    catch { toast.error('Cette décision n’a pas pu être enregistrée.') }
    finally { setSaving(false) }
  }

  async function sendComment() {
    if (!item || !comment.trim()) return
    setSaving(true)
    try { await approvalApi.addComment(item.id, comment.trim()); setComment(''); setItem(await approvalApi.get(item.id)); onChanged?.() }
    catch { toast.error('Le commentaire n’a pas pu être ajouté.') }
    finally { setSaving(false) }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto bg-white p-0 sm:max-w-2xl">
        {loading || !item ? <div className="p-8 text-sm text-muted-foreground">Chargement du dossier...</div> : (
          <div className="min-h-full">
            <SheetHeader className="border-b border-border px-6 py-6 pr-12">
              <div className="flex flex-wrap items-center gap-2"><ApprovalStatusBadge status={item.status} /><ApprovalPriorityBadge priority={item.priority} /></div>
              <SheetTitle className="pt-2 text-xl font-black">{item.title}</SheetTitle>
              <SheetDescription>{approvalResourceLabels[item.resourceType]}{item.companyName ? ` · ${item.companyName}` : ''}</SheetDescription>
            </SheetHeader>

            <div className="space-y-7 p-6">
              <section aria-labelledby="case-organization" className="space-y-4">
                <h3 id="case-organization" className="text-xs font-black uppercase text-muted-foreground">Organisation du contrôle</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label>Responsable</Label><Select disabled={!canAssign || saving} value={item.assignedTo || 'none'} onValueChange={(value) => update({ assignedTo: value === 'none' ? null : value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Non assigné</SelectItem>{assignees.map((assignee) => <SelectItem key={assignee.id} value={assignee.id}>{assignee.displayName || assignee.name}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>Priorité</Label><Select disabled={!canAssign || saving} value={item.priority} onValueChange={(value) => update({ priority: value as ApprovalPriority })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Faible</SelectItem><SelectItem value="normal">Normale</SelectItem><SelectItem value="high">Haute</SelectItem><SelectItem value="urgent">Urgente</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2 sm:col-span-2"><Label htmlFor="approval-due-date">Échéance</Label><Input id="approval-due-date" type="datetime-local" disabled={!canAssign || saving} value={toLocalInput(item.dueAt)} onChange={(event) => update({ dueAt: event.target.value ? event.target.value.replace('T', ' ') + ':00' : null })} /></div>
                </div>
              </section>

              {canDecide && transitions[item.status]?.length ? <section className="space-y-3 border-t border-border pt-6"><h3 className="text-xs font-black uppercase text-muted-foreground">Décision</h3><Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motif ou précision utile à la décision" className="min-h-20" disabled={saving} /><div className="flex flex-wrap gap-2">{transitions[item.status]?.map((action) => <Button key={action.status} variant={action.variant || 'default'} disabled={saving} onClick={() => transition(action.status)} className="gap-2"><action.icon className="h-4 w-4" />{action.label}</Button>)}</div></section> : null}

              <section className="space-y-3 border-t border-border pt-6"><h3 className="text-xs font-black uppercase text-muted-foreground">Commentaires internes</h3><div className="flex gap-2"><Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Ajouter une note au dossier" className="min-h-16" disabled={!canDecide || saving} /><Button size="icon" title="Envoyer le commentaire" disabled={!canDecide || saving || !comment.trim()} onClick={sendComment}><Send className="h-4 w-4" /></Button></div><div className="space-y-3">{item.comments?.length ? item.comments.map((entry) => <div key={entry.id} className="border-l-2 border-primary/30 pl-3"><div className="text-sm font-bold">{entry.userName || 'Administrateur'}</div><p className="mt-1 text-sm text-muted-foreground">{entry.body}</p><span className="mt-1 block text-xs text-muted-foreground">{formatDate(entry.createdAt)}</span></div>) : <p className="text-sm text-muted-foreground">Aucun commentaire pour le moment.</p>}</div></section>

              <section className="space-y-3 border-t border-border pt-6"><h3 className="text-xs font-black uppercase text-muted-foreground">Historique</h3><div className="space-y-3">{events.map((event) => <div key={event.id} className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" /><div><p className="text-sm font-semibold">{eventLabel(event.type)}</p><p className="text-xs text-muted-foreground">{event.userName || 'Système'} · {formatDate(event.createdAt)}</p>{event.reason ? <p className="mt-1 text-sm text-muted-foreground">{event.reason}</p> : null}</div></div>)}</div></section>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function toLocalInput(value?: string | null) { return value ? value.replace(' ', 'T').slice(0, 16) : '' }
function formatDate(value?: string | null) { if (!value) return 'Date non renseignée'; const date = new Date(value.replace(' ', 'T') + (value.includes('Z') ? '' : 'Z')); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date) }
function eventLabel(type: string) { return ({ created: 'Dossier créé', imported: 'Dossier importé', flagged: 'Dossier signalé', updated: 'Organisation mise à jour', transitioned: 'Statut modifié', commented: 'Commentaire ajouté', deadline_soon: 'Échéance proche signalée', deadline_overdue: 'Retard signalé', policy_changed: 'Règle de contrôle mise à jour' } as Record<string, string>)[type] || 'Dossier mis à jour' }
