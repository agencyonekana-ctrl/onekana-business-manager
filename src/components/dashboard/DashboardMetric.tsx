import type { ElementType, CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Skeleton } from '../ui/skeleton'
import { cn } from '../../lib/utils'

type DashboardMetricProps = {
  label: string
  value: string | number
  helper: string
  icon: ElementType
  to: string
  loading?: boolean
  emphasis?: boolean
  index?: number
}

export function DashboardMetric({ label, value, helper, icon: Icon, to, loading = false, emphasis = false, index = 0 }: DashboardMetricProps) {
  const style = { '--stagger-delay': `${Math.min(index, 5) * 40}ms` } as CSSProperties

  return (
    <Link
      to={to}
      style={style}
      className={cn(
        'dashboard-stagger group min-w-0 rounded-xl border bg-white p-4 shadow-sm transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-px hover:border-primary/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
        emphasis && 'border-primary/20 bg-primary/[0.035]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground transition-colors duration-200 group-hover:bg-primary/10 group-hover:text-primary', emphasis && 'bg-primary/10 text-primary')}>
          <Icon className="h-4 w-4" />
        </span>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <div className="mt-5 min-h-9">
        {loading ? <Skeleton className="h-8 w-24 bg-muted" /> : <span className="block truncate text-2xl font-black tabular-nums text-foreground">{value}</span>}
      </div>
      <span className="mt-2 block text-xs font-black uppercase text-foreground">{label}</span>
      <span className="mt-1 block truncate text-xs text-muted-foreground">{helper}</span>
    </Link>
  )
}
