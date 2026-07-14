import { Skeleton } from '../ui/skeleton'

type DashboardSkeletonProps = {
  rows?: number
}

export function DashboardSkeleton({ rows = 3 }: DashboardSkeletonProps) {
  return (
    <div className="space-y-2" aria-label="Chargement">
      {Array.from({ length: rows }, (_, index) => <Skeleton key={index} className="h-16 w-full bg-muted" />)}
    </div>
  )
}
