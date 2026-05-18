import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  description: string
  eyebrow?: string
  action?: ReactNode
}

export function PageHeader({ title, description, eyebrow, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-l-4 border-primary bg-transparent py-1 pl-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {eyebrow && <span className="text-xs font-black uppercase tracking-wide text-primary">{eyebrow}</span>}
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-4xl">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
