import { StatusBadge } from '../app/StatusBadge'
import type { ApprovalPriority, ApprovalStatus } from '../../types/approvals'
import { approvalPriorityLabels, approvalStatusLabels } from './approval-labels'

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  const tone = status === 'approved' ? 'dark' : ['pending', 'needs_information', 'rejected'].includes(status) ? 'red' : 'neutral'
  return <StatusBadge tone={tone}>{approvalStatusLabels[status]}</StatusBadge>
}

export function ApprovalPriorityBadge({ priority }: { priority: ApprovalPriority }) {
  return <StatusBadge tone={priority === 'urgent' || priority === 'high' ? 'red' : 'neutral'}>{approvalPriorityLabels[priority]}</StatusBadge>
}
