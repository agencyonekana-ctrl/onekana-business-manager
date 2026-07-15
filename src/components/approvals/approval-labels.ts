import type { ApprovalPriority, ApprovalResourceType, ApprovalStatus } from '../../types/approvals'

export const approvalStatusLabels: Record<ApprovalStatus, string> = {
  pending: 'À examiner',
  in_review: 'En cours',
  needs_information: 'Informations demandées',
  approved: 'Validé',
  rejected: 'Refusé',
  archived: 'Archivé',
}

export const approvalPriorityLabels: Record<ApprovalPriority, string> = { low: 'Faible', normal: 'Normale', high: 'Haute', urgent: 'Urgente' }
export const approvalResourceLabels: Record<ApprovalResourceType, string> = {
  agency_user: 'Compte signalé',
  agency_contact: 'Contact signalé',
  agency_request: 'Demande client',
  agency_campaign: 'Campagne reçue',
  document: 'Document',
}
