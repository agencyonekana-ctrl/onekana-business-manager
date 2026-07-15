import { useCallback, useEffect, useMemo, useState } from 'react'
import { approvalApi } from '../services/approval-api'
import type { ApprovalCase, ApprovalResourceType } from '../types/approvals'
import { useAuth } from './use-auth'
import { can, canModule } from '../lib/access-control'

export function useApprovalCases(resourceType: ApprovalResourceType) {
  const { user } = useAuth()
  const allowed = canModule(user, 'approvals') && can(user, 'approvals.view')
  const [cases, setCases] = useState<ApprovalCase[]>([])
  const [available, setAvailable] = useState(true)
  const load = useCallback(async () => {
    if (!allowed) { setCases([]); setAvailable(false); return }
    try { const response = await approvalApi.list({ resourceType, perPage: 100 }); setCases(response.data); setAvailable(true) }
    catch { setCases([]); setAvailable(false) }
  }, [allowed, resourceType])
  useEffect(() => { load() }, [load])
  const byExternalId = useMemo(() => new Map(cases.filter((item) => item.status !== 'archived').map((item) => [item.externalId, item])), [cases])
  return { cases, byExternalId, available, reload: load }
}
