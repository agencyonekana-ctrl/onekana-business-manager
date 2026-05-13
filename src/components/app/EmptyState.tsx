import type { ReactNode } from 'react'
import { CircleHelp } from 'lucide-react'
import { Button } from '../ui/button'

type EmptyStateProps = {
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white px-6 py-9 text-center shadow-sm">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
        <CircleHelp className="h-6 w-6" />
      </span>
      <h3 className="text-sm font-black uppercase tracking-wide">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function EmptyStateButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <Button size="sm" onClick={onClick}>
      {children}
    </Button>
  )
}
