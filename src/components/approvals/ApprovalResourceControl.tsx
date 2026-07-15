import { ClipboardCheck, Flag } from 'lucide-react'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { Button } from '../ui/button'
import { ApprovalStatusBadge } from './ApprovalBadges'
import { approvalApi } from '../../services/approval-api'
import type { ApprovalCase, ApprovalPriority, ApprovalResourceType } from '../../types/approvals'
import { useAuth } from '../../hooks/use-auth'
import { can, canModule } from '../../lib/access-control'

type Props = {
  item?: ApprovalCase
  resourceType: ApprovalResourceType
  externalId: string
  title: string
  subtitle?: string
  companyName?: string
  snapshot?: Record<string, unknown>
  priority?: ApprovalPriority
  onOpen: (id: string) => void
  onCreated?: () => void
}

export function ApprovalResourceControl({ item, resourceType, externalId, title, subtitle, companyName, snapshot, priority, onOpen, onCreated }: Props) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const canFlag = canModule(user, 'approvals') && can(user, 'approvals.decide')

  async function handleClick() {
    if (item) { onOpen(item.id); return }
    if (!canFlag) return
    setLoading(true)
    try {
      const created = await approvalApi.create({ resourceType, externalId, title, subtitle, companyName, snapshot, priority })
      onCreated?.(); onOpen(created.id); toast.success('Dossier ajouté au Centre de validation.')
    } catch { toast.error('Le dossier ne peut pas être signalé pour le moment.') }
    finally { setLoading(false) }
  }

  if (!item && !canFlag) return <span className="text-xs text-muted-foreground">Non signalé</span>
  return (
    <div className="flex min-w-44 flex-col items-end gap-1.5">
      <div className="flex items-center justify-end gap-2">
        {item ? <ApprovalStatusBadge status={item.status} /> : null}
        <Button type="button" variant="outline" size="sm" className="gap-2" disabled={loading} onClick={handleClick}>
          {item ? <ClipboardCheck className="h-4 w-4" /> : <Flag className="h-4 w-4" />}
          {loading ? 'Ajout...' : item ? 'Ouvrir' : 'Signaler'}
        </Button>
      </div>
      {item ? (
        <span className="text-right text-[11px] text-muted-foreground">
          {item.assigneeName || 'Non assigné'} · {formatDueDate(item.dueAt)}
        </span>
      ) : null}
    </div>
  )
}

function formatDueDate(value?: string | null) {
  if (!value) return 'sans échéance'
  const date = new Date(value.replace(' ', 'T') + (value.endsWith('Z') ? '' : 'Z'))
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(date)
}
