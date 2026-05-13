import type { ElementType, ReactNode } from 'react'

type StatCardProps = {
  title: string
  value: ReactNode
  icon: ElementType
  description?: string
  tone?: 'red' | 'black' | 'neutral'
}

const toneClasses = {
  red: 'bg-primary/5 text-primary ring-primary/10',
  black: 'bg-muted text-foreground ring-black/5',
  neutral: 'bg-muted text-foreground ring-black/5',
}

export function StatCard({ title, value, icon: Icon, description, tone = 'red' }: StatCardProps) {
  return (
    <div className="group rounded-xl border border-border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">{title}</p>
          <div className="mt-2 truncate text-2xl font-black tracking-tight text-foreground">{value}</div>
        </div>
        <div className={`rounded-xl p-2.5 ring-1 ${toneClasses[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {description && <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  )
}
