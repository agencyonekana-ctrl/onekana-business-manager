import type { ReactNode } from 'react'

type PageTransitionProps = {
  transitionKey: string
  children: ReactNode
}

export function PageTransition({ transitionKey, children }: PageTransitionProps) {
  return <div key={transitionKey} className="page-transition">{children}</div>
}
