import type { ElementType } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

type ActionTileProps = {
  label: string
  description: string
  to: string
  icon: ElementType
}

export function ActionTile({ label, description, to, icon: Icon }: ActionTileProps) {
  return (
    <Link
      to={to}
      className="group flex min-h-28 items-start justify-between gap-4 rounded-xl border border-border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
    >
      <span className="flex min-w-0 gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary ring-1 ring-primary/10">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-black uppercase tracking-wide text-foreground">{label}</span>
          <span className="mt-2 block text-xs leading-relaxed text-muted-foreground">{description}</span>
        </span>
      </span>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  )
}
