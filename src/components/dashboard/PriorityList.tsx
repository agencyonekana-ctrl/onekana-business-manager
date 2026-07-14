import type { CSSProperties } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { DashboardPriority } from '../../types/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Skeleton } from '../ui/skeleton'
import { cn } from '../../lib/utils'

type PriorityListProps = {
  items: DashboardPriority[]
  loading: boolean
}

const toneClasses = {
  urgent: 'bg-primary/10 text-primary',
  attention: 'bg-foreground/[0.08] text-foreground',
  neutral: 'bg-muted text-muted-foreground',
}

export function PriorityList({ items, loading }: PriorityListProps) {
  return (
    <Card className="border-border bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
        <div>
          <CardTitle className="text-sm font-black uppercase">À traiter</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">Les actions qui demandent une attention administrative.</p>
        </div>
        {!loading && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">{items.reduce((total, item) => total + item.value, 0)}</span>}
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-[70px] w-full bg-muted" />) : items.map((item, index) => {
          const style = { '--stagger-delay': `${index * 40}ms` } as CSSProperties
          return (
            <Link key={item.label} to={item.to} style={style} className="dashboard-stagger group flex items-center gap-3 rounded-xl border border-transparent bg-muted/35 p-3 transition-[transform,background-color,border-color] duration-200 hover:translate-x-px hover:border-primary/15 hover:bg-primary/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
              <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', toneClasses[item.tone])}><item.icon className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-foreground">{item.label}</span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.description}</span>
              </span>
              <span className="text-lg font-black tabular-nums">{item.value}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}
