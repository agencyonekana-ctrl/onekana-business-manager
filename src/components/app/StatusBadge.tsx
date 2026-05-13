import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

type StatusBadgeProps = {
  children: ReactNode
  tone?: 'red' | 'dark' | 'neutral'
  className?: string
}

const tones = {
  red: 'border-primary/15 bg-primary/10 text-primary',
  dark: 'border-black/10 bg-black text-white',
  neutral: 'border-border bg-muted text-muted-foreground',
}

export function StatusBadge({ children, tone = 'neutral', className }: StatusBadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold', tones[tone], className)}>
      {children}
    </span>
  )
}
