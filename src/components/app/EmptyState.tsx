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
    <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-primary/20 bg-primary/5 px-6 py-8 text-center">
      <CircleHelp className="mb-3 h-8 w-8 text-primary" />
      <h3 className="text-base font-black uppercase">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
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
